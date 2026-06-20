import { useAuth } from '@clerk/expo'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { type Chart, type StoredPlanet, getChart } from '@/lib/api'
import { HD_CHANNELS, HD_CENTERS_INFO, type ChartChannel } from '@/lib/hd-chart-data'
import BodyGraph from '@/components/BodyGraph'
import DetailBottomSheet, { type SheetTarget } from '@/components/DetailBottomSheet'

// ─── center id normalisation ─────────────────────────────────────────────────
// lib uses 'ego' / 'solarPlexus'; hd-chart-data uses 'heart' / 'solar'
const LIB_TO_CHART: Record<string, string> = {
  ego: 'heart',
  solarPlexus: 'solar',
}
function normalizeCenterId(id: string): string {
  return LIB_TO_CHART[id] ?? id
}

// lib channel ids: '1-8', 'c2-14' → hd-chart-data ids: 'c1-8', 'c2-14'
function normalizeChannelId(id: string): string {
  return id.startsWith('c') ? id : `c${id}`
}

// Lookup ChartChannel from a raw channel id string ('c1-8', '1-8', etc.)
function findChannelById(rawId: string): ChartChannel | undefined {
  const id = normalizeChannelId(rawId)
  const found = HD_CHANNELS.find((ch) => ch.id === id)
  if (found) return found
  // try reversed gate order
  const inner = id.slice(1)            // "64-47"
  const parts = inner.split('-')
  if (parts.length === 2) {
    const reversed = `c${parts[1]}-${parts[0]}`
    return HD_CHANNELS.find((ch) => ch.id === reversed)
  }
  return undefined
}

// ─── type metadata ────────────────────────────────────────────────────────────
type TypeMeta = { strategy: string; signature: string; notSelf: string }

const TYPE_META: Record<string, TypeMeta> = {
  Manifestor:             { strategy: '告知',               signature: '和平', notSelf: '憤怒' },
  Generator:              { strategy: '等待回應',            signature: '滿足', notSelf: '沮喪' },
  'Manifesting Generator':{ strategy: '等待回應，再告知',    signature: '滿足', notSelf: '沮喪' },
  Projector:              { strategy: '等待邀請',            signature: '成功', notSelf: '苦澀' },
  Reflector:              { strategy: '等待月循環（28 天）',  signature: '驚喜', notSelf: '失望' },
}

function getTypeMeta(type: string): TypeMeta {
  return (
    TYPE_META[type] ??
    Object.entries(TYPE_META).find(([k]) => type.includes(k))?.[1] ?? {
      strategy: '-', signature: '-', notSelf: '-',
    }
  )
}

