'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import type { Activations } from '@/lib/humanDesign/types'
import type { CenterName } from '@/lib/humanDesign/types'
import { BirthFormModal, DEFAULT_BIRTH_FORM, type BirthFormState } from '@/components/humanDesign/BirthFormModal'

const BodyGraph = dynamic(() => import('@/components/humanDesign/BodyGraph'), { ssr: false })

interface AuraFlowData {
  activations: Activations
  combinedCenterIds: CenterName[]
  computedAt: string
  chartName: string
}

interface ChartItem {
  id: string
  name: string | null
  birthCity: string
  birthDate: string
  chartKind: string | null
}

const REFRESH_MS = 30 * 60 * 1000


export default function AuraFlowPage() {
  const [charts, setCharts] = useState<ChartItem[]>([])
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null)
  const [data, setData] = useState<AuraFlowData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState<Date>(() => new Date())
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const loadCharts = useCallback(async () => {
    const r = await fetch('/api/charts')
    if (!r.ok) throw new Error('無法載入圖表清單')
    const json = await r.json()
    const personal = (Array.isArray(json.charts) ? json.charts as ChartItem[] : [])
      .filter(c => !c.chartKind || c.chartKind === 'personal')
    setCharts(personal)
    return personal
  }, [])

  useEffect(() => {
    async function init() {
      try {
        const personal = await loadCharts()
        if (personal.length === 1) setSelectedChartId(personal[0].id)
      } catch {
        setError('無法載入圖表清單')
      }
    }
    void init()
  }, [loadCharts])

  const fetchAuraFlow = useCallback(async (chartId: string) => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(`/api/aura-flow?chartId=${chartId}`)
      if (!res.ok) throw new Error((await res.json()).error ?? '載入失敗')
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedChartId) return
    async function run() { await fetchAuraFlow(selectedChartId!) }
    void run()
    const t = setInterval(() => { void run() }, REFRESH_MS)
    return () => clearInterval(t)
  }, [selectedChartId, fetchAuraFlow])

  const handleSave = async (formData: BirthFormState) => {
    setSaving(true)
    window.umami?.track('aura-flow-save-profile')
    try {
      const birthDate = formData.date.format('YYYY-MM-DD')
      const birthTime = formData.time.format('HH:mm')
      const res = await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.label || `${formData.location || '未知'} · ${birthDate}`,
          birthDate,
          birthTime,
          birthCity: formData.location || '未知',
          timezone: formData.timezone,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '儲存失敗')
      setShowForm(false)
      await loadCharts()
      if (json.chartId) setSelectedChartId(json.chartId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  const timeStr = now?.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) ?? ''
  const dateStr = now?.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' }) ?? ''

  return (
    <div className="min-h-screen bg-(--paper) flex flex-col">

      {/* 頂部列：時鐘（左）+ 控制（右），padding-top = navbar 高度 */}
      <div className="pt-13 mt-3 px-6 py-3 flex items-start justify-between shrink-0 ">
        {/* 左上：時鐘 */}
        <div className="flex flex-col gap-0.5 select-none">
          <span className="text-(--ink-soft) text-xs tracking-widest font-mono" suppressHydrationWarning>{dateStr}</span>
          <span className="text-(--ink) text-2xl font-thin font-mono tracking-widest" suppressHydrationWarning>{timeStr}</span>
        </div>

        {/* 右上：圖表選擇 + 新增按鈕 */}
        <div className="flex items-center gap-2 mt-3">
          {charts.length > 1 && (
            <select
              className="bg-(--paper) text-(--ink-soft) text-xs rounded px-2 py-1 border border-(--ink)/20 outline-none font-mono"
              value={selectedChartId ?? ''}
              onChange={e => setSelectedChartId(e.target.value)}
            >
              <option value="" disabled>選擇圖表</option>
              {charts.map(c => (
                <option key={c.id} value={c.id}>{c.name || `${c.birthCity} · ${c.birthDate}` || '未命名'}</option>
              ))}
            </select>
          )}
          {charts.length === 1 && (
            <span className="text-(--ink-soft) text-xs font-mono">{charts[0].name || `${charts[0].birthCity} · ${charts[0].birthDate}` || '未命名'}</span>
          )}
          <button
            onClick={() => {
              window.umami?.track('aura-flow-add-profile-click', { location: 'header' })
              setShowForm(true)
            }}
            className="w-6 h-6 flex items-center justify-center text-(--ink-soft) border border-(--ink)/20 rounded hover:text-(--ink) hover:border-(--ink)/50 transition-colors cursor-pointer text-base leading-none"
            title="新增個人資料"
          >
            +
          </button>
        </div>
      </div>

      {/* 主體：BodyGraph，填滿剩餘空間並置中 */}
      <div className="flex-1 flex items-center justify-center px-4 py-2">
        <div className="w-full max-w-xl">
          {!selectedChartId && charts.length === 0 && !loading && (
            <div className="text-center space-y-4">
              <p className="text-(--ink-soft) text-sm font-mono">尚未建立個人資料</p>
              <button
                onClick={() => {
                  window.umami?.track('aura-flow-add-profile-click', { location: 'empty-state' })
                  setShowForm(true)
                }}
                className="text-(--ink) text-xs border border-(--ink)/30 px-4 py-2 hover:border-(--ink)/60 transition-colors cursor-pointer font-mono tracking-widest"
              >
                + 新增個人資料
              </button>
            </div>
          )}
          {error && <p className="text-(--crimson) text-center text-sm font-mono">{error}</p>}
          {loading && !data && <p className="text-(--ink-soft) text-center text-sm font-mono">計算中…</p>}
          {data && (
            <BodyGraph
              onSelect={() => {}}
              showGates
              showAnnotations={false}
              showFace
              showSilhouette
              activations={data.activations}
              definedCenterIds={new Set(data.combinedCenterIds)}
            />
          )}
        </div>
      </div>

      {/* 底部圖例 */}
      {data && (
        <div className="shrink-0 mb-4 flex items-center justify-center gap-6 select-none">
          <span className="flex items-center gap-1.5 text-(--ink-soft) text-xs font-mono">
            <span className="inline-block w-3 h-3 rounded-sm bg-(--ink)" />
            個人圖
          </span>
          <span className="flex items-center gap-1.5 text-(--ink-soft) text-xs font-mono">
            <span className="inline-block w-3 h-3 rounded-sm bg-(--transit)" />
            今日流日
          </span>
          <span className="flex items-center gap-1.5 text-(--ink-soft) text-xs font-mono">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: 'repeating-linear-gradient(45deg, var(--ink) 0 3px, var(--transit) 3px 6px)' }}
            />
            共同激活
          </span>
          <span className="text-(--ink)/40 text-xs font-mono">
            {new Date(data.computedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })} 更新
          </span>
        </div>
      )}

      {showForm && (
        <BirthFormModal
          title="新增個人資料"
          initial={DEFAULT_BIRTH_FORM}
          saving={saving}
          saveLabel="儲存並預覽"
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
