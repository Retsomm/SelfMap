import { useAuth } from '@clerk/expo'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { type Chart, deleteChart, getCharts, renameChart } from '@/lib/api'
import { ScreenHeader } from '@/components/ScreenHeader'
import { SubTabBar } from '@/components/SubTabBar'
import { InputModal } from '@/components/InputModal'
import { LoadingView, ErrorView } from '@/components/StateViews'
import { Colors, Radius, Spacing } from '@/constants/tokens'

type SubTab = 'personal' | 'composite' | 'transit'
const SUB_TABS = [
  { id: 'personal',  label: '個人' },
  { id: 'composite', label: '合圖' },
  { id: 'transit',   label: '流日' },
] as const satisfies readonly { id: SubTab; label: string }[]

const KIND_CFG: Record<string, { label: string; color: string; bg: string }> = {
  personal:  { label: '個人', color: Colors.accent,  bg: Colors.accentD },
  composite: { label: '合圖', color: Colors.comp,    bg: '#0a1525' },
  transit:   { label: '流日', color: Colors.transit, bg: '#1a0d00' },
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

  if (loading) return <LoadingView />
  if (error) return <ErrorView message={error} onRetry={onRefresh} />

  return (
    <FlatList
      data={charts}
      keyExtractor={c => c.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}
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
      <ScreenHeader
        title="我的圖表"
        right={
          <Pressable onPress={() => signOut()} hitSlop={12}>
            <Text style={styles.sub}>登出</Text>
          </Pressable>
        }
      />

      <SubTabBar tabs={SUB_TABS} active={subTab} onSelect={setSubTab} />

      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, display: subTab === 'personal' ? 'flex' : 'none' }}>
          <ChartList {...sharedProps} charts={personalCharts} emptyText="還沒有個人圖表" />
        </View>
        <View style={{ flex: 1, display: subTab === 'composite' ? 'flex' : 'none' }}>
          <ChartList {...sharedProps} charts={compositeCharts} emptyText="還沒有合圖" />
        </View>
        <View style={{ flex: 1, display: subTab === 'transit' ? 'flex' : 'none' }}>
          <ChartList {...sharedProps} charts={transitCharts} emptyText="還沒有流日圖表" />
        </View>
      </View>

      <InputModal
        visible={renameTarget !== null}
        title="重新命名"
        value={renameValue}
        onChange={setRenameValue}
        onConfirm={handleRenameConfirm}
        onCancel={() => setRenameTarget(null)}
        placeholder="圖表名稱（留空則清除）"
        loading={renaming}
        inputRef={renameInputRef}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.bg },
  sub:        { fontSize: 13, color: Colors.sub },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyText:  { fontSize: 18, color: Colors.text, fontWeight: '600' },

  card:        { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, rowGap: 6, borderWidth: 1, borderColor: Colors.border },
  cardPressed: { opacity: 0.75 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName:    { fontSize: 16, fontWeight: '600', color: Colors.text, flex: 1 },
  cardMore:    { color: Colors.muted, fontSize: 14, paddingLeft: Spacing.sm },
  cardSub:     { fontSize: 13, color: Colors.sub, marginTop: 2 },
  badgeRow:    { flexDirection: 'row', columnGap: 6, marginTop: Spacing.xs, flexWrap: 'wrap' },

  kindBadge:     { borderRadius: 6, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  kindBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  badge:         { backgroundColor: Colors.accentD, borderRadius: 6, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  badgeDim:      { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  badgeText:     { color: Colors.accent, fontSize: 12, fontWeight: '600' },
  badgeTextDim:  { color: Colors.muted },

})
