import { useAuth } from '@clerk/expo'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type Chart, type StoredPlanet, type CreateCompositeResult, getChart, previewCompositeChart } from '@/lib/api'
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
  const [compositeFetched, setCompositeFetched]         = useState<CreateCompositeResult | null>(null)
  const [compositeFetchLoading, setCompositeFetchLoading] = useState(false)

  // 切換圖表時清除舊的合圖補算結果，避免渲染過期資料
  useEffect(() => { setCompositeFetched(null) }, [id])

  const loadChart = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) { setError('未登入，請重新登入'); return }
      const data = await getChart(token, id)
      const c = data.chart
      console.log(`[ChartDetail] id=${c.id} chartKind=${c.chartKind}`)
      console.log(`[ChartDetail] meta存在=${!!c.meta} incarnationCross=${!!(c.meta?.incarnationCross)} variables=${!!(c.meta?.variables)} arrows=${!!(c.meta?.arrows)}`)
      if (!c.meta?.incarnationCross) console.warn('[ChartDetail] ⚠️ meta.incarnationCross 不存在，輪迴交叉無法顯示')
      if (!c.meta?.variables || !c.meta?.arrows) console.warn('[ChartDetail] ⚠️ meta.variables/arrows 不存在，四箭頭無法顯示')
      setChart(c)
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg.includes('401') || msg.includes('Unauthorized') ? '認證失敗，請重新登入' : `載入失敗：${msg}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadChart() }, [id])

  // 自動補算舊格式 / 缺少 meta.compositeResult 的合圖
  useEffect(() => {
    if (!chart) return
    const isOldComposite = chart.type === '合圖' || chart.birthDate?.includes('|')
    const needsFetch = (chart.chartKind === 'composite' || isOldComposite) && !chart.meta?.compositeResult
    if (!needsFetch) return

    let payload: Parameters<typeof previewCompositeChart>[1] | null = null

    if (chart.meta?.personA && chart.meta?.personB) {
      const pA = chart.meta.personA
      const pB = chart.meta.personB
      if (pA.birthDate && pA.birthTime && pA.timezone && pB.birthDate && pB.birthTime && pB.timezone) {
        payload = {
          personA: { name: pA.name ?? undefined, birthDate: pA.birthDate, birthTime: pA.birthTime, birthCity: pA.birthCity, timezone: pA.timezone },
          personB: { name: pB.name ?? undefined, birthDate: pB.birthDate, birthTime: pB.birthTime, birthCity: pB.birthCity, timezone: pB.timezone },
        }
      }
    } else if (chart.birthDate?.includes('|') && chart.timezone) {
      const [dateA, dateB] = chart.birthDate.split('|')
      const [timeA, timeB] = chart.birthTime.split('|')
      const [cityA, cityB] = chart.birthCity.split('|')
      const [tzA, tzB] = chart.timezone.split('|')
      if (dateA && dateB && timeA && timeB && tzA && tzB) {
        payload = {
          personA: { birthDate: dateA, birthTime: timeA, birthCity: cityA ?? '', timezone: tzA },
          personB: { birthDate: dateB, birthTime: timeB, birthCity: cityB ?? '', timezone: tzB },
        }
      }
    }

    if (!payload) return
    setCompositeFetchLoading(true)
    getToken().then(token => {
      if (!token) { setCompositeFetchLoading(false); return }
      const p = payload
      if (!p) { setCompositeFetchLoading(false); return }
      return previewCompositeChart(token, p)
        .then(r => setCompositeFetched(r))
        .catch(e => { console.warn('[CompositeInfo] previewCompositeChart failed:', e) })
        .finally(() => setCompositeFetchLoading(false))
    }).catch(e => { console.warn('[CompositeInfo] getToken failed:', e); setCompositeFetchLoading(false) })
  }, [chart])

  if (loading) return <SafeAreaView style={styles.container}><LoadingView /></SafeAreaView>
  if (error || !chart) return <SafeAreaView style={styles.container}><ErrorView message={error ?? '找不到圖表'} onRetry={loadChart} /></SafeAreaView>

  const typeMeta        = getTypeMeta(chart.type)
  const transitSnapshot = chart.chartKind === 'transit' ? chart.meta?.transitSnapshot : undefined
  // 舊格式合圖：type='合圖' 或 birthDate 含 '|'（網頁端舊儲存方式）
  const isComposite     = chart.chartKind === 'composite' || chart.type === '合圖' || !!(chart.birthDate?.includes('|'))
  const isPersonal      = !transitSnapshot && !isComposite

  const definedCenterIds = transitSnapshot
    ? new Set(transitSnapshot.combinedDefinedCenterIds.map(normalizeCenterId))
    : new Set(chart.centers.map(normalizeCenterId))
  const definedChannelIds = transitSnapshot
    ? new Set(transitSnapshot.combinedDefinedChannelIds.map(normalizeChannelId))
    : new Set(chart.channels.map(normalizeChannelId))

  const planets: StoredPlanet[] = chart.planets ?? []

  // 合圖的通道連結資料：優先用 DB 存的 meta，否則用非同步補算結果
  const compositeConnections = isComposite
    ? (chart.meta?.compositeResult ?? compositeFetched)
    : null

  // 對網頁端 pipe-separated 舊格式合圖，同步解析人物基本資料 + integrationTheme
  // 這樣不必等 async fetch 就能立即顯示人物卡片
  const syncCompositeData: {
    personA: { name: null; birthDate: string; birthCity: string; type: string; profile: string; authority: string }
    personB: { name: null; birthDate: string; birthCity: string; type: string; profile: string; authority: string }
    integrationTheme: string
    compositeDefinedCount: number
    compositeOpenCount: number
  } | null = (isComposite && !chart.meta?.personA && chart.birthDate?.includes('|')) ? (() => {
    const [dateA = '', dateB = '']   = chart.birthDate.split('|')
    const [cityA = '', cityB = '']   = chart.birthCity.split('|')
    const [authA = '', authB = '']   = (chart.authority ?? '').split(' / ')
    const [profA = '', profB = '']   = (chart.profile ?? '').split(' / ')
    const compositeDefinedCount      = chart.centers.length
    const compositeOpenCount         = 9 - compositeDefinedCount
    const integrationTheme           =
      compositeOpenCount === 0 ? '9+0' :
      compositeOpenCount === 1 ? '8+1' :
      compositeOpenCount === 2 ? '7+2' : '6+3+'
    return {
      personA: { name: null, birthDate: dateA.trim(), birthCity: cityA.trim(), type: '—', profile: profA.trim(), authority: authA.trim() },
      personB: { name: null, birthDate: dateB.trim(), birthCity: cityB.trim(), type: '—', profile: profB.trim(), authority: authB.trim() },
      integrationTheme,
      compositeDefinedCount,
      compositeOpenCount,
    }
  })() : null

  const activations: Record<number, { c?: boolean; u?: boolean; t?: boolean }> = {}
  if (isComposite && compositeConnections) {
    // 合圖：只標記參與通道的閘門，A=黑(c)，B=紅(u)
    for (const type of ['electromagnetic', 'companionship', 'compromise', 'dominance'] as const) {
      const conns = compositeConnections[type] ?? []
      for (const conn of conns) {
        for (const g of conn.aGates) activations[g] = { ...activations[g], c: true }
        for (const g of conn.bGates) activations[g] = { ...activations[g], u: true }
      }
    }
  } else if (planets.length > 0) {
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
        {isComposite && (
          <CompositeInfo
            chart={chart}
            fetchedResult={compositeFetched}
            syncData={syncCompositeData}
            fetchLoading={compositeFetchLoading}
          />
        )}

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
            {chart.meta?.incarnationCross && (() => {
              const ic = chart.meta!.incarnationCross!
              const sheetTarget = {
                kind: 'incarnationCross' as const,
                crossType:      ic.crossType,
                crossTypeLabel: ic.crossTypeLabel,
                crossBaseName:  ic.crossBaseName,
                variant:        ic.variant,
                gatesLabel:     ic.gatesLabel,
                sunGate:        ic.sunGate,
              }
              console.log('[chart] incarnationCross sunGate=', ic.sunGate, 'crossType=', ic.crossType)
              return (
                <Pressable onPress={() => open(sheetTarget)} style={({ pressed }) => [styles.crossCard, pressed && styles.crossCardPressed]}>
                  <Text style={styles.crossCardTitle}>輪迴交叉</Text>
                  <Text style={styles.crossFullName}>
                    {ic.crossTypeLabel}之{ic.crossBaseName}{ic.variant}
                  </Text>
                  <Text style={styles.crossGates}>閘門組合：{ic.gatesLabel}</Text>
                  <Text style={styles.crossHint}>點擊查看說明 ›</Text>
                </Pressable>
              )
            })()}

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
                {[...chart.gates].sort((a, b) => a - b).map((g) => (
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

  crossCard:        { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  crossCardPressed: { borderColor: Colors.accent, backgroundColor: Colors.accentD },
  crossCardTitle:   { color: Colors.sub, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  crossFullName:    { color: Colors.accent, fontSize: 16, fontWeight: '700' },
  crossGates:       { color: Colors.sub, fontSize: 13 },
  crossHint:        { color: Colors.muted, fontSize: 12, alignSelf: 'flex-end' } as const,
})
