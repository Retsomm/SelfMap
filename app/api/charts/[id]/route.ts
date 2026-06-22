import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeHdResultServer } from '@/lib/computeHdResultServer'
import { CROSS_TYPE_LABELS } from '@/lib/humanDesign/constants'

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

    let chart = await prisma.chart.findFirst({ where: { id, userId: user.id } })
    if (!chart) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // 懶補算：個人圖缺少 meta 時，重新計算並存回 DB
    const isPersonal = !chart.chartKind || chart.chartKind === 'personal'
    const meta = chart.meta as Record<string, unknown> | null
    console.log(`[GET /api/charts/${id}] isPersonal=${isPersonal} timezone=${chart.timezone} meta=${JSON.stringify(meta)?.slice(0, 80)}`)
    if (isPersonal && !meta?.incarnationCross) {
      if (!chart.timezone) {
        console.warn(`[GET /api/charts/${id}] ⚠️ timezone 為 null，無法補算`)
      } else {
        try {
          console.log(`[GET /api/charts/${id}] meta 缺失，開始補算… birthDate=${chart.birthDate} birthTime=${chart.birthTime} timezone=${chart.timezone}`)
          const result = await computeHdResultServer(chart.birthDate, chart.birthTime, chart.timezone)
          console.log(`[GET /api/charts/${id}] computeHdResultServer 完成, incarnationCross.crossType=${result.incarnationCross?.crossType}`)
          const newMeta = {
            incarnationCross: {
              crossType:      result.incarnationCross.crossType,
              crossTypeLabel: CROSS_TYPE_LABELS[result.incarnationCross.crossType] ?? result.incarnationCross.crossType,
              crossBaseName:  result.incarnationCross.crossBaseName,
              crossName:      result.incarnationCross.crossName,
              gatesLabel:     result.incarnationCross.gatesLabel,
              variant:        result.incarnationCross.variant,
            },
            variables: {
              digestion:   result.variables.digestion,
              environment: result.variables.environment,
              perspective: result.variables.perspective,
              motivation:  result.variables.motivation,
            },
            arrows: {
              topLeft:     (result.planets[0]?.red.tone   ?? 1) <= 3,
              bottomLeft:  (result.planets[3]?.red.tone   ?? 1) <= 3,
              topRight:    (result.planets[0]?.black.tone ?? 1) <= 3,
              bottomRight: (result.planets[3]?.black.tone ?? 1) <= 3,
            },
          }
          chart = await prisma.chart.update({
            where: { id },
            data: { meta: newMeta },
          })
          console.log(`[GET /api/charts/${id}] meta 補算完成，已存回 DB`)
        } catch (err) {
          console.error(`[GET /api/charts/${id}] meta 補算失敗:`, err)
        }
      }
    }

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
