import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateChart } from '@/lib/humanDesign'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { birthDate, birthTime, birthCity, name } = body

    if (!birthDate || !birthTime || !birthCity) {
      return NextResponse.json({ error: '請填寫所有必填欄位' }, { status: 400 })
    }

    const clerkUser = await currentUser()

    let user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress ?? '',
          name: clerkUser?.fullName ?? null,
        },
      })
    }

    const hdChart = generateChart(birthDate, birthTime, birthCity)

    const chart = await prisma.chart.create({
      data: {
        userId: user.id,
        name: name || null,
        birthDate,
        birthTime,
        birthCity,
        type: hdChart.type,
        authority: hdChart.authority,
        profile: hdChart.profile,
        definition: hdChart.definition,
        centers: hdChart.centers as object[],
        channels: hdChart.channels as object[],
        gates: hdChart.gates,
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

    return NextResponse.json({ charts: user?.charts ?? [] })
  } catch (err) {
    console.error('[GET /api/charts]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
