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
import { CENTER_ORDER, HD_CHANNELS, HD_CENTERS_INFO, HD_GATES, type ChartChannel } from '@/lib/hd-chart-data'
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

// ─── transit analysis ─────────────────────────────────────────────────────────

const CENTER_SHORT_ZH: Record<string, string> = {
  head: '頭腦', ajna: '心智', throat: '喉嚨', g: 'G',
  heart: '意志力', spleen: '脾', sacral: '薦骨', solar: '情緒', root: '根部',
}

type TransitSnapshot = NonNullable<NonNullable<Chart['meta']>['transitSnapshot']>

function TransitAnalysis({
  snapshot,
  personalGates,
  personalChartCenterIds,
}: {
  snapshot: TransitSnapshot
  personalGates: number[]
  personalChartCenterIds: Set<string>
}) {
  const personalGateSet = new Set(personalGates)
  const transitGateSet  = new Set(snapshot.allGates)

  // Gates
  const sharedGates    = snapshot.planets.filter(p => personalGateSet.has(p.gate))
  const transitOnlyGates = snapshot.planets.filter(p => !personalGateSet.has(p.gate))

  // Transit center set (already normalized to lib keys from server)
  const transitChartCenterSet = new Set(snapshot.definedCenterIds.map(normalizeCenterId))

  // Centers: temporarily activated = was open (not in personal) but transit defined it
  const activatedByTransit = CENTER_ORDER.filter(
    k => !personalChartCenterIds.has(k) && transitChartCenterSet.has(k),
  )

  // Channels
  const seenPairs = new Set<string>()
  const newChannels: ChartChannel[] = []
  const completingChannels: Array<{ ch: ChartChannel; personalGate: number; transitGate: number }> = []

  for (const ch of HD_CHANNELS) {
    const key = `${Math.min(ch.from, ch.to)}-${Math.max(ch.from, ch.to)}`
    if (seenPairs.has(key)) continue
    seenPairs.add(key)

    const aInP = personalGateSet.has(ch.from)
    const bInP = personalGateSet.has(ch.to)
    const aInT = transitGateSet.has(ch.from)
    const bInT = transitGateSet.has(ch.to)

    if (!aInP && !bInP && aInT && bInT) {
      newChannels.push(ch)
    } else if (aInP && !bInP && bInT) {
      completingChannels.push({ ch, personalGate: ch.from, transitGate: ch.to })
    } else if (!aInP && bInP && aInT) {
      completingChannels.push({ ch, personalGate: ch.to, transitGate: ch.from })
    }
  }

  return (
    <>
      {/* 中心 */}
      <View style={[styles.card, { gap: 8 }]}>
        <Text style={styles.cardTitle}>中心</Text>
        {CENTER_ORDER.map(k => {
          const inP = personalChartCenterIds.has(k)
          const inT = transitChartCenterSet.has(k)
          const name = CENTER_SHORT_ZH[k] ?? k
          return (
            <View key={k} style={tStyles.centerRow}>
              <Text style={tStyles.centerName}>{name}</Text>
              <View style={tStyles.badges}>
                {!inP && !inT && <View style={[tStyles.badge, tStyles.badgeOpen]}><Text style={tStyles.badgeOpenText}>開放</Text></View>}
                {inP  && <View style={[tStyles.badge, tStyles.badgePersonal]}><Text style={tStyles.badgePersonalText}>個人</Text></View>}
                {inT  && <View style={[tStyles.badge, tStyles.badgeTransit]}><Text style={tStyles.badgeTransitText}>流日</Text></View>}
              </View>
            </View>
          )
        })}
        {activatedByTransit.length > 0 && (
          <View style={tStyles.highlight}>
            <Text style={tStyles.highlightTitle}>
              今日被流日暫時啟動：{activatedByTransit.map(k => CENTER_SHORT_ZH[k] ?? k).join('、')}中心
            </Text>
            <Text style={tStyles.highlightBody}>
              以上原本開放的中心，今天因流日被暫時定義，可能帶來不熟悉的衝動或情緒底色。這些能量不屬於你的設計，不需要跟隨它行動。
            </Text>
          </View>
        )}
      </View>

      {/* 閘門 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>閘門</Text>

        {sharedGates.length > 0 && (
          <>
            <Text style={tStyles.subTitle}>個人圖 &amp; 流日共有</Text>
            {sharedGates.map(p => (
              <View key={p.gate} style={tStyles.gateRow}>
                <Text style={tStyles.gateNum}>{p.gate}</Text>
                <Text style={tStyles.gatePlanet}>{p.planetName}</Text>
                <Text style={tStyles.gateName}>{HD_GATES[p.gate]?.name.zh ?? ''}</Text>
                <View style={[tStyles.badge, tStyles.badgeShared]}><Text style={tStyles.badgeSharedText}>共有</Text></View>
              </View>
            ))}
          </>
        )}

        {transitOnlyGates.length > 0 && (
          <>
            <Text style={[tStyles.subTitle, { marginTop: sharedGates.length > 0 ? 14 : 0 }]}>今日流日閘門</Text>
            {transitOnlyGates.map(p => (
              <View key={p.gate} style={tStyles.gateRow}>
                <Text style={tStyles.gateNum}>{p.gate}</Text>
                <Text style={tStyles.gatePlanet}>{p.planetName}</Text>
                <Text style={tStyles.gateName}>{HD_GATES[p.gate]?.name.zh ?? ''}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      {/* 通道 */}
      {(newChannels.length > 0 || completingChannels.length > 0) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>通道</Text>

          {newChannels.length > 0 && (
            <>
              <Text style={tStyles.subTitle}>全新通道（流日帶來）</Text>
              {newChannels.map(ch => (
                <View key={ch.id} style={tStyles.channelRow}>
                  <Text style={tStyles.channelId}>{ch.from}-{ch.to}</Text>
                  <Text style={tStyles.channelGates}>閘門 {ch.from} · {ch.to}</Text>
                </View>
              ))}
              <Text style={tStyles.channelNote}>
                以上通道完全不屬於你原本的設計，你可能會想用這些頻率做事，但不適合據此做重要決定。
              </Text>
            </>
          )}

          {completingChannels.length > 0 && (
            <>
              <Text style={[tStyles.subTitle, { marginTop: newChannels.length > 0 ? 16 : 0 }]}>補完通道（個人 + 流日）</Text>
              {completingChannels.map(({ ch, personalGate, transitGate }) => (
                <View key={ch.id} style={tStyles.channelRow}>
                  <Text style={tStyles.channelId}>{ch.from}-{ch.to}</Text>
                  <Text style={tStyles.channelGates}>
                    {personalGate}（個人） + {transitGate}（流日）
                  </Text>
                </View>
              ))}
              <Text style={tStyles.channelNote}>
                你有以上通道的其中一端，流日補上另一端，會短暫感受到完整通道的感覺，但能量散去後容易有失落感。
              </Text>
            </>
          )}
        </View>
      )}

      {/* 提醒 */}
      <View style={[styles.card, { borderColor: '#2a1a0e', borderLeftWidth: 3, borderLeftColor: '#f97316' }]}>
        <Text style={tStyles.reminderText}>
          關於流日的提醒：流日啟動的地方愈多，不代表運勢愈好。這些暫時被啟動的能量都不屬於你原本的設計，容易讓你感覺被外在頻率推著走，甚至做出不適合自己的決策。最重要的事，始終是回到自己的內在權威做決定。
        </Text>
      </View>
    </>
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

  const typeMeta = getTypeMeta(chart.type)

  const transitSnapshot = chart.chartKind === 'transit' ? chart.meta?.transitSnapshot : undefined

  // For transit charts, use combined center/channel IDs for body graph structure
  const definedCenterIds = transitSnapshot
    ? new Set(transitSnapshot.combinedDefinedCenterIds.map(normalizeCenterId))
    : new Set(chart.centers.map(normalizeCenterId))
  const definedChannelIds = transitSnapshot
    ? new Set(transitSnapshot.combinedDefinedChannelIds.map(normalizeChannelId))
    : new Set(chart.channels.map(normalizeChannelId))

  const planets: StoredPlanet[] = chart.planets ?? []

  const activations: Record<number, { c?: boolean; u?: boolean; t?: boolean }> = {}
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
  // Overlay transit gates in orange (only gates not already in personal)
  if (transitSnapshot) {
    for (const g of transitSnapshot.allGates) {
      if (!activations[g]) activations[g] = { t: true }
    }
  }

  // Precompute personal chart center IDs (in chart keys) for transit analysis
  const personalChartCenterIds = new Set(chart.centers.map(normalizeCenterId))

  const open = (target: SheetTarget) => setSheetTarget(target)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>

        {/* Body Graph SVG — 純顯示，不觸發彈窗 */}
        <View style={styles.graphCard}>
          <Text style={styles.cardTitle}>Body Graph</Text>
          {transitSnapshot ? (
            <View style={styles.legend}>
              <View style={[styles.legendDot, { backgroundColor: '#1a1a1a' }]} />
              <Text style={styles.legendText}>個人意識</Text>
              <View style={[styles.legendDot, { backgroundColor: '#c04020' }]} />
              <Text style={styles.legendText}>個人潛意識</Text>
              <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
              <Text style={styles.legendText}>流日</Text>
            </View>
          ) : null}
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

        {/* 流日分析報告（transit 圖表專屬） */}
        {transitSnapshot ? (
          <>
            <View style={[styles.card, { justifyContent: 'center' }]}>
              <Text style={styles.transitTime}>
                流日計算時間：{new Date(transitSnapshot.computedAt).toLocaleString('zh-TW', { hour12: false, timeZone: 'Asia/Taipei' })}
              </Text>
            </View>
            <TransitAnalysis
              snapshot={transitSnapshot}
              personalGates={chart.gates}
              personalChartCenterIds={personalChartCenterIds}
            />
          </>
        ) : null}

        {/* 以下區塊只對非流日圖表顯示 */}
        {!transitSnapshot && (
          <>
            {/* 類型 & 策略 */}
            <SectionCard title="類型">
              <Row
                label="能量類型"
                value={chart.type}
                accent
                tappable
                onPress={() => open({ kind: 'type', typeKey: chart.type })}
              />
              <Row label="策略" value={typeMeta.strategy} />
              <Row label="簽名（成功徵兆）" value={typeMeta.signature} accent />
              <Row label="非自我主題" value={typeMeta.notSelf} dim />
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
                  const chartKey = normalizeCenterId(c)
                  const info     = HD_CENTERS_INFO[chartKey]
                  const label    = info?.name.zh ?? c
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
          </>
        )}

        {/* 行星對照 & 激活閘門 — 只對非流日圖表顯示 */}
        {!transitSnapshot && (
          <>
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
          </>
        )}

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

// tappable controls visual appearance (chevron + highlight style); onPress wraps in Pressable.
// A row can be tappable=true without onPress (looks interactive but isn't).
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
  legend: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    gap: 6, marginBottom: 12,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#8888aa', marginRight: 8 },
  transitTime: { fontSize: 12, color: '#f97316' },

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

const tStyles = StyleSheet.create({
  // Center row
  centerRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  centerName:   { flex: 1, fontSize: 14, color: '#ccccdd' },
  badges:       { flexDirection: 'row', gap: 6 },
  badge:             { borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  badgeOpen:         { backgroundColor: '#1a1a2e' },
  badgeOpenText:     { fontSize: 11, color: '#555577' },
  badgePersonal:     { backgroundColor: '#2e1e4e' },
  badgePersonalText: { fontSize: 11, color: '#a78bfa', fontWeight: '600' },
  badgeTransit:      { backgroundColor: '#2a1400' },
  badgeTransitText:  { fontSize: 11, color: '#f97316', fontWeight: '600' },

  // Highlight box
  highlight:      { marginTop: 12, backgroundColor: '#1e1200', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#5a3000' },
  highlightTitle: { fontSize: 13, fontWeight: '700', color: '#f97316', marginBottom: 6 },
  highlightBody:  { fontSize: 13, color: '#cc9966', lineHeight: 20 },

  // Sub-title
  subTitle: { fontSize: 11, fontWeight: '700', color: '#8888aa', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },

  // Gate row
  gateRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  gateNum:    { width: 30, fontSize: 14, fontWeight: '700', color: '#f97316' },
  gatePlanet: { width: 60, fontSize: 13, color: '#8888aa' },
  gateName:   { flex: 1, fontSize: 13, color: '#ccccdd' },
  badgeShared:    { backgroundColor: '#1a2a1a', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  badgeSharedText:{ fontSize: 11, color: '#88cc88' },

  // Channel row
  channelRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  channelId:   { width: 54, fontSize: 13, fontWeight: '700', color: '#f97316' },
  channelGates:{ flex: 1, fontSize: 13, color: '#8888aa' },
  channelNote: { fontSize: 12, color: '#8888aa', lineHeight: 18, marginTop: 8, fontStyle: 'italic' },

  // Reminder
  reminderText: { fontSize: 13, color: '#8888aa', lineHeight: 20 },
})
