import { useAuth } from '@clerk/expo'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { type Chart, type StoredPlanet, getCharts } from '@/lib/api'
import BodyGraph from '@/components/BodyGraph'

// lib uses 'ego' and 'solarPlexus'; hd-chart-data uses 'heart' and 'solar'
const LIB_TO_CHART: Record<string, string> = {
  ego: 'heart',
  solarPlexus: 'solar',
}

function normalizeCenterId(id: string): string {
  return LIB_TO_CHART[id] ?? id
}

// lib channel ids: '1-8', '2-14'  hd-chart-data ids: 'c1-8', 'c2-14'
function normalizeChannelId(id: string): string {
  return id.startsWith('c') ? id : `c${id}`
}

type TypeMeta = { strategy: string; signature: string; notSelf: string }

const TYPE_META: Record<string, TypeMeta> = {
  Manifestor: { strategy: '告知', signature: '和平', notSelf: '憤怒' },
  Generator: { strategy: '等待回應', signature: '滿足', notSelf: '沮喪' },
  'Manifesting Generator': { strategy: '等待回應，再告知', signature: '滿足', notSelf: '沮喪' },
  Projector: { strategy: '等待邀請', signature: '成功', notSelf: '苦澀' },
  Reflector: { strategy: '等待月循環（28 天）', signature: '驚喜', notSelf: '失望' },
}

function getTypeMeta(type: string): TypeMeta {
  return (
    TYPE_META[type] ??
    Object.entries(TYPE_META).find(([k]) => type.includes(k))?.[1] ?? {
      strategy: '-',
      signature: '-',
      notSelf: '-',
    }
  )
}

