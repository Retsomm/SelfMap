'use client'

import { useRef, useMemo, useCallback, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import BodyGraph from '@/components/humanDesign/BodyGraph'
import PlanetIcon from '@/components/humanDesign/PlanetIcon'
import { analyzeComposite, type ConnectionDynamic } from '@/lib/compositeAnalysis'
import { buildCompositeAiPrompt, type HdResult } from '@/lib/buildAiPrompt'
import { saveCompositeChart } from '@/lib/saveChart'
import type { Activations, CenterName } from '@/lib/humanDesign'
import { toActivations } from '@/lib/humanDesign'
import { downloadChart } from '@/lib/downloadChart'
import {
  TYPE_LABELS,
  PROFILE_LABELS,
  CENTER_INFO,
} from '@/lib/humanDesign'
import toast from 'react-hot-toast'

type ChartMode = 'merged' | 'sideBySide'

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Build composite activations: Person A gates → c flag, Person B → u flag */
const buildCompositeActivations = (a: HdResult, b: HdResult): Activations => {
  const map: Activations = {}
  for (const gate of a.allGates) map[gate] = { ...map[gate], c: true }
  for (const gate of b.allGates) map[gate] = { ...map[gate], u: true }
  return map
}

const centerLabel = (id: CenterName) => CENTER_INFO[id]?.name ?? id

// ── CompositePlanetPanel ────────────────────────────────────────────────────

interface PlanetPanelProps {
  result: HdResult
  side: 'left' | 'right'
  label: string
}

const CompositePlanetPanel = ({ result, side, label }: PlanetPanelProps) => {
  const isLeft = side === 'left'
  const panelClass = isLeft ? 'composite-person-panel--a' : 'composite-person-panel--b'
  const rowClass = isLeft ? 'composite-planet-row--left' : 'composite-planet-row--right'

  return (
    <div className={`composite-person-panel ${panelClass}`}>
      <div className="composite-person-label">{label}</div>
      <div className="composite-planet-rows">
        {result.planets.map(p => (
          <div key={p.planetName} className={`composite-planet-row ${rowClass}`}>
            <span className={`composite-gate composite-gate--side ${isLeft ? 'composite-gate--right' : 'composite-gate--left'}`}>
              {isLeft ? p.red.full : p.black.full}
            </span>
            <PlanetIcon name={p.planetName} className="composite-planet-icon" />
            <span className={`composite-gate composite-gate--side ${isLeft ? 'composite-gate--left' : 'composite-gate--right'}`}>
              {isLeft ? p.black.full : p.red.full}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MiniChartPanel (for side-by-side mode) ──────────────────────────────────

interface MiniChartPanelProps {
  result: HdResult
  label: string
  color: string
  date: string
  time: string
  locationLabel: string
}

const MiniChartPanel = ({ result, label, color, date, time, locationLabel }: MiniChartPanelProps) => {
  const activations = useMemo(() => toActivations(result.planets), [result])
  const typeLabel = TYPE_LABELS[result.type]
  const profileLabel = PROFILE_LABELS[result.profile.profile] ?? '—'

  const annotationLabels = useMemo(() => ({
    head: '頭腦中心', ajna: '邏輯中心', throat: '喉嚨中心', g: 'G 中心',
    ego: '意志力中心', spleen: '脾中心', sacral: '薦骨中心',
    solarPlexus: '情緒中心', root: '根部中心',
  }), [])

  const arrowTones = useMemo(() => ({
    topLeft:     result.planets[0]?.red.tone   ?? 1,
    bottomLeft:  result.planets[3]?.red.tone   ?? 1,
    topRight:    result.planets[0]?.black.tone ?? 1,
    bottomRight: result.planets[3]?.black.tone ?? 1,
  }), [result.planets])

  const arrowColors = useMemo(() => ({
    topLeft:     result.planets[0]?.red.color   ?? 1,
    bottomLeft:  result.planets[3]?.red.color   ?? 1,
    topRight:    result.planets[0]?.black.color ?? 1,
    bottomRight: result.planets[3]?.black.color ?? 1,
  }), [result.planets])

  return (
    <div className="flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-baseline gap-3 mb-2 pb-2 border-b border-[var(--ink)]">
        <span className="font-serif italic font-medium text-[26px] leading-none" style={{ color }}>{label}</span>
        <div className="font-mono text-[12px] tracking-[0.08em] text-[var(--ink-soft)] min-w-0">
          <div className="truncate">{date} {time}</div>
          <div className="truncate opacity-70">{locationLabel}</div>
        </div>
      </div>

      {/* Chart row */}
      <div className="hd-chart-row hd-chart-row--mini">
        <aside className="hd-planets-side hd-planets-side--design">
          <div className="hd-planets-side-header">設計</div>
          <div className="hd-planet-rows">
            {result.planets.map(p => (
              <div key={p.planetName} className="hd-planet-row hd-planet-row--left">
                <PlanetIcon name={p.planetName} className="hd-planet-symbol" />
                <span className="hd-planet-gate">{p.red.full}</span>
              </div>
            ))}
          </div>
        </aside>

        <aside className="hd-arrows-col hd-arrows-col--left">
          {[
            { tone: arrowTones.topLeft, color: arrowColors.topLeft },
            { tone: arrowTones.bottomLeft, color: arrowColors.bottomLeft },
          ].map((v, i) => (
            <div key={i} className="hd-arrow-item">
              <div className={`hd-arrow-shape hd-arrow-shape--${v.tone <= 3 ? 'left' : 'right'}`} />
              <div className="hd-arrow-values">
                <span className="hd-arrow-value hd-arrow-value--color">{v.color}</span>
                <span className="hd-arrow-value hd-arrow-value--tone">{v.tone}</span>
              </div>
            </div>
          ))}
        </aside>

        <main className="hd-col-mid">
          <div className="hd-chart-frame">
            <span className="hd-chart-corner tl" /><span className="hd-chart-corner tr" />
            <span className="hd-chart-corner bl" /><span className="hd-chart-corner br" />
            <BodyGraph
              onSelect={() => {}}
              showGates showAnnotations showFace showSilhouette
              activations={activations}
              definedCenterIds={result.definedCenterIds}
              annotationLabels={annotationLabels}
            />
          </div>
        </main>

        <aside className="hd-arrows-col hd-arrows-col--right">
          {[
            { tone: arrowTones.topRight, color: arrowColors.topRight },
            { tone: arrowTones.bottomRight, color: arrowColors.bottomRight },
          ].map((v, i) => (
            <div key={i} className="hd-arrow-item">
              <div className={`hd-arrow-shape hd-arrow-shape--${v.tone <= 3 ? 'left' : 'right'}`} />
              <div className="hd-arrow-values">
                <span className="hd-arrow-value hd-arrow-value--color">{v.color}</span>
                <span className="hd-arrow-value hd-arrow-value--tone">{v.tone}</span>
              </div>
            </div>
          ))}
        </aside>

        <aside className="hd-planets-side hd-planets-side--personality">
          <div className="hd-planets-side-header">人格</div>
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

      {/* Stats */}
      <div className="mt-2 pt-2 border-t border-dotted border-[rgba(43,31,20,0.3)] grid grid-cols-3 gap-1">
        {[
          { label: '類型', value: typeLabel },
          { label: '配置', value: result.profile.profile + ' ' + profileLabel },
          { label: '權威', value: result.authority.name },
        ].map(item => (
          <div key={item.label} className="min-w-0">
            <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-[var(--ink-soft)]">{item.label}</div>
            <div className="font-sans text-[12px] font-semibold text-[var(--ink)] leading-snug">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── ConnectionGroup ──────────────────────────────────────────────────────────

interface ConnectionGroupProps {
  title: string
  desc: string
  connections: ConnectionDynamic[]
  colorClass: string
  labelA: string
  labelB: string
}

const ConnectionGroup = ({ title, desc, connections, colorClass, labelA, labelB }: ConnectionGroupProps) => {
  return (
    <div className="border border-[var(--ink)]">
      <div className={`px-4 py-2.5 border-b border-[var(--ink)] ${colorClass}`}>
        <div className="font-mono text-[12px] md:text-base font-bold tracking-[0.12em] uppercase text-[var(--ink)]">{title}</div>
        <div className="font-sans text-[12px] md:text-base text-[var(--ink-soft)] mt-0.5 leading-snug">{desc}</div>
      </div>
      {connections.length === 0 ? (
        <div className="px-4 py-3 font-mono text-[12px] md:text-base text-[var(--ink-soft)]">目前尚無連結動態</div>
      ) : (
        <div className="divide-y divide-dotted divide-[rgba(43,31,20,0.2)]">
          {connections.map(conn => (
            <div key={conn.channelId} className="px-4 py-2 flex flex-col gap-1 text-[12px] md:text-base">
              <div className="font-mono font-bold text-[var(--ink)] flex items-baseline gap-2 whitespace-nowrap">
                <span>{conn.channelId}</span>
                <span className="font-normal text-[var(--ink-soft)]">
                  {centerLabel(conn.centerA)}—{centerLabel(conn.centerB)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-mono text-[var(--ink-soft)]">
                  <span className="font-semibold text-[#c8553d]">{labelA}</span>{' '}
                  {conn.aGates.length > 0 ? conn.aGates.join(', ') : '—'}
                </div>
                <div className="font-mono text-[var(--ink-soft)]">
                  <span className="font-semibold text-[var(--ink)]">{labelB}</span>{' '}
                  {conn.bGates.length > 0 ? conn.bGates.join(', ') : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── CompositeView ────────────────────────────────────────────────────────────

interface CompositeViewProps {
  resultA: HdResult
  resultB: HdResult
  dateA: string
  timeA: string
  locationA: string
  timezoneA: string
  dateB: string
  timeB: string
  locationB: string
  timezoneB: string
  onSaved?: () => void
  hideSaveButton?: boolean
}

export default function CompositeView({
  resultA, resultB,
  dateA, timeA, locationA, timezoneA,
  dateB, timeB, locationB, timezoneB,
  onSaved,
  hideSaveButton = false,
}: CompositeViewProps) {
  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()
  const printAreaRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [chartMode, setChartMode] = useState<ChartMode>('merged')

  const analysis = useMemo(() => analyzeComposite(resultA, resultB), [resultA, resultB])
  const labelA = '人物 A'
  const labelB = '人物 B'

  const compositeActivations = useMemo(() => buildCompositeActivations(resultA, resultB), [resultA, resultB])

  const annotationLabels = useMemo(() => ({
    head:        '頭腦中心',
    ajna:        '邏輯中心',
    throat:      '喉嚨中心',
    g:           'G 中心',
    ego:         '意志力中心',
    spleen:      '脾中心',
    sacral:      '薦骨中心',
    solarPlexus: '情緒中心',
    root:        '根部中心',
  }), [])

  const integrationKey = analysis.integrationTheme === '9+0' ? 'theme9_0'
    : analysis.integrationTheme === '8+1' ? 'theme8_1'
    : analysis.integrationTheme === '7+2' ? 'theme7_2'
    : 'theme6_3'

  const INTEGRATION_CONTENT: Record<string, { label: string; love: string; work: string }> = {
    theme9_0: {
      label: '九加零',
      love: '極度甜蜜與黏人。能量場完全自給自足，外人很難融入。兩人會深深沉浸在彼此的世界中，但也容易因為缺乏外在刺激而感到窒息或過度封閉。',
      work: '過於封閉。團隊內部可能非常有默契，但極易忽略外部市場的變化或同事、客戶的客觀意見。',
    },
    theme8_1: {
      label: '八加一',
      love: '最舒服的互動模式。彼此有足夠的能量連結，同時留有「空白」作為陽光照進來的窗口。雙方擁有各自呼吸與消化的空間，關係健康且長久。',
      work: '黃金搭檔。既有共同努力的交集，又有一起去體驗、探索外部世界的窗口。',
    },
    theme7_2: {
      label: '七加二',
      love: '最舒服的互動模式之一。保有兩個空白中心，彼此連結同時仍有足夠的獨立呼吸空間，長期相處不易窒息。',
      work: '黃金搭檔。既有共同努力的交集，又有兩扇開放的窗口迎接外在刺激與機會。',
    },
    theme6_3: {
      label: '六加三',
      love: '連結感較淡。兩人在一起時仍有太多未定因素，容易流於平淡或像朋友。通常需要藉由共同的興趣、小孩或外在媒介來維繫緊密感。',
      work: '適合團隊合作。保持高度的獨立性與自由度，不會對彼此造成過度制約，適合鬆散型的專案合作或大團隊中的平行分工。',
    },
  }

  const LINE_RESONANCE: Record<string, { label: string; desc: string }> = {
    line1: { label: '第一線', desc: '這是你在關係中最自然的表達方式。' },
    line2: { label: '第二線', desc: '這是你在關係中需要穩定與支持的方式。' },
    line3: { label: '第三線', desc: '這是你在關係中帶來創新與試探的方式。' },
    line4: { label: '第四線', desc: '這是你在關係中建立安全與秩序的方式。' },
    line5: { label: '第五線', desc: '這是你在關係中展現自由與洞察的方式。' },
    line6: { label: '第六線', desc: '這是你在關係中整合與學習的方式。' },
  }

  const LINE_RESONANCE_KEYS = ['line1', 'line2', 'line3', 'line4', 'line5', 'line6'] as const

  const handleDownload = useCallback(async () => {
    const el = printAreaRef.current
    if (!el) return
    setDownloading(true)
    window.umami?.track('composite-download')
    try {
      await downloadChart(el)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '下載失敗')
    } finally {
      setDownloading(false)
    }
  }, [])

  const handleCopyPrompt = useCallback(() => {
    window.umami?.track('composite-copy-prompt')
    navigator.clipboard.writeText(buildCompositeAiPrompt(resultA, resultB, analysis)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(err => { console.error(err); toast.error('複製失敗') })
  }, [resultA, resultB, analysis])

  const handleSaveCharts = useCallback(async () => {
    setSaving(true)
    window.umami?.track('composite-save')
    try {
      await saveCompositeChart({
        resultA, resultB,
        dateA, timeA, locationA, timezoneA,
        dateB, timeB, locationB, timezoneB,
        compositeDefinedCenterIds: analysis.compositeDefinedCenterIds,
        compositeDefinedChannels: analysis.compositeDefinedChannels,
        compositeAllGates: new Set([...resultA.allGates, ...resultB.allGates]),
      })
      toast.success('合圖已儲存')
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '合圖儲存失敗')
    } finally {
      setSaving(false)
    }
  }, [resultA, resultB, dateA, timeA, locationA, timezoneA, dateB, timeB, locationB, timezoneB, analysis, onSaved])

  return (
    <div ref={printAreaRef} className="flex flex-col gap-8">

      {/* Person info header row */}
      <div className="grid grid-cols-2 gap-4 border border-[var(--ink)] bg-[var(--paper-deep)] px-5 py-3 font-mono text-[12px] md:text-base tracking-[0.06em]">
        {[
          { label: labelA, date: dateA, time: timeA, loc: locationA, color: '#c8553d' },
          { label: labelB, date: dateB, time: timeB, loc: locationB, color: 'var(--ink)' },
        ].map(p => (
          <div key={p.label} className="flex gap-2.5 items-start min-w-0">
            <span className="font-bold text-[14px] shrink-0" style={{ color: p.color }}>{p.label}</span>
            <div className="min-w-0 text-[var(--ink-soft)]">
              <div className="truncate">{p.date} · {p.time}</div>
              <div className="truncate opacity-70">{p.loc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart mode toggle buttons */}
      <div className="hd-print-hide flex gap-0 border border-[var(--ink)] self-start">
        {([
          { mode: 'merged' as ChartMode, label: '合併顯示' },
          { mode: 'sideBySide' as ChartMode, label: '並排顯示' },
        ] as const).map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setChartMode(mode)}
            className={[
              'font-mono text-[12px] md:text-base tracking-[0.12em] uppercase px-4 py-2 cursor-pointer transition-colors duration-[120ms] border-0',
              chartMode === mode
                ? 'bg-[var(--ink)] text-[var(--paper)]'
                : 'bg-transparent text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper-deep)]',
              mode === 'sideBySide' ? 'border-l border-l-[var(--ink)]' : '',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Merged mode: [PersonA panel] [BodyGraph] [PersonB panel] */}
      {chartMode === 'merged' && (
        <>
          <div className="composite-chart-row">
            <CompositePlanetPanel result={resultA} side="left" label={labelA} />

            <div className="hd-col-mid">
              <div className="hd-chart-frame">
                <span className="hd-chart-corner tl" /><span className="hd-chart-corner tr" />
                <span className="hd-chart-corner bl" /><span className="hd-chart-corner br" />
                <BodyGraph
                  onSelect={() => {}}
                  showGates showAnnotations showFace showSilhouette
                  activations={compositeActivations}
                  definedCenterIds={analysis.compositeDefinedCenterIds}
                  annotationLabels={annotationLabels}
                />
              </div>
            </div>

            <CompositePlanetPanel result={resultB} side="right" label={labelB} />
          </div>

          {/* Mobile: gate list below chart (visible ≤760px) */}
          <div className="composite-planets-mobile">
            {[
              { result: resultA, label: labelA, colClass: 'composite-planets-mobile-col--a' },
              { result: resultB, label: labelB, colClass: 'composite-planets-mobile-col--b' },
            ].map(({ result: r, label, colClass }) => (
              <div key={label} className={colClass}>
                <div className="composite-planets-mobile-header">{label}</div>
                {r.planets.map(p => (
                  <div key={p.planetName} className="composite-planets-mobile-row">
                    <PlanetIcon name={p.planetName} className="w-[10px] h-[10px] shrink-0 block" />
                    <span style={{ color: '#c8553d' }}>{p.red.full}</span>
                    <span style={{ opacity: 0.35 }}>/</span>
                    <span style={{ color: 'var(--ink)' }}>{p.black.full}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Side-by-side mode: two individual mini charts */}
      {chartMode === 'sideBySide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <MiniChartPanel
            result={resultA} label={labelA} color="#c8553d"
            date={dateA} time={timeA} locationLabel={locationA}
          />
          <MiniChartPanel
            result={resultB} label={labelB} color="var(--ink)"
            date={dateB} time={timeB} locationLabel={locationB}
          />
        </div>
      )}

      {/* Analysis section */}
      <section className="border-t border-[var(--ink)] pt-8">
        <div className="flex items-baseline gap-4 mb-6">
          <h2 className="font-serif italic font-medium text-[clamp(28px,3vw,42px)] leading-none m-0 text-[var(--ink)]">
            合圖分析
          </h2>
          <span className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)]">
            兩張圖的整合關係
          </span>
        </div>

        {/* Integration theme */}
        <div className="mb-6">
          <div className="font-mono text-[12px] md:text-base tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-3">
            整合主題
          </div>
          <div className="border border-[var(--ink)] bg-[var(--paper-deep)]">
            <div className="px-5 py-3 border-b border-[var(--ink)] flex flex-wrap items-center gap-4">
              <span className="font-serif italic font-medium text-[22px] md:text-[26px] text-[var(--ink)]">
                {INTEGRATION_CONTENT[integrationKey]?.label}
              </span>
              <span className="font-mono text-[12px] md:text-base tracking-[0.1em] text-[var(--ink-soft)]">
                {analysis.compositeDefinedCount} 個已定義中心
                {' · '}
                {analysis.compositeOpenCount} 個開放中心
              </span>
            </div>
            <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="font-mono text-[12px] md:text-base tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-1">愛與關係</div>
                <p className="font-sans text-[12px] md:text-base text-[var(--ink)] leading-[1.65] m-0">
                  {INTEGRATION_CONTENT[integrationKey]?.love}
                </p>
              </div>
              <div>
                <div className="font-mono text-[12px] md:text-base tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-1">工作與成長</div>
                <p className="font-sans text-[12px] md:text-base text-[var(--ink)] leading-[1.65] m-0">
                  {INTEGRATION_CONTENT[integrationKey]?.work}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection dynamics */}
        <div className="mb-6">
          <div className="font-mono text-[12px] md:text-base tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-3">
            連結動態
          </div>
          <div className="flex flex-col gap-2">
            <ConnectionGroup
              title="電磁力"
              desc="兩人間的吸引與衝突節點"
              connections={analysis.electromagnetic}
              colorClass="bg-[rgba(200,85,61,0.08)]"
              labelA={labelA} labelB={labelB}
            />
            <ConnectionGroup
              title="同伴關係"
              desc="彼此支持與陪伴的方式"
              connections={analysis.companionship}
              colorClass="bg-[rgba(168,192,101,0.12)]"
              labelA={labelA} labelB={labelB}
            />
            <ConnectionGroup
              title="妥協與協調"
              desc="如何在不同節奏與需求中找到平衡"
              connections={analysis.compromise}
              colorClass="bg-[rgba(217,194,94,0.12)]"
              labelA={labelA} labelB={labelB}
            />
            <ConnectionGroup
              title="主導與掌控"
              desc="誰更容易主導節奏與方向"
              connections={analysis.dominance}
              colorClass="bg-[rgba(43,31,20,0.05)]"
              labelA={labelA} labelB={labelB}
            />
          </div>
        </div>

        {/* Profile resonance */}
        <div className="mb-6">
          <div className="font-mono text-[12px] md:text-base tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-3">
            配置共鳴
          </div>
          <div className="border border-[var(--ink)] px-5 py-4">
            <div className="flex items-baseline gap-4 mb-3">
              <span className="font-serif italic text-[16px] text-[#c8553d]">{labelA} {resultA.profile.profile}</span>
              <span className="font-serif italic text-[16px] text-[var(--ink)]">{labelB} {resultB.profile.profile}</span>
            </div>
            {analysis.profileResonance.length === 0 ? (
              <p className="font-sans text-[12px] md:text-base text-[var(--ink-soft)] m-0 leading-[1.65]">
                目前沒有明顯的配置共鳴
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {analysis.profileResonance.map(line => {
                  const key = Number.isInteger(line) && line >= 1 && line <= LINE_RESONANCE_KEYS.length
                    ? LINE_RESONANCE_KEYS[line - 1]
                    : undefined
                  if (!key) return null
                  return (
                    <div key={line} className="flex gap-3 items-start">
                      <span className="font-mono text-[12px] md:text-base font-bold tracking-[0.06em] text-[var(--ink)] shrink-0 pt-0.5">
                        {LINE_RESONANCE[key]?.label}
                      </span>
                      <span className="font-sans text-[12px] md:text-base text-[var(--ink-soft)] leading-[1.65]">
                        {LINE_RESONANCE[key]?.desc}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Authority interaction */}
        <div className="mb-6">
          <div className="font-mono text-[12px] md:text-base tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-3">
            權威互動
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'A 的權威', result: resultA, accentColor: '#c8553d' },
              { label: 'B 的權威', result: resultB, accentColor: 'var(--ink)' },
            ].map(({ label, result: r, accentColor }) => (
              <div key={label} className="border border-[var(--ink)] border-l-4 px-4 py-3" style={{ borderLeftColor: accentColor }}>
                <div className="font-mono text-[12px] md:text-base tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-1">{label}</div>
                <div className="font-serif italic font-medium text-[18px] text-[var(--ink)] mb-1">{r.authority.name}</div>
                <p className="font-sans text-[12px] md:text-base text-[var(--ink-soft)] m-0 leading-[1.65]">{r.authority.tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="hd-print-hide flex gap-3 mt-4 flex-wrap">
          <button
            onClick={isSignedIn ? handleDownload : () => openSignIn()}
            disabled={isSignedIn ? downloading : false}
            className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--paper) bg-(--ink) border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--crimson) hover:border-(--crimson) disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSignedIn
              ? (downloading ? '下載中…' : '下載合圖')
              : '先登入再下載'}
          </button>
          <button
            onClick={isSignedIn ? handleCopyPrompt : () => openSignIn()}
            className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink) bg-transparent border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--ink) hover:text-(--paper)"
          >
            {isSignedIn ? (copied ? '已複製' : '複製合圖提示') : '先登入再複製'}
          </button>
          {!hideSaveButton && (
            <button
              onClick={isSignedIn ? handleSaveCharts : () => openSignIn()}
              disabled={isSignedIn ? saving : false}
              className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink) bg-transparent border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--ink) hover:text-(--paper) disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignedIn ? (saving ? '儲存中…' : '儲存合圖') : '先登入再儲存'}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
