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
  type ProfileResult,
  type AuthorityInfo,
  type HumanDesignType,
  type CenterName,
  type ChannelDef,
  type IncarnationCross,
  type VariablesResult,
  type PlanetRow,
} from '@/lib/humanDesign'
import { toUtcDate, getDesignJd } from '@/utils/ephemeris'
import Navbar from '@/components/Navbar'
import BodyGraph, { type Activations, type SelectionPayload } from '@/components/humanDesign/BodyGraph'
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

const PLANET_SYMBOLS: Record<string, string> = {
  '太陽': '☉', '地球': '⊕', '月亮': '☽',
  '北交點': '☊', '南交點': '☋',
  '水星': '☿', '金星': '♀', '火星': '♂',
  '木星': '♃', '土星': '♄', '天王星': '♅',
  '海王星': '♆', '冥王星': '♇',
}

interface Result {
  jd: number
  designJd: number
  utcTime: string
  designUtcTime: string
  planets: PlanetRow[]
  profile: ProfileResult
  type: HumanDesignType
  authority: AuthorityInfo
  definedCenterIds: Set<CenterName>
  definedChannels: ChannelDef[]
  allGates: Set<number>
  incarnationCross: IncarnationCross
  variables: VariablesResult
  definition: { raw: string; label: string }
}

function toActivations(planets: PlanetRow[]): Activations {
  const out: Activations = {}
  for (const p of planets) {
    const cGate = p.black.gate
    const uGate = p.red.gate
    out[cGate] = { c: true, u: out[cGate]?.u ?? false }
    out[uGate] = { c: out[uGate]?.c ?? false, u: true }
  }
  return out
}

