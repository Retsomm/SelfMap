import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { initSwissEphServer } from '@/lib/swissEphServer'
import { calculatePlanetGates, calculateCentersAndChannels, CHANNEL_DEFS } from '@/lib/humanDesign'
import type { CenterName } from '@/lib/humanDesign/types'
import { computeImpact } from '@/lib/transitImpact'

const SUN = 0, MOON = 1, MERCURY = 2, VENUS = 3, MARS = 4
const JUPITER = 5, SATURN = 6, URANUS = 7, NEPTUNE = 8, PLUTO = 9, TRUE_NODE = 11

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { chartId } = await req.json()
    if (!chartId) return NextResponse.json({ error: '缺少 chartId' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const chart = await prisma.chart.findFirst({ where: { id: chartId, userId: user.id } })
    if (!chart) return NextResponse.json({ error: '圖表不存在' }, { status: 404 })

    const swe  = await initSwissEphServer()
    const now  = new Date()
    const jd   = swe.dateToJulianDay(now)
    const lon  = (b: number) => swe.calculatePosition(jd, b).longitude
    const sunL = lon(SUN)
    const nnL  = lon(TRUE_NODE)

    const transitGateNums = [
      sunL, (sunL + 180) % 360, lon(MOON), nnL, (nnL + 180) % 360,
      lon(MERCURY), lon(VENUS), lon(MARS),
      lon(JUPITER), lon(SATURN), lon(URANUS), lon(NEPTUNE), lon(PLUTO),
    ].map(pLon => calculatePlanetGates(pLon, pLon, '').black.gate)

    const transitGates = new Set<number>(transitGateNums)
    const { definedCenterIds: transitCenterIds, definedChannels: transitChannels } =
      calculateCentersAndChannels(transitGates)

    if (!Array.isArray(chart.gates) || !Array.isArray(chart.centers) || !Array.isArray(chart.channels))
      return NextResponse.json({ error: '圖表資料格式異常' }, { status: 500 })

    const personalGates     = new Set<number>(chart.gates as number[])
    const personalCenterIds = new Set<CenterName>(chart.centers as CenterName[])
    const channelIdSet      = new Set<string>(chart.channels as string[])
    const personalChannels  = CHANNEL_DEFS.filter(ch => channelIdSet.has(ch.id))

    const combinedGates = new Set([...personalGates, ...transitGates])
    const { definedCenterIds: combinedCenterIds } = calculateCentersAndChannels(combinedGates)

    const layers = computeImpact(
      personalGates, personalCenterIds, personalChannels,
      transitGates, transitCenterIds as Set<CenterName>, transitChannels,
      combinedCenterIds as Set<CenterName>,
    )

    return NextResponse.json({ layers, computedAt: now.toISOString() })
  } catch (err) {
    console.error('[POST /api/transit/impact]', err)
    return NextResponse.json({ error: '計算失敗' }, { status: 500 })
  }
}
