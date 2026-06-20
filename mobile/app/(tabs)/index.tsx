import { useAuth } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
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

export default function ChartsScreen() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [charts, setCharts] = useState<Chart[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // rename modal
  const [renameTarget, setRenameTarget] = useState<Chart | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)
  const renameInputRef = useRef<TextInput>(null)

  async function fetchCharts(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) return
      const data = await getCharts(token)
      setCharts(data.charts)
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchCharts() }, [])

  function openActions(chart: Chart) {
    Alert.alert(chart.name ?? '未命名圖表', undefined, [
      {
        text: '重新命名',
        onPress: () => {
          setRenameTarget(chart)
          setRenameValue(chart.name ?? '')
          setTimeout(() => renameInputRef.current?.focus(), 100)
        },
      },
      {
        text: '刪除圖表',
        style: 'destructive',
        onPress: () => confirmDelete(chart),
      },
      { text: '取消', style: 'cancel' },
    ])
  }

  function confirmDelete(chart: Chart) {
    Alert.alert(
      '刪除圖表',
      `確定要刪除「${chart.name ?? '未命名圖表'}」嗎？此操作無法復原。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken()
              if (!token) return
              await deleteChart(token, chart.id)
              setCharts((prev) => prev.filter((c) => c.id !== chart.id))
            } catch (err) {
              Alert.alert('刪除失敗', err instanceof Error ? err.message : String(err))
            }
          },
        },
      ],
    )
  }

  async function handleRenameConfirm() {
    if (!renameTarget) return
    setRenaming(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('未登入')
      await renameChart(token, renameTarget.id, renameValue.trim())
      setCharts((prev) =>
        prev.map((c) => (c.id === renameTarget.id ? { ...c, name: renameValue.trim() || null } : c)),
      )
      setRenameTarget(null)
    } catch (err) {
      Alert.alert('重新命名失敗', err instanceof Error ? err.message : String(err))
    } finally {
      setRenaming(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#a78bfa" style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: '#ff6b6b' }]}>載入失敗</Text>
          <Text style={styles.emptyHint}>{error}</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => { setLoading(true); fetchCharts() }}
          >
            <Text style={styles.retryText}>重試</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>我的圖表</Text>
      <FlatList
        data={charts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchCharts(true)} tintColor="#a78bfa" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>還沒有圖表</Text>
            <Text style={styles.emptyHint}>點下方「建立圖表」開始</Text>
          </View>
        }
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(`/chart/${item.id}`)}
            onLongPress={() => openActions(item)}
            delayLongPress={400}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardName} numberOfLines={1}>{item.name ?? '未命名圖表'}</Text>
              <Pressable hitSlop={12} onPress={() => openActions(item)}>
                <Text style={styles.cardMore}>•••</Text>
              </Pressable>
            </View>
            <Text style={styles.cardSub}>{item.birthDate} · {item.birthCity}</Text>
            <View style={styles.cardBadgeRow}>
              <Badge label={item.type} />
              <Badge label={item.profile} dim />
            </View>
          </Pressable>
        )}
      />

      {/* Rename Modal */}
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
              placeholderTextColor="#555577"
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

function Badge({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <View style={[styles.badge, dim && styles.badgeDim]}>
      <Text style={[styles.badgeText, dim && styles.badgeTextDim]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  heading: { fontSize: 24, fontWeight: '700', color: '#fff', padding: 16, paddingBottom: 8 },
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 14,
    padding: 16,
    rowGap: 6,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  cardPressed: { opacity: 0.75 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '600', color: '#fff', flex: 1 },
  cardMore: { color: '#555577', fontSize: 14, paddingLeft: 8 },
  cardSub: { fontSize: 13, color: '#8888aa', marginTop: 2 },
  cardBadgeRow: { flexDirection: 'row', columnGap: 6, marginTop: 4 },
  badge: {
    backgroundColor: '#2e1e4e',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeDim: { backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: '#2a2a3e' },
  badgeText: { color: '#a78bfa', fontSize: 12, fontWeight: '600' },
  badgeTextDim: { color: '#6666aa' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 18, color: '#fff' },
  emptyHint: { fontSize: 14, color: '#8888aa', marginTop: 8 },
  retryBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#a78bfa' },
  retryText: { color: '#a78bfa', fontSize: 14 },
  // rename modal
  overlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', alignItems: 'center', padding: 24 },
  renameSheet: { backgroundColor: '#1e1e2e', borderRadius: 16, padding: 24, width: '100%' },
  renameTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  renameInput: {
    backgroundColor: '#0f0f1a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2e2e4e',
    marginBottom: 16,
  },
  renameBtns: { flexDirection: 'row', columnGap: 10 },
  renameCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#2e2e4e', alignItems: 'center' },
  renameCancelText: { color: '#8888aa', fontSize: 15 },
  renameConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#a78bfa', alignItems: 'center' },
  renameConfirmText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
})
