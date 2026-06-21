import { NextResponse } from 'next/server'
import { initSwissEphServer } from '@/lib/swissEphServer'
import { calculatePlanetGates, calculateCentersAndChannels } from '@/lib/humanDesign'

// Swiss Ephemeris body constants
const SUN = 0, MOON = 1, MERCURY = 2, VENUS = 3, MARS = 4
const JUPITER = 5, SATURN = 6, URANUS = 7, NEPTUNE = 8, PLUTO = 9, TRUE_NODE = 11

export async function GET() {
  try {
    const swe = await initSwissEphServer()
    const now = new Date()
    const jd  = swe.dateToJulianDay(now)
    const lon = (body: number) => swe.calculatePosition(jd, body).longitude

    const sunLon = lon(SUN)
    const nnLon  = lon(TRUE_NODE)

    const planetLons: [string, number][] = [
      ['太陽',   sunLon],
      ['地球',   (sunLon + 180) % 360],
      ['月亮',   lon(MOON)],
      ['北交點', nnLon],
      ['南交點', (nnLon + 180) % 360],
      ['水星',   lon(MERCURY)],
      ['金星',   lon(VENUS)],
      ['火星',   lon(MARS)],
      ['木星',   lon(JUPITER)],
      ['土星',   lon(SATURN)],
      ['天王星', lon(URANUS)],
      ['海王星', lon(NEPTUNE)],
      ['冥王星', lon(PLUTO)],
    ]

    const planets = planetLons.map(([name, pLon]) => {
      const r = calculatePlanetGates(pLon, pLon, name)
      return { planetName: name, gate: r.black.gate, line: r.black.line }
    })

    const allGates = [...new Set<number>(planets.map(p => p.gate))]
    const { definedCenterIds, definedChannels } = calculateCentersAndChannels(new Set(allGates))

    return NextResponse.json({
      planets,
      allGates,
      definedCenterIds: [...definedCenterIds],
      definedChannels,
      computedAt: now.toISOString(),
    })
  } catch (err) {
    console.error('[GET /api/transit]', err)
    return NextResponse.json({ error: '計算失敗' }, { status: 500 })
  }
}
