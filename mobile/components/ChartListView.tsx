import { useAuth } from '@clerk/expo'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { type Chart, deleteChart, getCharts, renameChart, isCompositeChart } from '@/lib/api'
import { SubTabBar } from '@/components/SubTabBar'
import { InputModal } from '@/components/InputModal'
import { LoadingView, ErrorView } from '@/components/StateViews'
import { Radius, Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'

type ChartTab = 'personal' | 'composite' | 'transit'
const CHART_TABS = [
  { id: 'personal',  label: '個人' },
  { id: 'composite', label: '合圖' },
  { id: 'transit',   label: '流日' },
] as const satisfies readonly { id: ChartTab; label: string }[]

const createKindCfg = (Colors: ThemeColors): Record<string, { label: string; color: string; bg: string }> => ({
  personal:  { label: '個人', color: Colors.accent,  bg: Colors.accentD },
  composite: { label: '合圖', color: Colors.comp,    bg: Colors.compDimBg },
  transit:   { label: '流日', color: Colors.transit, bg: Colors.transitDimBg },
})

function kindOf(c: Chart): string {
  if (c.chartKind === 'transit') return 'transit'
  if (isCompositeChart(c)) return 'composite'
  return c.chartKind ?? 'personal'
}

// 合圖沒有單一 Type/Profile，改顯示能量場整合主題（依已定義中心數推算，同 chart/[id].tsx 的算法）
function integrationThemeOf(definedCenterCount: number): string {
  const openCount = 9 - definedCenterCount
  if (openCount === 0) return '9+0'
  if (openCount === 1) return '8+1'
  if (openCount === 2) return '7+2'
  return '6+3+'
}

function KindBadge({ kind }: { kind: string }) {
  const Colors = useThemeColors()
  const s = useMemo(() => createStyles(Colors), [Colors])
  const kindCfg = useMemo(() => createKindCfg(Colors), [Colors])
  const cfg = kindCfg[kind] ?? kindCfg.personal
  return (
    <View style={[s.kindBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[s.kindBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  )
}

function Badge({ label, dim }: { label: string; dim?: boolean }) {
  const Colors = useThemeColors()
  const s = useMemo(() => createStyles(Colors), [Colors])
  return (
    <View style={[s.badge, dim && s.badgeDim]}>
      <Text style={[s.badgeText, dim && s.badgeTextDim]}>{label}</Text>
    </View>
  )
}

function ChartFlatList({
  charts,
  loading,
  refreshing,
  error,
  emptyText,
  onRefresh,
  onRename,
  onDelete,
}: {
  charts: Chart[]
  loading: boolean
  refreshing: boolean
  error: string | null
  emptyText: string
  onRefresh: () => void
  onRename: (c: Chart) => void
  onDelete: (c: Chart) => void
}) {
  const router = useRouter()
  const Colors = useThemeColors()
  const s = useMemo(() => createStyles(Colors), [Colors])

  if (loading) return <LoadingView />
  if (error) return <ErrorView message={error} onRetry={onRefresh} />

  const showMenu = (item: Chart) =>
    Alert.alert(item.name ?? '未命名圖表', '選擇要執行的操作', [
      { text: '重新命名', onPress: () => onRename(item) },
      { text: '刪除圖表', style: 'destructive', onPress: () => onDelete(item) },
      { text: '取消', style: 'cancel' },
    ])

  return (
    <FlatList
      data={charts}
      keyExtractor={c => c.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
      }
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md }}
      ListEmptyComponent={
        <View style={s.centered}>
          <Text style={s.emptyText}>{emptyText}</Text>
          <Text style={s.sub}>在「建立圖表」頁面新增</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [s.card, pressed && s.cardPressed]}
          onPress={() => router.push({ pathname: '/chart/[id]', params: { id: item.id } })}
          onLongPress={() => showMenu(item)}
          delayLongPress={400}
        >
          <View style={s.cardTop}>
            <Text style={s.cardName} numberOfLines={1}>{item.name ?? '未命名圖表'}</Text>
            <Pressable hitSlop={12} onPress={() => showMenu(item)}>
              <Text style={s.cardMore}>•••</Text>
            </Pressable>
          </View>
          {item.chartKind === 'composite' && item.meta?.personA && item.meta?.personB ? (
            <Text style={s.cardSub}>
              {item.meta.personA.name ?? '人物 A'} ({item.meta.personA.profile})  ×  {item.meta.personB.name ?? '人物 B'} ({item.meta.personB.profile})
            </Text>
          ) : (
            <Text style={s.cardSub}>{item.birthDate} · {item.birthCity}</Text>
          )}
          <View style={s.badgeRow}>
            <KindBadge kind={kindOf(item)} />
            {kindOf(item) === 'composite' ? (
              <Badge label={`整合 ${integrationThemeOf(item.centers.length)}`} dim />
            ) : (
              <>
                <Badge label={item.type} />
                <Badge label={item.profile} dim />
              </>
            )}
          </View>
        </Pressable>
      )}
    />
  )
}

