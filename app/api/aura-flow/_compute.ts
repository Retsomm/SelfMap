import { prisma } from '@/lib/db'
import { initSwissEphServer } from '@/lib/swissEphServer'
import { calculatePlanetGates, calculateCentersAndChannels } from '@/lib/humanDesign'
import type { Activations, CenterName } from '@/lib/humanDesign/types'

const SUN = 0, MOON = 1, MERCURY = 2, VENUS = 3, MARS = 4
const JUPITER = 5, SATURN = 6, URANUS = 7, NEPTUNE = 8, PLUTO = 9, TRUE_NODE = 11

export class AuraFlowError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'AuraFlowError'
  }
}

export interface AuraFlowPayload {
  activations: Activations
  definedCenterIds: Set<CenterName>
  now: Date
  chartName: string
}

/** Resolves chart ownership, runs Swiss Ephemeris, and returns merged gate data. */
export async function computeAuraFlow(userId: string, chartId: string): Promise<AuraFlowPayload> {
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) throw new AuraFlowError('User not found', 404)

  const chart = await prisma.chart.findFirst({ where: { id: chartId, userId: user.id } })
  if (!chart) throw new AuraFlowError('圖表不存在或無權存取', 404)

  const personalGates = new Set<number>(chart.gates as number[])

  const swe = await initSwissEphServer()
  const now = new Date()
  const jd = swe.dateToJulianDay(now)
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

  const transitGates = new Set<number>(
    planetLons.map(([name, pLon]) => calculatePlanetGates(pLon, pLon, name).black.gate)
  )

  const activations: Activations = {}
  for (const g of personalGates) activations[g] = { c: true, u: false }
  for (const g of transitGates) activations[g] = { c: activations[g]?.c ?? false, u: true }

  const allGates = new Set<number>([...personalGates, ...transitGates])
  const { definedCenterIds } = calculateCentersAndChannels(allGates)

  return { activations, definedCenterIds, now, chartName: chart.name ?? '我的圖' }
}
