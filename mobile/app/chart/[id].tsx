import { useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Alert,
  Clipboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Circle, Defs, Pattern, Rect, Svg } from 'react-native-svg'
import { type StoredPlanet, isCompositeChart, isLegacyPipeComposite } from '@/lib/api'
import { ACT_CONSCIOUS, ACT_UNCONSCIOUS } from '@shared/humanDesign/hd-chart-data'
import { normalizeCenterId, normalizeChannelId } from '@/lib/hd-normalizers'
import { useChartDetail } from '@/lib/useChartDetail'
import {
  downloadChartAsPdf,
  generateAiPrompt,
  downloadCompositePdf,
  generateCompositeAiPrompt,
  downloadTransitPdf,
  generateTransitAiPrompt,
} from '@/lib/chartPdf'
import BodyGraph from '@/components/BodyGraph'
import DetailBottomSheet, { type SheetTarget } from '@/components/DetailBottomSheet'
import { SectionCard, Row } from '@/components/chart/ChartPrimitives'
import PersonalChartDetails from '@/components/chart/PersonalChartDetails'
import TransitAnalysis from '@/components/chart/TransitAnalysis'
import CompositeInfo from '@/components/chart/CompositeInfo'
import { LoadingView, ErrorView } from '@/components/StateViews'
import { NavBackHeader } from '@/components/NavBackHeader'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Radius, Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors, useThemeMode } from '@/contexts/ThemeContext'

type ActionState = 'idle' | 'loading'

/** 圖例用的黑紅相間條紋色點，對應 BodyGraph「個人+流日共有」的條紋填色 */
function StripeLegendDot() {
  return (
    <Svg width={10} height={10}>
      <Defs>
        <Pattern id="legend-rb-stripes" patternUnits="userSpaceOnUse" width={4} height={4} patternTransform="rotate(45)">
          <Rect x={0} y={0} width={2} height={4} fill={ACT_CONSCIOUS} />
          <Rect x={2} y={0} width={2} height={4} fill={ACT_UNCONSCIOUS} />
        </Pattern>
      </Defs>
      <Circle cx={5} cy={5} r={5} fill="url(#legend-rb-stripes)" />
    </Svg>
  )
}

function ActionButton({
  label,
  onPress,
  state,
  variant,
}: {
  label: string
  onPress: () => void
  state?: ActionState
  variant?: 'primary' | 'outline'
}) {
  const isPrimary = variant === 'primary'
  const Colors = useThemeColors()
  const styles = useMemo(() => createStyles(Colors), [Colors])
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionBtn,
        isPrimary ? styles.actionBtnPrimary : styles.actionBtnOutline,
        (state === 'loading' || pressed) && styles.actionBtnDisabled,
      ]}
      onPress={onPress}
      disabled={state === 'loading'}
    >
      <Text style={[styles.actionBtnText, isPrimary ? styles.actionBtnTextPrimary : styles.actionBtnTextOutline]}>
        {state === 'loading' ? '處理中…' : label}
      </Text>
    </Pressable>
  )
}

