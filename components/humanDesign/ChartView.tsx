'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { toActivations, type CenterName } from '@/lib/humanDesign'
import PlanetIcon from '@/components/humanDesign/PlanetIcon'
import { fmtGate, fmtCenterName } from '@/utils/format'
import BodyGraph, { type SelectionPayload } from '@/components/humanDesign/BodyGraph'
import DetailDrawer from '@/components/humanDesign/DetailDrawer'
import { HD_GATES, HD_CENTERS_INFO, HD_CHANNELS } from '@/components/humanDesign/hd-chart-data'
import {
  CENTER_INFO,
  CHANNEL_DEFS,
  TYPE_LABELS,
  PROFILE_LABELS,
  STRATEGY_MAP,
  SIGNATURE_MAP,
  CROSS_TYPE_LABELS,
} from '@/lib/humanDesign'
import { downloadChart } from '@/lib/downloadChart'
import { buildAiPrompt, type HdResult } from '@/lib/buildAiPrompt'
import { saveChart } from '@/lib/saveChart'
import toast from 'react-hot-toast'

interface ChartViewProps {
  result: HdResult
  date: string
  time: string
  locationLabel: string
  timezone: string
  hideSaveButton?: boolean
  onSaved?: () => void
}

export default function ChartView({
  result,
  date,
  time,
  locationLabel,
  timezone,
  hideSaveButton = false,
  onSaved,
}: ChartViewProps) {
  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()

  const printAreaRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<SelectionPayload | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const activations = useMemo(() => toActivations(result.planets), [result])
  const generatedAt = useMemo(() => new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }), [])

  const CENTER_CHART_KEY: Record<string, string> = { ego: 'heart', solarPlexus: 'solar' }
  const toChartKey = (id: string) => CENTER_CHART_KEY[id] ?? id

  const hdChannelMap = useMemo(() => {
    const m: Record<string, typeof HD_CHANNELS[0]> = {}
    for (const ch of HD_CHANNELS) m[`${ch.from}-${ch.to}`] = ch
    return m
  }, [])

  const handleSelect = useCallback((sel: SelectionPayload) => setSelection(sel), [])
  const handleClose = useCallback(() => setSelection(null), [])

  const handleJumpToGate = useCallback((num: number) => {
    const g = HD_GATES[num]
    if (!g) return
    setSelection({ kind: 'gate', data: { ...g, number: num }, id: `gate-${num}` })
  }, [])

  const handleSelectCenter = useCallback((id: string) => {
    const chartKey = toChartKey(id)
    const info = HD_CENTERS_INFO[chartKey]
    if (info) setSelection({ kind: 'center', data: info, id: `center-${chartKey}` })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectChannel = useCallback((channelId: string) => {
    const [a, b] = channelId.split('-').map(Number)
    const ch = hdChannelMap[`${a}-${b}`] ?? hdChannelMap[`${b}-${a}`]
    if (ch) setSelection({ kind: 'channel', data: ch, id: `channel-${ch.id}` })
  }, [hdChannelMap])

  const handleDownload = useCallback(async () => {
    const el = printAreaRef.current
    if (!el) return
    setDownloading(true)
    try {
      await downloadChart(el)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '下載失敗，請稍後再試。')
    } finally {
      setDownloading(false)
    }
  }, [])

  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(buildAiPrompt(result)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => setCopied(false))
  }, [result])

  const handleSaveChart = useCallback(async () => {
    setSaving(true)
    try {
      await saveChart({ result, date, time, locationLabel, timezone })
      toast.success('已儲存人類圖')
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '儲存失敗')
    } finally {
      setSaving(false)
    }
  }, [result, date, time, locationLabel, timezone, onSaved])

  return (
    <div ref={printAreaRef} className="relative">

      {/* Chart row: Design | Chart | Personality */}
      <div className="hd-chart-row">

        <aside className="hd-planets-side hd-planets-side--design">
          <div className="hd-planets-side-header">Design</div>
          <div className="hd-planet-rows">
            {result.planets.map(p => (
              <div key={p.planetName} className="hd-planet-row hd-planet-row--left">
                <PlanetIcon name={p.planetName} className="hd-planet-symbol" />
                <span className="hd-planet-gate">{p.red.full}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="hd-col-mid">
          <div className="hd-chart-frame">
            <span className="hd-chart-corner tl" />
            <span className="hd-chart-corner tr" />
            <span className="hd-chart-corner bl" />
            <span className="hd-chart-corner br" />
            <BodyGraph
              onSelect={handleSelect}
              activeId={selection?.id}
              showGates
              showAnnotations
              showFace
              showSilhouette
              activations={activations}
              definedCenterIds={result.definedCenterIds}
            />
          </div>
        </main>

        <aside className="hd-planets-side hd-planets-side--personality">
          <div className="hd-planets-side-header">Personality</div>
          <div className="hd-planet-rows">
            {result.planets.map(p => (
              <div key={p.planetName} className="hd-planet-row hd-planet-row--right">
                <span className="hd-planet-gate">{p.black.full}</span>
                <PlanetIcon name={p.planetName} className="hd-planet-symbol" />
              </div>
            ))}
          </div>
        </aside>

      </div>

      {/* Gate index strip */}
      <div className="hd-index-strip">
        <div>
          <h5>閘門索引</h5>
          <div className="mt-1 text-[12px] md:text-base leading-[1.4] text-[var(--ink-soft)]">
            INDEX OF<br />SIXTY-FOUR<br />GATES
          </div>
        </div>
        <div className="hd-index-grid">
          {Array.from({ length: 64 }, (_, i) => i + 1).map(n => {
            const act = activations[n]
            let cls = 'hd-index-cell'
            if (act?.c && act?.u) cls += ' activated-both'
            else if (act?.c) cls += ' activated-c'
            else if (act?.u) cls += ' activated-u'
            return (
              <div
                key={n}
                className={cls}
                onClick={() => handleJumpToGate(n)}
                title={HD_GATES[n]?.name}
              >
                {fmtGate(n)}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile planet list */}
      <div className="hd-planets-mobile">
        <div className="hd-planets-mobile-col hd-planets-mobile-design">
          <div className="hd-planets-mobile-header">Design</div>
          {result.planets.map(p => (
            <div key={p.planetName} className="hd-planets-mobile-row">
              <PlanetIcon name={p.planetName} className="hd-planets-mobile-icon" />
              <span>{p.red.full}</span>
            </div>
          ))}
        </div>
        <div className="hd-planets-mobile-col hd-planets-mobile-personality">
          <div className="hd-planets-mobile-header">Personality</div>
          {result.planets.map(p => (
            <div key={p.planetName} className="hd-planets-mobile-row">
              <span>{p.black.full}</span>
              <PlanetIcon name={p.planetName} className="hd-planets-mobile-icon" />
            </div>
          ))}
        </div>
      </div>

      <DetailDrawer
        selection={selection}
        onClose={handleClose}
        onJumpToGate={handleJumpToGate}
      />

      {/* Birth info + generation time */}
      <div className="mt-14 border border-(--ink) bg-(--paper-deep) px-5 py-4 font-mono text-[12px] md:text-base tracking-[0.06em]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
          <div className="flex gap-3">
            <span className="text-(--ink-soft) uppercase tracking-[0.15em]">出生日期</span>
            <span className="text-(--ink)">{date}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-(--ink-soft) uppercase tracking-[0.15em]">出生時間</span>
            <span className="text-(--ink)">{time}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-(--ink-soft) uppercase tracking-[0.15em]">出生地點</span>
            <span className="text-(--ink)">{locationLabel}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-(--ink-soft) uppercase tracking-[0.15em]">時區</span>
            <span className="text-(--ink)">{timezone}</span>
          </div>
          <div className="flex gap-3 sm:col-span-2 mt-1 pt-2 border-t border-dotted border-[rgba(43,31,20,0.25)]">
            <span className="text-(--ink-soft) uppercase tracking-[0.15em]">生成時間</span>
            <span className="text-(--ink)">{generatedAt}</span>
          </div>
        </div>
      </div>

      {/* Full calculation results */}
      <section className="mt-6 border-t border-(--ink) pt-10">
        <div className="flex items-baseline gap-5 mb-8">
          <h2 className="font-serif italic font-medium text-[clamp(28px,3vw,42px)] leading-none m-0 text-[var(--ink)]">計算結果</h2>
          <span className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)]">Bodygraph Analysis</span>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 mb-6">
          <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)]">
            <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">類型 · Type</div>
            <div className="font-serif italic font-medium text-[26px] leading-[1.1] text-[var(--ink)] mb-1">{result.type}</div>
            <div className="font-sans text-[12px] md:text-base text-[var(--ink-soft)] leading-[1.5]">{TYPE_LABELS[result.type]}</div>
            <div className="font-mono text-[12px] md:text-base text-[var(--ink-soft)] mt-1.5 tracking-[0.04em]">策略 · {STRATEGY_MAP[result.type] ?? '—'}</div>
            <div className="font-mono text-[12px] md:text-base text-[var(--ink-soft)] mt-1.5 tracking-[0.04em]">
              正向 {SIGNATURE_MAP[result.type]?.positive ?? '—'} ／ 負向 {SIGNATURE_MAP[result.type]?.negative ?? '—'}
            </div>
          </div>

          <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)]">
            <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">人生角色 · Profile</div>
            <div className="font-serif italic font-medium text-[40px] leading-[1.1] text-[var(--ink)] mb-1 tracking-[0.06em]">{result.profile.profile}</div>
            <div className="font-sans text-[12px] md:text-base text-[var(--ink-soft)] leading-[1.5]">{PROFILE_LABELS[result.profile.profile] ?? '—'}</div>
          </div>

          <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)]">
            <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">決策權威 · Authority</div>
            <div className="font-serif italic font-medium text-[26px] leading-[1.1] text-[var(--ink)] mb-1">{result.authority.name}</div>
            <div className="font-sans text-[12px] md:text-base text-[var(--ink-soft)] leading-[1.5]">{result.authority.tip}</div>
          </div>

          <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)]">
            <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">定義 · Definition</div>
            <div className="font-serif italic font-medium text-[26px] leading-[1.1] text-[var(--ink)] mb-1">{result.definition.label}</div>
            <div className="font-mono text-[12px] md:text-base text-[var(--ink-soft)] mt-1 tracking-[0.04em]">{result.definition.raw}</div>
            <div className="font-sans text-[12px] md:text-base text-[var(--ink-soft)] leading-[1.5] mt-1.5">
              已定義 {result.definedCenterIds.size} / 9 中心 · 激活 {result.allGates.size} 閘門
            </div>
          </div>

          <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)] sm:col-span-2">
            <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">輪迴交叉 · Incarnation Cross</div>
            <div className="font-serif italic font-medium text-[22px] leading-[1.1] text-[var(--ink)] mb-1">
              {(CROSS_TYPE_LABELS[result.incarnationCross.crossType] ?? result.incarnationCross.crossType)}之{result.incarnationCross.crossName}
            </div>
            <div className="font-mono text-[12px] md:text-base text-[var(--ink-soft)] mt-1.5 tracking-[0.04em]">
              {result.incarnationCross.crossType} · {result.incarnationCross.gatesLabel}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--ink)] my-8" />

        {/* Variables */}
        <div className="border border-[var(--ink)] mb-6">
          <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] py-2.5 px-4 border-b border-[var(--ink)] bg-[var(--paper-deep)]">
            四箭頭 · Variables &amp; Life Design
          </div>
          {[
            { category: '飲食方式 · Digestion', val: result.variables.digestion },
            { category: '適合環境 · Environment', val: result.variables.environment },
            { category: '觀點 · Perspective', val: result.variables.perspective },
            { category: '思考動機 · Motivation', val: result.variables.motivation },
          ].map(r => (
            <div
              className="grid grid-cols-1 sm:grid-cols-[180px_120px_1fr] gap-1 sm:gap-4 py-2.5 px-4 border-b border-dotted border-[rgba(43,31,20,0.2)] items-start last:border-b-0"
              key={r.category}
            >
              <div className="font-mono text-[12px] md:text-base tracking-[0.04em] text-[var(--ink-soft)] leading-[1.5]">{r.category}</div>
              <div className="font-sans text-[12px] md:text-base font-semibold text-[var(--ink)]">{r.val.label}</div>
              <div className="font-sans text-[12px] md:text-base text-[var(--ink-soft)] leading-[1.55]">{r.val.description}</div>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--ink)] my-8" />

        {/* Centers */}
        <div className="mb-2 font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)]">九大能量中心 · Nine Centers</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
          {(Object.keys(CENTER_INFO) as CenterName[]).map(id => {
            const defined = result.definedCenterIds.has(id)
            return (
              <div
                key={id}
                className={`border border-[var(--ink)] py-2.5 px-3 flex items-center gap-2 cursor-pointer transition-colors duration-[120ms] hover:bg-[var(--paper-deep)] ${defined ? 'bg-[var(--paper-deep)]' : 'bg-[var(--paper)] opacity-55 hover:opacity-100'}`}
                onClick={() => handleSelectCenter(id)}
              >
                <div className={`w-2.5 h-2.5 border-[1.5px] border-[var(--ink)] shrink-0${defined ? ' bg-[var(--ink)]' : ''}`} />
                <div>
                  <div className="font-sans text-[12px] md:text-base font-semibold text-[var(--ink)]">{CENTER_INFO[id].name}</div>
                  <div className="font-mono text-[12px] md:text-base text-[var(--ink-soft)] tracking-[0.05em]">{defined ? 'DEFINED' : 'OPEN'}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-[var(--ink)] my-8" />

        {/* Channels */}
        <div className="border border-[var(--ink)] p-4 mb-6">
          <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-3 pb-2 border-b border-[var(--ink)]">
            已定義通道 · Defined Channels（{result.definedChannels.length} / {CHANNEL_DEFS.length}）
          </div>
          {result.definedChannels.length === 0 ? (
            <div className="font-mono text-[12px] md:text-base text-[var(--ink-soft)]">無已定義通道</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {result.definedChannels.map(ch => (
                <span
                  key={ch.id}
                  className="font-mono text-[12px] md:text-base tracking-[0.04em] border border-[var(--ink)] py-[3px] px-2 text-[var(--ink)] bg-[var(--paper-deep)] cursor-pointer transition-colors duration-[120ms] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                  onClick={() => handleSelectChannel(ch.id)}
                >
                  {ch.id}
                  <span className="ml-1.5 text-[12px] md:text-base opacity-60">
                    {fmtCenterName(CENTER_INFO[ch.centerA].name)}—{fmtCenterName(CENTER_INFO[ch.centerB].name)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="hd-print-hide flex gap-3 mt-10 flex-wrap items-center">
          <button
            onClick={isSignedIn ? handleDownload : () => openSignIn()}
            disabled={isSignedIn ? downloading : false}
            className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--paper) bg-(--ink) border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--crimson) hover:border-(--crimson) disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSignedIn ? (downloading ? '下載中…' : '↓ 下載我的人類圖') : '↓ 登入後下載'}
          </button>
          <button
            onClick={isSignedIn ? handleCopyPrompt : () => openSignIn()}
            className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink) bg-transparent border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--ink) hover:text-(--paper)"
          >
            {isSignedIn ? (copied ? '✓ 已複製！' : '⎘ 複製 Prompt 給 AI') : '⎘ 登入後複製 Prompt'}
          </button>
          {!hideSaveButton && (
            <button
              onClick={isSignedIn ? handleSaveChart : () => openSignIn()}
              disabled={isSignedIn ? saving : false}
              className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink) bg-transparent border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--ink) hover:text-(--paper) disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignedIn ? (saving ? '儲存中…' : '⊕ 儲存人類圖') : '⊕ 登入後儲存'}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
