import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createWorker } from 'tesseract.js'
import sharp from 'sharp'
import { prisma } from '@/lib/db'
import { buildChartFromAnalysis } from '@/lib/humanDesign'

export const runtime = 'nodejs'
export const maxDuration = 60

// ─── 文字解析：從 OCR 原始文字提取人類圖資訊 ─────────────────────────────

const parseHumanDesignText = (raw: string) => {
  const text = raw.replace(/\n/g, ' ').replace(/\s+/g, ' ')

  // Profile：格式如 1/3、2/4（允許全形斜線）
  const profileMatch = text.match(/\b([1-6])\s*[/／]\s*([1-6])\b/)
  const profile = profileMatch ? `${profileMatch[1]}/${profileMatch[2]}` : ''

  // Type：照順序比對，避免 "Manifesting Generator" 被匹配為 "Generator"
  const typePatterns: [RegExp, string][] = [
    [/manifesting\s+generator/i, 'Manifesting Generator'],
    [/generator/i,               'Generator'],
    [/manifestor/i,              'Manifestor'],
    [/projector/i,               'Projector'],
    [/reflector/i,               'Reflector'],
  ]
  let type = ''
  for (const [re, val] of typePatterns) {
    if (re.test(text)) { type = val; break }
  }

  // Authority：優先序由高到低
  const authorityPatterns: [RegExp, string][] = [
    [/emotional/i,       'Emotional'],
    [/sacral/i,          'Sacral'],
    [/splenic/i,         'Splenic'],
    [/spleen/i,          'Splenic'],
    [/ego/i,             'Ego'],
    [/self.projected/i,  'Self-Projected'],
    [/mental/i,          'Mental'],
    [/lunar/i,           'Lunar'],
  ]
  let authority = ''
  for (const [re, val] of authorityPatterns) {
    if (re.test(text)) { authority = val; break }
  }

  // Definition
  const definitionPatterns: [RegExp, string][] = [
    [/quadruple\s+split/i, 'Quadruple Split'],
    [/triple\s+split/i,    'Triple Split'],
    [/split\s+definition/i,'Split'],
    [/\bsplit\b/i,         'Split'],
    [/single\s+definition/i,'Single'],
    [/\bsingle\b/i,        'Single'],
  ]
  let definition = ''
  for (const [re, val] of definitionPatterns) {
    if (re.test(text)) { definition = val; break }
  }

  // 閘門號碼：提取所有 1-64 的整數
  // 使用 word boundary 避免「164」被誤讀為 64
  const gateSet = new Set<number>()
  const numberMatches = text.matchAll(/\b(\d{1,2})\b/g)
  for (const m of numberMatches) {
    const n = parseInt(m[1])
    if (n >= 1 && n <= 64) gateSet.add(n)
  }
  const activeGates = Array.from(gateSet)

  return { type, authority, profile, definition, activeGates }
}

// ─── API Route ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('image') as File | null
    const name = (formData.get('name') as string) || ''

    if (!file) {
      return NextResponse.json({ error: '請上傳圖片' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '僅支援 JPG、PNG、WEBP、GIF' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '圖片大小不能超過 10MB' }, { status: 400 })
    }

    // ── 圖片前處理：灰階 + 提高對比度，讓 OCR 更準確 ──────────────────────
    const rawBuffer = Buffer.from(await file.arrayBuffer())
    const processedBuffer = await sharp(rawBuffer)
      .resize({ width: 2000, withoutEnlargement: true }) // 最大寬度 2000px
      .grayscale()
      .normalise()                                        // 自動提升對比度
      .sharpen()
      .png()
      .toBuffer()

    // ── Tesseract OCR ──────────────────────────────────────────────────────
    const worker = await createWorker('eng', 1, {
      logger: () => {},                                   // 不印 progress log
    })

    const { data } = await worker.recognize(processedBuffer)
    await worker.terminate()

    const rawText = data.text
    const parsed = parseHumanDesignText(rawText)

    // 信心度判斷
    const hasEnoughGates = parsed.activeGates.length >= 6
    const hasType        = !!parsed.type
    const hasProfile     = !!parsed.profile
    const confidence = hasEnoughGates && hasType && hasProfile
      ? 'high'
      : hasEnoughGates || hasType
      ? 'medium'
      : 'low'

    const notes = confidence === 'low'
      ? `僅識別到 ${parsed.activeGates.length} 個閘門，圖片可能不夠清晰`
      : ''

    // 補預設值（若 OCR 未識別到）
    const analysisInput = {
      type:         parsed.type       || 'Generator',
      authority:    parsed.authority  || 'Sacral',
      profile:      parsed.profile    || '?/?',
      definition:   parsed.definition || 'Single',
      definedCenters: [] as string[], // 從 gates 推導，不靠 OCR
      activeGates:  parsed.activeGates,
    }

    const hdChart = buildChartFromAnalysis(analysisInput)

    // ── 儲存至資料庫 ────────────────────────────────────────────────────────
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

    const chart = await prisma.chart.create({
      data: {
        userId:     user.id,
        name:       name || null,
        birthDate:  '',
        birthTime:  '',
        birthCity:  `OCR 上傳（識別 ${parsed.activeGates.length} 個閘門）`,
        type:       hdChart.type,
        authority:  hdChart.authority,
        profile:    hdChart.profile,
        definition: hdChart.definition,
        centers:    hdChart.centers as object[],
        channels:   hdChart.channels as object[],
        gates:      hdChart.gates,
      },
    })

    return NextResponse.json({ chartId: chart.id, confidence, notes, rawGates: parsed.activeGates })
  } catch (err) {
    console.error('[POST /api/charts/analyze]', err)
    return NextResponse.json({ error: 'OCR 分析失敗，請確認圖片清晰度並重試' }, { status: 500 })
  }
}
