import { auth, currentUser } from '@clerk/nextjs/server'
import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

async function getOrCreateUser(userId: string) {
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
      user = await prisma.user.update({ where: { email }, data: { clerkId: userId, ...updateData } })
    } else {
      user = await prisma.user.create({ data: { clerkId: userId, email, name: clerkUser?.fullName ?? null } })
    }
  }
  return user
}

// GET /api/birth-profiles — 取得目前用戶的所有出生資料
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ profiles: [] })

    const profiles = await prisma.birthProfile.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    // Deduplicate by (label, date, time, location) — keeps earliest record
    const seen = new Set<string>()
    const duplicateIds: string[] = []
    const uniqueProfiles = profiles.filter(p => {
      const key = `${p.label}|${p.date}|${p.time}|${p.location}`
      if (seen.has(key)) { duplicateIds.push(p.id); return false }
      seen.add(key)
      return true
    })

    // Clean up duplicates from DB after response is sent
    if (duplicateIds.length > 0) {
      console.log(`[GET /api/birth-profiles] removing ${duplicateIds.length} duplicate(s)`)
      after(async () => {
        await prisma.birthProfile.deleteMany({ where: { id: { in: duplicateIds } } })
          .catch(e => console.error('[GET /api/birth-profiles] dedup cleanup error:', e))
      })
    }

    console.log(`[GET /api/birth-profiles] found=${profiles.length} unique=${uniqueProfiles.length}`)
    return NextResponse.json({ profiles: uniqueProfiles })
  } catch (err) {
    console.error('[GET /api/birth-profiles]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

// POST /api/birth-profiles — 新增出生資料（支援單筆或批次匯入）
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    // auto-create user if not in DB yet (e.g. new user who hasn't created a chart)
    const user = await getOrCreateUser(userId)

    // 批次匯入：{ profiles: [...] }
    if (Array.isArray(body.profiles)) {
      for (let i = 0; i < body.profiles.length; i++) {
        const p = body.profiles[i] as Record<string, unknown>
        const required = ['label', 'date', 'time', 'timezone', 'location'] as const
        for (const field of required) {
          if (typeof p[field] !== 'string' || (p[field] as string).trim() === '') {
            return NextResponse.json({ error: `profiles[${i}].${field} 為必填且不可為空` }, { status: 400 })
          }
        }
        if (p.sortOrder !== undefined && typeof p.sortOrder !== 'number') {
          return NextResponse.json({ error: `profiles[${i}].sortOrder 必須是數字` }, { status: 400 })
        }
      }
      const created = await prisma.$transaction(
        body.profiles.map((p: { label: string; date: string; time: string; timezone: string; location: string; sortOrder?: number }) =>
          prisma.birthProfile.create({
            data: {
              userId: user.id,
              label: p.label,
              date: p.date,
              time: p.time,
              timezone: p.timezone,
              location: p.location,
              sortOrder: p.sortOrder ?? 0,
            },
          })
        )
      )
      console.log(`[POST /api/birth-profiles] batch count=${created.length}`)
      return NextResponse.json({ profiles: created })
    }

    // 單筆新增
    const { label, date, time, timezone, location, sortOrder } = body
    if (!label || !date || !time || !timezone || !location) {
      return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
    }

    const profile = await prisma.birthProfile.create({
      data: { userId: user.id, label, date, time, timezone, location, sortOrder: sortOrder ?? 0 },
    })

    console.log(`[POST /api/birth-profiles] single id=${profile.id}`)
    return NextResponse.json({ profile })
  } catch (err) {
    console.error('[POST /api/birth-profiles]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
