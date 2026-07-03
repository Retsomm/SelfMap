import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserEmail, isAdminEmail, requireAdmin } from '@/lib/notificationsAdmin'

const VALID_TYPES = ['feature', 'bugfix', 'announcement'] as const
type NotificationType = typeof VALID_TYPES[number]

// GET /api/notifications — 公開列表，依發布時間新到舊排序
// 若請求帶有登入 session 且為管理員，額外回傳 isAdmin:true 供前端顯示管理介面
export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50,
    })
    const email = await getCurrentUserEmail()
    return NextResponse.json({ notifications, isAdmin: isAdminEmail(email) })
  } catch (err) {
    console.error('[GET /api/notifications]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

// POST /api/notifications — 新增通知（僅 ADMIN_EMAILS 允許的登入帳號可用）
export async function POST(req: NextRequest) {
  const adminEmail = await requireAdmin()
  if (!adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { title, body: content, type, publishedAt } = body

    if (typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'title 為必填' }, { status: 400 })
    }
    if (typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'body 為必填' }, { status: 400 })
    }
    if (type !== undefined && !VALID_TYPES.includes(type as NotificationType)) {
      return NextResponse.json({ error: `type 必須是 ${VALID_TYPES.join(' / ')}` }, { status: 400 })
    }

    let parsedPublishedAt: Date | undefined
    if (publishedAt !== undefined) {
      parsedPublishedAt = new Date(publishedAt)
      if (Number.isNaN(parsedPublishedAt.getTime())) {
        return NextResponse.json({ error: 'publishedAt 格式不正確' }, { status: 400 })
      }
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        body: content,
        type: (type as NotificationType | undefined) ?? 'announcement',
        publishedAt: parsedPublishedAt,
      },
    })
    console.log(`[POST /api/notifications] by=${adminEmail} id=${notification.id}`)
    return NextResponse.json({ notification })
  } catch (err) {
    console.error('[POST /api/notifications]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
