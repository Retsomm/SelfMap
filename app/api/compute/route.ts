import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { computeHdResultServer } from '@/lib/computeHdResultServer'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { birthDate, birthTime, timezone } = await req.json()

    if (!birthDate || !birthTime || !timezone) {
      return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    }

    const result = await computeHdResultServer(birthDate, birthTime, timezone)

    return NextResponse.json({
      type: result.type,
      authority: result.authority.name,
      profile: result.profile.profile,
      definition: result.definition.label,
      centers: [...result.definedCenterIds],
      channels: result.definedChannels.map((ch) => ch.id),
      gates: [...result.allGates],
    })
  } catch (err) {
    console.error('[POST /api/compute]', err)
    return NextResponse.json({ error: '計算失敗' }, { status: 500 })
  }
}
