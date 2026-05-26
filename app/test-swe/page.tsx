'use client'

import { useState, useRef } from 'react'
import { initSwissEph, Planet, LunarPoint } from '@/lib/swissEph'
import {
  calculatePlanetGates,
  calculateProfile,
  calculateCentersAndChannels,
  calculateType,
  calculateAuthority,
  type ProfileResult,
  type AuthorityInfo,
  type HumanDesignType,
  type CenterName,
  type ChannelDef,
} from '@/lib/humanDesign'
import { toUtcDate, getDesignJd } from '@/utils/ephemeris'
import BirthInputForm from '@/components/humanDesign/BirthInputForm'
import ProfileCard from '@/components/humanDesign/ProfileCard'
import TypeCard from '@/components/humanDesign/TypeCard'
import AuthorityCard from '@/components/humanDesign/AuthorityCard'
import CentersGrid from '@/components/humanDesign/CentersGrid'
import ChannelsList from '@/components/humanDesign/ChannelsList'
import PlanetsTable, { type PlanetRow } from '@/components/humanDesign/PlanetsTable'

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
}

export default function TestSwePage() {
  const [date, setDate] = useState('1996-12-14')
  const [time, setTime] = useState('19:00')
  const [offset, setOffset] = useState(8)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const sweRef = useRef<Awaited<ReturnType<typeof initSwissEph>> | null>(null)

  const calculate = async () => {
    setError('')
    setResult(null)
    setLoading(true)
    try {
      if (!sweRef.current) {
        sweRef.current = await initSwissEph()
      }
      const swe = sweRef.current
      const birthUtc = toUtcDate(date, time, offset)
      const jd       = swe.dateToJulianDay(birthUtc)
      const designJd = getDesignJd(swe, jd)
      const designUtc = new Date((designJd - 2440587.5) * 86400 * 1000)

      const lon = (body: Parameters<typeof swe.calculatePosition>[1], jdVal: number) =>
        swe.calculatePosition(jdVal, body).longitude

      const sunP = lon(Planet.Sun, jd)
      const sunD = lon(Planet.Sun, designJd)
      const nnP  = lon(LunarPoint.TrueNode, jd)
      const nnD  = lon(LunarPoint.TrueNode, designJd)

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
      for (const p of planets) {
        allGates.add(p.black.gate)
        allGates.add(p.red.gate)
      }
      const { definedCenterIds, definedChannels } = calculateCentersAndChannels(allGates)
      const type      = calculateType(definedCenterIds, definedChannels)
      const authority = calculateAuthority(definedCenterIds, type)

      setResult({ jd, designJd, utcTime: birthUtc.toISOString(), designUtcTime: designUtc.toISOString(), planets, profile, type, authority, definedCenterIds, definedChannels, allGates })
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8 font-mono">
      <h1 className="text-2xl font-bold mb-8">Swiss Ephemeris 測試頁</h1>

      <BirthInputForm
        date={date}
        time={time}
        offset={offset}
        loading={loading}
        onDateChange={setDate}
        onTimeChange={setTime}
        onOffsetChange={setOffset}
        onCalculate={calculate}
      />

      {error && <p className="text-red-400 mb-6">❌ {error}</p>}

      {result && (
        <section className="max-w-4xl overflow-x-auto">
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-400">
            <div>
              <p className="text-white font-semibold mb-1">Personality（意識）</p>
              <p>JD：{result.jd.toFixed(4)}</p>
              <p>UTC：{result.utcTime}</p>
            </div>
            <div>
              <p className="text-red-400 font-semibold mb-1">Design（潛意識）</p>
              <p>JD：{result.designJd.toFixed(4)}</p>
              <p>UTC：{result.designUtcTime}</p>
            </div>
          </div>

          <ProfileCard profile={result.profile} />
          <TypeCard type={result.type} />
          <AuthorityCard authority={result.authority} />
          <CentersGrid definedCenterIds={result.definedCenterIds} allGates={result.allGates} />
          <ChannelsList definedChannels={result.definedChannels} />
          <PlanetsTable planets={result.planets} />
        </section>
      )}
    </main>
  )
}
