/**
 * Server-side HD compute — uses initSwissEphServer (讀 WASM 檔案) 取代
 * browser 版 initSwissEph (dynamic import + fetch)，避免 dev server ESM 衝突。
 */
import { initSwissEphServer } from '@/lib/swissEphServer'
import {
  calculatePlanetGates,
  calculateProfile,
  calculateCentersAndChannels,
  calculateType,
  calculateAuthority,
  calculateIncarnationCross,
  calculateVariables,
  calculateDefinition,
  type PlanetRow,
} from '@/lib/humanDesign'
import { toUtcDate, getDesignJd, getOffsetFromTimezone } from '@/utils/ephemeris'
import type { HdResult } from '@/lib/buildAiPrompt'

// Swiss Ephemeris body numbers (from @swisseph/core)
const SUN = 0
const MOON = 1
const MERCURY = 2
const VENUS = 3
const MARS = 4
const JUPITER = 5
const SATURN = 6
const URANUS = 7
const NEPTUNE = 8
const PLUTO = 9
const TRUE_NODE = 11

export const computeHdResultServer = async (
  date: string,
  time: string,
  timezone: string,
): Promise<HdResult> => {
  const year = new Date(date).getUTCFullYear()
  if (year < 1900 || year > 2040) {
    throw new Error(`出生年份 ${year} 超出支援範圍（1900–2040）`)
  }

  const swe = await initSwissEphServer()

  const offset = getOffsetFromTimezone(timezone, new Date(`${date}T${time}:00`))
  const birthUtc = toUtcDate(date, time, offset)
  const jd = swe.dateToJulianDay(birthUtc)
  const designJd = getDesignJd(swe, jd)
  const designUtc = new Date((designJd - 2440587.5) * 86400 * 1000)

  const lon = (body: number, jdVal: number) =>
    swe.calculatePosition(jdVal, body).longitude

  const sunP = lon(SUN, jd)
  const sunD = lon(SUN, designJd)
  const nnP = lon(TRUE_NODE, jd)
  const nnD = lon(TRUE_NODE, designJd)

  const rows: [string, number, number][] = [
    ['太陽',   sunP,                       sunD],
    ['地球',   (sunP + 180) % 360,         (sunD + 180) % 360],
    ['月亮',   lon(MOON,    jd),           lon(MOON,    designJd)],
    ['北交點', nnP,                         nnD],
    ['南交點', (nnP + 180) % 360,          (nnD + 180) % 360],
    ['水星',   lon(MERCURY, jd),           lon(MERCURY, designJd)],
    ['金星',   lon(VENUS,   jd),           lon(VENUS,   designJd)],
    ['火星',   lon(MARS,    jd),           lon(MARS,    designJd)],
    ['木星',   lon(JUPITER, jd),           lon(JUPITER, designJd)],
    ['土星',   lon(SATURN,  jd),           lon(SATURN,  designJd)],
    ['天王星', lon(URANUS,  jd),           lon(URANUS,  designJd)],
    ['海王星', lon(NEPTUNE, jd),           lon(NEPTUNE, designJd)],
    ['冥王星', lon(PLUTO,   jd),           lon(PLUTO,   designJd)],
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

  return {
    jd, designJd,
    utcTime: birthUtc.toISOString(),
    designUtcTime: designUtc.toISOString(),
    planets, profile, type, authority, definedCenterIds, definedChannels,
    allGates, incarnationCross, variables, definition,
  }
}
