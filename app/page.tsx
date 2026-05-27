'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { DatePicker, TimePicker, ConfigProvider } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { initSwissEph, Planet, LunarPoint } from '@/lib/swissEph'
import {
  calculatePlanetGates,
  calculateProfile,
  calculateCentersAndChannels,
  calculateType,
  calculateAuthority,
  calculateIncarnationCross,
  calculateVariables,
  calculateDefinition,
  toActivations,
  PLANET_SYMBOLS,
  type CenterName,
  type PlanetRow,
} from '@/lib/humanDesign'
import { toUtcDate, getDesignJd } from '@/utils/ephemeris'
import { fmtGate, fmtCenterName } from '@/utils/format'
import Navbar from '@/components/Navbar'
import BodyGraph, { type SelectionPayload } from '@/components/humanDesign/BodyGraph'
import DetailDrawer from '@/components/humanDesign/DetailDrawer'
import { HD_GATES } from '@/components/humanDesign/hd-chart-data'
import LocationPicker, { getOffsetFromTimezone } from '@/components/humanDesign/LocationPicker'
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

export default function HomePage() {
  const [birthDate, setBirthDate] = useState<Dayjs>(() => dayjs('1996-12-14'))
  const [birthTime, setBirthTime] = useState<Dayjs>(() => dayjs('1996-12-14 19:00'))

  const date = birthDate.format('YYYY-MM-DD')
  const time = birthTime.format('HH:mm')
  const [timezone, setTimezone] = useState('Asia/Taipei')
  const [locationLabel, setLocationLabel] = useState('台北, 台灣')
  const [result, setResult] = useState<HdResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const sweRef = useRef<Awaited<ReturnType<typeof initSwissEph>> | null>(null)

  const printAreaRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = useCallback(async () => {
    const el = printAreaRef.current
    if (!el) return
    setDownloading(true)
    try {
      await downloadChart(el)
    } finally {
      setDownloading(false)
    }
  }, [])

  const handleCopyPrompt = useCallback(() => {
    if (!result) return
    navigator.clipboard.writeText(buildAiPrompt(result)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [result])

  const [selection, setSelection] = useState<SelectionPayload | null>(null)
  const [showGates] = useState(true)
  const [showAnnotations] = useState(true)
  const [showFace] = useState(true)
  const [showSilhouette] = useState(true)

  const activations = useMemo(() =>
    result ? toActivations(result.planets) : {},
    [result],
  )

  const calculate = async () => {
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const year = new Date(date).getUTCFullYear()
      if (year < 1900 || year > 2040) {
        throw new Error(`出生年份 ${year} 超出支援範圍（1900–2040）`)
      }
      if (!sweRef.current) sweRef.current = await initSwissEph()
      const swe = sweRef.current
      const offset = getOffsetFromTimezone(timezone, new Date(`${date}T${time}:00`))
      const birthUtc = toUtcDate(date, time, offset)
      const jd = swe.dateToJulianDay(birthUtc)
      const designJd = getDesignJd(swe, jd)
      const designUtc = new Date((designJd - 2440587.5) * 86400 * 1000)

      const lon = (body: Parameters<typeof swe.calculatePosition>[1], jdVal: number) =>
        swe.calculatePosition(jdVal, body).longitude

      const sunP = lon(Planet.Sun, jd)
      const sunD = lon(Planet.Sun, designJd)
      const nnP = lon(LunarPoint.TrueNode, jd)
      const nnD = lon(LunarPoint.TrueNode, designJd)

      const rows: [string, number, number][] = [
        ['太陽',   sunP,                         sunD],
        ['地球',   (sunP + 180) % 360,           (sunD + 180) % 360],
        ['月亮',   lon(Planet.Moon,    jd),      lon(Planet.Moon,    designJd)],
        ['北交點', nnP,                           nnD],
        ['南交點', (nnP + 180) % 360,            (nnD + 180) % 360],
        ['水星',   lon(Planet.Mercury, jd),      lon(Planet.Mercury, designJd)],
        ['金星',   lon(Planet.Venus,   jd),      lon(Planet.Venus,   designJd)],
        ['火星',   lon(Planet.Mars,    jd),      lon(Planet.Mars,    designJd)],
        ['木星',   lon(Planet.Jupiter, jd),      lon(Planet.Jupiter, designJd)],
        ['土星',   lon(Planet.Saturn,  jd),      lon(Planet.Saturn,  designJd)],
        ['天王星', lon(Planet.Uranus,  jd),      lon(Planet.Uranus,  designJd)],
        ['海王星', lon(Planet.Neptune, jd),      lon(Planet.Neptune, designJd)],
        ['冥王星', lon(Planet.Pluto,   jd),      lon(Planet.Pluto,   designJd)],
      ]

      const planets: PlanetRow[] = rows.map(([name, pLon, dLon]) => ({
        ...calculatePlanetGates(pLon, dLon, name),
        persLon: pLon,
        desLon: dLon,
      }))

      const profile = calculateProfile(sunP, sunD)
      const allGates = new Set<number>()
      for (const p of planets) { allGates.add(p.black.gate); allGates.add(p.red.gate) }
      const { definedCenterIds, definedChannels } = calculateCentersAndChannels(allGates)
      const type = calculateType(definedCenterIds, definedChannels)
      const authority = calculateAuthority(definedCenterIds, type)
      const incarnationCross = calculateIncarnationCross(
        planets[0].black, planets[1].black, planets[0].red, planets[1].red,
      )
      const variables = calculateVariables(
        planets[0].black, planets[0].red, planets[3].black, planets[3].red,
      )
      const definition = calculateDefinition(definedCenterIds, definedChannels)

      setResult({
        jd, designJd,
        utcTime: birthUtc.toISOString(),
        designUtcTime: designUtc.toISOString(),
        planets, profile, type, authority, definedCenterIds, definedChannels,
        allGates, incarnationCross, variables, definition,
      })
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = useCallback((sel: SelectionPayload) => setSelection(sel), [])
  const handleClose = useCallback(() => setSelection(null), [])
  const handleJumpToGate = useCallback((num: number) => {
    const g = HD_GATES[num]
    if (!g) return
    setSelection({ kind: 'gate', data: { ...g, number: num }, id: `gate-${num}` })
  }, [])

  return (
    <>
      <Navbar />
      <div ref={printAreaRef} className="max-w-[1440px] mx-auto px-14 pb-20 pt-[72px] relative">

        {/* Masthead */}
        <header className="flex justify-center mb-6 gap-6">
          <h1 className="font-serif font-medium italic text-[clamp(36px,4vw,56px)] leading-[0.95] tracking-[-0.01em] text-center m-0">
            Human Design
          </h1>
        </header>

        {/* Main layout */}
        <div className="flex flex-col gap-5">

          {/* Input row — full width horizontal */}
          <div className="hd-print-hide py-3.5 px-5 border border-[var(--ink)] bg-[var(--paper-deep)] flex items-end gap-5 flex-wrap max-[640px]:flex-col max-[640px]:items-stretch">
            <h4 className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)] m-0 p-0 border-none whitespace-nowrap self-end pb-1.5">
              輸入出生資料
            </h4>
            <div className="flex gap-2 flex-wrap items-end flex-1">
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: '#2b1f14',
                    colorBgContainer: '#efe5d0',
                    colorText: '#2b1f14',
                    colorBorder: '#2b1f14',
                    colorBgElevated: '#efe5d0',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12.5,
                    controlHeight: 28,
                  },
                }}
              >
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[var(--ink-soft)]">生日</label>
                  <DatePicker
                    value={birthDate}
                    onChange={(d) => { if (d) setBirthDate(d) }}
                    format="YYYY/MM/DD"
                    minDate={dayjs('1900-01-01')}
                    maxDate={dayjs('2040-12-31')}
                    allowClear={false}
                    style={{ width: 130 }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[var(--ink-soft)]">時間</label>
                  <TimePicker
                    value={birthTime}
                    onChange={(t) => { if (t) setBirthTime(t) }}
                    format="HH:mm"
                    minuteStep={5}
                    allowClear={false}
                    style={{ width: 90 }}
                  />
                </div>
              </ConfigProvider>
              <LocationPicker
                value={locationLabel}
                onSelect={(tz, label) => {
                  setTimezone(tz)
                  setLocationLabel(label)
                }}
              />
              <button
                className="font-mono text-[11.5px] tracking-[0.12em] uppercase text-[var(--paper)] bg-[var(--ink)] border border-[var(--ink)] px-4 py-1.5 cursor-pointer whitespace-nowrap transition-colors duration-[120ms] hover:bg-[var(--crimson)] hover:border-[var(--crimson)] disabled:opacity-45 disabled:cursor-not-allowed"
                onClick={calculate}
                disabled={loading}
              >
                {loading ? '計算中…' : '生成人類圖'}
              </button>
              {error && (
                <div className="font-mono text-[11px] text-[var(--crimson)] mt-2 py-1.5 px-2 border border-[var(--crimson)] tracking-[0.02em]">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Chart row: Design | Chart | Personality */}
          <div className="hd-chart-row">

          {/* Design planets */}
          <aside className="hd-planets-side hd-planets-side--design">
            <div className="hd-planets-side-header">Design</div>
            <div className="hd-planet-rows">
              {result ? result.planets.map(p => (
                <div key={p.planetName} className="hd-planet-row hd-planet-row--left">
                  <span className="hd-planet-symbol">{PLANET_SYMBOLS[p.planetName] ?? p.planetName}</span>
                  <span className="hd-planet-gate">{p.red.full}</span>
                </div>
              )) : null}
            </div>
          </aside>

          {/* Centre — chart only (index strip moved outside grid) */}
          <main className="hd-col-mid">
            <div className="hd-chart-frame">
              <span className="hd-chart-corner tl" />
              <span className="hd-chart-corner tr" />
              <span className="hd-chart-corner bl" />
              <span className="hd-chart-corner br" />
              <BodyGraph
                onSelect={handleSelect}
                activeId={selection?.id}
                showGates={showGates}
                showAnnotations={showAnnotations}
                showFace={showFace}
                showSilhouette={showSilhouette}
                activations={activations}
                definedCenterIds={result?.definedCenterIds}
              />
            </div>
          </main>

          {/* Personality planets */}
          <aside className="hd-planets-side hd-planets-side--personality">
            <div className="hd-planets-side-header">Personality</div>
            <div className="hd-planet-rows">
              {result ? result.planets.map(p => (
                <div key={p.planetName} className="hd-planet-row hd-planet-row--right">
                  <span className="hd-planet-gate">{p.black.full}</span>
                  <span className="hd-planet-symbol">{PLANET_SYMBOLS[p.planetName] ?? p.planetName}</span>
                </div>
              )) : null}
            </div>
          </aside>

          </div>{/* end hd-chart-row */}

          {/* Gate index strip — outside grid so it doesn't affect planet column height */}
          <div className="hd-index-strip">
            <div>
              <h5>閘門索引</h5>
              <div className="mt-1 text-[9px] leading-[1.4] text-[var(--ink-soft)]">
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

          {/* Mobile-only planet list */}
          {result && (
            <div className="hd-planets-mobile">
              <div className="hd-planets-mobile-col hd-planets-mobile-design">
                <div className="hd-planets-mobile-header">Design</div>
                {result.planets.map(p => (
                  <div key={p.planetName} className="hd-planets-mobile-row">
                    <span>{PLANET_SYMBOLS[p.planetName]}</span>
                    <span>{p.red.full}</span>
                  </div>
                ))}
              </div>
              <div className="hd-planets-mobile-col hd-planets-mobile-personality">
                <div className="hd-planets-mobile-header">Personality</div>
                {result.planets.map(p => (
                  <div key={p.planetName} className="hd-planets-mobile-row">
                    <span>{p.black.full}</span>
                    <span>{PLANET_SYMBOLS[p.planetName]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>{/* end flex col */}

        {/* Footer */}
        <footer className="hd-print-hide mt-[60px] border-t border-[var(--ink)] pt-3.5 flex justify-between font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--ink-soft)]">
          <span>FIELD STUDY · BODYGRAPH</span>
          <span>PRESS · ESC · TO · CLOSE</span>
          <span>FIN.</span>
        </footer>

        <DetailDrawer
          selection={selection}
          onClose={handleClose}
          onJumpToGate={handleJumpToGate}
        />

        {/* ── Full calculation results ── */}
        {result && (
          <section className="mt-14 border-t border-[var(--ink)] pt-10">
            <div className="flex items-baseline gap-5 mb-8">
              <h2 className="font-serif italic font-medium text-[clamp(28px,3vw,42px)] leading-none m-0 text-[var(--ink)]">計算結果</h2>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--ink-soft)]">Bodygraph Analysis</span>
            </div>

            {/* Overview cards row */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 mb-6">
              {/* Type */}
              <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)]">
                <div className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">類型 · Type</div>
                <div className="font-serif italic font-medium text-[26px] leading-[1.1] text-[var(--ink)] mb-1">{result.type}</div>
                <div className="font-sans text-[13px] text-[var(--ink-soft)] leading-[1.5]">{TYPE_LABELS[result.type]}</div>
                <div className="font-mono text-[11px] text-[var(--ink-soft)] mt-1.5 tracking-[0.04em]">策略 · {STRATEGY_MAP[result.type] ?? '—'}</div>
                <div className="font-mono text-[11px] text-[var(--ink-soft)] mt-1.5 tracking-[0.04em]">
                  正向 {SIGNATURE_MAP[result.type]?.positive ?? '—'} ／
                  負向 {SIGNATURE_MAP[result.type]?.negative ?? '—'}
                </div>
              </div>

              {/* Profile */}
              <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)]">
                <div className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">人生角色 · Profile</div>
                <div className="font-serif italic font-medium text-[40px] leading-[1.1] text-[var(--ink)] mb-1 tracking-[0.06em]">{result.profile.profile}</div>
                <div className="font-sans text-[13px] text-[var(--ink-soft)] leading-[1.5]">{PROFILE_LABELS[result.profile.profile] ?? '—'}</div>
              </div>

              {/* Authority */}
              <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)]">
                <div className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">決策權威 · Authority</div>
                <div className="font-serif italic font-medium text-[26px] leading-[1.1] text-[var(--ink)] mb-1">{result.authority.name}</div>
                <div className="font-sans text-[13px] text-[var(--ink-soft)] leading-[1.5]">{result.authority.tip}</div>
              </div>

              {/* Definition */}
              <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)]">
                <div className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">定義 · Definition</div>
                <div className="font-serif italic font-medium text-[26px] leading-[1.1] text-[var(--ink)] mb-1">{result.definition.label}</div>
                <div className="font-mono text-[11px] text-[var(--ink-soft)] mt-1 tracking-[0.04em]">{result.definition.raw}</div>
                <div className="font-sans text-[13px] text-[var(--ink-soft)] leading-[1.5] mt-1.5">
                  已定義 {result.definedCenterIds.size} / 9 中心 · 激活 {result.allGates.size} 閘門
                </div>
              </div>

              {/* Incarnation Cross */}
              <div className="border border-[var(--ink)] py-4 px-[18px] bg-[var(--paper)] col-span-2">
                <div className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-2">輪迴交叉 · Incarnation Cross</div>
                <div className="font-serif italic font-medium text-[22px] leading-[1.1] text-[var(--ink)] mb-1">
                  {(CROSS_TYPE_LABELS[result.incarnationCross.crossType] ?? result.incarnationCross.crossType)}之{result.incarnationCross.crossName}
                </div>
                <div className="font-mono text-[11px] text-[var(--ink-soft)] mt-1.5 tracking-[0.04em]">
                  {result.incarnationCross.crossType} · {result.incarnationCross.gatesLabel}
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--ink)] my-8" />

            {/* Variables */}
            <div className="border border-[var(--ink)] mb-6">
              <div className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[var(--ink-soft)] py-2.5 px-4 border-b border-[var(--ink)] bg-[var(--paper-deep)]">
                四箭頭 · Variables &amp; Life Design
              </div>
              {[
                { category: '飲食方式 · Digestion', val: result.variables.digestion },
                { category: '適合環境 · Environment', val: result.variables.environment },
                { category: '觀點 · Perspective', val: result.variables.perspective },
                { category: '思考動機 · Motivation', val: result.variables.motivation },
              ].map(r => (
                <div
                  className="grid grid-cols-[200px_140px_1fr] gap-4 py-2.5 px-4 border-b border-dotted border-[rgba(43,31,20,0.2)] items-start last:border-b-0 max-[600px]:grid-cols-1 max-[600px]:gap-1"
                  key={r.category}
                >
                  <div className="font-mono text-[11px] tracking-[0.04em] text-[var(--ink-soft)] leading-[1.5]">{r.category}</div>
                  <div className="font-sans text-[13px] font-semibold text-[var(--ink)]">{r.val.label}</div>
                  <div className="font-sans text-[13px] text-[var(--ink-soft)] leading-[1.55]">{r.val.description}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--ink)] my-8" />

            {/* Centers grid */}
            <div className="mb-2 font-mono text-[9px] tracking-[0.2em] uppercase text-[var(--ink-soft)]">
              九大能量中心 · Nine Centers
            </div>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {(Object.keys(CENTER_INFO) as CenterName[]).map(id => {
                const defined = result.definedCenterIds.has(id)
                return (
                  <div
                    key={id}
                    className={`border border-[var(--ink)] py-2.5 px-3 flex items-center gap-2 ${defined ? 'bg-[var(--paper-deep)]' : 'bg-[var(--paper)] opacity-55'}`}
                  >
                    <div className={`w-2.5 h-2.5 border-[1.5px] border-[var(--ink)] shrink-0${defined ? ' bg-[var(--ink)]' : ''}`} />
                    <div>
                      <div className="font-sans text-[12px] font-semibold text-[var(--ink)]">{CENTER_INFO[id].name}</div>
                      <div className="font-mono text-[10.5px] text-[var(--ink-soft)] tracking-[0.05em]">{defined ? 'DEFINED' : 'OPEN'}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-[var(--ink)] my-8" />

            {/* Channels */}
            <div className="border border-[var(--ink)] p-4 mb-6">
              <div className="font-mono text-[10.5px] tracking-[0.2em] uppercase text-[var(--ink-soft)] mb-3 pb-2 border-b border-[var(--ink)]">
                已定義通道 · Defined Channels（{result.definedChannels.length} / {CHANNEL_DEFS.length}）
              </div>
              {result.definedChannels.length === 0 ? (
                <div className="font-mono text-[12px] text-[var(--ink-soft)]">無已定義通道</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {result.definedChannels.map(ch => (
                    <span key={ch.id} className="font-mono text-[11px] tracking-[0.04em] border border-[var(--ink)] py-[3px] px-2 text-[var(--ink)] bg-[var(--paper-deep)]">
                      {ch.id}
                      <span className="text-[var(--ink-soft)] ml-1.5 text-[11px]">
                        {fmtCenterName(CENTER_INFO[ch.centerA].name)}—{fmtCenterName(CENTER_INFO[ch.centerB].name)}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="hd-print-hide flex gap-3 mt-10 flex-wrap">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="font-mono text-[11.5px] tracking-[0.12em] uppercase text-(--paper) bg-(--ink) border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--crimson) hover:border-(--crimson) disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? '生成中…' : '↓ 下載我的人類圖'}
              </button>
              <button
                onClick={handleCopyPrompt}
                className="font-mono text-[11.5px] tracking-[0.12em] uppercase text-(--ink) bg-transparent border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--ink) hover:text-(--paper)"
              >
                {copied ? '✓ 已複製！' : '⎘ 複製 Prompt 給 AI'}
              </button>
            </div>

          </section>
        )}
      </div>
    </>
  )
}
