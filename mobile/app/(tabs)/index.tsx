import { useAuth } from '@clerk/expo'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { type Chart, deleteChart, getCharts, renameChart } from '@/lib/api'

const T = {
  bg: '#0f0f1a', surface: '#1e1e2e', border: '#2a2a3e',
  accent: '#a78bfa', accentD: '#2e1e4e',
  text: '#ffffff', sub: '#8888aa', muted: '#555577', red: '#ff6b6b',
  transit: '#f97316', comp: '#60a5fa',
}

type SubTab = 'personal' | 'composite' | 'transit'
const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'personal',  label: '個人' },
  { id: 'composite', label: '合圖' },
  { id: 'transit',   label: '流日' },
]

const KIND_CFG: Record<string, { label: string; color: string; bg: string }> = {
  personal:  { label: '個人', color: T.accent,  bg: T.accentD },
  composite: { label: '合圖', color: T.comp,    bg: '#0a1525' },
  transit:   { label: '流日', color: T.transit, bg: '#1a0d00' },
}

function kindOf(c: Chart): string {
  return c.chartKind ?? 'personal'
}

function KindBadge({ kind }: { kind: string }) {
  const cfg = KIND_CFG[kind] ?? KIND_CFG.personal
  return (
    <View style={[styles.kindBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.kindBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  )
}

function Badge({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <View style={[styles.badge, dim && styles.badgeDim]}>
      <Text style={[styles.badgeText, dim && styles.badgeTextDim]}>{label}</Text>
    </View>
  )
}

// ─── Chart list (shared across all sub-tabs) ─────────────────────────────────

function ChartList({
  charts,
  loading,
  refreshing,
  error,
  emptyText,
  onRefresh,
  onRename,
  onDelete,
  tappable = true,
}: {
  charts: Chart[]
  loading: boolean
  refreshing: boolean
  error: string | null
  emptyText: string
  onRefresh: () => void
  onRename: (c: Chart) => void
  onDelete: (c: Chart) => void
  tappable?: boolean
}) {
  const router = useRouter()

  if (loading) return <ActivityIndicator color={T.accent} style={{ flex: 1 }} />
  if (error) return (
    <View style={styles.centered}>
      <Text style={[styles.sub, { color: T.red }]}>{error}</Text>
      <Pressable style={styles.outlineBtn} onPress={onRefresh}>
        <Text style={styles.outlineBtnText}>重試</Text>
      </Pressable>
    </View>
  )

  return (
    <FlatList
      data={charts}
      keyExtractor={c => c.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{emptyText}</Text>
          <Text style={styles.sub}>在「建立圖表」頁面新增</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && tappable && styles.cardPressed]}
          onPress={tappable ? () => router.push({ pathname: '/chart/[id]', params: { id: item.id } }) : undefined}
          onLongPress={() => Alert.alert(item.name ?? '未命名圖表', undefined, [
            { text: '重新命名', onPress: () => onRename(item) },
            { text: '刪除圖表', style: 'destructive', onPress: () => onDelete(item) },
            { text: '取消', style: 'cancel' },
          ])}
          delayLongPress={400}
        >
          <View style={styles.cardTop}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name ?? '未命名圖表'}</Text>
            <Pressable hitSlop={12} onPress={() => Alert.alert(item.name ?? '未命名圖表', undefined, [
              { text: '重新命名', onPress: () => onRename(item) },
              { text: '刪除圖表', style: 'destructive', onPress: () => onDelete(item) },
              { text: '取消', style: 'cancel' },
            ])}>
              <Text style={styles.cardMore}>•••</Text>
            </Pressable>
          </View>
          {item.chartKind === 'composite' && item.meta?.personA && item.meta?.personB ? (
            <Text style={styles.cardSub}>
              {item.meta.personA.name ?? '人物 A'} ({item.meta.personA.profile})  ×  {item.meta.personB.name ?? '人物 B'} ({item.meta.personB.profile})
            </Text>
          ) : (
            <Text style={styles.cardSub}>{item.birthDate} · {item.birthCity}</Text>
          )}
          <View style={styles.badgeRow}>
            <KindBadge kind={kindOf(item)} />
            <Badge label={item.type} />
            <Badge label={item.profile} dim />
          </View>
        </Pressable>
      )}
    />
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChartsScreen() {
  const { getToken, signOut } = useAuth()
  const [subTab, setSubTab]                     = useState<SubTab>('personal')
  const [charts, setCharts]                     = useState<Chart[]>([])
  const [chartsLoading, setChartsLoading]       = useState(true)
  const [chartsRefreshing, setChartsRefreshing] = useState(false)
  const [chartsError, setChartsError]           = useState<string | null>(null)
  const [renameTarget, setRenameTarget]         = useState<Chart | null>(null)
  const [renameValue, setRenameValue]           = useState('')
  const [renaming, setRenaming]                 = useState(false)
  const renameInputRef = useRef<TextInput>(null)

  const fetchCharts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setChartsRefreshing(true)
    setChartsError(null)
    try {
      const token = await getToken()
      if (!token) return
      const data = await getCharts(token)
      setCharts(data.charts)
    } catch (e: any) { setChartsError(e.message) }
    finally { setChartsLoading(false); setChartsRefreshing(false) }
  }, [getToken])

  useEffect(() => { fetchCharts() }, [])

  const fetchChartsRef = useRef(fetchCharts)
  useEffect(() => { fetchChartsRef.current = fetchCharts }, [fetchCharts])

  const didRefreshRef = useRef(false)
  useFocusEffect(useCallback(() => {
    if (!didRefreshRef.current) { didRefreshRef.current = true; return }
    fetchChartsRef.current()
  }, []))

  const openRename = (chart: Chart) => {
    setRenameTarget(chart)
    setRenameValue(chart.name ?? '')
    setTimeout(() => renameInputRef.current?.focus(), 100)
  }

  const handleRenameConfirm = async () => {
    if (!renameTarget) return
    setRenaming(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('未登入')
      await renameChart(token, renameTarget.id, renameValue.trim())
      setCharts(prev => prev.map(c =>
        c.id === renameTarget.id ? { ...c, name: renameValue.trim() || null } : c,
      ))
      setRenameTarget(null)
    } catch (e: any) { Alert.alert('重新命名失敗', e.message) }
    finally { setRenaming(false) }
  }

  const handleDelete = (chart: Chart) => {
    Alert.alert('刪除圖表', `確定要刪除「${chart.name ?? '未命名圖表'}」嗎？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除', style: 'destructive',
        onPress: async () => {
          try {
            const token = await getToken()
            if (!token) return
            await deleteChart(token, chart.id)
            setCharts(prev => prev.filter(c => c.id !== chart.id))
          } catch (e: any) { Alert.alert('刪除失敗', e.message) }
        },
      },
    ])
  }

  const personalCharts  = charts.filter(c => kindOf(c) === 'personal')
  const compositeCharts = charts.filter(c => kindOf(c) === 'composite')
  const transitCharts   = charts.filter(c => kindOf(c) === 'transit')

  const sharedProps = {
    loading: chartsLoading,
    refreshing: chartsRefreshing,
    error: chartsError,
    onRefresh: () => fetchCharts(true),
    onRename: openRename,
    onDelete: handleDelete,
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>我的圖表</Text>
        <Pressable onPress={() => signOut()} hitSlop={12}>
          <Text style={styles.sub}>登出</Text>
        </Pressable>
      </View>

      {/* Sub-tab bar */}
      <View style={styles.subTabBar}>
        {SUB_TABS.map(tab => (
          <Pressable
            key={tab.id}
            style={[styles.subTabItem, subTab === tab.id && styles.subTabItemActive]}
            onPress={() => setSubTab(tab.id)}
          >
            <Text style={[styles.subTabText, subTab === tab.id && styles.subTabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, display: subTab === 'personal' ? 'flex' : 'none' }}>
          <ChartList
            {...sharedProps}
            charts={personalCharts}
            emptyText="還沒有個人圖表"
          />
        </View>
        <View style={{ flex: 1, display: subTab === 'composite' ? 'flex' : 'none' }}>
          <ChartList
            {...sharedProps}
            charts={compositeCharts}
            emptyText="還沒有合圖"
          />
        </View>
        <View style={{ flex: 1, display: subTab === 'transit' ? 'flex' : 'none' }}>
          <ChartList
            {...sharedProps}
            charts={transitCharts}
            emptyText="還沒有流日圖表"
          />
        </View>
      </View>

      {/* Rename modal */}
      <Modal
        visible={renameTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameTarget(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setRenameTarget(null)}>
          <Pressable style={styles.renameSheet} onPress={() => {}}>
            <Text style={styles.renameTitle}>重新命名</Text>
            <TextInput
              ref={renameInputRef}
              style={styles.renameInput}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="圖表名稱（留空則清除）"
              placeholderTextColor={T.muted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleRenameConfirm}
            />
            <View style={styles.renameBtns}>
              <Pressable style={styles.renameCancelBtn} onPress={() => setRenameTarget(null)}>
                <Text style={styles.renameCancelText}>取消</Text>
              </Pressable>
              <Pressable
                style={[styles.renameConfirmBtn, renaming && styles.btnDisabled]}
                onPress={handleRenameConfirm}
                disabled={renaming}
              >
                <Text style={styles.renameConfirmText}>{renaming ? '儲存中…' : '確認'}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  heading:  { fontSize: 22, fontWeight: '700', color: T.text },
  sub:      { fontSize: 13, color: T.sub },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyText:{ fontSize: 18, color: T.text, fontWeight: '600' },

  subTabBar:        { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.border },
  subTabItem:       { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  subTabItemActive: { borderBottomColor: T.accent },
  subTabText:       { fontSize: 14, fontWeight: '500', color: T.muted },
  subTabTextActive: { color: T.accent, fontWeight: '700' },

  card:        { backgroundColor: T.surface, borderRadius: 14, padding: 16, rowGap: 6, borderWidth: 1, borderColor: T.border },
  cardPressed: { opacity: 0.75 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName:    { fontSize: 16, fontWeight: '600', color: T.text, flex: 1 },
  cardMore:    { color: T.muted, fontSize: 14, paddingLeft: 8 },
  cardSub:     { fontSize: 13, color: T.sub, marginTop: 2 },
  badgeRow:    { flexDirection: 'row', columnGap: 6, marginTop: 4, flexWrap: 'wrap' },

  kindBadge:     { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  kindBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  badge:         { backgroundColor: T.accentD, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeDim:      { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  badgeText:     { color: T.accent, fontSize: 12, fontWeight: '600' },
  badgeTextDim:  { color: T.muted },

  outlineBtn:     { borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  outlineBtnText: { color: T.sub, fontSize: 13 },

  overlay:          { flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', alignItems: 'center', padding: 24 },
  renameSheet:      { backgroundColor: T.surface, borderRadius: 16, padding: 24, width: '100%' },
  renameTitle:      { color: T.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  renameInput:      { backgroundColor: T.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: T.text, fontSize: 15, borderWidth: 1, borderColor: T.border, marginBottom: 16 },
  renameBtns:       { flexDirection: 'row', columnGap: 10 },
  renameCancelBtn:  { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  renameCancelText: { color: T.sub, fontSize: 15 },
  renameConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: T.accent, alignItems: 'center' },
  renameConfirmText:{ color: T.bg, fontSize: 15, fontWeight: '600' },
  btnDisabled:      { opacity: 0.5 },
})