export default function ChartDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getToken } = useAuth()
  const [chart, setChart] = useState<Chart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const token = await getToken()
        if (!token) { setError('未登入，請重新登入'); return }
        const data = await getCharts(token)
        const found = data.charts.find((c) => c.id === id)
        if (!found) setError('找不到圖表')
        else setChart(found)
      } catch (err) {
        console.error(err)
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg.includes('401') || msg.includes('Unauthorized') ? '認證失敗，請重新登入' : `載入失敗：${msg}`)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#a78bfa" style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  if (error || !chart) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>{error ?? '找不到圖表'}</Text>
      </SafeAreaView>
    )
  }

  const meta = getTypeMeta(chart.type)

  // Map API data to BodyGraph props
  const definedCenterIds = new Set(chart.centers.map(normalizeCenterId))
  const definedChannelIds = new Set(chart.channels.map(normalizeChannelId))

  // planets 可能是 null（舊圖表）
  const planets: StoredPlanet[] = chart.planets ?? []

  // Build per-gate activation: c = Personality (黑), u = Design (紅)
  // 優先用 planets 推導（最準確），fallback 到 personalityGates/designGates，再 fallback 到 gates
  const activations: Record<number, { c?: boolean; u?: boolean }> = {}
  if (planets.length > 0) {
    for (const p of planets) {
      activations[p.blackGate] = { ...activations[p.blackGate], c: true }
      activations[p.redGate] = { ...activations[p.redGate], u: true }
    }
  } else {
    const personalityGates: number[] = chart.personalityGates ?? []
    const designGates: number[] = chart.designGates ?? []
    if (personalityGates.length > 0 || designGates.length > 0) {
      for (const g of personalityGates) activations[g] = { ...activations[g], c: true }
      for (const g of designGates) activations[g] = { ...activations[g], u: true }
    } else {
      // 最舊的圖表：只有合併的 gates，全顯示為黑
      for (const g of chart.gates) activations[g] = { c: true }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>

        {/* Body Graph SVG */}
        <View style={styles.graphCard}>
          <Text style={styles.cardTitle}>Body Graph</Text>
          <View style={styles.graphContainer}>
            <BodyGraph
              definedCenterIds={definedCenterIds}
              definedChannelIds={definedChannelIds}
              activations={activations}
              showGates
            />
          </View>
        </View>

        {/* 出生資訊 */}
        <SectionCard title="出生資訊">
          <Row label="出生日期" value={chart.birthDate} />
          <Row label="出生時間" value={chart.birthTime} />
          <Row label="出生城市" value={chart.birthCity} />
          {chart.timezone ? <Row label="時區" value={chart.timezone} /> : null}
        </SectionCard>

        {/* 類型 & 策略 */}
        <SectionCard title="類型">
          <Row label="能量類型" value={chart.type} accent />
          <Row label="策略" value={meta.strategy} />
          <Row label="簽名（成功徵兆）" value={meta.signature} accent />
          <Row label="非自我主題" value={meta.notSelf} dim />
        </SectionCard>

        {/* 權威 & 輪廓 */}
        <SectionCard title="設計">
          <Row label="內在權威" value={chart.authority} accent />
          <Row label="人生角色（Profile）" value={chart.profile} />
          <Row label="定義" value={chart.definition} />
        </SectionCard>

        {/* 九大中心 */}
        <SectionCard title="九大中心">
          <View style={styles.tagRow}>
            {chart.centers.map((c) => (
              <Tag key={c} label={c} active />
            ))}
          </View>
        </SectionCard>

        {/* 定義通道 */}
        {chart.channels.length > 0 && (
          <SectionCard title={`定義通道（${chart.channels.length}）`}>
            <View style={styles.tagRow}>
              {chart.channels.map((ch) => (
                <Tag key={ch} label={ch} />
              ))}
            </View>
          </SectionCard>
        )}

        {/* 行星對照 */}
        {planets.length > 0 && (
          <SectionCard title="行星閘門對照">
            {/* 表頭 */}
            <View style={styles.planetHeader}>
              <Text style={[styles.planetCol, styles.planetHeaderText]}>行星</Text>
              <Text style={[styles.planetGateCol, styles.planetHeaderText, { color: '#555' }]}>● 意識（黑）</Text>
              <Text style={[styles.planetGateCol, styles.planetHeaderText, { color: '#c04020' }]}>● 潛意識（紅）</Text>
            </View>
            {planets.map((p, i) => (
              <View key={i} style={[styles.planetRow, i % 2 === 1 && styles.planetRowAlt]}>
                <Text style={styles.planetCol}>{p.name}</Text>
                <Text style={[styles.planetGateCol, styles.planetBlack]}>{p.blackGate}.{p.blackLine}</Text>
                <Text style={[styles.planetGateCol, styles.planetRed]}>{p.redGate}.{p.redLine}</Text>
              </View>
            ))}
          </SectionCard>
        )}

        {/* 激活閘門 */}
        <SectionCard title={`激活閘門（${chart.gates.length}）`}>
          <View style={styles.gateGrid}>
            {chart.gates.map((g) => (
              <View key={g} style={styles.gate}>
                <Text style={styles.gateText}>{g}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

      </ScrollView>
    </SafeAreaView>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  )
}

function Row({
  label,
  value,
  accent,
  dim,
}: {
  label: string
  value: string
  accent?: boolean
  dim?: boolean
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, accent && styles.rowAccent, dim && styles.rowDim]}>
        {value}
      </Text>
    </View>
  )
}

function Tag({ label, active }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.tag, active && styles.tagActive]}>
      <Text style={[styles.tagText, active && styles.tagTextActive]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  inner: { padding: 16, paddingBottom: 40, rowGap: 12 },
  error: { color: '#ff6b6b', textAlign: 'center', marginTop: 80, fontSize: 16 },

  graphCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  graphContainer: {
    width: '100%',
    aspectRatio: 700 / 1030,
  },

  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  cardTitle: {
    color: '#8888aa',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  cardBody: { rowGap: 8 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowLabel: { color: '#8888aa', fontSize: 14, flex: 1 },
  rowValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  rowAccent: { color: '#a78bfa', fontWeight: '700' },
  rowDim: { color: '#ff9966' },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 6 },
  tag: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  tagActive: { backgroundColor: '#2e1e4e', borderColor: '#5b2dba' },
  tagText: { color: '#6666aa', fontSize: 13 },
  tagTextActive: { color: '#a78bfa', fontWeight: '600' },

  gateGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 8 },
  gate: {
    backgroundColor: '#14142a',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e2e4e',
  },
  gateText: { color: '#a78bfa', fontSize: 13, fontWeight: '600' },

  // planet table
  planetHeader: { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#2a2a3e', marginBottom: 4 },
  planetHeaderText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: '#8888aa' },
  planetRow: { flexDirection: 'row', paddingVertical: 5 },
  planetRowAlt: { backgroundColor: '#17172a', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 6 },
  planetCol: { flex: 1.2, fontSize: 13, color: '#ccc' },
  planetGateCol: { flex: 1, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  planetBlack: { color: '#e0e0e0' },
  planetRed: { color: '#e05030' },
})
