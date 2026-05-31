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
import { useLang } from '@/i18n'
import {
  TYPE_LABELS,
  TYPE_LABELS_EN,
  PROFILE_LABELS,
  PROFILE_LABELS_EN,
  CENTER_INFO,
  CENTER_NAMES_EN,
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

const centerLabel = (id: CenterName, lang: string) =>
  lang === 'en' ? (CENTER_NAMES_EN[id] ?? CENTER_INFO[id]?.name ?? id) : (CENTER_INFO[id]?.name ?? id)

// ── CompositePlanetPanel ────────────────────────────────────────────────────

interface PlanetPanelProps {
  result: HdResult
  side: 'left' | 'right'
  label: string
}

const CompositePlanetPanel = ({ result, side, label }: PlanetPanelProps) => {
  const { t } = useLang()
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
              {p.red.full}
            </span>
            <PlanetIcon name={p.planetName} className="composite-planet-icon" />
            <span className={`composite-gate composite-gate--side ${isLeft ? 'composite-gate--left' : 'composite-gate--right'}`}>
              {p.black.full}
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
  const { t, lang } = useLang()
  const activations = useMemo(() => toActivations(result.planets), [result])
  const typeLabel = lang === 'en' ? (TYPE_LABELS_EN[result.type] ?? result.type) : TYPE_LABELS[result.type]
  const profileLabel = lang === 'en' ? (PROFILE_LABELS_EN[result.profile.profile] ?? '—') : (PROFILE_LABELS[result.profile.profile] ?? '—')

  const annotationLabels = useMemo(() => ({
    head: t('chart.annotations.head'), ajna: t('chart.annotations.ajna'),
    throat: t('chart.annotations.throat'), g: t('chart.annotations.g'),
    ego: t('chart.annotations.ego'), spleen: t('chart.annotations.spleen'),
    sacral: t('chart.annotations.sacral'), solarPlexus: t('chart.annotations.solarPlexus'),
    root: t('chart.annotations.root'),
  }), [t])

  const arrowTones = useMemo(() => ({
    topLeft:     result.planets[0]?.red.tone   ?? 1,
    bottomLeft:  result.planets[3]?.red.tone   ?? 1,
    topRight:    result.planets[0]?.black.tone ?? 1,
    bottomRight: result.planets[3]?.black.tone ?? 1,
  }), [result.planets])

  return (
    <div className="flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-baseline gap-3 mb-2 pb-2 border-b border-[var(--ink)]">
        <span className="font-serif italic font-medium text-[26px] leading-none" style={{ color }}>{label}</span>
        <div className="font-mono text-[10px] tracking-[0.08em] text-[var(--ink-soft)] min-w-0">
          <div className="truncate">{date} {time}</div>
          <div className="truncate opacity-70">{locationLabel}</div>
        </div>
      </div>

      {/* Chart row */}
      <div className="hd-chart-row hd-chart-row--mini">
        <aside className="hd-planets-side hd-planets-side--design">
          <div className="hd-planets-side-header">{t('chart.designLabel')}</div>
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
          {[arrowTones.topLeft, arrowTones.bottomLeft].map((tone, i) => (
            <div key={i} className="hd-arrow-item">
              <div className={`hd-arrow-shape hd-arrow-shape--${tone <= 3 ? 'left' : 'right'}`} />
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
          {[arrowTones.topRight, arrowTones.bottomRight].map((tone, i) => (
            <div key={i} className="hd-arrow-item">
              <div className={`hd-arrow-shape hd-arrow-shape--${tone <= 3 ? 'left' : 'right'}`} />
            </div>
          ))}
        </aside>

        <aside className="hd-planets-side hd-planets-side--personality">
          <div className="hd-planets-side-header">{t('chart.personalityLabel')}</div>
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
          { label: t('chart.typeCard'), value: typeLabel },
          { label: t('chart.profileCard'), value: result.profile.profile + ' ' + profileLabel },
          { label: t('chart.authorityCard'), value: result.authority.name },
        ].map(item => (
          <div key={item.label} className="min-w-0">
            <div className="font-mono text-[8px] tracking-[0.1em] uppercase text-[var(--ink-soft)]">{item.label}</div>
            <div className="font-sans text-[10px] font-semibold text-[var(--ink)] leading-snug">{item.value}</div>
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
  const { t, lang } = useLang()
  return (
    <div className="border border-[var(--ink)]">
      <div className={`px-4 py-2.5 border-b border-[var(--ink)] ${colorClass}`}>
        <div className="font-mono text-[11px] md:text-[13px] font-bold tracking-[0.12em] uppercase text-[var(--ink)]">{title}</div>
        <div className="font-sans text-[11px] md:text-[12px] text-[var(--ink-soft)] mt-0.5 leading-snug">{desc}</div>
      </div>
      {connections.length === 0 ? (
        <div className="px-4 py-3 font-mono text-[11px] md:text-[12px] text-[var(--ink-soft)]">{t('composite.noConnections')}</div>
      ) : (
        <div className="divide-y divide-dotted divide-[rgba(43,31,20,0.2)]">
          {connections.map(conn => (
            <div key={conn.channelId} className="px-4 py-2 grid grid-cols-[80px_1fr_1fr] md:grid-cols-[100px_1fr_1fr] gap-2 items-start text-[11px] md:text-[12px]">
              <div className="font-mono font-bold text-[var(--ink)]">
                {conn.channelId}
                <div className="font-normal text-[10px] text-[var(--ink-soft)] leading-tight">
                  {centerLabel(conn.centerA, lang)}—{centerLabel(conn.centerB, lang)}
                </div>
              </div>
              <div className="font-mono text-[var(--ink-soft)]">
                <span className="font-semibold text-[#c8553d]">{labelA}</span>{' '}
                {conn.aGates.length > 0 ? conn.aGates.join(', ') : '—'}
              </div>
              <div className="font-mono text-[var(--ink-soft)]">
                <span className="font-semibold text-[var(--ink)]">{labelB}</span>{' '}
                {conn.bGates.length > 0 ? conn.bGates.join(', ') : '—'}
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
  const { t, lang } = useLang()
  const printAreaRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [chartMode, setChartMode] = useState<ChartMode>('merged')

  const analysis = useMemo(() => analyzeComposite(resultA, resultB), [resultA, resultB])
  const labelA = t('composite.personA')
  const labelB = t('composite.personB')

  const compositeActivations = useMemo(() => buildCompositeActivations(resultA, resultB), [resultA, resultB])

  const annotationLabels = useMemo(() => ({
    head:        t('chart.annotations.head'),
    ajna:        t('chart.annotations.ajna'),
    throat:      t('chart.annotations.throat'),
    g:           t('chart.annotations.g'),
    ego:         t('chart.annotations.ego'),
    spleen:      t('chart.annotations.spleen'),
    sacral:      t('chart.annotations.sacral'),
    solarPlexus: t('chart.annotations.solarPlexus'),
    root:        t('chart.annotations.root'),
  }), [t])

  const integrationKey = analysis.integrationTheme === '9+0' ? 'theme9_0'
    : analysis.integrationTheme === '8+1' ? 'theme8_1'
    : analysis.integrationTheme === '7+2' ? 'theme7_2'
    : 'theme6_3'

  const LINE_RESONANCE_KEYS = ['line1', 'line2', 'line3', 'line4', 'line5', 'line6'] as const

  const handleDownload = useCallback(async () => {
    const el = printAreaRef.current
    if (!el) return
    setDownloading(true)
    try {
      await downloadChart(el)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('chart.downloadFailed'))
    } finally {
      setDownloading(false)
    }
  }, [t])

  const handleCopyPrompt = useCallback(() => {
    window.umami?.track('composite-copy-prompt')
    navigator.clipboard.writeText(buildCompositeAiPrompt(resultA, resultB)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => setCopied(false))
  }, [resultA, resultB])

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
      toast.success(t('composite.chartsSaved'))
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('composite.saveFailed'))
    } finally {
      setSaving(false)
    }
  }, [resultA, resultB, dateA, timeA, locationA, timezoneA, dateB, timeB, locationB, timezoneB, analysis, onSaved, t])

  return (
    <div ref={printAreaRef} className="flex flex-col gap-8">

      {/* Person info header row */}
      <div className="grid grid-cols-2 gap-4 border border-[var(--ink)] bg-[var(--paper-deep)] px-5 py-3 font-mono text-[11px] tracking-[0.06em]">
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
          { mode: 'merged' as ChartMode, label: lang === 'zh' ? '合併顯示' : 'Merged' },
          { mode: 'sideBySide' as ChartMode, label: lang === 'zh' ? '並排顯示' : 'Side by Side' },
        ] as const).map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setChartMode(mode)}
            className={[
              'font-mono text-[11px] md:text-[12px] tracking-[0.12em] uppercase px-4 py-2 cursor-pointer transition-colors duration-[120ms] border-0',
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
          <h2 className="font-serif italic font-medium text-[clamp(24px,2.5vw,36px)] leading-none m-0 text-[var(--ink)]">
            {t('composite.title')}
          </h2>
          <span className="font-mono text-[11px] md:text-[13px] tracking-[0.2em] uppercase text-[var(--ink-soft)]">
            {t('composite.subtitle')}
          </span>
        </div>

        {/* Integration theme */}
        <div className="mb-6">
          <div className="font-mono text-[11px] md:text-[13px] tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-3">
            {t('composite.integrationTitle')}
          </div>
          <div className="border border-[var(--ink)] bg-[var(--paper-deep)]">
            <div className="px-5 py-3 border-b border-[var(--ink)] flex flex-wrap items-center gap-4">
              <span className="font-serif italic font-medium text-[22px] md:text-[26px] text-[var(--ink)]">
                {t(`composite.${integrationKey}_label`)}
              </span>
              <span className="font-mono text-[11px] tracking-[0.1em] text-[var(--ink-soft)]">
                {t('composite.definedCenters', { count: analysis.compositeDefinedCount })}
                {' · '}
                {t('composite.openCenters', { count: analysis.compositeOpenCount })}
              </span>
            </div>
            <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-1">{t('composite.loveLabel')}</div>
                <p className="font-sans text-[12px] md:text-[13px] text-[var(--ink)] leading-[1.65] m-0">
                  {t(`composite.${integrationKey}_love`)}
                </p>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-1">{t('composite.workLabel')}</div>
                <p className="font-sans text-[12px] md:text-[13px] text-[var(--ink)] leading-[1.65] m-0">
                  {t(`composite.${integrationKey}_work`)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection dynamics */}
        <div className="mb-6">
          <div className="font-mono text-[11px] md:text-[13px] tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-3">
            {t('composite.connectionTitle')}
          </div>
          <div className="flex flex-col gap-2">
            <ConnectionGroup
              title={t('composite.electromagnetic')}
              desc={t('composite.electromagneticDesc')}
              connections={analysis.electromagnetic}
              colorClass="bg-[rgba(200,85,61,0.08)]"
              labelA={labelA} labelB={labelB}
            />
            <ConnectionGroup
              title={t('composite.companionship')}
              desc={t('composite.companionshipDesc')}
              connections={analysis.companionship}
              colorClass="bg-[rgba(168,192,101,0.12)]"
              labelA={labelA} labelB={labelB}
            />
            <ConnectionGroup
              title={t('composite.compromise')}
              desc={t('composite.compromiseDesc')}
              connections={analysis.compromise}
              colorClass="bg-[rgba(217,194,94,0.12)]"
              labelA={labelA} labelB={labelB}
            />
            <ConnectionGroup
              title={t('composite.dominance')}
              desc={t('composite.dominanceDesc')}
              connections={analysis.dominance}
              colorClass="bg-[rgba(43,31,20,0.05)]"
              labelA={labelA} labelB={labelB}
            />
          </div>
        </div>

        {/* Composite defined channels */}
        {analysis.compositeDefinedChannels.length > 0 && (
          <div className="mb-6">
            <div className="font-mono text-[11px] md:text-[13px] tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-2">
              {t('composite.compositeChannelsTitle')}（{analysis.compositeDefinedChannels.length}）
            </div>
            <div className="flex flex-wrap gap-1.5">
              {analysis.compositeDefinedChannels.map(ch => (
                <span key={ch.id} className="font-mono text-[11px] tracking-[0.04em] border border-[var(--ink)] py-[3px] px-2 text-[var(--ink)] bg-[var(--paper-deep)]">
                  {ch.id}
                  <span className="ml-1.5 opacity-60 text-[10px]">
                    {centerLabel(ch.centerA, lang)}—{centerLabel(ch.centerB, lang)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Profile resonance */}
        <div className="mb-6">
          <div className="font-mono text-[11px] md:text-[13px] tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-3">
            {t('composite.profileResonanceTitle')}
          </div>
          <div className="border border-[var(--ink)] px-5 py-4">
            <div className="flex items-baseline gap-4 mb-3">
              <span className="font-serif italic text-[16px] text-[#c8553d]">{labelA} {resultA.profile.profile}</span>
              <span className="font-serif italic text-[16px] text-[var(--ink)]">{labelB} {resultB.profile.profile}</span>
            </div>
            {analysis.profileResonance.length === 0 ? (
              <p className="font-sans text-[12px] md:text-[13px] text-[var(--ink-soft)] m-0 leading-[1.65]">
                {t('composite.profileResonanceNone')}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {analysis.profileResonance.map(line => {
                  const key = LINE_RESONANCE_KEYS[line - 1]
                  return (
                    <div key={line} className="flex gap-3 items-start">
                      <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-[var(--ink)] shrink-0 pt-0.5">
                        {t(`composite.${key}`)}
                      </span>
                      <span className="font-sans text-[12px] md:text-[13px] text-[var(--ink-soft)] leading-[1.65]">
                        {t(`composite.${key}Desc`)}
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
          <div className="font-mono text-[11px] md:text-[13px] tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-3">
            {t('composite.authorityTitle')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: t('composite.authorityA'), result: resultA, accentColor: '#c8553d' },
              { label: t('composite.authorityB'), result: resultB, accentColor: 'var(--ink)' },
            ].map(({ label, result: r, accentColor }) => (
              <div key={label} className="border border-[var(--ink)] border-l-4 px-4 py-3" style={{ borderLeftColor: accentColor }}>
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--ink-soft)] mb-1">{label}</div>
                <div className="font-serif italic font-medium text-[18px] text-[var(--ink)] mb-1">{r.authority.name}</div>
                <p className="font-sans text-[12px] md:text-[13px] text-[var(--ink-soft)] m-0 leading-[1.65]">{r.authority.tip}</p>
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
              ? (downloading ? t('composite.downloading') : t('composite.download'))
              : t('composite.downloadSignIn')}
          </button>
          <button
            onClick={isSignedIn ? handleCopyPrompt : () => openSignIn()}
            className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink) bg-transparent border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--ink) hover:text-(--paper)"
          >
            {isSignedIn ? (copied ? t('composite.copied') : t('composite.copyPrompt')) : t('composite.copyPromptSignIn')}
          </button>
          {!hideSaveButton && (
            <button
              onClick={isSignedIn ? handleSaveCharts : () => openSignIn()}
              disabled={isSignedIn ? saving : false}
              className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink) bg-transparent border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--ink) hover:text-(--paper) disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignedIn ? (saving ? t('account.saving') : t('composite.saveCharts')) : t('composite.saveChartsSignIn')}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
