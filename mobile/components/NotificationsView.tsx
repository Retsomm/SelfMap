import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { Radius, Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'
import { type AppNotification, type NotificationType, getNotifications } from '@/lib/api'
import { LoadingView, ErrorView } from '@/components/StateViews'

const createTypeCfg = (Colors: ThemeColors): Record<NotificationType, { label: string; color: string; bg: string }> => ({
  feature:      { label: '新功能', color: Colors.successText,     bg: Colors.compDimBg },
  bugfix:       { label: '問題修正', color: Colors.accent,          bg: Colors.accentD },
  announcement: { label: '公告',    color: Colors.transitWarmText, bg: Colors.transitDimBg },
})

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

type TypeCfg = Record<NotificationType, { label: string; color: string; bg: string }>

function NotificationCard({ item, s, typeCfg }: { item: AppNotification; s: ReturnType<typeof createStyles>; typeCfg: TypeCfg }) {
  const cfg = typeCfg[item.type] ?? typeCfg.announcement
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
          <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <Text style={s.date}>{formatDate(item.publishedAt)}</Text>
      </View>
      <Text style={s.title}>{item.title}</Text>
      <Text style={s.body}>{item.body}</Text>
    </View>
  )
}

export default function NotificationsView() {
  const Colors = useThemeColors()
  const s = useMemo(() => createStyles(Colors), [Colors])
  const typeCfg = useMemo(() => createTypeCfg(Colors), [Colors])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { notifications } = await getNotifications()
      setNotifications(notifications)
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (loading) return <LoadingView />
  if (error) return <ErrorView message={error} onRetry={load} />

  return (
    <FlatList
      data={notifications}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <NotificationCard item={item} s={s} typeCfg={typeCfg} />}
      contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />}
      ListEmptyComponent={
        <View style={s.empty}>
          <Text style={s.emptyText}>目前沒有通知</Text>
        </View>
      }
    />
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  list:       { padding: Spacing.xl, gap: Spacing.md, flexGrow: 1 },
  card:       { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.xs },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge:      { borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1 },
  badgeText:  { fontSize: 11, fontWeight: '700' },
  date:       { fontSize: 12, color: Colors.muted },
  title:      { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 2 },
  body:       { fontSize: 13, color: Colors.sub, lineHeight: 19 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText:  { color: Colors.muted, fontSize: 14 },
})
