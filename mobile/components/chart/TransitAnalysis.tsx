import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { type Chart } from '@/lib/api'
import { CENTER_ORDER, HD_CHANNELS } from '@shared/humanDesign/hd-chart-data'
import { normalizeCenterId } from '@/lib/hd-normalizers'
import { CENTER_NAME } from '@/lib/hd-constants'
import { Radius, Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'
import { GateChip } from '@/components/transit/GateChip'
import { ImpactCard } from '@/components/transit/ImpactCard'

type TransitSnapshot = NonNullable<NonNullable<Chart['meta']>['transitSnapshot']>

const channelLabel = (from: number, to: number) => `${Math.min(from, to)}-${Math.max(from, to)}`

/**
 * 圖表詳情頁（儲存後）的流日分析——內容與呈現方式跟儲存前的預覽（TransitView.tsx）一致，
 * 共用 GateChip／ImpactCard，避免兩邊各自維護造成文案與版面不一致。
 */
export default function TransitAnalysis({
  snapshot,
  personalGates,
  personalChartCenterIds,
}: {
  snapshot: TransitSnapshot
  personalGates: number[]
  personalChartCenterIds: Set<string>
}) {
  const Colors = useThemeColors()
  const s = useMemo(() => createStyles(Colors), [Colors])

  const personalGateSet = new Set(personalGates)
  const transitGateSet  = new Set(snapshot.allGates)
  const shared      = personalGates.filter(g => transitGateSet.has(g)).sort((a, b) => a - b)
  const transitOnly = snapshot.allGates.filter(g => !personalGateSet.has(g)).sort((a, b) => a - b)

  const combinedChartCenterSet = new Set(snapshot.combinedDefinedCenterIds.map(normalizeCenterId))
  const activatedCenters = CENTER_ORDER.filter(
    k => !personalChartCenterIds.has(k) && combinedChartCenterSet.has(k),
  )

  const seenPairs = new Set<string>()
  const newChannelItems: string[] = []
  const completingChannelItems: string[] = []

  for (const ch of HD_CHANNELS) {
    const key = channelLabel(ch.from, ch.to)
    if (seenPairs.has(key)) continue
    seenPairs.add(key)

    const aInP = personalGateSet.has(ch.from)
    const bInP = personalGateSet.has(ch.to)
    const aInT = transitGateSet.has(ch.from)
    const bInT = transitGateSet.has(ch.to)

    if (!aInP && !bInP && aInT && bInT) {
      newChannelItems.push(key)
    } else if ((aInP && !bInP && bInT) || (!aInP && bInP && aInT)) {
      completingChannelItems.push(key)
    }
  }

  return (
    <>
      <View style={s.card}>
        <Text style={s.sectionLabel}>閘門摘要</Text>

        {shared.length > 0 && (
          <>
            <Text style={s.gateGroupLabel}>個人 + 流日共有</Text>
            <View style={s.chipRow}>
              {shared.map(g => <GateChip key={g} g={g} color={Colors.successText} bg={Colors.successBg} />)}
            </View>
          </>
        )}

        <Text style={[s.gateGroupLabel, { marginTop: Spacing.sm }]}>流日影響</Text>
        <View style={s.chipRow}>
          {transitOnly.map(g => <GateChip key={g} g={g} color={Colors.designRed} bg={Colors.accentD} />)}
        </View>
      </View>

      <ImpactCard kind="center-activated" items={activatedCenters.map(k => CENTER_NAME[k] ?? k)} />
      <ImpactCard kind="new-channel" items={newChannelItems} />
      <ImpactCard kind="completing-channel" items={completingChannelItems} />
    </>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  gateGroupLabel: { fontSize: 10, fontWeight: '600', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
})
