import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const chart = await prisma.chart.findFirst({ where: { id, userId: user.id } })
    if (!chart) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ chart })
  } catch (err) {
    console.error('[GET /api/charts/[id]]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const name: string | undefined = typeof body.name === 'string' ? body.name.trim() : undefined
    if (name === undefined) return NextResponse.json({ error: '缺少 name' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const updated = await prisma.chart.updateMany({
      where: { id, userId: user.id },
      data: { name: name || null },
    })
    if (updated.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/charts/[id]]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // deleteMany is idempotent — no error if the record is already gone
    await prisma.chart.deleteMany({ where: { id, userId: user.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/charts/[id]]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
