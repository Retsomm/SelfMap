import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { birthDate, birthTime, birthCity, timezone, name, type, authority, profile, definition, centers, channels, gates } = body

    if (!birthDate || !birthTime || !birthCity || !type || !authority || !profile || !definition) {
      return NextResponse.json({ error: '請填寫所有必填欄位' }, { status: 400 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress || `clerk_${userId}@placeholder.local`

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
