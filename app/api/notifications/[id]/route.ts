import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function isAuthorizedAdmin(req: NextRequest) {
  const secret = process.env.APP_SECRET
  if (!secret) return false
  return req.headers.get('x-admin-secret') === secret
}

// DELETE /api/notifications/[id] — 刪除通知（需帶 x-admin-secret header）
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    await prisma.notification.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/notifications/[id]]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
