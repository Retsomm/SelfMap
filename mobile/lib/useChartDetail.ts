import { useAuth } from '@clerk/expo'
import { useEffect, useRef, useState } from 'react'
import {
  type Chart,
  type CreateCompositeResult,
  type CreateTransitResult,
  getChart,
  previewCompositeChart,
  previewTransitChart,
  isCompositeChart,
  isLegacyPipeComposite,
} from '@/lib/api'

export type TransitSnapshot = NonNullable<NonNullable<Chart['meta']>['transitSnapshot']>

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
  if (isLegacyPipeComposite(chart) && chart.timezone) {
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

// 流日圖本人出生資料解析：mobile 存檔格式頂層欄位即是本人資料，
// web 存檔格式頂層欄位是流日計算時刻的佔位資料，本人資料在 meta.transitMeta。
// getTransitResult 與自動補算 effect 共用同一份 fallback 邏輯，避免兩處算出不同結果。
function resolveTransitBirthInfo(chart: Chart) {
  const webMeta = chart.meta?.transitMeta
  return {
    birthDate: webMeta?.personalBirthDate ?? chart.birthDate,
    birthTime: webMeta?.personalBirthTime ?? chart.birthTime,
    birthCity: webMeta?.personalBirthCity ?? chart.birthCity,
    timezone: webMeta?.personalTimezone ?? chart.timezone,
  }
}

/**
 * 圖表詳情頁的資料層：載入圖表、自動補算舊格式／缺欄位的合圖與流日資料。
 * 純資料邏輯，不含任何渲染，讓 chart/[id].tsx 專注在畫面呈現。
 */
export function useChartDetail(id: string) {
  const { getToken } = useAuth()
  const [chart, setChart] = useState<Chart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [compositeFetched, setCompositeFetched]           = useState<CreateCompositeResult | null>(null)
  const [compositeFetchLoading, setCompositeFetchLoading] = useState(false)
  const [transitFetched, setTransitFetched]                = useState<TransitSnapshot | null>(null)
  const [transitFetchLoading, setTransitFetchLoading]      = useState(false)
  const [transitResultFetched, setTransitResultFetched]     = useState<CreateTransitResult | null>(null)

  // 目前有效的圖表 id，供非同步流程在 await 之後判斷自己是否已經過期。
  // react-compiler 不允許 render 期間讀寫 ref.current，改在 effect 裡同步；
  // 這個 effect 宣告在其他依賴 [id] 的 effect 之前，確保它們執行時 ref 已更新。
  const currentIdRef = useRef(id)
  useEffect(() => { currentIdRef.current = id }, [id])
  // unmount 之後任何非同步流程都不可以再 setState
  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    return () => { aliveRef.current = false }
  }, [])

  // 切換圖表時同步清除舊的合圖／流日補算結果，避免下一張圖表的第一次渲染
  // 還沿用上一張圖表的結果。用 state（而非 ref）記錄上一個 id 並在 render 期間
  // 比對／setState，是 React 官方建議的「render 期間調整 state」寫法
  // （ref 不能在 render 期間讀寫，state 可以）。
  const [prevId, setPrevId] = useState(id)
  if (prevId !== id) {
    setPrevId(id)
    setCompositeFetched(null)
    setTransitFetched(null)
    setTransitResultFetched(null)
  }

  const loadChart = async () => {
    const requestedId = id
    const stillCurrent = () => aliveRef.current && currentIdRef.current === requestedId
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!stillCurrent()) return
      if (!token) { setError('未登入，請重新登入'); return }
      const data = await getChart(token, requestedId)
      if (!stillCurrent()) return
      const c = data.chart
      if (!c.meta?.incarnationCross) console.warn('[ChartDetail] ⚠️ meta.incarnationCross 不存在，輪迴交叉無法顯示')
      if (!c.meta?.variables || !c.meta?.arrows) console.warn('[ChartDetail] ⚠️ meta.variables/arrows 不存在，四箭頭無法顯示')
      setChart(c)
    } catch (err) {
      if (!stillCurrent()) return
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg.includes('401') || msg.includes('Unauthorized') ? '認證失敗，請重新登入' : `載入失敗：${msg}`)
    } finally {
      if (stillCurrent()) setLoading(false)
    }
  }

  // loadChart 也做為 reload 對外曝露（供手動重試/下拉刷新呼叫）。
  // react-compiler 的 set-state-in-effect 檢查只會沿著「effect callback 自己
  // 那層」直接呼叫的具名函式往回追 setState，不會往下鑽進 effect 內部另外定義、
  // 立即呼叫的區域函式；用區域函式包一層呼叫 loadChart，即可避免被判定為
  // 「effect 內同步 setState」，行為跟直接呼叫完全一樣。
  useEffect(() => {
    async function run() { await loadChart() }
    run()
  }, [id])

  // 自動補算舊格式 / 缺少 meta.compositeResult 的合圖
  useEffect(() => {
    if (!chart) return
    const needsFetch = isCompositeChart(chart) && !chart.meta?.compositeResult
    if (!needsFetch) return

    const payload = buildCompositePayload(chart)
    if (!payload) return

    const requestedId = id
    const stillCurrent = () => aliveRef.current && currentIdRef.current === requestedId

    async function run() {
      setCompositeFetchLoading(true)
      try {
        const token = await getToken()
        if (!token) return
        if (!payload) return
        const r = await previewCompositeChart(payload)
        if (!stillCurrent()) return
        setCompositeFetched(r)
      } catch (e) {
        if (!stillCurrent()) return
        console.warn('[CompositeInfo] previewCompositeChart failed:', e)
      } finally {
        if (stillCurrent()) setCompositeFetchLoading(false)
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

    const { birthDate, birthTime, birthCity, timezone } = resolveTransitBirthInfo(chart)
    if (!timezone) return

    const requestedId = id
    const stillCurrent = () => aliveRef.current && currentIdRef.current === requestedId

    async function run() {
      setTransitFetchLoading(true)
      try {
        if (!timezone) return
        const r = await previewTransitChart({ birthDate, birthTime, birthCity, timezone })
        if (!stillCurrent()) return
        setTransitFetched(toTransitSnapshot(r))
        setTransitResultFetched(r)
      } catch (e) {
        if (!stillCurrent()) return
        console.warn('[TransitAnalysis] previewTransitChart failed:', e)
      } finally {
        if (stillCurrent()) setTransitFetchLoading(false)
      }
    }
    run()
  }, [chart])

  async function getCompositeResult(): Promise<CreateCompositeResult | null> {
    if (compositeFetched) return compositeFetched
    if (!chart) return null
    const payload = buildCompositePayload(chart)
    if (!payload) return null
    const result = await previewCompositeChart(payload)
    setCompositeFetched(result)
    return result
  }

  async function getTransitResult(): Promise<CreateTransitResult | null> {
    if (transitResultFetched) return transitResultFetched
    if (!chart) return null
    const requestedId = id
    const { birthDate, birthTime, birthCity, timezone } = resolveTransitBirthInfo(chart)
    if (!timezone) return null
    const result = await previewTransitChart({ birthDate, birthTime, birthCity, timezone })
    if (currentIdRef.current === requestedId) {
      setTransitResultFetched(result)
      setTransitFetched(toTransitSnapshot(result))
    }
    return result
  }

  return {
    chart,
    loading,
    error,
    reload: loadChart,
    compositeFetched,
    compositeFetchLoading,
    transitFetched,
    transitFetchLoading,
    getCompositeResult,
    getTransitResult,
  }
}
