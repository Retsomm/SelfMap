import { useAuth } from '@clerk/expo'
import { useEffect, useState } from 'react'
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
    const needsFetch = isCompositeChart(chart) && !chart.meta?.compositeResult
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
    const timezone  = webMeta?.personalTimezone  ?? chart.timezone
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

  async function getCompositeResult(): Promise<CreateCompositeResult | null> {
    if (compositeFetched) return compositeFetched
    if (!chart) return null
    const payload = buildCompositePayload(chart)
    if (!payload) return null
    const result = await previewCompositeChart(payload)
    setCompositeFetched(result)
    return result
  }

  async function getTransitResult() {
    if (!chart || !chart.timezone) return null
    return previewTransitChart({
      birthDate: chart.birthDate,
      birthTime: chart.birthTime,
      birthCity: chart.birthCity,
      timezone: chart.timezone,
    })
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
