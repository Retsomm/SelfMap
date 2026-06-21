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
              <View key={`${p.gate}-${p.planetName}-${p.line}`} style={tStyles.gateRow}>
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
              <View key={`${p.gate}-${p.planetName}-${p.line}`} style={tStyles.gateRow}>
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
          ) : chart.chartKind === 'composite' ? (
            <View style={styles.legend}>
              <View style={[styles.legendDot, { backgroundColor: '#1a1a1a' }]} />
              <Text style={styles.legendText}>人物 A</Text>
              <View style={[styles.legendDot, { backgroundColor: '#c04020' }]} />
              <Text style={styles.legendText}>人物 B</Text>
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

        {/* 出生資訊（合圖不顯示，改在 CompositeInfo 中顯示） */}
        {chart.chartKind !== 'composite' && (
          <SectionCard title="出生資訊">
            <Row label="出生日期" value={chart.birthDate} />
            <Row label="出生時間" value={chart.birthTime} />
            <Row label="出生城市" value={chart.birthCity} />
            {chart.timezone ? <Row label="時區" value={chart.timezone} /> : null}
          </SectionCard>
        )}

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

        {/* 合圖專屬資訊 */}
        {chart.chartKind === 'composite' && (
          <CompositeInfo chart={chart} />
        )}

        {/* 以下區塊只對非流日、非合圖顯示 */}
        {!transitSnapshot && chart.chartKind !== 'composite' && (
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

        {/* 行星對照 & 激活閘門 — 只對非流日、非合圖顯示 */}
        {!transitSnapshot && chart.chartKind !== 'composite' && (
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

// ─── composite components ─────────────────────────────────────────────────────

const LIB_CENTER_ZH: Record<string, string> = {
  head: '頭腦中心', ajna: '心智中心', throat: '喉嚨中心', g: 'G 中心',
  ego: '意志力中心', heart: '意志力中心',
  solarPlexus: '情緒中心', solar: '情緒中心',
  spleen: '脾臟中心', sacral: '薦骨中心', root: '根部中心',
}

const INTEGRATION_THEME: Record<string, { label: string; love: string; work: string }> = {
  '9+0': {
    label: '全滿（9+0）— Nowhere to go',
    love: '極度甜蜜與黏人。能量場完全自給自足，外人很難融入。兩人會深深沉浸在彼此的世界中，但也容易因為缺乏外在刺激而感到窒息或過度封閉。',
    work: '過於封閉。團隊內部可能非常有默契，但極易忽略外部市場的變化或同事、客戶的客觀意見。',
  },
  '8+1': {
    label: '8+1 — Have some fun',
    love: '最舒服的互動模式。彼此有足夠的能量連結，同時留有「空白」作為陽光照進來的窗口。雙方擁有各自呼吸與消化的空間，關係健康且長久。',
    work: '黃金搭檔。既有共同努力的交集，又有一起去體驗、探索外部世界的窗口。',
  },
  '7+2': {
    label: '7+2 — Work to do',
    love: '最舒服的互動模式之一。保有兩個空白中心，彼此連結同時仍有足夠的獨立呼吸空間，長期相處不易窒息。',
    work: '黃金搭檔。既有共同努力的交集，又有兩扇開放的窗口迎接外在刺激與機會。',
  },
  '6+3+': {
    label: '6+3+ — Better to be free',
    love: '連結感較淡。兩人在一起時仍有太多未定因素，容易流於平淡或像朋友。通常需要藉由共同的興趣、小孩或外在媒介來維繫緊密感。',
    work: '適合團隊合作。保持高度的獨立性與自由度，不會對彼此造成過度制約，適合鬆散型的專案合作或大團隊中的平行分工。',
  },
}

const PROFILE_RESONANCE_DESC: Record<number, { title: string; desc: string }> = {
  1: { title: '1 爻共鳴', desc: '兩人都需要足夠的安全感與底層研究，能深深理解彼此打基礎的必要。' },
  2: { title: '2 爻共鳴', desc: '兩人都需要獨處與等待被呼喚的空間，彼此能體諒對方的隱士特質。' },
  3: { title: '3 爻共鳴', desc: '兩人都能理解試錯與碰撞的學習過程，不會因為失敗而互相責備。' },
  4: { title: '4 爻共鳴', desc: '兩人都重視人脈與穩定的社群，能在圈子建設上形成默契。' },
  5: { title: '5 爻共鳴', desc: '兩人都帶有被投射的特質，需要互相留意實際的期待落差。' },
  6: { title: '6 爻共鳴', desc: '兩人都有長遠的人生週期觀，能理解彼此不同階段的冷靜與退後。' },
}

const CONN_CFG: Record<string, { label: string; desc: string; accentColor: string; bgColor: string }> = {
  electromagnetic: {
    label: '電磁關係 (Electromagnetic)',
    desc:  '互補吸引 — 一方有 A 閘門，另一方有 B 閘門，合力激活完整通道。最經典的「致命吸引力」，容易一見鍾情但也容易相愛相殺。',
    accentColor: '#c8553d', bgColor: 'rgba(200,85,61,0.08)',
  },
  companionship: {
    label: '陪伴關係 (Companionship)',
    desc:  '默契安全 — 兩人擁有相同的閘門或通道，相處起來最不費力，如靈魂伴侶或老朋友。',
    accentColor: '#6b9a3c', bgColor: 'rgba(107,154,60,0.10)',
  },
  compromise: {
    label: '妥協關係 (Compromise)',
    desc:  '關係摩擦源 — 一方擁有完整通道，另一方只有其中一個閘門，長期易累積委屈與不平衡感。',
    accentColor: '#c8a820', bgColor: 'rgba(200,168,32,0.10)',
  },
  dominance: {
    label: '支配關係 (Dominance)',
    desc:  '單向引導 — 一方在某條通道有能量，另一方完全開放，空白的那方會單向受到能量制約。',
    accentColor: '#6b7280', bgColor: 'rgba(43,31,20,0.05)',
  },
}

const T_COMP = {
  bg:       '#0f0f1a',
  surface:  '#1e1e2e',
  border:   '#2a2a3e',
  text:     '#ffffff',
  sub:      '#8888aa',
  muted:    '#555577',
  accent:   '#a78bfa',
}

function CompositeInfo({ chart }: { chart: import('@/lib/api').Chart }) {
  const meta    = chart.meta
  const personA = meta?.personA
  const personB = meta?.personB
  const result  = meta?.compositeResult
  const theme   = result ? (INTEGRATION_THEME[result.integrationTheme] ?? INTEGRATION_THEME['6+3+']) : null

  const nameA = personA?.name || 'A'
  const nameB = personB?.name || 'B'

  return (
    <View style={cStyles.root}>

      {/* ── 人物資訊 ─────────────────────────────── */}
      <View style={cStyles.personRow}>
        {[
          { label: nameA, p: personA, color: '#c8553d' },
          { label: nameB, p: personB, color: T_COMP.text },
        ].map(({ label, p, color }) => (
          <View key={label} style={cStyles.personCard}>
            <Text style={[cStyles.personName, { color }]}>{label}</Text>
            <Text style={cStyles.personSub}>{p?.birthDate ?? '—'}</Text>
            <Text style={cStyles.personSub}>{p?.birthCity ?? '—'}</Text>
            <Text style={cStyles.personMeta}>{p?.type ?? '—'} · {p?.profile ?? '—'}</Text>
          </View>
        ))}
      </View>

      {result && theme && (
        <>
          {/* ── 整合主題 ────────────────────────────── */}
          <View style={cStyles.section}>
            <Text style={cStyles.sectionLabel}>能量場整合主題</Text>
            <View style={cStyles.card}>
              <View style={cStyles.themeHeader}>
                <Text style={cStyles.themeLabel}>{theme.label}</Text>
                <Text style={cStyles.themeSub}>
                  合圖定義 {result.compositeDefinedCount} / 9 中心 · 開放 {result.compositeOpenCount} 中心
                </Text>
              </View>
              <View style={cStyles.themePair}>
                <View style={cStyles.themeBlock}>
                  <Text style={cStyles.themeBlockLabel}>戀愛關係</Text>
                  <Text style={cStyles.themeBlockBody}>{theme.love}</Text>
                </View>
                <View style={[cStyles.themeBlock, { marginTop: 12 }]}>
                  <Text style={cStyles.themeBlockLabel}>工作夥伴</Text>
                  <Text style={cStyles.themeBlockBody}>{theme.work}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── 四種核心連結動力 ─────────────────────── */}
          <View style={cStyles.section}>
            <Text style={cStyles.sectionLabel}>四種核心連結動力</Text>
            {(['electromagnetic', 'companionship', 'compromise', 'dominance'] as const).map(type => {
              const items = result[type]
              const cfg   = CONN_CFG[type]
              return (
                <View key={type} style={[cStyles.connGroup, { borderColor: cfg.accentColor + '55' }]}>
                  <View style={[cStyles.connHeader, { backgroundColor: cfg.bgColor }]}>
                    <Text style={[cStyles.connTitle, { color: cfg.accentColor }]}>{cfg.label}</Text>
                    <Text style={cStyles.connDesc}>{cfg.desc}</Text>
                  </View>
                  {items.length === 0 ? (
                    <Text style={cStyles.connEmpty}>無相關通道</Text>
                  ) : items.map(conn => (
                    <View key={conn.channelId} style={cStyles.connRow}>
                      <View style={cStyles.connIdCol}>
                        <Text style={cStyles.connId}>{conn.channelId}</Text>
                        <Text style={cStyles.connCenters}>
                          {LIB_CENTER_ZH[conn.centerA] ?? conn.centerA}—{LIB_CENTER_ZH[conn.centerB] ?? conn.centerB}
                        </Text>
                      </View>
                      <View style={cStyles.connGateCol}>
                        <Text style={[cStyles.connPersonLabel, { color: '#c8553d' }]}>{nameA}</Text>
                        <Text style={cStyles.connGates}>{conn.aGates.length > 0 ? conn.aGates.join(', ') : '—'}</Text>
                      </View>
                      <View style={cStyles.connGateCol}>
                        <Text style={cStyles.connPersonLabel}>{nameB}</Text>
                        <Text style={cStyles.connGates}>{conn.bGates.length > 0 ? conn.bGates.join(', ') : '—'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )
            })}
          </View>

          {/* ── 合圖定義通道 ─────────────────────────── */}
          {chart.channels.length > 0 && (
            <View style={cStyles.section}>
              <Text style={cStyles.sectionLabel}>合圖定義通道（{chart.channels.length}）</Text>
              <View style={cStyles.card}>
                <View style={cStyles.chipRow}>
                  {chart.channels.map(rawCh => {
                    const ch = findChannelById(rawCh)
                    const id = ch ? `${ch.from}-${ch.to}` : rawCh.replace(/^c/, '')
                    return (
                      <View key={rawCh} style={cStyles.chip}>
                        <Text style={cStyles.chipId}>{id}</Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ── 人生角色共鳴 ─────────────────────────── */}
          <View style={cStyles.section}>
            <Text style={cStyles.sectionLabel}>人生角色共鳴</Text>
            <View style={cStyles.card}>
              <View style={cStyles.profileRow}>
                <Text style={[cStyles.profileLabel, { color: '#c8553d' }]}>{nameA} {personA?.profile}</Text>
                <Text style={cStyles.profileLabel}>{nameB} {personB?.profile}</Text>
              </View>
              {result.profileResonance.length === 0 ? (
                <Text style={cStyles.resonanceNone}>兩人人生角色沒有共同爻線，各自的觀點框架較為不同。</Text>
              ) : result.profileResonance.map(line => {
                const info = PROFILE_RESONANCE_DESC[line]
                if (!info) return null
                return (
                  <View key={line} style={cStyles.resonanceRow}>
                    <Text style={cStyles.resonanceTitle}>{info.title}</Text>
                    <Text style={cStyles.resonanceDesc}>{info.desc}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* ── 策略與內在權威 ───────────────────────── */}
          <View style={cStyles.section}>
            <Text style={cStyles.sectionLabel}>策略與內在權威</Text>
            {[
              { label: `${nameA} 的權威`, p: personA, color: '#c8553d' },
              { label: `${nameB} 的權威`, p: personB, color: T_COMP.text },
            ].map(({ label, p, color }) => (
              <View key={label} style={[cStyles.authorityCard, { borderLeftColor: color }]}>
                <Text style={cStyles.authorityLabel}>{label}</Text>
                <Text style={[cStyles.authorityName, { color }]}>{p?.authority ?? '—'}</Text>
                {p?.authorityTip ? <Text style={cStyles.authorityTip}>{p.authorityTip}</Text> : null}
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}

const cStyles = StyleSheet.create({
  root:              { gap: 16 },
  section:           { gap: 8 },
  sectionLabel:      { fontSize: 11, fontWeight: '600', color: T_COMP.muted, letterSpacing: 1.2, textTransform: 'uppercase' },

  // Person header
  personRow:         { flexDirection: 'row', gap: 10 },
  personCard:        { flex: 1, backgroundColor: T_COMP.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: T_COMP.border },
  personName:        { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  personSub:         { fontSize: 12, color: T_COMP.sub },
  personMeta:        { fontSize: 12, color: T_COMP.muted, marginTop: 6 },

  // Card
  card:              { backgroundColor: T_COMP.surface, borderRadius: 12, borderWidth: 1, borderColor: T_COMP.border, overflow: 'hidden' },

  // Integration theme
  themeHeader:       { padding: 14, borderBottomWidth: 1, borderBottomColor: T_COMP.border },
  themeLabel:        { fontSize: 16, fontWeight: '700', color: T_COMP.text, marginBottom: 4 },
  themeSub:          { fontSize: 12, color: T_COMP.sub },
  themePair:         { padding: 14 },
  themeBlock:        {},
  themeBlockLabel:   { fontSize: 10, fontWeight: '700', color: T_COMP.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  themeBlockBody:    { fontSize: 13, color: T_COMP.text, lineHeight: 20 },

  // Connection groups
  connGroup:         { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  connHeader:        { padding: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a3e' },
  connTitle:         { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  connDesc:          { fontSize: 12, color: T_COMP.sub, lineHeight: 18 },
  connEmpty:         { padding: 12, fontSize: 12, color: T_COMP.muted },
  connRow:           { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: '#1e1e2e', gap: 8 },
  connIdCol:         { width: 80 },
  connId:            { fontSize: 13, fontWeight: '700', color: T_COMP.text },
  connCenters:       { fontSize: 10, color: T_COMP.muted, lineHeight: 14, marginTop: 2 },
  connGateCol:       { flex: 1 },
  connPersonLabel:   { fontSize: 11, fontWeight: '600', color: T_COMP.sub, marginBottom: 1 },
  connGates:         { fontSize: 13, color: T_COMP.text },

  // Composite channels
  chipRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12 },
  chip:              { borderWidth: 1, borderColor: T_COMP.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  chipId:            { fontSize: 12, color: T_COMP.accent, fontWeight: '600' },

  // Profile resonance
  profileRow:        { flexDirection: 'row', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: T_COMP.border },
  profileLabel:      { fontSize: 14, fontWeight: '600', color: T_COMP.text },
  resonanceNone:     { fontSize: 13, color: T_COMP.sub, lineHeight: 20, padding: 12 },
  resonanceRow:      { paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: T_COMP.border },
  resonanceTitle:    { fontSize: 13, fontWeight: '700', color: T_COMP.text, marginBottom: 3 },
  resonanceDesc:     { fontSize: 13, color: T_COMP.sub, lineHeight: 19 },

  // Authority
  authorityCard:     { backgroundColor: T_COMP.surface, borderRadius: 12, borderWidth: 1, borderColor: T_COMP.border, borderLeftWidth: 4, padding: 14, marginBottom: 8 },
  authorityLabel:    { fontSize: 10, fontWeight: '700', color: T_COMP.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  authorityName:     { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  authorityTip:      { fontSize: 13, color: T_COMP.sub, lineHeight: 19 },
})

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
