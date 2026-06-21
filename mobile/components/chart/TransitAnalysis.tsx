import { StyleSheet, Text, View } from 'react-native'
import { type Chart } from '@/lib/api'
import { CENTER_ORDER, HD_CHANNELS, HD_GATES } from '@/lib/hd-chart-data'
import { normalizeCenterId } from '@/lib/hd-normalizers'

const CENTER_SHORT_ZH: Record<string, string> = {
  head: '頭腦', ajna: '心智', throat: '喉嚨', g: 'G',
  heart: '意志力', spleen: '脾', sacral: '薦骨', solar: '情緒', root: '根部',
}

type TransitSnapshot = NonNullable<NonNullable<Chart['meta']>['transitSnapshot']>

export default function TransitAnalysis({
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

  const sharedGates       = snapshot.planets.filter(p => personalGateSet.has(p.gate))
  const transitOnlyGates  = snapshot.planets.filter(p => !personalGateSet.has(p.gate))

  const transitChartCenterSet = new Set(snapshot.definedCenterIds.map(normalizeCenterId))

  const activatedByTransit = CENTER_ORDER.filter(
    k => !personalChartCenterIds.has(k) && transitChartCenterSet.has(k),
  )

  const seenPairs = new Set<string>()
  const newChannels: typeof HD_CHANNELS = []
  const completingChannels: Array<{ ch: typeof HD_CHANNELS[number]; personalGate: number; transitGate: number }> = []

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
      <View style={[s.card, { gap: 8 }]}>
        <Text style={s.cardTitle}>中心</Text>
        {CENTER_ORDER.map(k => {
          const inP  = personalChartCenterIds.has(k)
          const inT  = transitChartCenterSet.has(k)
          const name = CENTER_SHORT_ZH[k] ?? k
          return (
            <View key={k} style={t.centerRow}>
              <Text style={t.centerName}>{name}</Text>
              <View style={t.badges}>
                {!inP && !inT && <View style={[t.badge, t.badgeOpen]}><Text style={t.badgeOpenText}>開放</Text></View>}
                {inP  && <View style={[t.badge, t.badgePersonal]}><Text style={t.badgePersonalText}>個人</Text></View>}
                {inT  && <View style={[t.badge, t.badgeTransit]}><Text style={t.badgeTransitText}>流日</Text></View>}
              </View>
            </View>
          )
        })}
        {activatedByTransit.length > 0 && (
          <View style={t.highlight}>
            <Text style={t.highlightTitle}>
              今日被流日暫時啟動：{activatedByTransit.map(k => CENTER_SHORT_ZH[k] ?? k).join('、')}中心
            </Text>
            <Text style={t.highlightBody}>
              以上原本開放的中心，今天因流日被暫時定義，可能帶來不熟悉的衝動或情緒底色。這些能量不屬於你的設計，不需要跟隨它行動。
            </Text>
          </View>
        )}
      </View>

      {/* 閘門 */}
      <View style={s.card}>
        <Text style={s.cardTitle}>閘門</Text>

        {sharedGates.length > 0 && (
          <>
            <Text style={t.subTitle}>個人圖 &amp; 流日共有</Text>
            {sharedGates.map(p => (
              <View key={`${p.gate}-${p.planetName}-${p.line}`} style={t.gateRow}>
                <Text style={t.gateNum}>{p.gate}</Text>
                <Text style={t.gatePlanet}>{p.planetName}</Text>
                <Text style={t.gateName}>{HD_GATES[p.gate]?.name.zh ?? ''}</Text>
                <View style={[t.badge, t.badgeShared]}><Text style={t.badgeSharedText}>共有</Text></View>
              </View>
            ))}
          </>
        )}

        {transitOnlyGates.length > 0 && (
          <>
            <Text style={[t.subTitle, { marginTop: sharedGates.length > 0 ? 14 : 0 }]}>今日流日閘門</Text>
            {transitOnlyGates.map(p => (
              <View key={`${p.gate}-${p.planetName}-${p.line}`} style={t.gateRow}>
                <Text style={t.gateNum}>{p.gate}</Text>
                <Text style={t.gatePlanet}>{p.planetName}</Text>
                <Text style={t.gateName}>{HD_GATES[p.gate]?.name.zh ?? ''}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      {/* 通道 */}
      {(newChannels.length > 0 || completingChannels.length > 0) && (
        <View style={s.card}>
          <Text style={s.cardTitle}>通道</Text>

          {newChannels.length > 0 && (
            <>
              <Text style={t.subTitle}>全新通道（流日帶來）</Text>
              {newChannels.map(ch => (
                <View key={ch.id} style={t.channelRow}>
                  <Text style={t.channelId}>{ch.from}-{ch.to}</Text>
                  <Text style={t.channelGates}>閘門 {ch.from} · {ch.to}</Text>
                </View>
              ))}
              <Text style={t.channelNote}>
                以上通道完全不屬於你原本的設計，你可能會想用這些頻率做事，但不適合據此做重要決定。
              </Text>
            </>
          )}

          {completingChannels.length > 0 && (
            <>
              <Text style={[t.subTitle, { marginTop: newChannels.length > 0 ? 16 : 0 }]}>補完通道（個人 + 流日）</Text>
              {completingChannels.map(({ ch, personalGate, transitGate }) => (
                <View key={ch.id} style={t.channelRow}>
                  <Text style={t.channelId}>{ch.from}-{ch.to}</Text>
                  <Text style={t.channelGates}>
                    {personalGate}（個人） + {transitGate}（流日）
                  </Text>
                </View>
              ))}
              <Text style={t.channelNote}>
                你有以上通道的其中一端，流日補上另一端，會短暫感受到完整通道的感覺，但能量散去後容易有失落感。
              </Text>
            </>
          )}
        </View>
      )}

      {/* 提醒 */}
      <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: '#f97316' }]}>
        <Text style={t.reminderText}>
          關於流日的提醒：流日啟動的地方愈多，不代表運勢愈好。這些暫時被啟動的能量都不屬於你原本的設計，容易讓你感覺被外在頻率推著走，甚至做出不適合自己的決策。最重要的事，始終是回到自己的內在權威做決定。
        </Text>
      </View>
    </>
  )
}

// shared card style (mirrors ChartPrimitives / main screen card)
const s = StyleSheet.create({
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
})

const t = StyleSheet.create({
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

  highlight:      { marginTop: 12, backgroundColor: '#1e1200', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#5a3000' },
  highlightTitle: { fontSize: 13, fontWeight: '700', color: '#f97316', marginBottom: 6 },
  highlightBody:  { fontSize: 13, color: '#cc9966', lineHeight: 20 },

  subTitle: { fontSize: 11, fontWeight: '700', color: '#8888aa', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },

  gateRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  gateNum:    { width: 30, fontSize: 14, fontWeight: '700', color: '#f97316' },
  gatePlanet: { width: 60, fontSize: 13, color: '#8888aa' },
  gateName:   { flex: 1, fontSize: 13, color: '#ccccdd' },
  badgeShared:     { backgroundColor: '#1a2a1a', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  badgeSharedText: { fontSize: 11, color: '#88cc88' },

  channelRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  channelId:    { width: 54, fontSize: 13, fontWeight: '700', color: '#f97316' },
  channelGates: { flex: 1, fontSize: 13, color: '#8888aa' },
  channelNote:  { fontSize: 12, color: '#8888aa', lineHeight: 18, marginTop: 8, fontStyle: 'italic' },

  reminderText: { fontSize: 13, color: '#8888aa', lineHeight: 20 },
})
