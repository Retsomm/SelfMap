import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const VALID_TYPES = ['feature', 'bugfix', 'announcement'] as const
type NotificationType = typeof VALID_TYPES[number]

function isAuthorizedAdmin(req: NextRequest) {
  const secret = process.env.APP_SECRET
  if (!secret) return false
  return req.headers.get('x-admin-secret') === secret
}

// GET /api/notifications — 公開列表，依發布時間新到舊排序
export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ notifications })
  } catch (err) {
    console.error('[GET /api/notifications]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}

// POST /api/notifications — 新增通知（需帶 x-admin-secret header）
export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
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

    const notification = await prisma.notification.create({
      data: {
        title,
        body: content,
        type: (type as NotificationType | undefined) ?? 'announcement',
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      },
    })
    return NextResponse.json({ notification })
  } catch (err) {
    console.error('[POST /api/notifications]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
