import { useAuth } from '@clerk/expo'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { type Chart, type StoredPlanet, getChart } from '@/lib/api'
import { HD_CENTERS_INFO } from '@/lib/hd-chart-data'
import { normalizeCenterId, normalizeChannelId, findChannelById } from '@/lib/hd-normalizers'
import { getTypeMeta } from '@/lib/hd-type-meta'
import BodyGraph from '@/components/BodyGraph'
import DetailBottomSheet, { type SheetTarget } from '@/components/DetailBottomSheet'
import { SectionCard, Row, Tag } from '@/components/chart/ChartPrimitives'
import TransitAnalysis from '@/components/chart/TransitAnalysis'
import CompositeInfo from '@/components/chart/CompositeInfo'
import { LoadingView, ErrorView } from '@/components/StateViews'
import { Colors, Radius, Spacing } from '@/constants/tokens'

export default function ChartDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getToken } = useAuth()
  const [chart, setChart] = useState<Chart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null)

  const loadChart = async () => {
    setLoading(true)
    setError(null)
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
  }

  useEffect(() => { loadChart() }, [id])

  if (loading) return <SafeAreaView style={styles.container}><LoadingView /></SafeAreaView>
  if (error || !chart) return <SafeAreaView style={styles.container}><ErrorView message={error ?? '找不到圖表'} onRetry={loadChart} /></SafeAreaView>

  const typeMeta          = getTypeMeta(chart.type)
  const transitSnapshot   = chart.chartKind === 'transit' ? chart.meta?.transitSnapshot : undefined
  const isComposite       = chart.chartKind === 'composite'
  const isPersonal        = !transitSnapshot && !isComposite

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
    const personalityGates = chart.personalityGates ?? []
    const designGates      = chart.designGates ?? []
    if (personalityGates.length > 0 || designGates.length > 0) {
      for (const g of personalityGates) activations[g] = { ...activations[g], c: true }
      for (const g of designGates)      activations[g] = { ...activations[g], u: true }
    } else {
      for (const g of chart.gates) activations[g] = { c: true }
    }
  }
  if (transitSnapshot) {
    for (const g of transitSnapshot.allGates) {
      if (!activations[g]) activations[g] = { t: true }
    }
  }

  const personalChartCenterIds = new Set(chart.centers.map(normalizeCenterId))
  const open = (target: SheetTarget) => setSheetTarget(target)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>

        {/* Body Graph */}
        <View style={styles.graphCard}>
          <View style={styles.graphCardHeader}>
            <Text style={styles.graphTitle}>Body Graph</Text>
            {transitSnapshot ? (
              <View style={styles.legend}>
                <View style={[styles.legendDot, { backgroundColor: Colors.text }]} />
                <Text style={styles.legendText}>個人意識</Text>
                <View style={[styles.legendDot, { backgroundColor: Colors.designRed }]} />
                <Text style={styles.legendText}>個人潛意識</Text>
                <View style={[styles.legendDot, { backgroundColor: Colors.transit }]} />
                <Text style={styles.legendText}>流日</Text>
              </View>
            ) : isComposite ? (
              <View style={styles.legend}>
                <View style={[styles.legendDot, { backgroundColor: Colors.text }]} />
                <Text style={styles.legendText}>人物 A</Text>
                <View style={[styles.legendDot, { backgroundColor: Colors.designRed }]} />
                <Text style={styles.legendText}>人物 B</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.graphContainer}>
            <BodyGraph
              definedCenterIds={definedCenterIds}
              definedChannelIds={definedChannelIds}
              activations={activations}
              showGates
            />
          </View>
        </View>

        {/* 出生資訊（合圖不顯示） */}
        {!isComposite && (
          <SectionCard title="出生資訊">
            <Row label="出生日期" value={chart.birthDate} />
            <Row label="出生時間" value={chart.birthTime} />
            <Row label="出生城市" value={chart.birthCity} />
            {chart.timezone ? <Row label="時區" value={chart.timezone} /> : null}
          </SectionCard>
        )}

        {/* 流日分析（transit 專屬） */}
        {transitSnapshot ? (
          <>
            <View style={styles.transitCard}>
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

        {/* 合圖資訊（composite 專屬） */}
        {isComposite && <CompositeInfo chart={chart} />}

        {/* 以下區塊只對個人圖顯示 */}
        {isPersonal && (
          <>
            <SectionCard title="類型">
              <Row label="能量類型" value={chart.type} accent tappable onPress={() => open({ kind: 'type', typeKey: chart.type })} />
              <Row label="策略" value={typeMeta.strategy} />
              <Row label="簽名（成功徵兆）" value={typeMeta.signature} accent />
              <Row label="非自我主題" value={typeMeta.notSelf} dim />
            </SectionCard>

            <SectionCard title="設計">
              <Row label="內在權威" value={chart.authority} accent tappable onPress={() => open({ kind: 'authority', authorityKey: chart.authority })} />
              <Row label="人生角色（Profile）" value={chart.profile} tappable onPress={() => open({ kind: 'profile', profile: chart.profile })} />
              <Row label="定義" value={chart.definition} tappable onPress={() => open({ kind: 'definition', definitionKey: chart.definition })} />
            </SectionCard>

            <SectionCard title="九大中心（已定義）">
              <View style={styles.tagRow}>
                {chart.centers.map((c) => {
                  const chartKey = normalizeCenterId(c)
                  const info     = HD_CENTERS_INFO[chartKey]
                  const label    = info?.name.zh ?? c
                  return (
                    <Tag key={c} label={label} active onPress={() => open({ kind: 'center', id: chartKey })} />
                  )
                })}
              </View>
            </SectionCard>

            {chart.channels.length > 0 && (
              <SectionCard title={`定義通道（${chart.channels.length}）`}>
                <View style={styles.tagRow}>
                  {chart.channels.map((rawCh) => {
                    const ch    = findChannelById(rawCh)
                    const label = ch ? `${ch.from}–${ch.to}` : rawCh
                    return (
                      <Tag key={rawCh} label={label} onPress={ch ? () => open({ kind: 'channel', channel: ch }) : undefined} />
                    )
                  })}
                </View>
              </SectionCard>
            )}

            {planets.length > 0 && (
              <SectionCard title="行星閘門對照">
                <View style={styles.planetHeader}>
                  <Text style={[styles.planetCol, styles.planetHeaderText]}>行星</Text>
                  <Text style={[styles.planetGateCol, styles.planetHeaderText, { color: Colors.muted }]}>● 意識（黑）</Text>
                  <Text style={[styles.planetGateCol, styles.planetHeaderText, { color: Colors.designRed }]}>● 潛意識（紅）</Text>
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

            {/* 輪迴交叉 */}
            {chart.meta?.incarnationCross && (
              <SectionCard title="輪迴交叉">
                <Row label="交叉類型" value={chart.meta.incarnationCross.crossTypeLabel} accent />
                <Row label="交叉名稱" value={`${chart.meta.incarnationCross.crossBaseName}${chart.meta.incarnationCross.variant}`} />
                <Row label="完整名稱" value={`${chart.meta.incarnationCross.crossTypeLabel}之${chart.meta.incarnationCross.crossBaseName}${chart.meta.incarnationCross.variant}`} />
                <Row label="閘門組合" value={chart.meta.incarnationCross.gatesLabel} />
              </SectionCard>
            )}

            {/* 四箭頭 */}
            {chart.meta?.variables && chart.meta?.arrows && (
              <SectionCard title="四箭頭（Variables）">
                <View style={styles.arrowsGrid}>
                  <View style={styles.arrowsCol}>
                    <Text style={styles.arrowsSide}>← Design（紅）</Text>
                    <View style={styles.arrowItem}>
                      <Text style={styles.arrowDir}>{chart.meta.arrows.topLeft ? '←' : '→'}</Text>
                      <View style={styles.arrowInfo}>
                        <Text style={styles.arrowCategory}>飲食（Digestion）</Text>
                        <Text style={styles.arrowLabel}>{chart.meta.variables.digestion.label}</Text>
                        <Text style={styles.arrowDesc}>{chart.meta.variables.digestion.description}</Text>
                      </View>
                    </View>
                    <View style={styles.arrowItem}>
                      <Text style={styles.arrowDir}>{chart.meta.arrows.bottomLeft ? '←' : '→'}</Text>
                      <View style={styles.arrowInfo}>
                        <Text style={styles.arrowCategory}>環境（Environment）</Text>
                        <Text style={styles.arrowLabel}>{chart.meta.variables.environment.label}</Text>
                        <Text style={styles.arrowDesc}>{chart.meta.variables.environment.description}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.arrowsCol}>
                    <Text style={styles.arrowsSide}>Personality（黑）→</Text>
                    <View style={styles.arrowItem}>
                      <Text style={styles.arrowDir}>{chart.meta.arrows.topRight ? '←' : '→'}</Text>
                      <View style={styles.arrowInfo}>
                        <Text style={styles.arrowCategory}>動機（Motivation）</Text>
                        <Text style={styles.arrowLabel}>{chart.meta.variables.motivation.label}</Text>
                        <Text style={styles.arrowDesc}>{chart.meta.variables.motivation.description}</Text>
                      </View>
                    </View>
                    <View style={styles.arrowItem}>
                      <Text style={styles.arrowDir}>{chart.meta.arrows.bottomRight ? '←' : '→'}</Text>
                      <View style={styles.arrowInfo}>
                        <Text style={styles.arrowCategory}>觀點（Perspective）</Text>
                        <Text style={styles.arrowLabel}>{chart.meta.variables.perspective.label}</Text>
                        <Text style={styles.arrowDesc}>{chart.meta.variables.perspective.description}</Text>
                      </View>
                    </View>
                  </View>
                </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner:     { padding: Spacing.lg, paddingBottom: Spacing.xxl, rowGap: Spacing.md },

  graphCard:       { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  graphCardHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  graphTitle:      { color: Colors.sub, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  graphContainer:  { width: '100%', aspectRatio: 590 / 1030 },
  legend:          { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  legendDot:       { width: 10, height: 10, borderRadius: 5 },
  legendText:      { fontSize: 11, color: Colors.sub, marginRight: Spacing.sm },

  transitCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center' },
  transitTime: { fontSize: 12, color: Colors.transit },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 6 },

  gateGrid:    { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.sm, rowGap: Spacing.sm },
  gate:        { backgroundColor: Colors.gateBg, borderRadius: Radius.sm, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.gateBorder },
  gatePressed: { backgroundColor: Colors.accentD, borderColor: Colors.accent },
  gateText:    { color: Colors.accent, fontSize: 13, fontWeight: '600' },

  planetHeader:     { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.xs },
  planetHeaderText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: Colors.sub },
  planetRow:        { flexDirection: 'row', paddingVertical: 5 },
  planetRowAlt:     { backgroundColor: Colors.altRowBg, marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg, borderRadius: 6 },
  planetCol:        { flex: 1.2, fontSize: 13, color: Colors.sub },
  planetGateCol:    { flex: 1, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  planetBlack:      { color: Colors.text },
  planetRed:        { color: Colors.planetRedText },

  arrowsGrid:    { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md },
  arrowsCol:     { flex: 1, gap: Spacing.sm },
  arrowsSide:    { fontSize: 11, color: Colors.muted, fontWeight: '600', marginBottom: 2 },
  arrowItem:     { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  arrowDir:      { fontSize: 18, color: Colors.accent, fontWeight: '700', width: 20, lineHeight: 22 },
  arrowInfo:     { flex: 1, gap: 2 },
  arrowCategory: { fontSize: 10, color: Colors.sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  arrowLabel:    { fontSize: 13, color: Colors.text, fontWeight: '700' },
  arrowDesc:     { fontSize: 11, color: Colors.sub, lineHeight: 15 },
})
