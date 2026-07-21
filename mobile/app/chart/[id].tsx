import { useAuth } from '@clerk/expo'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
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
import { type Chart, type StoredPlanet, type CreateCompositeResult, type CreateTransitResult, getChart, previewCompositeChart, previewTransitChart } from '@/lib/api'
import { HD_CENTERS_INFO, ACT_CONSCIOUS, ACT_UNCONSCIOUS } from '@/lib/hd-chart-data'
import { normalizeCenterId, normalizeChannelId, findChannelById } from '@/lib/hd-normalizers'
import { getTypeMeta, getTypeLabel } from '@/lib/hd-type-meta'
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
import { SectionCard, Row, Tag } from '@/components/chart/ChartPrimitives'
import TransitAnalysis from '@/components/chart/TransitAnalysis'
import CompositeInfo from '@/components/chart/CompositeInfo'
import { LoadingView, ErrorView } from '@/components/StateViews'
import { NavBackHeader } from '@/components/NavBackHeader'
import { Colors, Radius, Spacing } from '@/constants/tokens'

type ActionState = 'idle' | 'loading'
type TransitSnapshot = NonNullable<NonNullable<Chart['meta']>['transitSnapshot']>

/** 把 previewTransitChart 回傳的巢狀結果轉成 chart.meta.transitSnapshot 的扁平格式 */
function toTransitSnapshot(r: CreateTransitResult): TransitSnapshot {
  return {
    computedAt: r.transit.computedAt,
    planets: r.transit.planets,
    allGates: r.transit.allGates,
    definedCenterIds: r.transit.definedCenterIds,
    definedChannels: r.transit.definedChannels,
    combinedDefinedCenterIds: r.combined.definedCenterIds,
    combinedDefinedChannelIds: r.combined.definedChannelIds,
  }
}

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

// 合圖補算所需的出生資料 payload（與自動補算 useEffect 共用邏輯）
function buildCompositePayload(chart: Chart): Parameters<typeof previewCompositeChart>[0] | null {
  if (chart.meta?.personA && chart.meta?.personB) {
    const pA = chart.meta.personA
    const pB = chart.meta.personB
    if (pA.birthDate && pA.birthTime && pA.timezone && pB.birthDate && pB.birthTime && pB.timezone) {
      return {
        personA: { name: pA.name ?? undefined, birthDate: pA.birthDate, birthTime: pA.birthTime, birthCity: pA.birthCity, timezone: pA.timezone },
        personB: { name: pB.name ?? undefined, birthDate: pB.birthDate, birthTime: pB.birthTime, birthCity: pB.birthCity, timezone: pB.timezone },
      }
    }
    return null
  }
  if (chart.birthDate?.includes('|') && chart.timezone) {
    const [dateA, dateB] = chart.birthDate.split('|')
    const [timeA, timeB] = chart.birthTime.split('|')
    const [cityA, cityB] = chart.birthCity.split('|')
    const [tzA, tzB] = chart.timezone.split('|')
    if (dateA && dateB && timeA && timeB && tzA && tzB) {
      return {
        personA: { birthDate: dateA, birthTime: timeA, birthCity: cityA ?? '', timezone: tzA },
        personB: { birthDate: dateB, birthTime: timeB, birthCity: cityB ?? '', timezone: tzB },
      }
    }
  }
  return null
}