export default function ChartListView({ initialTab }: { initialTab?: ChartTab }) {
  const { getToken } = useAuth()
  const [chartTab, setChartTab]             = useState<ChartTab>(initialTab ?? 'personal')
  const [charts, setCharts]                 = useState<Chart[]>([])
  const [loading, setLoading]               = useState(true)
  const [refreshing, setRefreshing]         = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [renameTarget, setRenameTarget]     = useState<Chart | null>(null)
  const [renameValue, setRenameValue]       = useState('')
  const [renaming, setRenaming]             = useState(false)
  const renameInputRef = useRef<TextInput>(null)

  const getTokenRef = useRef(getToken)
  useEffect(() => { getTokenRef.current = getToken }, [getToken])

  const fetchCharts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    setError(null)
    try {
      const token = await getTokenRef.current()
      if (!token) return
      const data = await getCharts(token)
      setCharts(data.charts)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '載入失敗')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => {
    void fetchCharts()
  }, [fetchCharts]))

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
      setCharts(prev =>
        prev.map(c => c.id === renameTarget.id ? { ...c, name: renameValue.trim() || null } : c),
      )
      setRenameTarget(null)
    } catch (e: unknown) {
      Alert.alert('重新命名失敗', e instanceof Error ? e.message : '請稍後再試')
    } finally {
      setRenaming(false)
    }
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
          } catch (e: unknown) {
            Alert.alert('刪除失敗', e instanceof Error ? e.message : '請稍後再試')
          }
        },
      },
    ])
  }

  const personalCharts  = charts.filter(c => kindOf(c) === 'personal')
  const compositeCharts = charts.filter(c => kindOf(c) === 'composite')
  const transitCharts   = charts.filter(c => kindOf(c) === 'transit')

  const sharedProps = {
    loading,
    refreshing,
    error,
    onRefresh: () => fetchCharts(true),
    onRename: openRename,
    onDelete: handleDelete,
  }

  return (
    <>
      <SubTabBar tabs={CHART_TABS} active={chartTab} onSelect={setChartTab} />

      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, display: chartTab === 'personal'  ? 'flex' : 'none' }}>
          <ChartFlatList {...sharedProps} charts={personalCharts}  emptyText="還沒有個人圖表" />
        </View>
        <View style={{ flex: 1, display: chartTab === 'composite' ? 'flex' : 'none' }}>
          <ChartFlatList {...sharedProps} charts={compositeCharts} emptyText="還沒有合圖" />
        </View>
        <View style={{ flex: 1, display: chartTab === 'transit'   ? 'flex' : 'none' }}>
          <ChartFlatList {...sharedProps} charts={transitCharts}   emptyText="還沒有流日圖表" />
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
    </>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyText: { fontSize: 18, color: Colors.text, fontWeight: '600' },
  sub:       { fontSize: 13, color: Colors.sub },

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