// ─── screen ──────────────────────────────────────────────────────────────────
export default function ChartDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getToken } = useAuth()
  const [chart, setChart] = useState<Chart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const token = await getToken()
        if (!token) { setError('未登入，請重新登入'); return }
        const data = await getChart(token, id)
        setChart(data.chart)
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

  const definedCenterIds = new Set(chart.centers.map(normalizeCenterId))
  const definedChannelIds = new Set(chart.channels.map(normalizeChannelId))

  const planets: StoredPlanet[] = chart.planets ?? []

  const activations: Record<number, { c?: boolean; u?: boolean }> = {}
  if (planets.length > 0) {
    for (const p of planets) {
      activations[p.blackGate] = { ...activations[p.blackGate], c: true }
      activations[p.redGate]   = { ...activations[p.redGate],   u: true }
    }
  } else {
    const personalityGates: number[] = chart.personalityGates ?? []
    const designGates: number[]      = chart.designGates ?? []
    if (personalityGates.length > 0 || designGates.length > 0) {
      for (const g of personalityGates) activations[g] = { ...activations[g], c: true }
      for (const g of designGates)      activations[g] = { ...activations[g], u: true }
    } else {
      for (const g of chart.gates) activations[g] = { c: true }
    }
  }

  const open = (target: SheetTarget) => setSheetTarget(target)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>

        {/* Body Graph SVG — 純顯示，不觸發彈窗 */}
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
          <Row
            label="能量類型"
            value={chart.type}
            accent
            tappable
            onPress={() => open({ kind: 'type', typeKey: chart.type })}
          />
          <Row label="策略" value={meta.strategy} />
          <Row label="簽名（成功徵兆）" value={meta.signature} accent />
          <Row label="非自我主題" value={meta.notSelf} dim />
        </SectionCard>

        {/* 設計 */}
        <SectionCard title="設計">
          <Row
            label="內在權威"
            value={chart.authority}
            accent
            tappable
            onPress={() => open({ kind: 'authority', authorityKey: chart.authority })}
          />
          <Row
            label="人生角色（Profile）"
            value={chart.profile}
            tappable
            onPress={() => open({ kind: 'profile', profile: chart.profile })}
          />
          <Row
            label="定義"
            value={chart.definition}
            tappable
            onPress={() => open({ kind: 'definition', definitionKey: chart.definition })}
          />
        </SectionCard>

        {/* 九大中心 */}
        <SectionCard title="九大中心（已定義）">
          <View style={styles.tagRow}>
            {chart.centers.map((c) => {
              const chartKey  = normalizeCenterId(c)
              const info      = HD_CENTERS_INFO[chartKey]
              const label     = info?.name.zh ?? c
              return (
                <Tag
                  key={c}
                  label={label}
                  active
                  onPress={() => open({ kind: 'center', id: chartKey })}
                />
              )
            })}
          </View>
        </SectionCard>

        {/* 定義通道 */}
        {chart.channels.length > 0 && (
          <SectionCard title={`定義通道（${chart.channels.length}）`}>
            <View style={styles.tagRow}>
              {chart.channels.map((rawCh) => {
                const ch = findChannelById(rawCh)
                const label = ch ? `${ch.from}–${ch.to}` : rawCh
                return (
                  <Tag
                    key={rawCh}
                    label={label}
                    onPress={ch ? () => open({ kind: 'channel', channel: ch }) : undefined}
                  />
                )
              })}
            </View>
          </SectionCard>
        )}

        {/* 行星對照 */}
        {planets.length > 0 && (
          <SectionCard title="行星閘門對照">
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
              <Pressable
                key={g}
                style={({ pressed }) => [styles.gate, pressed && styles.gatePressed]}
                onPress={() => open({ kind: 'gate', num: g })}
              >
                <Text style={styles.gateText}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

      </ScrollView>

      <DetailBottomSheet
        target={sheetTarget}
        onClose={() => setSheetTarget(null)}
      />
    </SafeAreaView>
  )
}

// ─── shared components ────────────────────────────────────────────────────────

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
  tappable,
  onPress,
}: {
  label: string
  value: string
  accent?: boolean
  dim?: boolean
  tappable?: boolean
  onPress?: () => void
}) {
  const inner = (
    <View style={[styles.row, tappable && styles.rowTappable]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, accent && styles.rowAccent, dim && styles.rowDim]}>
          {value}
        </Text>
        {tappable && <Text style={styles.rowChevron}>›</Text>}
      </View>
    </View>
  )
  if (!onPress) return inner
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed ? styles.rowPressedBg : undefined}>
      {inner}
    </Pressable>
  )
}

function Tag({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const chip = (
    <View style={[styles.tag, active && styles.tagActive, !!onPress && styles.tagTappable]}>
      <Text style={[styles.tagText, active && styles.tagTextActive]}>{label}</Text>
    </View>
  )
  if (!onPress) return chip
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed ? { opacity: 0.7 } : undefined}>
      {chip}
    </Pressable>
  )
}

// ─── styles ───────────────────────────────────────────────────────────────────

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
  cardBody: { rowGap: 4 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowTappable: { paddingVertical: 8 },
  rowPressedBg: { backgroundColor: 'rgba(167,139,250,0.08)', borderRadius: 8 },
  rowLabel: { color: '#8888aa', fontSize: 14, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  rowValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    marginLeft: 8,
  },
  rowAccent: { color: '#a78bfa', fontWeight: '700' },
  rowDim: { color: '#ff9966' },
  rowChevron: { color: '#5555aa', fontSize: 18, lineHeight: 20 },

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
  tagTappable: { borderColor: '#3a2a6e' },
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
  gatePressed: { backgroundColor: '#2e1e4e', borderColor: '#a78bfa' },
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
