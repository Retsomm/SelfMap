import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeHdResultServer } from '@/lib/computeHdResultServer'
import { analyzeComposite } from '@/lib/compositeAnalysis'
import { CHANNEL_DEFS } from '@/lib/humanDesign'
import type { HdResult } from '@/lib/buildAiPrompt'

type BirthPayload = {
  name?: string
  birthDate: string
  birthTime: string
  birthCity: string
  timezone: string
}

function hdToCompositeInput(r: HdResult) {
  const channelIdSet = new Set(r.definedChannels.map(ch => ch.id))
  return {
    allGates: r.allGates,
    profile: r.profile,
    definedCenterIds: r.definedCenterIds,
    definedChannels: CHANNEL_DEFS.filter(ch => channelIdSet.has(ch.id)),
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    const body = await req.json()

    const isValidBirth = (p: unknown): p is BirthPayload =>
      !!p && typeof p === 'object' &&
      typeof (p as BirthPayload).birthDate === 'string' && !!(p as BirthPayload).birthDate &&
      typeof (p as BirthPayload).birthTime === 'string' && !!(p as BirthPayload).birthTime &&
      typeof (p as BirthPayload).birthCity === 'string' && !!(p as BirthPayload).birthCity &&
      typeof (p as BirthPayload).timezone  === 'string' && !!(p as BirthPayload).timezone

    if (!isValidBirth(body?.personA))
      return NextResponse.json({ error: '請填寫人物 A 的完整出生資料（欄位需為字串）' }, { status: 400 })
    if (!isValidBirth(body?.personB))
      return NextResponse.json({ error: '請填寫人物 B 的完整出生資料（欄位需為字串）' }, { status: 400 })

    const { personA, personB, name } = body as { personA: BirthPayload; personB: BirthPayload; name?: string }

    let hdA, hdB
    try {
      ;[hdA, hdB] = await Promise.all([
        computeHdResultServer(personA.birthDate, personA.birthTime, personA.timezone),
        computeHdResultServer(personB.birthDate, personB.birthTime, personB.timezone),
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      return NextResponse.json({ error: msg || '出生資料計算失敗' }, { status: 400 })
    }

    const composite = analyzeComposite(
      hdToCompositeInput(hdA) as HdResult,
      hdToCompositeInput(hdB) as HdResult,
    )

    const chartName = name?.trim() || (
      (personA.name || personB.name)
        ? [personA.name, personB.name].filter(Boolean).join(' & ')
        : null
    )

    const compositeResult = {
      integrationTheme:          composite.integrationTheme,
      compositeDefinedCount:     composite.compositeDefinedCount,
      compositeOpenCount:        composite.compositeOpenCount,
      compositeDefinedCenterIds: [...composite.compositeDefinedCenterIds],
      electromagnetic:           composite.electromagnetic,
      companionship:             composite.companionship,
      compromise:                composite.compromise,
      dominance:                 composite.dominance,
      profileResonance:          composite.profileResonance,
    }

    const meta = {
      personA: {
        name:      personA.name   || null,
        birthDate: personA.birthDate,
        birthTime: personA.birthTime,
        birthCity: personA.birthCity,
        timezone:  personA.timezone,
        type:      hdA.type,
        profile:   hdA.profile.profile,
      },
      personB: {
        name:      personB.name   || null,
        birthDate: personB.birthDate,
        birthTime: personB.birthTime,
        birthCity: personB.birthCity,
        timezone:  personB.timezone,
        type:      hdB.type,
        profile:   hdB.profile.profile,
      },
    }

    // 未登入：只回傳分析結果，不存 DB
    if (!userId) {
      return NextResponse.json({
        chartId: null,
        ...compositeResult,
        personA: meta.personA,
        personB: meta.personB,
      })
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const planetsA = hdA.planets.map(p => ({
      name: p.planetName,
      blackGate: p.black.gate, blackLine: p.black.line,
      redGate: p.red.gate,    redLine: p.red.line,
    }))

    const chart = await prisma.chart.create({
      data: {
        userId:    user.id,
        name:      chartName,
        birthDate: personA.birthDate,
        birthTime: personA.birthTime,
        birthCity: personA.birthCity,
        timezone:  personA.timezone,
        type:      hdA.type,
        authority: hdA.authority.name,
        profile:   hdA.profile.profile,
        definition:hdA.definition.label,
        centers:   [...hdA.definedCenterIds],
        channels:  hdA.definedChannels.map(ch => ch.id),
        gates:     [...hdA.allGates],
        planets:   planetsA,
        personalityGates: hdA.planets.map(p => p.black.gate),
        designGates:      hdA.planets.map(p => p.red.gate),
        chartKind: 'composite',
        meta,
      },
    })

    return NextResponse.json({
      chartId: chart.id,
      ...compositeResult,
      personA: meta.personA,
      personB: meta.personB,
    })
  } catch (err) {
    console.error('[POST /api/composite/create]', err)
    return NextResponse.json({ error: '合圖計算失敗' }, { status: 500 })
  }
}
