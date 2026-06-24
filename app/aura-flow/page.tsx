'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { Activations } from '@/lib/humanDesign/types'
import type { CenterName } from '@/lib/humanDesign/types'

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
  chartKind: string | null
}

interface ProfileForm {
  name: string
  birthDate: string
  birthTime: string
  birthCity: string
  timezone: string
}

const EMPTY_FORM: ProfileForm = {
  name: '',
  birthDate: '',
  birthTime: '',
  birthCity: '',
  timezone: 'Etc/GMT-8',
}

const REFRESH_MS = 30 * 60 * 1000

const TIMEZONES = [
  { value: 'Etc/GMT+12', label: 'UTC−12' },
  { value: 'Etc/GMT+11', label: 'UTC−11' },
  { value: 'Etc/GMT+10', label: 'UTC−10' },
  { value: 'Etc/GMT+9',  label: 'UTC−9' },
  { value: 'Etc/GMT+8',  label: 'UTC−8' },
  { value: 'Etc/GMT+7',  label: 'UTC−7' },
  { value: 'Etc/GMT+6',  label: 'UTC−6' },
  { value: 'Etc/GMT+5',  label: 'UTC−5' },
  { value: 'Etc/GMT+4',  label: 'UTC−4' },
  { value: 'Etc/GMT+3',  label: 'UTC−3' },
  { value: 'Etc/GMT+2',  label: 'UTC−2' },
  { value: 'Etc/GMT+1',  label: 'UTC−1' },
  { value: 'UTC',        label: 'UTC±0' },
  { value: 'Etc/GMT-1',  label: 'UTC+1' },
  { value: 'Etc/GMT-2',  label: 'UTC+2' },
  { value: 'Etc/GMT-3',  label: 'UTC+3' },
  { value: 'Etc/GMT-4',  label: 'UTC+4' },
  { value: 'Etc/GMT-5',  label: 'UTC+5' },
  { value: 'Etc/GMT-6',  label: 'UTC+6' },
  { value: 'Etc/GMT-7',  label: 'UTC+7' },
  { value: 'Etc/GMT-8',  label: 'UTC+8' },
  { value: 'Etc/GMT-9',  label: 'UTC+9' },
  { value: 'Etc/GMT-10', label: 'UTC+10' },
  { value: 'Etc/GMT-11', label: 'UTC+11' },
  { value: 'Etc/GMT-12', label: 'UTC+12' },
]

export default function AuraFlowPage() {
  const [charts, setCharts] = useState<ChartItem[]>([])
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null)
  const [data, setData] = useState<AuraFlowData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState<Date>(() => new Date())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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

  const handleSave = async () => {
    if (!form.birthDate || !form.birthTime) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || `${form.birthCity || '未知'} · ${form.birthDate}`,
          birthDate: form.birthDate,
          birthTime: form.birthTime,
          birthCity: form.birthCity || '未知',
          timezone: form.timezone,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '儲存失敗')
      setShowForm(false)
      setForm(EMPTY_FORM)
      await loadCharts()
      if (json.chartId) setSelectedChartId(json.chartId)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '儲存失敗')
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
                <option key={c.id} value={c.id}>{c.name ?? '未命名'}</option>
              ))}
            </select>
          )}
          {charts.length === 1 && (
            <span className="text-(--ink-soft) text-xs font-mono">{charts[0].name ?? '未命名'}</span>
          )}
          <button
            onClick={() => { setForm(EMPTY_FORM); setShowForm(true); setSaveError(null) }}
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
                onClick={() => { setForm(EMPTY_FORM); setShowForm(true); setSaveError(null) }}
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
            <span className="inline-block w-3 h-3 rounded-sm bg-black" />
            個人圖
          </span>
          <span className="flex items-center gap-1.5 text-(--ink-soft) text-xs font-mono">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#d04830]" />
            今日流日
          </span>
          <span className="flex items-center gap-1.5 text-(--ink-soft) text-xs font-mono">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: 'repeating-linear-gradient(45deg, #000 0 3px, #d04830 3px 6px)' }}
            />
            共同激活
          </span>
          <span className="text-(--ink)/40 text-xs font-mono">
            {new Date(data.computedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })} 更新
          </span>
        </div>
      )}

      {/* 新增個人資料 Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center bg-(--ink)/20"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-(--paper) border border-(--ink)/20 p-6 w-80 flex flex-col gap-4 shadow-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs tracking-widest uppercase text-(--ink)">新增個人資料</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-(--ink-soft) hover:text-(--ink) cursor-pointer text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs text-(--ink-soft)">名稱</span>
                <input
                  type="text"
                  placeholder="例：小明"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="border border-(--ink)/20 bg-(--paper) px-2 py-1.5 text-sm font-mono text-(--ink) outline-none focus:border-(--ink)/50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs text-(--ink-soft)">出生日期 *</span>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                  className="border border-(--ink)/20 bg-(--paper) px-2 py-1.5 text-sm font-mono text-(--ink) outline-none focus:border-(--ink)/50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs text-(--ink-soft)">出生時間 *</span>
                <input
                  type="time"
                  value={form.birthTime}
                  onChange={e => setForm(f => ({ ...f, birthTime: e.target.value }))}
                  className="border border-(--ink)/20 bg-(--paper) px-2 py-1.5 text-sm font-mono text-(--ink) outline-none focus:border-(--ink)/50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-xs text-(--ink-soft)">時區</span>
                <select
                  value={form.timezone}
                  onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                  className="border border-(--ink)/20 bg-(--paper) px-2 py-1.5 text-sm font-mono text-(--ink) outline-none focus:border-(--ink)/50"
                >
                  {TIMEZONES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            {saveError && (
              <p className="text-(--crimson) text-xs font-mono">{saveError}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !form.birthDate || !form.birthTime}
              className="bg-(--ink) text-(--paper) font-mono text-xs tracking-widest uppercase py-2 hover:bg-(--ink)/80 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? '計算中…' : '儲存並預覽'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
