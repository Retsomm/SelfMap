/**
 * POST /api/transit/create
 * 一次計算：個人人類圖 + 今日流日行星 + 合成分析
 * 若有登入則存一筆 chartKind='transit' 的圖表，meta 裡含流日快照
 */
import { auth } from '@clerk/nextjs/server'
import { getOrCreateDbUser } from '@/lib/dbUser'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeHdResultServer } from '@/lib/computeHdResultServer'
import { initSwissEphServer } from '@/lib/swissEphServer'
import { calculatePlanetGates, calculateCentersAndChannels, CHANNEL_DEFS } from '@/lib/humanDesign'
import type { CenterName } from '@/lib/humanDesign/types'
import { computeImpact } from '@/lib/transitImpact'

const SUN = 0, MOON = 1, MERCURY = 2, VENUS = 3, MARS = 4
const JUPITER = 5, SATURN = 6, URANUS = 7, NEPTUNE = 8, PLUTO = 9, TRUE_NODE = 11

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    const { birthDate, birthTime, birthCity, timezone, name } = await req.json()
    if (!birthDate || !birthTime || !birthCity || !timezone)
      return NextResponse.json({ error: '請填寫完整出生資料' }, { status: 400 })

    let hd, swe
    try {
      ;[hd, swe] = await Promise.all([
        computeHdResultServer(birthDate, birthTime, timezone),
        initSwissEphServer(),
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      return NextResponse.json({ error: msg || '出生資料計算失敗' }, { status: 400 })
    }

    const now = new Date()
    const jd  = swe.dateToJulianDay(now)
    const lon = (b: number) => swe.calculatePosition(jd, b).longitude
    const sunL = lon(SUN)
    const nnL  = lon(TRUE_NODE)

    const transitPlanetLons: [string, number][] = [
      ['太陽',   sunL],
      ['地球',   (sunL + 180) % 360],
      ['月亮',   lon(MOON)],
      ['北交點', nnL],
      ['南交點', (nnL + 180) % 360],
      ['水星',   lon(MERCURY)],
      ['金星',   lon(VENUS)],
      ['火星',   lon(MARS)],
      ['木星',   lon(JUPITER)],
      ['土星',   lon(SATURN)],
      ['天王星', lon(URANUS)],
      ['海王星', lon(NEPTUNE)],
      ['冥王星', lon(PLUTO)],
    ]

    const transitPlanets = transitPlanetLons.map(([pName, pLon]) => {
      const r = calculatePlanetGates(pLon, pLon, pName)
      return { planetName: pName, gate: r.black.gate, line: r.black.line }
    })

    const transitGateSet = new Set<number>(transitPlanets.map(p => p.gate))
    const { definedCenterIds: transitCenterIds, definedChannels: transitChannels } =
      calculateCentersAndChannels(transitGateSet)

    const personalGates     = hd.allGates
    const personalCenterIds = hd.definedCenterIds
    const personalChannelSet = new Set(hd.definedChannels.map(ch => ch.id))
    const personalChannels  = CHANNEL_DEFS.filter(ch => personalChannelSet.has(ch.id))

    const combinedGates = new Set([...personalGates, ...transitGateSet])
    const {
      definedCenterIds: combinedCenterIds,
      definedChannels:  combinedChannels,
    } = calculateCentersAndChannels(combinedGates)

    const impactLayers = computeImpact(
      personalGates, personalCenterIds as Set<CenterName>, personalChannels,
      transitGateSet, transitCenterIds as Set<CenterName>, transitChannels,
      combinedCenterIds as Set<CenterName>,
    )

    const result = {
      type:      hd.type,
      profile:   hd.profile.profile,
      authority: hd.authority.name,
      personalGates:    [...personalGates],
      personalityGates: hd.planets.map(p => p.black.gate),
      designGates:      hd.planets.map(p => p.red.gate),
      personalPlanets:  hd.planets.map(p => ({
        planetName: p.planetName,
        personality: { gate: p.black.gate, line: p.black.line },
        design:      { gate: p.red.gate,   line: p.red.line },
      })),
      personalDefinedCenterIds:  [...personalCenterIds],
      personalDefinedChannelIds: hd.definedChannels.map(ch => ch.id),
      transit: {
        computedAt:      now.toISOString(),
        planets:         transitPlanets,
        allGates:        [...transitGateSet],
        definedCenterIds:[...transitCenterIds],
        definedChannels: [...transitChannels].map(ch => ({ id: ch.id })),
      },
      combined: {
        definedCenterIds:  [...combinedCenterIds],
        definedChannelIds: combinedChannels.map(ch => ch.id),
      },
      impact: { layers: impactLayers },
    }

    // 未登入：只回傳計算結果，不存 DB
    if (!userId) {
      return NextResponse.json({ chartId: null, ...result })
    }

    const user = await getOrCreateDbUser(userId)

    const planetsData = hd.planets.map(p => ({
      name: p.planetName,
      blackGate: p.black.gate, blackLine: p.black.line,
      redGate:   p.red.gate,   redLine:   p.red.line,
    }))

    const meta = {
      transitSnapshot: {
        computedAt:      now.toISOString(),
        planets:         transitPlanets,
        allGates:        [...transitGateSet],
        definedCenterIds:[...transitCenterIds],
        definedChannels: [...transitChannels].map(ch => ({ id: ch.id })),
        combinedDefinedCenterIds: [...combinedCenterIds],
        combinedDefinedChannelIds: combinedChannels.map(ch => ch.id),
      },
    }

    const chart = await prisma.chart.create({
      data: {
        userId:    user.id,
        name:      name?.trim() || null,
        birthDate,
        birthTime,
        birthCity,
        timezone,
        type:      hd.type,
        authority: hd.authority.name,
        profile:   hd.profile.profile,
        definition:hd.definition.label,
        centers:   [...hd.definedCenterIds],
        channels:  hd.definedChannels.map(ch => ch.id),
        gates:     [...hd.allGates],
        planets:   planetsData,
        personalityGates: hd.planets.map(p => p.black.gate),
        designGates:      hd.planets.map(p => p.red.gate),
        chartKind: 'transit',
        meta,
      },
    })

    return NextResponse.json({ chartId: chart.id, ...result })
  } catch (err) {
    console.error('[POST /api/transit/create]', err)
    return NextResponse.json({ error: '計算失敗' }, { status: 500 })
  }
}