export default function ChartDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getToken } = useAuth()
  const [chart, setChart] = useState<Chart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null)
  const [compositeFetched, setCompositeFetched]         = useState<CreateCompositeResult | null>(null)
  const [compositeFetchLoading, setCompositeFetchLoading] = useState(false)
  const [transitFetched, setTransitFetched]             = useState<TransitSnapshot | null>(null)
  const [transitFetchLoading, setTransitFetchLoading]   = useState(false)
  const [pdfState, setPdfState] = useState<ActionState>('idle')
  const [copyState, setCopyState] = useState<ActionState>('idle')

  // 切換圖表時清除舊的合圖／流日補算結果，避免渲染過期資料
  useEffect(() => { setCompositeFetched(null); setTransitFetched(null) }, [id])

  const loadChart = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) { setError('未登入，請重新登入'); return }
      const data = await getChart(token, id)
      const c = data.chart
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

    const payload = buildCompositePayload(chart)
    if (!payload) return

    async function run() {
      setCompositeFetchLoading(true)
      try {
        const token = await getToken()
        if (!token) return
        if (!payload) return
        const r = await previewCompositeChart(payload)
        setCompositeFetched(r)
      } catch (e) {
        console.warn('[CompositeInfo] previewCompositeChart failed:', e)
      } finally {
        setCompositeFetchLoading(false)
      }
    }
    run()
  }, [chart])

  // 自動補算缺少 meta.transitSnapshot 的流日圖（舊格式或存檔失敗殘留）。
  //
  // 兩種來源存檔格式並不相容，本人真實出生資料的位置不一樣：
  // - mobile 存的（meta.transitSnapshot 存在）：頂層 birthDate/birthTime/birthCity/timezone
  //   本身就是本人出生資料，不需要這個補算。
  // - web 存的（meta.transitMeta 存在）：頂層欄位存的是流日計算時刻的佔位資料
  //   （birthCity 甚至固定是字串 "流日"），本人出生資料在 meta.transitMeta.personalXxx。
  // 可直接餵給 previewTransitChart 重算，但流日行星會是「現在」而非當初存檔當下，僅為盡量還原。
  useEffect(() => {
    if (!chart) return
    if (chart.chartKind !== 'transit' || chart.meta?.transitSnapshot) return

    const webMeta = chart.meta?.transitMeta
    const birthDate = webMeta?.personalBirthDate ?? chart.birthDate
    const birthTime = webMeta?.personalBirthTime ?? chart.birthTime
    const birthCity = webMeta?.personalBirthCity ?? chart.birthCity
    const timezone  = webMeta?.personalTimezone ?? chart.timezone
    if (!timezone) return

    async function run() {
      setTransitFetchLoading(true)
      try {
        if (!timezone) return
        const r = await previewTransitChart({ birthDate, birthTime, birthCity, timezone })
        setTransitFetched(toTransitSnapshot(r))
      } catch (e) {
        console.warn('[TransitAnalysis] previewTransitChart failed:', e)
      } finally {
        setTransitFetchLoading(false)
      }
    }
    run()
  }, [chart])

  if (loading) return <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}><NavBackHeader title="圖表詳情" /><LoadingView /></SafeAreaView>
  if (error || !chart) return <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}><NavBackHeader title="圖表詳情" /><ErrorView message={error ?? '找不到圖表'} onRetry={loadChart} /></SafeAreaView>

  const typeMeta        = getTypeMeta(chart.type)
  const isTransit       = chart.chartKind === 'transit'
  const transitIsRebuilt = isTransit && !chart.meta?.transitSnapshot && !!transitFetched
  const transitSnapshot = isTransit ? (chart.meta?.transitSnapshot ?? transitFetched ?? undefined) : undefined
  // 舊格式合圖：type='合圖' 或 birthDate 含 '|'（網頁端舊儲存方式）
  const isComposite     = chart.chartKind === 'composite' || chart.type === '合圖' || !!(chart.birthDate?.includes('|'))
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

  async function getCompositeResult(): Promise<CreateCompositeResult | null> {
    if (compositeFetched) return compositeFetched
    const payload = buildCompositePayload(chart!)
    if (!payload) return null
    const result = await previewCompositeChart(payload)
    setCompositeFetched(result)
    return result
  }

  async function getTransitResult() {
    const c = chart!
    if (!c.timezone) return null
    return previewTransitChart({
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      birthCity: c.birthCity,
      timezone: c.timezone,
    })
  }

  async function handleDownload() {
    setPdfState('loading')
    try {
      if (isComposite) {
        const result = await getCompositeResult()
        if (!result) throw new Error('缺少完整出生資料，無法產生合圖報告')
        await downloadCompositePdf(result)
      } else if (transitSnapshot) {
        const result = await getTransitResult()
        if (!result) throw new Error('缺少時區資料，無法產生流日報告')
        await downloadTransitPdf(result)
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
        })
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
          <>
            <SectionCard title="類型">
              <Row label="能量類型" value={getTypeLabel(chart.type)} accent tappable onPress={() => open({ kind: 'type', typeKey: chart.type })} />
              <Row label="策略" value={typeMeta.strategy} />
              <Row label="簽名（成功徵兆）" value={typeMeta.signature} accent />
              <Row label="非自我主題" value={typeMeta.notSelf} dim />
            </SectionCard>

            <SectionCard title="設計">
              <Row label="內在權威" value={chart.authority} accent tappable onPress={() => open({ kind: 'authority', authorityKey: chart.authority })} />
              <Row label="人生角色（Profile）" value={chart.profile} tappable onPress={() => open({ kind: 'profile', profile: chart.profile })} />
              <Row label="定義" value={chart.definition} tappable onPress={() => open({ kind: 'definition', definitionKey: chart.definition })} />
            </SectionCard>

            <SectionCard title="九大中心">
              <View style={styles.tagRow}>
                {Object.keys(HD_CENTERS_INFO).map((chartKey) => {
                  const info    = HD_CENTERS_INFO[chartKey]
                  const defined = personalChartCenterIds.has(chartKey)
                  return (
                    <Tag
                      key={chartKey}
                      label={info.name.zh}
                      active={defined}
                      onPress={() => open({ kind: 'center', id: chartKey, defined })}
                    />
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
                      <Tag key={rawCh} label={label} active onPress={ch ? () => open({ kind: 'channel', channel: ch }) : undefined} />
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

            <SectionCard title={`激活閘門（${chart.gates.length}）`}>
              <View style={styles.gateGrid}>
                {[...chart.gates].sort((a, b) => a - b).map((g) => {
                  const state = activations[g]
                  const isDual = !!(state?.c && state?.u)
                  const soloFill = isDual ? null : state?.c ? ACT_CONSCIOUS : state?.u ? ACT_UNCONSCIOUS : null
                  const isActive = isDual || !!soloFill
                  return (
                    <Pressable
                      key={g}
                      style={[
                        styles.gate,
                        isDual && { backgroundColor: ACT_CONSCIOUS, borderColor: ACT_CONSCIOUS },
                        soloFill && { backgroundColor: soloFill, borderColor: soloFill },
                      ]}
                      onPress={() => open({ kind: 'gate', num: g })}
                    >
                      {({ pressed }) => (
                        <>
                          {isDual && <View style={styles.gateDualOverlay} />}
                          <Text style={[styles.gateText, isActive && styles.gateTextActive, pressed && styles.gateTextPressed]}>
                            {g}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  )
                })}
              </View>
            </SectionCard>

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
          </>
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
  transitRebuiltNote: { fontSize: 12, color: Colors.sub, marginTop: 4 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 6 },

  gateGrid:    { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.sm, rowGap: Spacing.sm },
  gate:        { backgroundColor: Colors.gateBg, borderRadius: Radius.sm, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.gateBorder, overflow: 'hidden' },
  gateDualOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', backgroundColor: Colors.designRed },
  gateText:        { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  gateTextActive:  { color: '#ffffff' },
  gateTextPressed: { fontSize: 17, fontWeight: '800' },

  planetHeader:     { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.xs },
  planetHeaderText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: Colors.sub },
  planetRow:        { flexDirection: 'row', paddingVertical: 5 },
  planetRowAlt:     { backgroundColor: Colors.altRowBg, marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg, borderRadius: 6 },
  planetCol:        { flex: 1.2, fontSize: 13, color: Colors.sub },
  planetGateCol:    { flex: 1, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  planetBlack:      { color: Colors.text },
  planetRed:        { color: Colors.planetRedText },

  arrowsGrid:    { flexDirection: 'column', gap: Spacing.lg, padding: Spacing.md },
  arrowsCol:     { gap: Spacing.md },
  arrowsSide:    { fontSize: 14, color: Colors.muted, fontWeight: '600', marginBottom: 2 },
  arrowItem:     { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  arrowDir:      { fontSize: 22, color: Colors.accent, fontWeight: '700', width: 24, lineHeight: 26 },
  arrowInfo:     { flex: 1, gap: 3 },
  arrowCategory: { fontSize: 12, color: Colors.sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  arrowLabel:    { fontSize: 17, color: Colors.text, fontWeight: '700' },
  arrowDesc:     { fontSize: 13, color: Colors.sub, lineHeight: 18 },

  actionSection: { gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn:         { paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center' },
  actionBtnPrimary:  { backgroundColor: Colors.accent },
  actionBtnOutline:  { borderWidth: 1.5, borderColor: Colors.accent, backgroundColor: Colors.accentD },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText:        { fontSize: 15, fontWeight: '600' },
  actionBtnTextPrimary: { color: Colors.bg },
  actionBtnTextOutline: { color: Colors.accent },

  crossCard:        { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  crossCardPressed: { borderColor: Colors.accent, backgroundColor: Colors.accentD },
  crossCardTitle:   { color: Colors.sub, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  crossFullName:    { color: Colors.accent, fontSize: 16, fontWeight: '700' },
  crossGates:       { color: Colors.sub, fontSize: 13 },
  crossHint:        { color: Colors.muted, fontSize: 12, alignSelf: 'flex-end' } as const,
})
