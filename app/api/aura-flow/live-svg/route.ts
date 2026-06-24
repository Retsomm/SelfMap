import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Activations, CenterName } from '@/lib/humanDesign/types'
import { computeAuraFlow, AuraFlowError } from '../_compute'
import {
  CENTERS_GEOM,
  CENTER_ORDER,
  HD_CHANNELS,
  HD_PALETTE,
  ACT_CONSCIOUS,
  ACT_UNCONSCIOUS,
  INTEGRATION_PAIRS,
} from '@/components/humanDesign/hd-chart-data'

// Lib CenterName uses 'ego' / 'solarPlexus'; chart data uses 'heart' / 'solar'
const LIB_TO_CHART: Record<string, string> = { ego: 'heart', solarPlexus: 'solar' }

function isDefined(chartKey: string, ids: Set<CenterName>): boolean {
  const libKey = Object.entries(LIB_TO_CHART).find(([, v]) => v === chartKey)?.[0] ?? chartKey
  return ids.has(libKey as CenterName) || ids.has(chartKey as CenterName)
}

function gateLoc(num: number): [number, number] | null {
  for (const c of Object.values(CENTERS_GEOM)) {
    if (c.gateAnchors[num]) return c.gateAnchors[num]
  }
  return null
}

function perpFoot(p: [number, number], a: [number, number], b: [number, number]): [number, number] {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const lenSq = dx * dx + dy * dy
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq
  return [a[0] + t * dx, a[1] + t * dy]
}

function actFill(activations: Activations, gate: number): string | null {
  const s = activations[gate]
  if (!s) return null
  if (s.c && s.u) return 'url(#hd-rb-stripes)'
  if (s.c) return ACT_CONSCIOUS
  if (s.u) return ACT_UNCONSCIOUS
  return null
}

function n(v: number): string { return v.toFixed(2) }

function seg(x1: number, y1: number, x2: number, y2: number, fill: string | null): string {
  if (fill) {
    return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${fill}" stroke-width="10" stroke-linecap="round"/>`
  }
  return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${HD_PALETTE.ink}" stroke-width="10" stroke-linecap="round" opacity="0.95"/>` +
    `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${HD_PALETTE.paper}" stroke-width="2.8" stroke-linecap="round"/>`
}

