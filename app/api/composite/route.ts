import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeComposite } from '@/lib/compositeAnalysis'
import type { HdResult } from '@/lib/buildAiPrompt'
import { CHANNEL_DEFS } from '@/lib/humanDesign'
import type { CenterName } from '@/lib/humanDesign/types'

function toHdResult(chart: {
  gates: unknown; centers: unknown; channels: unknown; profile: string
}): Pick<HdResult, 'allGates' | 'profile' | 'definedCenterIds' | 'definedChannels'> {
  const allGates         = new Set<number>(chart.gates as number[])
  const definedCenterIds = new Set<CenterName>((chart.centers as string[]) as CenterName[])
  const channelIdSet     = new Set<string>(chart.channels as string[])
  const definedChannels  = CHANNEL_DEFS.filter(ch => channelIdSet.has(ch.id))
  return { allGates, profile: { profile: chart.profile } as any, definedCenterIds, definedChannels }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { chartAId, chartBId } = await req.json()
    if (!chartAId || !chartBId)
      return NextResponse.json({ error: '缺少 chartAId 或 chartBId' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const [chartA, chartB] = await Promise.all([
      prisma.chart.findFirst({ where: { id: chartAId, userId: user.id } }),
      prisma.chart.findFirst({ where: { id: chartBId, userId: user.id } }),
    ])
    if (!chartA || !chartB)
      return NextResponse.json({ error: '圖表不存在或無權存取' }, { status: 404 })

    const result = analyzeComposite(
      toHdResult(chartA) as HdResult,
      toHdResult(chartB) as HdResult,
    )

    return NextResponse.json({
      integrationTheme:          result.integrationTheme,
      compositeDefinedCount:     result.compositeDefinedCount,
      compositeOpenCount:        result.compositeOpenCount,
      compositeDefinedCenterIds: [...result.compositeDefinedCenterIds],
      electromagnetic:           result.electromagnetic,
      companionship:             result.companionship,
      compromise:                result.compromise,
      dominance:                 result.dominance,
      profileResonance:          result.profileResonance,
      chartA: { id: chartA.id, name: chartA.name, profile: chartA.profile, type: chartA.type },
      chartB: { id: chartB.id, name: chartB.name, profile: chartB.profile, type: chartB.type },
    })
  } catch (err) {
    console.error('[POST /api/composite]', err)
    return NextResponse.json({ error: '分析失敗' }, { status: 500 })
  }
}