export default function HomePage() {
  const [birthDate, setBirthDate] = useState<Dayjs>(() => dayjs('1996-12-14'))
  const [birthTime, setBirthTime] = useState<Dayjs>(() => dayjs('1996-12-14 19:00'))

  const date = birthDate.format('YYYY-MM-DD')
  const time = birthTime.format('HH:mm')
  const [timezone, setTimezone] = useState('Asia/Taipei')
  const [locationLabel, setLocationLabel] = useState('台北, 台灣')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const sweRef = useRef<Awaited<ReturnType<typeof initSwissEph>> | null>(null)

  const [selection, setSelection] = useState<SelectionPayload | null>(null)
  const [showGates] = useState(true)
  const [showAnnotations] = useState(true)
  const [showFace] = useState(true)
  const [showSilhouette] = useState(true)

  const activations = useMemo(() =>
    result ? toActivations(result.planets) : {},
    [result],
  )

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }, [])

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
      <div className="hd-app" style={{ paddingTop: 72 }}>

        {/* Masthead */}
        <header className="hd-masthead">
          <div className="hd-mast-left">
            <span className="hd-mast-mark" />SPECIMEN №.001 / FOLIO XIV
            <br />THE BODYGRAPH — A FIELD STUDY
          </div>
          <h1 className="hd-mast-title">
            Human Design
          </h1>
          <div className="hd-mast-right">
            ISSUE 2026 · 春<br />
            DATE {today}
          </div>
        </header>

        {/* Main layout */}
        <div className="hd-work">

          {/* Input row — full width horizontal */}
          <div className="hd-input-section">
            <h4>輸入出生資料</h4>
            <div className="hd-input-row">
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
                <div className="hd-input-group">
                  <label className="hd-input-label">生日</label>
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
                <div className="hd-input-group">
                  <label className="hd-input-label">時間</label>
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
              <button className="hd-btn" onClick={calculate} disabled={loading}>
                {loading ? '計算中…' : '生成人類圖'}
              </button>
              {error && <div className="hd-error">{error}</div>}
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
              <div style={{ marginTop: 4, fontSize: 9, lineHeight: 1.4, color: '#6b5a44' }}>
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
                    {String(n).padStart(2, '0')}
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

        </div>{/* end hd-work */}

        {/* Footer */}
        <footer className="hd-foot">
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
          <section className="hd-results">
            <div className="hd-results-header">
              <h2 className="hd-results-title">計算結果</h2>
              <span className="hd-results-sub">Bodygraph Analysis</span>
            </div>

            {/* Overview cards row */}
            <div className="hd-cards-row">
              {/* Type */}
              <div className="hd-card">
                <div className="hd-card-label">類型 · Type</div>
                <div className="hd-card-value">{result.type}</div>
                <div className="hd-card-sub">{TYPE_LABELS[result.type]}</div>
                <div className="hd-card-meta">策略 · {STRATEGY_MAP[result.type] ?? '—'}</div>
                <div className="hd-card-meta">
                  正向 {SIGNATURE_MAP[result.type]?.positive ?? '—'} ／
                  負向 {SIGNATURE_MAP[result.type]?.negative ?? '—'}
                </div>
              </div>

              {/* Profile */}
              <div className="hd-card">
                <div className="hd-card-label">人生角色 · Profile</div>
                <div className="hd-card-value" style={{ fontSize: 40, letterSpacing: '0.06em' }}>{result.profile.profile}</div>
                <div className="hd-card-sub">{PROFILE_LABELS[result.profile.profile] ?? '—'}</div>
                <div className="hd-card-meta" style={{ color: '#d04830', marginTop: 8 }}>
                  意識太陽 {result.profile.personalitySun.full}
                </div>
                <div className="hd-card-meta">
                  潛意識太陽 {result.profile.designSun.full}
                </div>
              </div>

              {/* Authority */}
              <div className="hd-card">
                <div className="hd-card-label">決策權威 · Authority</div>
                <div className="hd-card-value">{result.authority.name}</div>
                <div className="hd-card-sub">{result.authority.tip}</div>
              </div>

              {/* Definition */}
              <div className="hd-card">
                <div className="hd-card-label">定義 · Definition</div>
                <div className="hd-card-value">{result.definition.label}</div>
                <div className="hd-card-meta" style={{ marginTop: 4 }}>{result.definition.raw}</div>
                <div className="hd-card-sub" style={{ marginTop: 6 }}>
                  已定義 {result.definedCenterIds.size} / 9 中心 · 激活 {result.allGates.size} 閘門
                </div>
              </div>

              {/* Incarnation Cross */}
              <div className="hd-card" style={{ gridColumn: 'span 2' }}>
                <div className="hd-card-label">輪迴交叉 · Incarnation Cross</div>
                <div className="hd-card-value" style={{ fontSize: 22 }}>
                  {(CROSS_TYPE_LABELS[result.incarnationCross.crossType] ?? result.incarnationCross.crossType)}之{result.incarnationCross.crossName}
                </div>
                <div className="hd-card-meta">{result.incarnationCross.crossType} · {result.incarnationCross.gatesLabel}</div>
                
              </div>
            </div>

            <hr className="hd-section-divider" />

            {/* Variables */}
            <div className="hd-variables">
              <div className="hd-variables-title">四箭頭 · Variables &amp; Life Design</div>
              {[
                { category: '飲食方式 · Digestion', val: result.variables.digestion },
                { category: '適合環境 · Environment', val: result.variables.environment },
                { category: '觀點 · Perspective', val: result.variables.perspective },
                { category: '思考動機 · Motivation', val: result.variables.motivation },
              ].map(r => (
                <div className="hd-var-row" key={r.category}>
                  <div className="hd-var-category">{r.category}</div>
                  <div className="hd-var-label">{r.val.label}</div>
                  <div className="hd-var-desc">{r.val.description}</div>
                </div>
              ))}
            </div>

            <hr className="hd-section-divider" />

            {/* Centers grid */}
            <div style={{ marginBottom: 8, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
              九大能量中心 · Nine Centers
            </div>
            <div className="hd-centers-grid">
              {(Object.keys(CENTER_INFO) as CenterName[]).map(id => {
                const defined = result.definedCenterIds.has(id)
                return (
                  <div key={id} className={`hd-center-cell ${defined ? 'defined' : 'undefined'}`}>
                    <div className={`hd-center-dot${defined ? ' filled' : ''}`} />
                    <div>
                      <div className="hd-center-cell-name">{CENTER_INFO[id].name}</div>
                      <div className="hd-center-cell-en">{defined ? 'DEFINED' : 'OPEN'}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <hr className="hd-section-divider" />

            {/* Channels */}
            <div className="hd-channels-block">
              <div className="hd-channels-block-title">
                已定義通道 · Defined Channels（{result.definedChannels.length} / {CHANNEL_DEFS.length}）
              </div>
              {result.definedChannels.length === 0 ? (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>無已定義通道</div>
              ) : (
                <div className="hd-channels-tags">
                  {result.definedChannels.map(ch => (
                    <span key={ch.id} className="hd-channel-tag">
                      {ch.id}
                      <span style={{ color: 'var(--ink-soft)', marginLeft: 6, fontSize: 11 }}>
                        {CENTER_INFO[ch.centerA].name.replace('中心', '')}—{CENTER_INFO[ch.centerB].name.replace('中心', '')}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

          </section>
        )}
      </div>
    </>
  )
}