function generateSvg(activations: Activations, definedCenterIds: Set<CenterName>): string {
  const INK = HD_PALETTE.ink
  const PAPER = HD_PALETTE.paper

  // ── Defs ─────────────────────────────────────────────────────────────
  const defs = `<defs>
  <pattern id="hd-rb-stripes" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
    <rect width="3.5" height="7" fill="${ACT_CONSCIOUS}"/>
    <rect x="3.5" width="3.5" height="7" fill="${ACT_UNCONSCIOUS}"/>
  </pattern>
</defs>`

  // ── Background ───────────────────────────────────────────────────────
  const bg = `<rect x="0" y="-40" width="700" height="1030" fill="${PAPER}"/>`

  // ── Body silhouette ──────────────────────────────────────────────────
  const silhouette = `<path d="M 350 -32 C 230 -32, 195 80, 195 175 C 196 215, 218 260, 287 278 C 286 302, 286 322, 285 330 C 242 375, 148 420, 75 510 C 60 640, 75 780, 145 850 C 200 930, 285 960, 350 960 C 415 960, 500 930, 555 850 C 625 780, 640 640, 625 510 C 552 420, 458 378, 415 330 C 414 322, 414 302, 413 278 C 482 260, 504 215, 505 175 C 505 80, 470 -32, 350 -32 Z" fill="rgba(43,31,20,0.022)" stroke="rgba(43,31,20,0.14)" stroke-width="1.1"/>`

  // ── Regular channels (skip integration pairs) ────────────────────────
  const seenPairs = new Set<string>()
  const channelLines: string[] = []
  for (const ch of HD_CHANNELS) {
    const key = `${Math.min(ch.from, ch.to)}-${Math.max(ch.from, ch.to)}`
    if (seenPairs.has(key)) continue
    seenPairs.add(key)
    if (INTEGRATION_PAIRS.has(key)) continue
    const a = gateLoc(ch.from)
    const b = gateLoc(ch.to)
    if (!a || !b) continue
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
    channelLines.push(seg(a[0], a[1], mx, my, actFill(activations, ch.from)))
    channelLines.push(seg(mx, my, b[0], b[1], actFill(activations, ch.to)))
  }

  // ── Integration compound (20-57 trunk + spurs from 10, 34) ───────────
  const integLines: string[] = []
  const g20 = gateLoc(20), g57 = gateLoc(57), g10 = gateLoc(10), g34 = gateLoc(34)
  if (g20 && g57 && g10 && g34) {
    const foot10 = perpFoot(g10, g20, g57)
    const foot34 = perpFoot(g34, g20, g57)
    const tmx = (g20[0] + g57[0]) / 2, tmy = (g20[1] + g57[1]) / 2
    const s10mx = (g10[0] + foot10[0]) / 2, s10my = (g10[1] + foot10[1]) / 2
    const s34mx = (g34[0] + foot34[0]) / 2, s34my = (g34[1] + foot34[1]) / 2
    // Trunk
    integLines.push(seg(g20[0], g20[1], tmx, tmy, actFill(activations, 20)))
    integLines.push(seg(tmx, tmy, g57[0], g57[1], actFill(activations, 57)))
    // Spur 10
    integLines.push(seg(g10[0], g10[1], s10mx, s10my, actFill(activations, 10)))
    integLines.push(seg(s10mx, s10my, foot10[0], foot10[1], null))
    // Spur 34
    integLines.push(seg(g34[0], g34[1], s34mx, s34my, actFill(activations, 34)))
    integLines.push(seg(s34mx, s34my, foot34[0], foot34[1], null))
    // Junction dots
    integLines.push(`<circle cx="${n(foot10[0])}" cy="${n(foot10[1])}" r="3" fill="${INK}"/>`)
    integLines.push(`<circle cx="${n(foot34[0])}" cy="${n(foot34[1])}" r="3" fill="${INK}"/>`)
  }

  // ── Centers (polygons) ───────────────────────────────────────────────
  const centers = CENTER_ORDER.map(k => {
    const c = CENTERS_GEOM[k]
    const fill = isDefined(k, definedCenterIds) ? c.color : PAPER
    return `<polygon points="${c.points}" fill="${fill}" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/>`
  })

  // ── G-center smiley ──────────────────────────────────────────────────
  const face = [
    `<ellipse cx="338" cy="533" rx="2.6" ry="3.2" fill="${INK}"/>`,
    `<ellipse cx="362" cy="533" rx="2.6" ry="3.2" fill="${INK}"/>`,
    `<circle cx="339" cy="532" r="0.8" fill="${PAPER}"/>`,
    `<circle cx="363" cy="532" r="0.8" fill="${PAPER}"/>`,
    `<path d="M 338 547 Q 350 558 362 547" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,
    `<ellipse cx="328" cy="547" rx="3" ry="1.8" fill="${HD_PALETTE.crimson}" opacity="0.45"/>`,
    `<ellipse cx="372" cy="547" rx="3" ry="1.8" fill="${HD_PALETTE.crimson}" opacity="0.45"/>`,
  ]

  // ── Gates (circles + numbers) ────────────────────────────────────────
  const gates: string[] = []
  for (const k of CENTER_ORDER) {
    const c = CENTERS_GEOM[k]
    for (const [numStr, [x, y]] of Object.entries(c.gateAnchors)) {
      const gateNum = Number(numStr)
      const fill = actFill(activations, gateNum) ?? PAPER
      const textFill = fill === PAPER ? INK : PAPER
      gates.push(
        `<circle cx="${x}" cy="${y}" r="7.5" fill="${fill}" stroke="${INK}" stroke-width="1.4"/>`,
        `<text x="${x}" y="${y}" fill="${textFill}" text-anchor="middle" dominant-baseline="central" font-size="10.5" font-weight="600" font-family="monospace">${gateNum}</text>`,
      )
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -40 700 1030">`,
    defs,
    bg,
    silhouette,
    `<g>${channelLines.join('')}</g>`,
    `<g>${integLines.join('')}</g>`,
    `<g>${centers.join('')}</g>`,
    `<g>${face.join('')}</g>`,
    `<g>${gates.join('')}</g>`,
    `</svg>`,
  ].join('\n')
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const chartId = req.nextUrl.searchParams.get('chartId')
    if (!chartId) return NextResponse.json({ error: '缺少 chartId' }, { status: 400 })

    const { activations, definedCenterIds } = await computeAuraFlow(userId, chartId)
    const svg = generateSvg(activations, definedCenterIds)

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (err) {
    if (err instanceof AuraFlowError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('[GET /api/aura-flow/live-svg]', err)
    return NextResponse.json({ error: '計算失敗' }, { status: 500 })
  }
}
