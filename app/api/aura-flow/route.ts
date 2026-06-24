import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { computeAuraFlow, AuraFlowError } from './_compute'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const chartId = req.nextUrl.searchParams.get('chartId')
    if (!chartId) return NextResponse.json({ error: '缺少 chartId' }, { status: 400 })

    const { activations, definedCenterIds, now, chartName } = await computeAuraFlow(userId, chartId)

    return NextResponse.json({
      activations,
      combinedCenterIds: [...definedCenterIds],
      computedAt: now.toISOString(),
      chartName,
    })
  } catch (err) {
    if (err instanceof AuraFlowError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('[GET /api/aura-flow]', err)
    return NextResponse.json({ error: '計算失敗' }, { status: 500 })
  }
}
