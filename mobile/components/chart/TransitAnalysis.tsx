import { StyleSheet, Text, View } from 'react-native'
import { type Chart } from '@/lib/api'
import { CENTER_ORDER, HD_CHANNELS, HD_GATES } from '@/lib/hd-chart-data'
import { normalizeCenterId } from '@/lib/hd-normalizers'
import { Colors, Radius, Spacing } from '@/constants/tokens'

const CENTER_SHORT_ZH: Record<string, string> = {
  head: '頭腦', ajna: '邏輯', throat: '喉嚨', g: 'G',
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

  const combinedChartCenterSet = new Set(snapshot.combinedDefinedCenterIds.map(normalizeCenterId))

  const activatedByTransit = CENTER_ORDER.filter(
    k => !personalChartCenterIds.has(k) && combinedChartCenterSet.has(k),
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
      {/* 空白中心被激活 */}
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
                這些是今日流日帶給你的限定天賦，可以借來執行任務、享受那股靈感或動力。只是記得，這件衣服明天會換掉，不要在它還穿著的時候做需要長久負責的承諾。
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
                你本身擁有一半，今天流日借你補齊了另一半，讓你短暫體驗完整通道的感覺。這股能量來了可以好好享用，能量退潮後回到原本的節奏就好。
              </Text>
            </>
          )}
        </View>
      )}

      {/* 提醒 */}
      <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: Colors.transit }]}>
        <Text style={t.reminderText}>
          把流日想像成宇宙每天發給你的「限定體驗卡」。被激活的能量雖然不是你本來的配備，卻是可以借來用的暫時天賦——拿來執行、創作、或體驗平時沒有的敏銳度都很好。只要掌握一個原則：盡情享受過程，但不要在被流日定義的地方做重大的長期承諾。始終以自己的內在權威做最終決定。
        </Text>
      </View>
    </>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    color: Colors.sub,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
})

const t = StyleSheet.create({
  badge:            { borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },

  highlight: {
    backgroundColor: Colors.transitHighlightBg,
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.transitHighlightBorder,
  },
  highlightTitle: { fontSize: 13, fontWeight: '700', color: Colors.transit, marginBottom: 6 },
  highlightBody:  { fontSize: 13, color: Colors.transitWarmText, lineHeight: 20 },

  subTitle: { fontSize: 11, fontWeight: '700', color: Colors.sub, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },

  gateRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.border },
  gateNum:    { width: 30, fontSize: 14, fontWeight: '700', color: Colors.transit },
  gatePlanet: { width: 60, fontSize: 13, color: Colors.sub },
  gateName:   { flex: 1, fontSize: 13, color: Colors.text },
  badgeShared:     { backgroundColor: Colors.successBg, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  badgeSharedText: { fontSize: 11, color: Colors.successText },

  channelRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  channelId:    { width: 54, fontSize: 13, fontWeight: '700', color: Colors.transit },
  channelGates: { flex: 1, fontSize: 13, color: Colors.sub },
  channelNote:  { fontSize: 12, color: Colors.sub, lineHeight: 18, marginTop: 8, fontStyle: 'italic' },

  reminderText: { fontSize: 13, color: Colors.sub, lineHeight: 20 },
})
