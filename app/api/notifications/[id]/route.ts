import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/notificationsAdmin'

// DELETE /api/notifications/[id] — 刪除通知（僅 ADMIN_EMAILS 允許的登入帳號可用）
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminEmail = await requireAdmin()
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    await prisma.notification.delete({ where: { id } })
    console.log(`[DELETE /api/notifications/[id]] by=${adminEmail} id=${id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: '通知不存在' }, { status: 404 })
    }
    console.error('[DELETE /api/notifications/[id]]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
