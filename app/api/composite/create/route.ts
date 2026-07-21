import { auth } from '@clerk/nextjs/server'
import { resolveDbUser } from '@/lib/dbUser'
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

    const { personA, personB, name, previewOnly } = body as { personA: BirthPayload; personB: BirthPayload; name?: string; previewOnly?: boolean }

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
      integrationTheme:            composite.integrationTheme,
      compositeDefinedCount:       composite.compositeDefinedCount,
      compositeOpenCount:          composite.compositeOpenCount,
      compositeDefinedCenterIds:   [...composite.compositeDefinedCenterIds],
      compositeDefinedChannelIds:  composite.compositeDefinedChannels.map(ch => ch.id),
      electromagnetic:             composite.electromagnetic,
      companionship:               composite.companionship,
      compromise:                  composite.compromise,
      dominance:                   composite.dominance,
      profileResonance:            composite.profileResonance,
    }

    const buildPersonMeta = (
      payload: BirthPayload,
      hd: Awaited<ReturnType<typeof computeHdResultServer>>,
    ) => ({
      name:             payload.name || null,
      birthDate:        payload.birthDate,
      birthTime:        payload.birthTime,
      birthCity:        payload.birthCity,
      timezone:         payload.timezone,
      type:             hd.type,
      profile:          hd.profile.profile,
      authority:        hd.authority.name,
      authorityTip:     hd.authority.tip,
      allGates:         [...hd.allGates],
      personalityGates: [...new Set(hd.planets.map(p => p.black.gate))],
      designGates:      [...new Set(hd.planets.map(p => p.red.gate))],
      planets:          hd.planets.map(p => ({
        name:      p.planetName,
        blackGate: p.black.gate,
        blackLine: p.black.line,
        redGate:   p.red.gate,
        redLine:   p.red.line,
      })),
    })

    const meta = {
      personA: buildPersonMeta(personA, hdA),
      personB: buildPersonMeta(personB, hdB),
    }

    // 未登入或 previewOnly：只回傳分析結果，不存 DB
    if (!userId || previewOnly) {
      return NextResponse.json({
        chartId: null,
        ...compositeResult,
        personA: meta.personA,
        personB: meta.personB,
      })
    }

    const user = await resolveDbUser(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const chart = await prisma.chart.create({
      data: {
        userId:    user.id,
        name:      chartName,
        birthDate: personA.birthDate,
        birthTime: personA.birthTime,
        birthCity: personA.birthCity,
        timezone:  personA.timezone,
        type:      '合圖',
        authority: '合圖',
        profile:   composite.profileResonance.length > 0
                     ? composite.profileResonance.join('/')
                     : '—',
        definition: composite.integrationTheme,
        centers:   [...composite.compositeDefinedCenterIds],
        channels:  composite.compositeDefinedChannels.map(ch => ch.id),
        gates:     [...new Set([...hdA.allGates, ...hdB.allGates])],
        personalityGates: [...hdA.allGates],
        designGates:      [...hdB.allGates],
        chartKind: 'composite',
        meta: JSON.parse(JSON.stringify({
          ...meta,
          compositeResult,
        })),
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
