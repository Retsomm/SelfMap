'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { toActivations, type CenterName } from '@/lib/humanDesign'
import PlanetIcon from '@/components/humanDesign/PlanetIcon'
import { fmtGate, fmtCenterName } from '@/utils/format'
import BodyGraph, { type SelectionPayload, type AnnotationLabels } from '@/components/humanDesign/BodyGraph'
import DetailDrawer from '@/components/humanDesign/DetailDrawer'
import { HD_GATES, HD_CENTERS_INFO, HD_CHANNELS } from '@/components/humanDesign/hd-chart-data'
import {
  CENTER_INFO,
  CENTER_NAMES_EN,
  CHANNEL_DEFS,
  TYPE_LABELS,
  TYPE_LABELS_EN,
  PROFILE_LABELS,
  PROFILE_LABELS_EN,
  STRATEGY_MAP,
  STRATEGY_MAP_EN,
  SIGNATURE_MAP,
  SIGNATURE_MAP_EN,
  CROSS_TYPE_LABELS,
  CROSS_TYPE_LABELS_EN,
  CROSS_BASE_NAMES,
  CROSS_BASE_NAMES_EN,
  DEFINITION_LABEL_EN,
  AUTHORITY_INFO_EN,
  AUTHORITY_KEY_MAP,
  DIGESTION_MAP_EN,
  ENVIRONMENT_MAP_EN,
  PERSPECTIVE_MAP_EN,
  MOTIVATION_MAP_EN,
} from '@/lib/humanDesign'
import { downloadChart } from '@/lib/downloadChart'
import { buildAiPrompt, type HdResult } from '@/lib/buildAiPrompt'
import { saveChart } from '@/lib/saveChart'
import toast from 'react-hot-toast'
import { useLang } from '@/i18n'

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
  const { t, lang, pick } = useLang()

  const printAreaRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<SelectionPayload | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const annotationLabels: AnnotationLabels = useMemo(() => ({
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

  const activations = useMemo(() => toActivations(result.planets), [result])
  const generatedAt = useMemo(() => new Date().toLocaleString(lang === 'zh' ? 'zh-TW' : 'en-US', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }), [lang])

  // language-aware label helpers
  const typeLabel = lang === 'en' ? (TYPE_LABELS_EN[result.type] ?? result.type) : TYPE_LABELS[result.type]
  const profileLabel = lang === 'en' ? (PROFILE_LABELS_EN[result.profile.profile] ?? '—') : (PROFILE_LABELS[result.profile.profile] ?? '—')
  const strategyLabel = lang === 'en' ? (STRATEGY_MAP_EN[result.type] ?? '—') : (STRATEGY_MAP[result.type] ?? '—')
  const signaturePositive = lang === 'en' ? (SIGNATURE_MAP_EN[result.type]?.positive ?? '—') : (SIGNATURE_MAP[result.type]?.positive ?? '—')
  const signatureNegative = lang === 'en' ? (SIGNATURE_MAP_EN[result.type]?.negative ?? '—') : (SIGNATURE_MAP[result.type]?.negative ?? '—')
  const crossTypeLabel = lang === 'en' ? (CROSS_TYPE_LABELS_EN[result.incarnationCross.crossType] ?? result.incarnationCross.crossType) : (CROSS_TYPE_LABELS[result.incarnationCross.crossType] ?? result.incarnationCross.crossType)
  const crossBaseName = useMemo(() => {
    if (lang !== 'en') return result.incarnationCross.crossBaseName
    const idx = CROSS_BASE_NAMES.indexOf(result.incarnationCross.crossBaseName)
    return idx >= 0 ? (CROSS_BASE_NAMES_EN[idx] ?? result.incarnationCross.crossBaseName) : result.incarnationCross.crossBaseName
  }, [lang, result.incarnationCross.crossBaseName])
  const definitionLabel = lang === 'en' ? (DEFINITION_LABEL_EN[result.definition.raw] ?? result.definition.raw) : result.definition.label

  const authorityKey = AUTHORITY_KEY_MAP[result.authority.name]
  const authorityInfo = lang === 'en' && authorityKey ? (AUTHORITY_INFO_EN[authorityKey] ?? result.authority) : result.authority

  // variable color indices from planet data (same derivation as engine.ts calculateVariables)
  const varColors = useMemo(() => ({
    digestion:   result.planets[0]?.red.color   ?? 1,
    environment: result.planets[3]?.red.color   ?? 1,
    perspective: result.planets[3]?.black.color ?? 1,
    motivation:  result.planets[0]?.black.color ?? 1,
  }), [result.planets])

  // four-arrow directions from tone (1-3 = left, 4-6 = right) per HD standard
  const arrowTones = useMemo(() => ({
    topLeft:     result.planets[0]?.red.tone   ?? 1,  // Design 太陽 (Body)
    bottomLeft:  result.planets[3]?.red.tone   ?? 1,  // Design 北交點 (Environment)
    topRight:    result.planets[0]?.black.tone ?? 1,  // Personality 太陽 (Mind)
    bottomRight: result.planets[3]?.black.tone ?? 1,  // Personality 北交點 (Perspective)
  }), [result.planets])

  const varLabels = useMemo(() => {
    if (lang !== 'en') return result.variables
    return {
      digestion:   DIGESTION_MAP_EN[varColors.digestion]   ?? result.variables.digestion,
      environment: ENVIRONMENT_MAP_EN[varColors.environment] ?? result.variables.environment,
      perspective: PERSPECTIVE_MAP_EN[varColors.perspective] ?? result.variables.perspective,
      motivation:  MOTIVATION_MAP_EN[varColors.motivation]  ?? result.variables.motivation,
    }
  }, [lang, result.variables, varColors])

  const centerName = (id: CenterName) => lang === 'en' ? (CENTER_NAMES_EN[id] ?? CENTER_INFO[id].name) : CENTER_INFO[id].name

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

  const handleSelectCenter = useCallback((id: string, isDefined: boolean) => {
    const chartKey = toChartKey(id)
    const info = HD_CENTERS_INFO[chartKey]
    if (info) setSelection({ kind: 'center', data: { center: info, isDefined }, id: `center-${chartKey}` })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectType = useCallback(() => {
    setSelection({ kind: 'type', data: { typeKey: result.type }, id: `type-${result.type}` })
  }, [result.type])

  const handleSelectProfile = useCallback(() => {
    setSelection({ kind: 'profile', data: { profile: result.profile.profile }, id: `profile-${result.profile.profile}` })
  }, [result.profile.profile])

  const handleSelectAuthority = useCallback(() => {
    setSelection({ kind: 'authority', data: { authorityKey: authorityKey ?? result.authority.name }, id: `authority-${result.authority.name}` })
  }, [authorityKey, result.authority.name])

  const handleSelectDefinition = useCallback(() => {
    setSelection({ kind: 'definition', data: { definitionRaw: result.definition.raw }, id: `definition-${result.definition.raw}` })
  }, [result.definition.raw])

  const handleSelectCross = useCallback(() => {
    setSelection({
      kind: 'cross',
      data: {
        crossType: result.incarnationCross.crossType,
        sunGate: result.incarnationCross.persSunGate,
        crossBaseName: result.incarnationCross.crossBaseName,
        variant: result.incarnationCross.variant,
        gatesLabel: result.incarnationCross.gatesLabel,
      },
      id: `cross-${result.incarnationCross.crossName}`,
    })
  }, [result.incarnationCross])

  const handleSelectChannel = useCallback((channelId: string) => {
    const [a, b] = channelId.split('-').map(Number)
    const ch = hdChannelMap[`${a}-${b}`] ?? hdChannelMap[`${b}-${a}`]
    if (ch) setSelection({ kind: 'channel', data: ch, id: `channel-${ch.id}` })
  }, [hdChannelMap])

  const handleDownload = useCallback(async () => {
    const el = printAreaRef.current
    if (!el) return
    setDownloading(true)
    window.umami?.track('chart-download')
    try {
      await downloadChart(el)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('chart.downloadFailed'))
    } finally {
      setDownloading(false)
    }
  }, [t])

  const handleCopyPrompt = useCallback(() => {
    window.umami?.track('chart-copy-prompt')
    navigator.clipboard.writeText(buildAiPrompt(result)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => setCopied(false))
  }, [result])

  const handleSaveChart = useCallback(async () => {
    setSaving(true)
    window.umami?.track('chart-save')
    try {
      await saveChart({ result, date, time, locationLabel, timezone })
      toast.success(t('chart.chartSaved'))
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('chart.saveFailed'))
    } finally {
      setSaving(false)
    }
  }, [result, date, time, locationLabel, timezone, onSaved, t])

  return (
    <div ref={printAreaRef} className="relative">

      {/* Chart row: Design | Chart | Personality */}
      <div className="hd-chart-row">

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

        {/* Left arrows: Body top-left (Design 太陽 tone), Environment bottom-left (Design 北交點 tone) */}
        <aside className="hd-arrows-col hd-arrows-col--left h-30">
          <div className="hd-arrow-item">
            <div className={`hd-arrow-shape hd-arrow-shape--${arrowTones.topLeft <= 3 ? 'left' : 'right'}`} />
          </div>
          <div className="hd-arrow-item">
            <div className={`hd-arrow-shape hd-arrow-shape--${arrowTones.bottomLeft <= 3 ? 'left' : 'right'}`} />
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
              annotationLabels={annotationLabels}
            />
          </div>
        </main>

        {/* Right arrows: Mind top-right (Personality 太陽 tone), Perspective bottom-right (Personality 北交點 tone) */}
        <aside className="hd-arrows-col hd-arrows-col--right h-30">
          <div className="hd-arrow-item">
            <div className={`hd-arrow-shape hd-arrow-shape--${arrowTones.topRight <= 3 ? 'left' : 'right'}`} />
          </div>
          <div className="hd-arrow-item">
            <div className={`hd-arrow-shape hd-arrow-shape--${arrowTones.bottomRight <= 3 ? 'left' : 'right'}`} />
          </div>
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

      {/* Gate index strip */}
      <div className="hd-index-strip">
        <div>
          <h5>{t('chart.gateIndex')}</h5>
          <div className="mt-1 text-[12px] md:text-base leading-[1.4] text-[var(--ink-soft)]">
            {lang === 'en' ? (<>INDEX OF<br />SIXTY-FOUR<br />GATES</>) : (<>六十四<br />閘門索引</>)}
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
                title={HD_GATES[n] ? pick(HD_GATES[n].name) : undefined}
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
          <div className="hd-planets-mobile-header">{t('chart.designLabel')}</div>
          {result.planets.map(p => (
            <div key={p.planetName} className="hd-planets-mobile-row">
              <PlanetIcon name={p.planetName} className="hd-planets-mobile-icon" />
              <span>{p.red.full}</span>
            </div>
          ))}
        </div>
        <div className="hd-planets-mobile-col hd-planets-mobile-personality">
          <div className="hd-planets-mobile-header">{t('chart.personalityLabel')}</div>
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
            <span className="text-(--ink-soft) uppercase tracking-[0.15em]">{t('chart.birthDate')}</span>
            <span className="text-(--ink)">{date}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-(--ink-soft) uppercase tracking-[0.15em]">{t('chart.birthTime')}</span>
            <span className="text-(--ink)">{time}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-(--ink-soft) uppercase tracking-[0.15em]">{t('chart.birthLocation')}</span>
            <span className="text-(--ink)">{locationLabel}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-(--ink-soft) uppercase tracking-[0.15em]">{t('chart.timezone')}</span>
            <span className="text-(--ink)">{timezone}</span>
          </div>
          <div className="flex gap-3 sm:col-span-2 mt-1 pt-2 border-t border-dotted border-[rgba(43,31,20,0.25)]">
            <span className="text-(--ink-soft) uppercase tracking-[0.15em]">{t('chart.generatedAt')}</span>
            <span className="text-(--ink)">{generatedAt}</span>
          </div>
        </div>
      </div>

      {/* Full calculation results */}
      <section className="mt-6 border-t border-(--ink) pt-10">
        <div className="flex items-baseline gap-5 mb-8">
          <h2 className="font-serif italic font-medium text-[clamp(28px,3vw,42px)] leading-none m-0 text-[var(--ink)]">{t('chart.results')}</h2>
          <span className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)]">{t('chart.bodygraphAnalysis')}</span>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 mb-6">
          <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)] cursor-pointer transition-colors duration-[120ms] hover:bg-[var(--paper-deep)]" onClick={() => { window.umami?.track('chart-detail', { card: 'type' }); handleSelectType() }}>
            <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">{t('chart.typeCard')}</div>
            <div className="font-serif italic font-medium text-[26px] leading-[1.1] text-[var(--ink)] mb-1">{typeLabel}</div>
            {lang === 'zh' && <div className="font-mono text-[11px] text-[var(--ink-soft)] opacity-60">{result.type}</div>}
            <div className="font-mono text-[12px] md:text-base text-[var(--ink-soft)] mt-1.5 tracking-[0.04em]">{t('chart.strategy')} · {strategyLabel}</div>
            <div className="font-mono text-[12px] md:text-base text-[var(--ink-soft)] mt-1.5 tracking-[0.04em]">
              {t('chart.positive')} {signaturePositive} ／ {t('chart.negative')} {signatureNegative}
            </div>
          </div>

          <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)] cursor-pointer transition-colors duration-[120ms] hover:bg-[var(--paper-deep)]" onClick={() => { window.umami?.track('chart-detail', { card: 'profile' }); handleSelectProfile() }}>
            <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">{t('chart.profileCard')}</div>
            <div className="font-serif italic font-medium text-[40px] leading-[1.1] text-[var(--ink)] mb-1 tracking-[0.06em]">{result.profile.profile}</div>
            <div className="font-sans text-[12px] md:text-base text-[var(--ink-soft)] leading-[1.5]">{profileLabel}</div>
          </div>

          <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)] cursor-pointer transition-colors duration-[120ms] hover:bg-[var(--paper-deep)]" onClick={() => { window.umami?.track('chart-detail', { card: 'authority' }); handleSelectAuthority() }}>
            <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">{t('chart.authorityCard')}</div>
            <div className="font-serif italic font-medium text-[26px] leading-[1.1] text-[var(--ink)] mb-1">{authorityInfo.name}</div>
            <div className="font-sans text-[12px] md:text-base text-[var(--ink-soft)] leading-[1.5]">{authorityInfo.tip}</div>
          </div>

          <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)] cursor-pointer transition-colors duration-[120ms] hover:bg-[var(--paper-deep)]" onClick={() => { window.umami?.track('chart-detail', { card: 'definition' }); handleSelectDefinition() }}>
            <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">{t('chart.definitionCard')}</div>
            <div className="font-serif italic font-medium text-[26px] leading-[1.1] text-[var(--ink)] mb-1">{definitionLabel}</div>
            {lang === 'en' && <div className="font-mono text-[12px] md:text-base text-[var(--ink-soft)] mt-1 tracking-[0.04em]">{result.definition.raw}</div>}
            <div className="font-sans text-[12px] md:text-base text-[var(--ink-soft)] leading-[1.5] mt-1.5">
              {t('chart.definedCenters', { count: result.definedCenterIds.size, gates: result.allGates.size })}
            </div>
          </div>

          <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)] sm:col-span-2 cursor-pointer transition-colors duration-[120ms] hover:bg-[var(--paper-deep)]" onClick={() => { window.umami?.track('chart-detail', { card: 'cross' }); handleSelectCross() }}>
            <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">{t('chart.crossCard')}</div>
            <div className="font-serif italic font-medium text-[22px] leading-[1.1] text-[var(--ink)] mb-1">
              {lang === 'en'
                ? `${crossTypeLabel} of ${crossBaseName} ${result.incarnationCross.variant}`
                : `${crossTypeLabel}之${crossBaseName}${result.incarnationCross.variant}`}
            </div>
            <div className="font-mono text-[12px] md:text-base text-[var(--ink-soft)] mt-1.5 tracking-[0.04em]">
              {lang === 'en' ? result.incarnationCross.crossType : crossTypeLabel} · {result.incarnationCross.gatesLabel}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--ink)] my-8" />

        {/* Variables */}
        <div className="border border-[var(--ink)] mb-6">
          <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] py-2.5 px-4 border-b border-[var(--ink)] bg-[var(--paper-deep)]">
            {t('chart.variablesCard')}
          </div>
          {[
            { category: t('chart.digestion'), val: varLabels.digestion },
            { category: t('chart.environment'), val: varLabels.environment },
            { category: t('chart.perspective'), val: varLabels.perspective },
            { category: t('chart.motivation'), val: varLabels.motivation },
          ].map(r => (
            <div
              className="grid grid-cols-1 sm:grid-cols-[180px_160px_1fr] gap-1 sm:gap-4 py-2.5 px-4 border-b border-dotted border-[rgba(43,31,20,0.2)] items-start last:border-b-0"
              key={r.category}
            >
              <div className="font-mono text-[12px] md:text-base tracking-[0.04em] text-[var(--ink-soft)] leading-[1.5]">{r.category}</div>
              <div className="font-sans text-[12px] md:text-base font-semibold text-[var(--ink)] whitespace-nowrap">{r.val.label}</div>
              <div className="font-sans text-[12px] md:text-base text-[var(--ink-soft)] leading-[1.55]">{r.val.description}</div>
            </div>
          ))}
        </div>

        <div className="border-t border-[var(--ink)] my-8" />

        {/* Centers */}
        <div className="mb-2 font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)]">{t('chart.centersTitle')}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
          {(Object.keys(CENTER_INFO) as CenterName[]).map(id => {
            const defined = result.definedCenterIds.has(id)
            return (
              <div
                key={id}
                className={`border border-[var(--ink)] py-2.5 px-3 flex items-center gap-2 cursor-pointer transition-colors duration-[120ms] hover:bg-[var(--paper-deep)] ${defined ? 'bg-[var(--paper-deep)]' : 'bg-[var(--paper)] opacity-55 hover:opacity-100'}`}
                onClick={() => handleSelectCenter(id, defined)}
              >
                <div className={`w-2.5 h-2.5 border-[1.5px] border-[var(--ink)] shrink-0${defined ? ' bg-[var(--ink)]' : ''}`} />
                <div>
                  <div className="font-sans text-[12px] md:text-base font-semibold text-[var(--ink)]">{centerName(id)}</div>
                  <div className="font-mono text-[12px] md:text-base text-[var(--ink-soft)] tracking-[0.05em]">{defined ? t('chart.defined') : t('chart.open')}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-[var(--ink)] my-8" />

        {/* Channels */}
        <div className="border border-[var(--ink)] p-4 mb-6">
          <div className="font-mono text-[12px] md:text-base tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-3 pb-2 border-b border-[var(--ink)]">
            {t('chart.channelsTitle')}（{result.definedChannels.length} / {CHANNEL_DEFS.length}）
          </div>
          {result.definedChannels.length === 0 ? (
            <div className="font-mono text-[12px] md:text-base text-[var(--ink-soft)]">{t('chart.noChannels')}</div>
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
                    {lang === 'en' ? CENTER_NAMES_EN[ch.centerA] : fmtCenterName(CENTER_INFO[ch.centerA].name)}—{lang === 'en' ? CENTER_NAMES_EN[ch.centerB] : fmtCenterName(CENTER_INFO[ch.centerB].name)}
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
            {isSignedIn ? (downloading ? t('chart.downloading') : t('chart.download')) : t('chart.downloadSignIn')}
          </button>
          <button
            onClick={isSignedIn ? handleCopyPrompt : () => openSignIn()}
            className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink) bg-transparent border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--ink) hover:text-(--paper)"
          >
            {isSignedIn ? (copied ? t('chart.copied') : t('chart.copyPrompt')) : t('chart.copyPromptSignIn')}
          </button>
          {!hideSaveButton && (
            <button
              onClick={isSignedIn ? handleSaveChart : () => openSignIn()}
              disabled={isSignedIn ? saving : false}
              className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink) bg-transparent border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--ink) hover:text-(--paper) disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignedIn ? (saving ? t('account.saving') : t('chart.saveChart')) : t('chart.saveChartSignIn')}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