function ChartDetailScreenContent() {
  const Colors = useThemeColors()
  const { mode } = useThemeMode()
  const styles = useMemo(() => createStyles(Colors), [Colors])
  const { id } = useLocalSearchParams<{ id: string }>()
  const {
    chart,
    loading,
    error,
    reload,
    compositeFetched,
    compositeFetchLoading,
    transitFetched,
    transitFetchLoading,
    getCompositeResult,
    getTransitResult,
  } = useChartDetail(id)
  const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null)
  const [pdfState, setPdfState] = useState<ActionState>('idle')
  const [copyState, setCopyState] = useState<ActionState>('idle')

  if (loading) return <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}><NavBackHeader title="圖表詳情" /><LoadingView /></SafeAreaView>
  if (error || !chart) return <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}><NavBackHeader title="圖表詳情" /><ErrorView message={error ?? '找不到圖表'} onRetry={reload} /></SafeAreaView>

  const isTransit       = chart.chartKind === 'transit'
  const transitIsRebuilt = isTransit && !chart.meta?.transitSnapshot && !!transitFetched
  const transitSnapshot = isTransit ? (chart.meta?.transitSnapshot ?? transitFetched ?? undefined) : undefined
  // 舊格式合圖：type='合圖' 或 birthDate 含 '|'（網頁端舊儲存方式）
  const isComposite     = isCompositeChart(chart)
  // 修正：舊格式流日圖缺少 meta.transitSnapshot 時，不能只靠 transitSnapshot 存在與否
  // 判斷是不是個人圖，否則會誤顯示成個人圖版面（chartKind 才是可靠依據）
  const isPersonal      = !isTransit && !isComposite

  // 「出生資訊」要顯示的本人真實出生資料：
  // web 存的流日圖（meta.transitMeta 存在）頂層欄位是流日計算時刻的佔位資料，
  // 要改讀 meta.transitMeta.personalXxx；其餘情況（個人圖、mobile 存的流日圖）
  // 頂層欄位本來就是本人出生資料
  const webTransitMeta = isTransit ? chart.meta?.transitMeta : undefined
  const birthInfo = {
    date:     webTransitMeta?.personalBirthDate ?? chart.birthDate,
    time:     webTransitMeta?.personalBirthTime ?? chart.birthTime,
    city:     webTransitMeta?.personalBirthCity ?? chart.birthCity,
    timezone: webTransitMeta?.personalTimezone  ?? chart.timezone,
  }

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
  } | null = (isComposite && !chart.meta?.personA && isLegacyPipeComposite(chart)) ? (() => {
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
  if (isTransit) {
    // 流日圖：跟網頁版一致的三色配色——個人(c/黑)、流日限定(u/紅)、
    // 個人+流日共有的閘門兩個 flag 都設 true，BodyGraph 會畫成黑紅相間條紋
    const personalGates = new Set<number>()
    if (planets.length > 0) {
      for (const p of planets) { personalGates.add(p.blackGate); personalGates.add(p.redGate) }
    } else {
      const personalityGates = chart.personalityGates ?? []
      const designGates      = chart.designGates ?? []
      if (personalityGates.length > 0 || designGates.length > 0) {
        for (const g of personalityGates) personalGates.add(g)
        for (const g of designGates)      personalGates.add(g)
      } else {
        for (const g of chart.gates) personalGates.add(g)
      }
    }
    for (const g of personalGates) activations[g] = { c: true }
    if (transitSnapshot) {
      for (const g of transitSnapshot.allGates) {
        activations[g] = personalGates.has(g) ? { ...activations[g], u: true } : { u: true }
      }
    }
  } else if (isComposite && compositeConnections) {
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

  const personalChartCenterIds = new Set(chart.centers.map(normalizeCenterId))
  const open = (target: SheetTarget) => setSheetTarget(target)

  async function handleDownload() {
    setPdfState('loading')
    try {
      if (isComposite) {
        const result = await getCompositeResult()
        if (!result) throw new Error('缺少完整出生資料，無法產生合圖報告')
        await downloadCompositePdf(result, mode, chart!.name)
      } else if (transitSnapshot) {
        const result = await getTransitResult()
        if (!result) throw new Error('缺少時區資料，無法產生流日報告')
        await downloadTransitPdf(result, mode, chart!.name)
      } else {
        await downloadChartAsPdf({
          name: chart!.name ?? '',
          birthDate: chart!.birthDate,
          birthTime: chart!.birthTime,
          birthCity: chart!.birthCity,
          timezone: chart!.timezone ?? '',
          type: chart!.type,
          authority: chart!.authority,
          profile: chart!.profile,
          definition: chart!.definition,
          centers: chart!.centers,
          channels: chart!.channels,
          gates: chart!.gates,
          planets: chart!.planets,
          personalityGates: chart!.personalityGates,
          designGates: chart!.designGates,
          incarnationCross: chart!.meta?.incarnationCross,
          variables: chart!.meta?.variables,
          arrows: chart!.meta?.arrows,
        }, mode)
      }
    } catch (err) {
      Alert.alert('下載失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setPdfState('idle')
    }
  }

  async function handleCopyPrompt() {
    setCopyState('loading')
    try {
      let text: string
      if (isComposite) {
        const result = await getCompositeResult()
        if (!result) throw new Error('缺少完整出生資料，無法產生提示詞')
        text = generateCompositeAiPrompt(result)
      } else if (transitSnapshot) {
        const result = await getTransitResult()
        if (!result) throw new Error('缺少時區資料，無法產生提示詞')
        text = generateTransitAiPrompt(result)
      } else {
        text = generateAiPrompt({
          name: chart!.name ?? '',
          birthDate: chart!.birthDate,
          birthTime: chart!.birthTime,
          birthCity: chart!.birthCity,
          timezone: chart!.timezone ?? '',
          type: chart!.type,
          authority: chart!.authority,
          profile: chart!.profile,
          definition: chart!.definition,
          centers: chart!.centers,
          channels: chart!.channels,
          gates: chart!.gates,
          planets: chart!.planets,
          personalityGates: chart!.personalityGates,
          designGates: chart!.designGates,
          incarnationCross: chart!.meta?.incarnationCross,
          variables: chart!.meta?.variables,
          arrows: chart!.meta?.arrows,
        })
      }
      Clipboard.setString(text)
      Alert.alert('已複製', '提示詞已複製到剪貼簿，可貼到 ChatGPT 或其他 AI 工具使用。')
    } catch (err) {
      Alert.alert('複製失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setCopyState('idle')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <NavBackHeader title="圖表詳情" />
      <ScrollView contentContainerStyle={styles.inner}>

        {/* Body Graph */}
        <View style={styles.graphCard}>
          <View style={styles.graphCardHeader}>
            <Text style={styles.graphTitle}>Body Graph</Text>
            {transitSnapshot ? (
              <View style={styles.legend}>
                <View style={[styles.legendDot, { backgroundColor: Colors.text }]} />
                <Text style={styles.legendText}>個人</Text>
                <View style={[styles.legendDot, { backgroundColor: Colors.designRed }]} />
                <Text style={styles.legendText}>流日</Text>
                <StripeLegendDot />
                <Text style={styles.legendText}>共有</Text>
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
            <Row label="出生日期" value={birthInfo.date} />
            <Row label="出生時間" value={birthInfo.time} />
            <Row label="出生城市" value={birthInfo.city} />
            {birthInfo.timezone ? <Row label="時區" value={birthInfo.timezone} /> : null}
          </SectionCard>
        )}

        {/* 流日分析（transit 專屬） */}
        {isTransit && transitFetchLoading && !transitSnapshot ? (
          <View style={styles.transitCard}>
            <Text style={styles.transitTime}>正在重新計算流日資料…</Text>
          </View>
        ) : null}
        {transitSnapshot ? (
          <>
            <View style={styles.transitCard}>
              <Text style={styles.transitTime}>
                流日計算時間：{new Date(transitSnapshot.computedAt).toLocaleString('zh-TW', { hour12: false, timeZone: 'Asia/Taipei' })}
              </Text>
              {transitIsRebuilt && (
                <Text style={styles.transitRebuiltNote}>
                  這份流日圖是舊格式儲存，已用你的本命資料重新計算「今天」的流日，並非原始儲存當下的結果
                </Text>
              )}
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
          <PersonalChartDetails
            chart={chart}
            personalChartCenterIds={personalChartCenterIds}
            activations={activations}
            planets={planets}
            open={open}
          />
        )}

        {/* ─── 下載／複製按鈕 ─── */}
        <View style={styles.actionSection}>
          <ActionButton label="下載 PDF" onPress={handleDownload} state={pdfState} variant="outline" />
          <ActionButton label="複製提示詞" onPress={handleCopyPrompt} state={copyState} variant="outline" />
        </View>

      </ScrollView>

      <DetailBottomSheet
        target={sheetTarget}
        onClose={() => setSheetTarget(null)}
      />
    </SafeAreaView>
  )
}

export default function ChartDetailScreen() {
  return (
    <ErrorBoundary fallbackTitle="圖表載入失敗">
      <ChartDetailScreenContent />
    </ErrorBoundary>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
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
  transitRebuiltNote: { fontSize: 12, color: Colors.sub, marginTop: 4 },

  actionSection: { gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn:         { paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center' },
  actionBtnPrimary:  { backgroundColor: Colors.accent },
  actionBtnOutline:  { borderWidth: 1.5, borderColor: Colors.accent, backgroundColor: Colors.accentD },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText:        { fontSize: 15, fontWeight: '600' },
  actionBtnTextPrimary: { color: Colors.bg },
  actionBtnTextOutline: { color: Colors.accent },
})
