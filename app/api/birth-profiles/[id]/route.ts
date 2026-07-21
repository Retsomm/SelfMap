import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { resolveDbUser } from '@/lib/dbUser'

// PATCH /api/birth-profiles/[id] — 更新出生資料
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { label, date, time, timezone, location, sortOrder } = body

    const updatableFields = { label, date, time, timezone, location, sortOrder }
    const providedFields = Object.entries(updatableFields).filter(([, v]) => v !== undefined)
    if (providedFields.length === 0) {
      return NextResponse.json({ error: '至少需要提供一個要更新的欄位' }, { status: 400 })
    }
    if (sortOrder !== undefined && typeof sortOrder !== 'number') {
      return NextResponse.json({ error: 'sortOrder 必須是數字' }, { status: 400 })
    }
    const stringFields = { label, date, time, timezone, location }
    for (const [key, val] of Object.entries(stringFields)) {
      if (val !== undefined && (typeof val !== 'string' || val.trim() === '')) {
        return NextResponse.json({ error: `${key} 不可為空字串` }, { status: 400 })
      }
    }

    const user = await resolveDbUser(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const updated = await prisma.birthProfile.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(label !== undefined && { label }),
        ...(date !== undefined && { date }),
        ...(time !== undefined && { time }),
        ...(timezone !== undefined && { timezone }),
        ...(location !== undefined && { location }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })
    if (updated.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const profile = await prisma.birthProfile.findUnique({ where: { id } })
    return NextResponse.json({ profile })
  } catch (err) {
    console.error('[PATCH /api/birth-profiles/[id]]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

// DELETE /api/birth-profiles/[id] — 刪除出生資料
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const user = await resolveDbUser(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    await prisma.birthProfile.deleteMany({ where: { id, userId: user.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/birth-profiles/[id]]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
