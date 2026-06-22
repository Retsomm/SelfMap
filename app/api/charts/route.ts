import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeHdResultServer } from '@/lib/computeHdResultServer'
import { CROSS_TYPE_LABELS } from '@/lib/humanDesign/constants'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    const body = await req.json()
    const { birthDate, birthTime, birthCity, timezone, name, chartKind } = body
    let { type, authority, profile, definition, centers, channels, gates } = body

    if (!birthDate || !birthTime || !birthCity) {
      return NextResponse.json({ error: '請填寫所有必填欄位' }, { status: 400 })
    }

    const VALID_CHART_KINDS = ['personal', 'composite', 'transit']
    if (chartKind != null && !VALID_CHART_KINDS.includes(chartKind)) {
      return NextResponse.json({ error: 'chartKind 不合法' }, { status: 400 })
    }

    let planets: object[] | undefined
    let personalityGates: number[] | undefined
    let designGates: number[] | undefined
    let incarnationCross: object | undefined
    let variables: object | undefined
    let arrows: object | undefined

    if (!type || !authority || !profile || !definition) {
      if (!timezone) return NextResponse.json({ error: '請提供時區' }, { status: 400 })
      let result
      try {
        result = await computeHdResultServer(birthDate, birthTime, timezone)
      } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        return NextResponse.json({ error: msg || '出生資料計算失敗' }, { status: 400 })
      }
      type = result.type
      authority = result.authority.name
      profile = result.profile.profile
      definition = result.definition.label
      centers = [...result.definedCenterIds]
      channels = result.definedChannels.map((ch) => ch.id)
      gates = [...result.allGates]
      planets = result.planets.map((p) => ({
        name: p.planetName,
        blackGate: p.black.gate,
        blackLine: p.black.line,
        redGate: p.red.gate,
        redLine: p.red.line,
      }))
      personalityGates = result.planets.map((p) => p.black.gate)
      designGates = result.planets.map((p) => p.red.gate)
      incarnationCross = {
        crossType:      result.incarnationCross.crossType,
        crossTypeLabel: CROSS_TYPE_LABELS[result.incarnationCross.crossType] ?? result.incarnationCross.crossType,
        crossBaseName:  result.incarnationCross.crossBaseName,
        crossName:      result.incarnationCross.crossName,
        gatesLabel:     result.incarnationCross.gatesLabel,
        variant:        result.incarnationCross.variant,
      }
      variables = {
        digestion:   result.variables.digestion,
        environment: result.variables.environment,
        perspective: result.variables.perspective,
        motivation:  result.variables.motivation,
      }
      // 箭頭方向：tone 1–3 = 左（←），tone 4–6 = 右（→）
      arrows = {
        topLeft:     (result.planets[0]?.red.tone   ?? 1) <= 3,  // Design 太陽（身體/飲食）
        bottomLeft:  (result.planets[3]?.red.tone   ?? 1) <= 3,  // Design 北交點（環境）
        topRight:    (result.planets[0]?.black.tone ?? 1) <= 3,  // Personality 太陽（心智/動機）
        bottomRight: (result.planets[3]?.black.tone ?? 1) <= 3,  // Personality 北交點（觀點）
      }
    } else {
      // 使用方提供預計算結果時，仍從 body 取出 meta 欄位以便存入 DB
      incarnationCross = body.incarnationCross
      variables = body.variables
      arrows = body.arrows
    }

    // 未登入：只回傳計算結果，不存 DB
    if (!userId) {
      return NextResponse.json({
        chartId: null,
        type, authority, profile, definition,
        centers: centers ?? [],
        channels: channels ?? [],
        gates: gates ?? [],
        ...(planets ? { planets, personalityGates, designGates } : {}),
        ...(incarnationCross ? { incarnationCross } : {}),
        ...(variables ? { variables } : {}),
        ...(arrows ? { arrows } : {}),
      })
    }

    const clerkUser = await currentUser()
    const primaryAddr = clerkUser?.emailAddresses.find(
      e => e.id === clerkUser.primaryEmailAddressId && e.verification?.status === 'verified'
    )
    const email = primaryAddr?.emailAddress ?? `clerk_${userId}@placeholder.local`

    const updateData: { email?: string; name?: string | null } = {}
    if (!email.endsWith('@placeholder.local')) updateData.email = email
    if (clerkUser?.fullName != null) updateData.name = clerkUser.fullName

    let user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (user) {
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({ where: { clerkId: userId }, data: updateData })
      }
    } else {
      const byEmail = email.endsWith('@placeholder.local')
        ? null
        : await prisma.user.findUnique({ where: { email } })
      if (byEmail) {
        user = await prisma.user.update({
          where: { email },
          data: { clerkId: userId, ...updateData },
        })
      } else {
        user = await prisma.user.create({
          data: { clerkId: userId, email, name: clerkUser?.fullName ?? null },
        })
      }
    }

    const chart = await prisma.chart.create({
      data: {
        userId: user.id,
        name: name || null,
        birthDate,
        birthTime,
        birthCity,
        timezone: timezone ?? null,
        type,
        authority,
        profile,
        definition,
        centers: centers ?? [],
        channels: channels ?? [],
        gates: gates ?? [],
        chartKind: chartKind ?? 'personal',
        ...(planets ? { planets, personalityGates, designGates } : {}),
        ...((incarnationCross || variables || arrows) ? {
          meta: { incarnationCross, variables, arrows },
        } : {}),
      },
    })

    return NextResponse.json({ chartId: chart.id })
  } catch (err) {
    console.error('[POST /api/charts]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { charts: { orderBy: { createdAt: 'desc' } } },
    })

    const charts = user?.charts ?? []
    if (process.env.NODE_ENV === 'development') {
      console.log('[GET /api/charts] 回傳圖表數量:', charts.length)
      charts.forEach((c, i) => {
        const meta = c.meta as Record<string, unknown> | null
        console.log(`[GET /api/charts] [${i}] chartKind=${c.chartKind} meta存在=${!!meta} incarnationCross=${!!(meta?.incarnationCross)} variables=${!!(meta?.variables)} arrows=${!!(meta?.arrows)}`)
      })
    }
    return NextResponse.json({ charts })
  } catch (err) {
    console.error('[GET /api/charts]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
