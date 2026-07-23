import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { File, Paths } from 'expo-file-system'
import {
  ACT_CONSCIOUS,
  ACT_UNCONSCIOUS,
  CENTER_ORDER,
  CENTERS_GEOM,
  HD_CENTERS_INFO,
  HD_CHANNELS,
  HD_GATES,
  HD_PALETTE,
  INTEGRATION_PAIRS,
} from '@shared/humanDesign/hd-chart-data'
import { findChannelById, normalizeCenterId } from './hd-normalizers'
import {
  STRATEGY_MAP,
  SIGNATURE_MAP,
  AUTHORITY_TIP,
  CENTER_NAME,
  ALL_CENTER_IDS,
  normalizeCenterAlias,
} from './hd-constants'
import { getTypeLabel, getTypeMeta } from './hd-type-meta'
import type { PendingChart } from './pendingChart'
import type { CreateCompositeResult, CreateTransitResult, ConnectionDynamic } from './api'
import { lightColors, darkColors } from '../constants/tokens'
import { CONN_LABEL, CONN_DESC, INTEGRATION_THEME, PROFILE_RESONANCE_DESC } from '../components/composite/compositeText'
import { IMPACT_LABEL, IMPACT_DESC, type ImpactKind } from '../components/transit/ImpactCard'

export type PdfThemeMode = 'light' | 'dark'

/** PDF 文件外觀（背景/文字/邊框等版面色）跟著 app 目前的明暗主題走，圖表本身的閘門／中心配色不受影響 */
function pdfPalette(mode: PdfThemeMode) {
  const c = mode === 'dark' ? darkColors : lightColors
  return {
    bg:      c.bg,
    ink:     c.text,
    crimson: c.accent,
    sub:     c.sub,
    cardBg:  c.surface,
    border:  c.border,
    dimBg:      c.gateBg,
    altRow:     c.altRowBg,
    paperDeep:  c.gateBg, // 對應網頁版 --paper-deep，用於頁尾商標色帶
    accentBg:   c.accentD,       // 對應畫面 Tag active 的底色
    dimText:    c.planetRedText, // 對應畫面 Row dim 的文字色
  }
}

// ─── Gate activation state ─────────────────────────────────────────────────────

type GateActivation = { c?: boolean; u?: boolean }

function buildActivations(chart: PendingChart): Record<number, GateActivation> {
  const act: Record<number, GateActivation> = {}
  if (chart.planets && chart.planets.length > 0) {
    for (const p of chart.planets) {
      act[p.blackGate] = { ...act[p.blackGate], c: true }
      act[p.redGate]   = { ...act[p.redGate],   u: true }
    }
  } else {
    const pg = chart.personalityGates ?? []
    const dg = chart.designGates ?? []
    if (pg.length > 0 || dg.length > 0) {
      for (const g of pg) act[g] = { ...act[g], c: true }
      for (const g of dg) act[g] = { ...act[g], u: true }
    } else {
      for (const g of chart.gates) act[g] = { c: true }
    }
  }
  return act
}

function actFill(state: GateActivation | undefined): string | null {
  if (!state) return null
  if (state.c && state.u) return 'both'
  if (state.c) return ACT_CONSCIOUS
  if (state.u) return ACT_UNCONSCIOUS
  return null
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

// ─── SVG channel segment (HTML SVG equivalent of ChannelSegment) ───────────────

function channelSeg(x1: number, y1: number, x2: number, y2: number, fill: string | null, sw: number): string {
  if (fill === 'both') {
    return `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ACT_UNCONSCIOUS}" stroke-width="${sw}" stroke-linecap="round"/>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ACT_CONSCIOUS}"   stroke-width="${sw * 0.45}" stroke-linecap="round"/>`
  }
  if (fill) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fill}" stroke-width="${sw}" stroke-linecap="round"/>`
  }
  return `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${HD_PALETTE.ink}"   stroke-width="${sw}" stroke-linecap="round" opacity="0.95"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${HD_PALETTE.paper}" stroke-width="${sw * 0.28}" stroke-linecap="round"/>`
}

// ─── Build BodyGraph SVG string ────────────────────────────────────────────────

function buildBodyGraphSvg(chart: PendingChart, presetActivations?: Record<number, GateActivation>): string {
  // 流日圖的黑/紅語意跟個人圖不同（個人 vs 今日流日，而非 Personality vs Design），
  // 呼叫端會算好對應的 activations 直接傳入，蓋掉這裡預設的 personality/design 判斷法
  const act = presetActivations ?? buildActivations(chart)
  const definedCenterIds = new Set(chart.centers.map(s => s.toLowerCase().replace(/\s+/g, '')))

  // Normalise center keys coming from API (e.g. "Solar Plexus" → "solar")
  const CENTER_KEY_MAP: Record<string, string> = {
    'head': 'head', 'crown': 'head',
    'ajna': 'ajna', 'mind': 'ajna',
    'throat': 'throat',
    'g': 'g', 'genter': 'g', 'gcenter': 'g', 'identity': 'g',
    'heart': 'heart', 'will': 'heart', 'ego': 'heart',
    'spleen': 'spleen',
    'sacral': 'sacral',
    'solar': 'solar', 'solarplexus': 'solar', 'emotionalcenter': 'solar',
    'root': 'root',
  }

  function isDefined(k: string): boolean {
    // direct match
    if (definedCenterIds.has(k)) return true
    // try normalising each element of chart.centers
    for (const c of chart.centers) {
      const norm = c.toLowerCase().replace(/[\s_-]/g, '')
      const mapped = CENTER_KEY_MAP[norm]
      if (mapped === k) return true
    }
    return false
  }

  const SW = 10

  // ── Channels ──────────────────────────────────────────────────────────────────
  const seenPairs = new Set<string>()
  const drawnChannels = HD_CHANNELS.filter(ch => {
    const key = `${Math.min(ch.from, ch.to)}-${Math.max(ch.from, ch.to)}`
    if (seenPairs.has(key)) return false
    seenPairs.add(key)
    return true
  })

  let channelsSvg = ''
  for (const ch of drawnChannels) {
    const a = gateLoc(ch.from), b = gateLoc(ch.to)
    if (!a || !b) continue
    const pairKey = `${Math.min(ch.from, ch.to)}-${Math.max(ch.from, ch.to)}`
    if (INTEGRATION_PAIRS.has(pairKey)) continue

    const aFill = actFill(act[ch.from])
    const bFill = actFill(act[ch.to])
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
    channelsSvg += channelSeg(a[0], a[1], mx, my, aFill, SW)
    channelsSvg += channelSeg(mx, my, b[0], b[1], bFill, SW)
  }

  // Integration compound
  const g20 = gateLoc(20), g57 = gateLoc(57), g10 = gateLoc(10), g34 = gateLoc(34)
  if (g20 && g57 && g10 && g34) {
    const foot10 = perpFoot(g10, g20, g57)
    const foot34 = perpFoot(g34, g20, g57)
    const fill20 = actFill(act[20]), fill57 = actFill(act[57])
    const fill10 = actFill(act[10]), fill34 = actFill(act[34])
    const tmx = (g20[0] + g57[0]) / 2, tmy = (g20[1] + g57[1]) / 2
    const s10mx = (g10[0] + foot10[0]) / 2, s10my = (g10[1] + foot10[1]) / 2
    const s34mx = (g34[0] + foot34[0]) / 2, s34my = (g34[1] + foot34[1]) / 2
    channelsSvg += channelSeg(g20[0], g20[1], tmx, tmy, fill20, SW)
    channelsSvg += channelSeg(tmx, tmy, g57[0], g57[1], fill57, SW)
    channelsSvg += channelSeg(g10[0], g10[1], s10mx, s10my, fill10, SW)
    channelsSvg += channelSeg(s10mx, s10my, foot10[0], foot10[1], null, SW)
    channelsSvg += channelSeg(g34[0], g34[1], s34mx, s34my, fill34, SW)
    channelsSvg += channelSeg(s34mx, s34my, foot34[0], foot34[1], null, SW)
    channelsSvg += `<circle cx="${foot10[0]}" cy="${foot10[1]}" r="3" fill="${HD_PALETTE.ink}"/>`
    channelsSvg += `<circle cx="${foot34[0]}" cy="${foot34[1]}" r="3" fill="${HD_PALETTE.ink}"/>`
  }

  // ── Centers ────────────────────────────────────────────────────────────────────
  let centersSvg = ''
  for (const k of CENTER_ORDER) {
    const c = CENTERS_GEOM[k]
    const defined = isDefined(k)
    centersSvg += `<polygon points="${c.points}" fill="${defined ? c.color : HD_PALETTE.paper}" stroke="${HD_PALETTE.ink}" stroke-width="2.8" stroke-linejoin="round"/>`
  }

  // ── G-center face ──────────────────────────────────────────────────────────────
  const faceSvg = `
    <ellipse cx="338" cy="533" rx="2.6" ry="3.2" fill="${HD_PALETTE.ink}"/>
    <ellipse cx="362" cy="533" rx="2.6" ry="3.2" fill="${HD_PALETTE.ink}"/>
    <circle  cx="339" cy="532" r="0.8"  fill="${HD_PALETTE.paper}"/>
    <circle  cx="363" cy="532" r="0.8"  fill="${HD_PALETTE.paper}"/>
    <path d="M 338 547 Q 350 558 362 547" fill="none" stroke="${HD_PALETTE.ink}" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="328" cy="547" rx="3" ry="1.8" fill="${HD_PALETTE.crimson}" opacity="0.45"/>
    <ellipse cx="372" cy="547" rx="3" ry="1.8" fill="${HD_PALETTE.crimson}" opacity="0.45"/>`

  // ── Gate circles ───────────────────────────────────────────────────────────────
  let gatesSvg = ''
  for (const k of CENTER_ORDER) {
    const c = CENTERS_GEOM[k]
    for (const [numStr, [x, y]] of Object.entries(c.gateAnchors)) {
      const gateNum = Number(numStr)
      const state   = act[gateNum]
      const fill    = actFill(state)
      const isAct   = !!fill
      const bgFill  = fill === 'both' ? ACT_UNCONSCIOUS : (fill ?? HD_PALETTE.paper)
      const textCol = isAct ? '#ffffff' : HD_PALETTE.ink

      gatesSvg += `
        <circle cx="${x}" cy="${y}" r="7.5" fill="${bgFill}" stroke="${HD_PALETTE.ink}" stroke-width="1.4"/>`
      if (fill === 'both') {
        // inner black stripe for consciousness
        gatesSvg += `<circle cx="${x}" cy="${y}" r="3.4" fill="${ACT_CONSCIOUS}"/>`
      }
      gatesSvg += `
        <text x="${x}" y="${y}" fill="${textCol}" text-anchor="middle" dominant-baseline="central"
              font-size="10.5" font-weight="600" font-family="monospace">${numStr}</text>`
    }
  }

  return `<svg viewBox="55 -40 590 1030" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
    <!-- Body silhouette -->
    <path d="M 350 -32 C 230 -32, 195 80, 195 175 C 196 215, 218 260, 287 278 C 286 302, 286 322, 285 330 C 242 375, 148 420, 75 510 C 60 640, 75 780, 145 850 C 200 930, 285 960, 350 960 C 415 960, 500 930, 555 850 C 625 780, 640 640, 625 510 C 552 420, 458 378, 415 330 C 414 322, 414 302, 413 278 C 482 260, 504 215, 505 175 C 505 80, 470 -32, 350 -32 Z"
          fill="rgba(43,31,20,0.04)" stroke="rgba(43,31,20,0.18)" stroke-width="1.1"/>
    <!-- Channels -->
    ${channelsSvg}
    <!-- Centers -->
    ${centersSvg}
    <!-- Face -->
    ${faceSvg}
    <!-- Gates -->
    ${gatesSvg}
  </svg>`
}

// ─── HTML template ─────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// ─── PDF 檔名 ──────────────────────────────────────────────────────────────────

/** 移除檔名不能用的字元（路徑分隔符、萬用字元等），避免使用者自訂名稱裡的符號弄壞檔名 */
function sanitizeFilenamePart(s: string): string {
  const cleaned = s.trim().replace(/[\\/:*?"<>|]+/g, '_')
  return cleaned || '未命名'
}

function timestampForFilename(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

/** 檔名格式：圖表種類-圖表名稱-下載時間 */
function buildPdfFilename(kind: string, name: string | null | undefined): string {
  return `${kind}-${sanitizeFilenamePart(name || '未命名')}-${timestampForFilename()}.pdf`
}

/** expo-print 產生的檔案在快取目錄裡是隨機檔名，這裡複製一份成使用者看得懂的檔名再分享 */
async function shareGeneratedPdf(sourceUri: string, filename: string, dialogTitle: string): Promise<void> {
  const source = new File(sourceUri)
  const dest = new File(Paths.cache, filename)
  await source.copy(dest, { overwrite: true })

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(dest.uri, {
      mimeType: 'application/pdf',
      dialogTitle,
      UTI: 'com.adobe.pdf',
    })
  } else {
    const { Alert } = await import('react-native')
    Alert.alert('PDF 已產生', `報告已儲存至：${dest.uri}`)
  }
}

// 以下版面小工具跨三種報告（個人／合圖／流日）共用同一份實作，避免各自維護造成內容/樣式drift
// （這正是這幾輪修正一直在處理的問題——只改一處，三種報告都會跟著對齊）

function row(label: string, value: string, accent = false, dim = false): string {
  return `<div class="row"><span class="label">${label}</span><span class="value${accent ? ' accent' : ''}${dim ? ' dim' : ''}">${value}</span></div>`
}

function tags(items: string[]): string {
  return `<div class="tags">${items.map(i => `<span class="tag">${i}</span>`).join('')}</div>`
}

// 中心/通道都需要區分「已定義（active）」與「未定義」樣式，跟畫面上 Tag 元件的 active 狀態對齊
function stateTags(items: { label: string; active: boolean }[]): string {
  return `<div class="tags">${items.map(i => `<span class="tag${i.active ? ' tag-active' : ''}">${i.label}</span>`).join('')}</div>`
}

function gateTags(gates: number[]): string {
  return `<div class="tags">${[...gates].sort((a, b) => a - b).map(g => `<span class="tag gate-tag">${g}</span>`).join('')}</div>`
}

function section(title: string, body: string): string {
  return `<div class="section"><div class="section-title">${title}</div>${body}</div>`
}

/** 九大中心：跟畫面（preview.tsx / [id].tsx / CompositeInfo.tsx / TransitAnalysis.tsx）算法一致，
 * 全部 9 個中心都列出、用中文名稱，並標示是否已定義 */
function centerTagsFor(rawCenterIds: string[]): string {
  const defined = new Set(rawCenterIds.map(normalizeCenterId))
  return stateTags(CENTER_ORDER.map(k => ({
    label: HD_CENTERS_INFO[k]?.name.zh ?? k,
    active: defined.has(k),
  })))
}

/** 定義通道：畫面上一律以 active（強調色）樣式呈現，並轉換成 34–20 這種可讀格式 */
function channelTagsFor(rawChannelIds: string[]): string {
  return stateTags(rawChannelIds.map(rawCh => {
    const ch = findChannelById(rawCh)
    return { label: ch ? `${ch.from}–${ch.to}` : rawCh, active: true }
  }))
}

function buildHtml(chart: PendingChart, mode: PdfThemeMode): string {
  const { bg, ink, crimson, sub, cardBg, border, dimBg, altRow, paperDeep, accentBg, dimText } = pdfPalette(mode)

  const svgMarkup = buildBodyGraphSvg(chart)

  const typeMeta = getTypeMeta(chart.type)
  const centerTags = centerTagsFor(chart.centers)
  const channelTags = channelTagsFor(chart.channels)

  const crossSection = chart.incarnationCross ? section('輪迴交叉',
    row('交叉類型', chart.incarnationCross.crossTypeLabel, true) +
    row('交叉名稱', `${chart.incarnationCross.crossBaseName}${chart.incarnationCross.variant}`) +
    row('完整名稱', `${chart.incarnationCross.crossTypeLabel}之${chart.incarnationCross.crossBaseName}${chart.incarnationCross.variant}`) +
    row('閘門組合', chart.incarnationCross.gatesLabel)
  ) : ''

  const arrowsSection = (chart.variables && chart.arrows) ? section('四箭頭（Variables）',
    `<table class="arrows-table">
      <thead>
        <tr>
          <th>方向</th><th>類別</th><th>項目</th><th>說明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="dir">${chart.arrows.topLeft ? '←' : '→'}</td>
          <td class="cat" style="color:${sub}">飲食<br><small>Digestion</small><br><small style="color:#9e8c78">Design 太陽</small></td>
          <td class="val">${chart.variables.digestion.label}</td>
          <td class="desc">${chart.variables.digestion.description}</td>
        </tr>
        <tr class="alt">
          <td class="dir">${chart.arrows.bottomLeft ? '←' : '→'}</td>
          <td class="cat" style="color:${sub}">環境<br><small>Environment</small><br><small style="color:#9e8c78">Design 北交點</small></td>
          <td class="val">${chart.variables.environment.label}</td>
          <td class="desc">${chart.variables.environment.description}</td>
        </tr>
        <tr>
          <td class="dir">${chart.arrows.topRight ? '←' : '→'}</td>
          <td class="cat" style="color:${sub}">動機<br><small>Motivation</small><br><small style="color:#9e8c78">Pers. 太陽</small></td>
          <td class="val">${chart.variables.motivation.label}</td>
          <td class="desc">${chart.variables.motivation.description}</td>
        </tr>
        <tr class="alt">
          <td class="dir">${chart.arrows.bottomRight ? '←' : '→'}</td>
          <td class="cat" style="color:${sub}">觀點<br><small>Perspective</small><br><small style="color:#9e8c78">Pers. 北交點</small></td>
          <td class="val">${chart.variables.perspective.label}</td>
          <td class="desc">${chart.variables.perspective.description}</td>
        </tr>
      </tbody>
    </table>`
  ) : ''

  const planetsSection = chart.planets && chart.planets.length > 0 ? section('行星閘門對照',
    `<table class="planet-table">
      <thead><tr>
        <th>行星</th>
        <th style="color:${sub}">● 意識（黑）</th>
        <th style="color:${crimson}">● 潛意識（紅）</th>
      </tr></thead>
      <tbody>
        ${chart.planets.map((p, i) =>
          `<tr class="${i % 2 === 1 ? 'alt' : ''}">
            <td style="color:${sub}">${p.name}</td>
            <td style="color:${ink};font-weight:700">${p.blackGate}.${p.blackLine}</td>
            <td style="color:${crimson};font-weight:700">${p.redGate}.${p.redLine}</td>
          </tr>`
        ).join('')}
      </tbody>
    </table>`
  ) : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; background: ${bg}; color: ${ink}; padding: 28px 24px; max-width: 700px; margin: 0 auto; }
  h1  { color: ${crimson}; font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .meta { color: ${sub}; font-size: 12px; margin-bottom: 20px; }

  .graph-card { background: ${cardBg}; border: 1px solid ${border}; border-radius: 10px; overflow: hidden; margin-bottom: 14px; }
  .graph-title { color: ${sub}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 10px 14px 4px; }
  .graph-container { max-width: 460px; margin: 0 auto; }

  .section { background: ${cardBg}; border: 1px solid ${border}; border-radius: 10px; overflow: hidden; margin-bottom: 14px; }
  .section-title { background: ${dimBg}; padding: 7px 14px; font-size: 10px; font-weight: 700; color: ${sub}; text-transform: uppercase; letter-spacing: 0.8px; }
  .row { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 14px; border-bottom: 1px solid ${border}; }
  .row:last-child { border-bottom: none; }
  .label { color: ${sub}; font-size: 12px; }
  .value { color: ${ink}; font-size: 13px; font-weight: 600; text-align: right; max-width: 60%; }
  .accent { color: ${crimson}; }
  .dim { color: ${dimText}; }

  .tags { padding: 10px 14px; display: flex; flex-wrap: wrap; gap: 5px; }
  .tag { background: ${dimBg}; border: 1px solid ${border}; border-radius: 5px; padding: 2px 8px; font-size: 11px; color: ${sub}; }
  .tag-active { background: ${accentBg}; border-color: ${crimson}; color: ${crimson}; font-weight: 600; }
  .gate-tag { color: ${crimson}; font-weight: 700; }

  .planet-table { width: 100%; border-collapse: collapse; }
  .planet-table th { padding: 6px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 1px solid ${border}; }
  .planet-table td { padding: 6px 14px; font-size: 12px; }
  .planet-table tr.alt { background: ${altRow}; }

  .arrows-table { width: 100%; border-collapse: collapse; }
  .arrows-table th { padding: 5px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 1px solid ${border}; color: ${sub}; }
  .arrows-table td { padding: 7px 12px; font-size: 12px; vertical-align: top; }
  .arrows-table tr.alt { background: ${altRow}; }
  .arrows-table .dir { font-size: 18px; font-weight: 700; color: ${crimson}; width: 28px; text-align: center; }
  .arrows-table .cat { font-size: 11px; color: ${sub}; min-width: 80px; }
  .arrows-table .cat small { font-size: 10px; display: block; }
  .arrows-table .val { font-weight: 700; color: ${ink}; min-width: 80px; }
  .arrows-table .desc { color: ${sub}; font-size: 11px; line-height: 1.4; }

  .legend { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 14px 8px; font-size: 11px; color: ${sub}; }
  .legend-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }

  .footer { margin-top: 20px; padding: 8px 0; background: ${paperDeep}; border-top: 1px solid ${ink}; border-radius: 8px 8px 0 0; text-align: center; color: ${sub}; font-size: 10px; }
</style>
</head>
<body>
  <h1>${chart.name || '人類圖本命盤'}</h1>
  <p class="meta">${chart.birthDate}　${chart.birthTime}　${chart.birthCity}${chart.timezone ? `　${chart.timezone}` : ''}</p>

  <!-- Body Graph -->
  <div class="graph-card">
    <div class="graph-title">Body Graph</div>
    <div class="legend">
      <span class="legend-dot" style="background:#111111"></span>意識（黑）
      <span class="legend-dot" style="background:${ACT_UNCONSCIOUS}"></span>潛意識（紅）
    </div>
    <div class="graph-container">${svgMarkup}</div>
  </div>

  <!-- 類型 -->
  ${section('類型',
    row('能量類型', getTypeLabel(chart.type), true) +
    row('策略', typeMeta.strategy) +
    row('簽名（成功徵兆）', typeMeta.signature, true) +
    row('非自我主題', typeMeta.notSelf, false, true)
  )}

  <!-- 設計 -->
  ${section('設計',
    row('內在權威', chart.authority, true) +
    row('人生角色（Profile）', chart.profile) +
    row('定義',    chart.definition)
  )}

  <!-- 九大中心 -->
  ${section('九大中心', centerTags)}

  <!-- 定義通道 -->
  ${chart.channels.length > 0 ? section(`定義通道（${chart.channels.length}）`, channelTags) : ''}

  <!-- 行星對照 -->
  ${planetsSection}

  <!-- 輪迴交叉 -->
  ${crossSection}

  <!-- 四箭頭 -->
  ${arrowsSection}

  <!-- 激活閘門 -->
  ${section(`激活閘門（${chart.gates.length}）`, gateTags(chart.gates))}

  <div class="footer"><p>© Retsnom</p></div>
</body>
</html>`
}

// ─── Public exports ────────────────────────────────────────────────────────────

export async function downloadChartAsPdf(chart: PendingChart, mode: PdfThemeMode = 'light'): Promise<void> {
  const html = buildHtml(chart, mode)
  const { uri } = await Print.printToFileAsync({ html, base64: false })
  const filename = buildPdfFilename('個人', chart.name)
  await shareGeneratedPdf(uri, filename, '儲存或分享人類圖報告')
}

export function generateAiPrompt(chart: PendingChart): string {
  const definedCenterNames = chart.centers.map(id => CENTER_NAME[id] ?? id)
  const definedSet = new Set(chart.centers.map(normalizeCenterAlias))
  const openCenterNames = ALL_CENTER_IDS.filter(id => !definedSet.has(id)).map(id => CENTER_NAME[id] ?? id)

  const channelsStr = chart.channels.length > 0
    ? chart.channels.map(rawId => {
        const ch = findChannelById(rawId)
        return ch ? `${rawId}（${ch.name.zh}）` : rawId
      }).join('、')
    : '無'

  const planetRows = (chart.planets && chart.planets.length > 0)
    ? chart.planets.map(p => `  ${p.name}：Personality ${p.blackGate}.${p.blackLine} ／ Design ${p.redGate}.${p.redLine}`).join('\n')
    : '  無'

  const crossLine = chart.incarnationCross
    ? `${chart.incarnationCross.crossTypeLabel}之${chart.incarnationCross.crossName}（${chart.incarnationCross.gatesLabel}）`
    : '—'

  const variablesSection = chart.variables ? `
【四箭頭 Variables】
飲食方式（Digestion）：${chart.variables.digestion.label} — ${chart.variables.digestion.description}
適合環境（Environment）：${chart.variables.environment.label} — ${chart.variables.environment.description}
觀點（Perspective）：${chart.variables.perspective.label} — ${chart.variables.perspective.description}
思考動機（Motivation）：${chart.variables.motivation.label} — ${chart.variables.motivation.description}` : ''

  const authTip = AUTHORITY_TIP[chart.authority] ?? ''

  return `以下是我的 Human Design（人類圖）資料，請根據這些資料為我進行深度解讀。
請只根據我提供的資料分析，不要自行推算或補充未提供的閘門、爻線與通道。
若發現資料之間有矛盾，請直接指出，不要強行解釋。

姓名/圖表名稱：${chart.name || '（未命名）'}
出生資料：${chart.birthDate} ${chart.birthTime}，${chart.birthCity}

【類型 Type】
${chart.type}
策略：${STRATEGY_MAP[chart.type] ?? '—'}
正向標誌：${SIGNATURE_MAP[chart.type]?.positive ?? '—'} ／ 負向標誌：${SIGNATURE_MAP[chart.type]?.negative ?? '—'}

【人生角色 Profile】
${chart.profile}

【決策權威 Authority】
${chart.authority}${authTip ? '\n' + authTip : ''}

【定義 Definition】
${chart.definition}
已定義 ${chart.centers.length} / 9 中心，激活 ${chart.gates.length} 閘門

【輪迴交叉 Incarnation Cross】
${crossLine}
${variablesSection}

【已定義能量中心】
${definedCenterNames.join('、') || '無'}

【開放能量中心】
${openCenterNames.join('、') || '無'}

【已定義通道 Defined Channels】
${channelsStr}

【行星閘門 Planetary Gates】
${planetRows}

請依照以下結構解讀：

1. 核心設計總覽：
   用一段話說明我這張圖的整體主軸（類型 × 人生角色 × 輪迴交叉
   如何構成我的人生方向）。

2. 類型與策略：
   ${chart.type}「${STRATEGY_MAP[chart.type] ?? '—'}」在我的圖中具體是什麼樣子？
   哪些領域的邀請對我特別重要？${SIGNATURE_MAP[chart.type]?.negative ?? '負向標誌'}感通常會從哪裡冒出來？

3. 決策權威實際操作：
   ${chart.authority}在日常中如何辨識？請給出「這是真正的權威訊號」vs
   「這是頭腦假裝的訊號」的具體分辨方法，
   並結合我開放的能量中心，說明我容易被什麼帶偏。

4. ${chart.definition}的課題：
   請說明我的定義中心之間的關係、是否存在缺口與橋接閘門，
   以及這會如何影響我對特定人事物的依賴。

5. 人生角色 ${chart.profile} 的運作方式：
   兩條爻線分別代表的行為模式如何搭配？
   這對我理解自己的成長歷程有什麼意義？

6. 通道與重要閘門：
   逐一解讀我已定義的通道（${channelsStr}）的天賦與陰影面。
   行星閘門請聚焦在太陽/地球軸，其餘行星挑對主題有顯著影響的講即可，不必逐一羅列。

7. 開放中心的制約課題：
   在我開放的中心中，挑出對我影響最大的 2-3 個，
   深入說明「非自己」的行為長什麼樣子，
   以及我可以用什麼問句自我檢查。

8. 四箭頭的生活應用：
   ${chart.variables ? `${chart.variables.digestion.label}飲食、${chart.variables.environment.label}環境、${chart.variables.perspective.label}觀點、${chart.variables.motivation.label}動機，
   分別給出一個具體可執行的生活調整。` : '（無四箭頭資料，可略過此項）'}

9. 總結：
   給我 3-5 點依重要性排序的實際建議，
   每一點都要對應到前面的分析，不要泛泛而談。`
}

// ─── Composite / Transit prompt ───────────────────────────────────────────────

const stripCenterSuffix = (name: string): string => name.replace('中心', '')

export function generateCompositeAiPrompt(result: CreateCompositeResult): string {
  const allConns = [...result.electromagnetic, ...result.companionship, ...result.compromise, ...result.dominance]

  // 從四類連結中反推每個人自己完整定義（兩個閘門都有）的通道與中心
  const personSummary = (side: 'a' | 'b', type: string, profile: string, authority: string) => {
    const gatesKey = side === 'a' ? 'aGates' : 'bGates'
    const ownChannels = allConns.filter(c => c[gatesKey].length === 2)
    const centerIds = new Set<string>()
    ownChannels.forEach(c => { centerIds.add(c.centerA); centerIds.add(c.centerB) })
    const centers = [...centerIds].map(id => stripCenterSuffix(CENTER_NAME[id] ?? id)).join('、') || '無'
    const channels = ownChannels.map(c => c.channelId).join('、') || '無'
    return `能量類型：${type}
人生角色：${profile}
決策權威：${authority}
已定義中心：${centers}
已定義通道：${channels}`
  }

  const openCenterIds = ALL_CENTER_IDS.filter(id => !result.compositeDefinedCenterIds.includes(id))
  const openLabel = openCenterIds.length > 0
    ? '開放' + openCenterIds.map(id => stripCenterSuffix(CENTER_NAME[id] ?? id)).join('、')
    : '無開放中心'

  const resonanceLabel = result.profileResonance.length > 0
    ? `有（${result.profileResonance.join('、')} 爻）`
    : '無'

  const fmtConn = (c: ConnectionDynamic) =>
    `${c.channelId}（${stripCenterSuffix(CENTER_NAME[c.centerA] ?? c.centerA)}—${stripCenterSuffix(CENTER_NAME[c.centerB] ?? c.centerB)}）`

  const fmtList = (list: ConnectionDynamic[]) => list.length > 0 ? list.map(fmtConn).join('、') : '無'

  // 妥協連結：擁有完整通道（兩個閘門）的一方是妥協方
  const fmtCompromiseList = (list: ConnectionDynamic[]) =>
    list.length > 0 ? list.map(c => `${fmtConn(c)}，${c.aGates.length === 2 ? 'A' : 'B'}方妥協`).join('；') : '無'

  // 支配連結：擁有閘門的一方（另一方完全沒有）是支配方
  const fmtDominanceList = (list: ConnectionDynamic[]) =>
    list.length > 0 ? list.map(c => `${fmtConn(c)}，${c.aGates.length > c.bGates.length ? 'A' : 'B'}方支配`).join('；') : '無'

  const personALabel = result.personA.name ? `${result.personA.name} 的人類圖` : 'A 的人類圖'
  const personBLabel = result.personB.name ? `${result.personB.name} 的人類圖` : 'B 的人類圖'

  return `以下是兩人的 Human Design（人類圖）合圖資料，請根據這些資料進行深度的合圖關係解讀。
請只根據我提供的資料分析，不要自行推算或補充未提供的閘門與通道。

【${personALabel}】
${personSummary('a', result.personA.type, result.personA.profile, result.personA.authority)}

【${personBLabel}】
${personSummary('b', result.personB.type, result.personB.profile, result.personB.authority)}

【合圖整合資料】
定義中心整合：${result.integrationTheme}（${openLabel}）
人生角色共鳴爻線：${resonanceLabel}
電磁連結：${fmtList(result.electromagnetic)}
陪伴連結：${fmtList(result.companionship)}
妥協連結：${fmtCompromiseList(result.compromise)}
支配連結：${fmtDominanceList(result.dominance)}

請從以下角度分析：
1. 兩人類型與策略的互動模式（含能量場的給予與接收）
2. 人生角色的共鳴、互補與潛在誤解
3. 決策權威差異造成的相處節奏，以及如何配合彼此的決策方式
4. 四類通道連結的動力：電磁的吸引與火花、陪伴的穩定基礎、
   妥協與支配連結中誰讓步誰主導，可能累積什麼壓力
5. 開放中心作為兩人共同課題的意義
6. 整體能量場整合度評估，並給出 3-5 點具體可執行的相處建議`
}

export function generateTransitAiPrompt(result: CreateTransitResult): string {
  const planetRows = result.transit.planets
    .map(p => `  ${p.planetName}：${p.gate}.${p.line}`)
    .join('\n')

  const personalCenters = result.personalDefinedCenterIds.map(id => CENTER_NAME[id] ?? id).join('、') || '無'
  const personalGates = [...result.personalGates].sort((a, b) => a - b).join('、') || '無'

  const personalGateSet = new Set(result.personalGates)
  const transitGateSet  = new Set(result.transit.allGates)

  const sharedGates = result.transit.allGates.filter(g => personalGateSet.has(g)).sort((a, b) => a - b)
  const sharedGatesLabel = sharedGates.length > 0 ? sharedGates.join('、') : '無'

  // 流日獨立形成的通道（兩個閘門都只由流日激活）與個人閘門+流日閘門合成的新通道
  const personalChannelIdSet = new Set(result.personalDefinedChannelIds)
  const transitOnlyChannels: string[] = []
  const completingChannels: string[] = []
  const seenPairs = new Set<string>()
  for (const ch of HD_CHANNELS) {
    const key = `${Math.min(ch.from, ch.to)}-${Math.max(ch.from, ch.to)}`
    if (seenPairs.has(key)) continue
    seenPairs.add(key)
    if (personalChannelIdSet.has(ch.id)) continue

    const aInPersonal = personalGateSet.has(ch.from)
    const bInPersonal = personalGateSet.has(ch.to)
    const aInTransit  = transitGateSet.has(ch.from)
    const bInTransit  = transitGateSet.has(ch.to)

    if (!aInPersonal && !bInPersonal && aInTransit && bInTransit) {
      transitOnlyChannels.push(`${ch.from}-${ch.to}`)
    } else if (aInPersonal && !bInPersonal && bInTransit) {
      completingChannels.push(`${ch.from}-${ch.to}（個人 ${ch.from} + 流日 ${ch.to}）`)
    } else if (bInPersonal && !aInPersonal && aInTransit) {
      completingChannels.push(`${ch.from}-${ch.to}（個人 ${ch.to} + 流日 ${ch.from}）`)
    }
  }

  const combinedCenterSet = new Set(result.combined.definedCenterIds)
  const openActivated = ALL_CENTER_IDS.filter(
    id => !result.personalDefinedCenterIds.includes(id) && combinedCenterSet.has(id),
  )
  const openActivatedLabel = openActivated.length > 0 ? openActivated.map(id => CENTER_NAME[id] ?? id).join('、') : '無'

  const transitDate = (() => {
    try {
      return new Date(result.transit.computedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    } catch { return result.transit.computedAt }
  })()

  const sunGate = result.transit.planets.find(p => p.planetName === '太陽')
  const earthGate = result.transit.planets.find(p => p.planetName === '地球')
  const sunEarthAxis = sunGate && earthGate ? `${sunGate.gate}-${earthGate.gate}` : '—'

  return `以下是我的個人人類圖與今日流日資料，請進行深度流日解讀。
請只根據我提供的資料分析，不要自行推算未提供的閘門、通道或中心。

【個人人類圖】
類型：${result.type ?? '—'}（${getTypeLabel(result.type)}）
人生角色：${result.profile ?? '—'}
決策權威：${result.authority ?? '—'}
已定義中心：${personalCenters}
已定義通道：${result.personalDefinedChannelIds.join('、') || '無'}
個人激活閘門：${personalGates}

【流日時間】
${transitDate}（台北時間）

【流日行星閘門】
${planetRows}

【疊加分析資料】
個人與流日共有閘門：${sharedGatesLabel}
流日獨立形成的通道：${transitOnlyChannels.length > 0 ? transitOnlyChannels.join('、') : '無'}
個人閘門+流日閘門合成的新通道：${completingChannels.length > 0 ? completingChannels.join('、') : '無'}
今日暫時被定義的開放中心：${openActivatedLabel}

請分析：
1. 今日整體流日天氣：太陽/地球軸（${sunEarthAxis}）的主題是什麼
2. 暫時被定義的${openActivatedLabel}中心，我可能有什麼不熟悉的體驗？哪些感受是「借來的」，不該當成自己的？
3. 共有閘門 ${sharedGatesLabel} 被流日強化，對我的既有特質有什麼放大效果？
4. 結合我的 ${result.type ?? '—'} 策略（${STRATEGY_MAP[result.type] ?? '—'}）與${result.authority ?? '—'}，今天適合推進什麼、該避免什麼？
5. 給我 3-5 點今天具體可執行的建議，並註明時效（月亮閘門幾小時就會換，太陽閘門約 5-6 天）。`
}

// ─── Composite / Transit PDF download ────────────────────────────────────────

function buildCompositeHtml(result: CreateCompositeResult, mode: PdfThemeMode): string {
  const { bg, ink, crimson, sub, cardBg, border, dimBg, altRow, paperDeep, accentBg } = pdfPalette(mode)
  const tc = mode === 'dark' ? darkColors : lightColors

  const nameA = escapeHtml(result.personA.name ?? 'A')
  const nameB = escapeHtml(result.personB.name ?? 'B')
  const aDate    = escapeHtml(result.personA.birthDate)
  const aTime    = escapeHtml(result.personA.birthTime)
  const aCity    = escapeHtml(result.personA.birthCity)
  // 跟畫面（CompositeInfo.tsx / CompositeView.tsx）一致：顯示中文標籤，不是原始英文 type 值
  const aType    = escapeHtml(getTypeLabel(result.personA.type))
  const aProfile = escapeHtml(result.personA.profile)
  const aAuth    = escapeHtml(result.personA.authority)
  const aAuthTip = result.personA.authorityTip ? escapeHtml(result.personA.authorityTip) : ''
  const bDate    = escapeHtml(result.personB.birthDate)
  const bTime    = escapeHtml(result.personB.birthTime)
  const bCity    = escapeHtml(result.personB.birthCity)
  const bType    = escapeHtml(getTypeLabel(result.personB.type))
  const bProfile = escapeHtml(result.personB.profile)
  const bAuth    = escapeHtml(result.personB.authority)
  const bAuthTip = result.personB.authorityTip ? escapeHtml(result.personB.authorityTip) : ''

  // Bodygraph: use full allGates for each person
  // Fallback for old API responses without allGates
  const aAllGates = result.personA.allGates ?? []
  const bAllGates = result.personB.allGates ?? []
  const fallbackGates: number[] = []
  const useFallback = !aAllGates.length && !bAllGates.length
  if (useFallback) {
    for (const type of ['electromagnetic', 'companionship', 'compromise', 'dominance'] as const) {
      for (const conn of result[type]) {
        for (const g of conn.aGates) fallbackGates.push(g)
        for (const g of conn.bGates) fallbackGates.push(g)
      }
    }
  }
  const svgChart: PendingChart = {
    name: `${nameA} x ${nameB}`,
    birthDate: '', birthTime: '', birthCity: '', timezone: '',
    type: '', authority: '', profile: '', definition: '',
    centers: result.compositeDefinedCenterIds,
    channels: result.compositeDefinedChannelIds ?? [],
    gates: useFallback ? [...new Set(fallbackGates)] : [...new Set([...aAllGates, ...bAllGates])],
    personalityGates: useFallback ? [] : aAllGates,
    designGates: useFallback ? [] : bAllGates,
  }
  const svgMarkup = buildBodyGraphSvg(svgChart)

  const theme = INTEGRATION_THEME[result.integrationTheme] ?? INTEGRATION_THEME['6+3+']

  // 顏色跟著明暗主題走（畫面 connColors() 也是這樣），避免深色模式下 PDF 顯示淺色配色
  const CONN_META = {
    electromagnetic: { label: CONN_LABEL.electromagnetic, color: tc.em,      bg: tc.emDimBg,      desc: CONN_DESC.electromagnetic },
    companionship:   { label: CONN_LABEL.companionship,   color: tc.comp,    bg: tc.compDimBg,    desc: CONN_DESC.companionship },
    compromise:      { label: CONN_LABEL.compromise,      color: tc.compro,  bg: tc.comproDimBg,  desc: CONN_DESC.compromise },
    dominance:       { label: CONN_LABEL.dominance,       color: tc.dom,     bg: tc.domDimBg,     desc: CONN_DESC.dominance },
  } as const

  // 顏色跟畫面 CompositeInfo.tsx 一致：依「意識/潛意識」區分（text/designRed），
  // 不是依人物 A/B 區分——人物身分改由上方的分組標題列顯示
  const planetTable = (result.personA.planets?.length ?? 0) > 0
    ? section('行星閘門對照',
        `<table class="planet-table">
          <thead>
            <tr class="planet-group-row">
              <th></th>
              <th colspan="2" style="color:${crimson}">${nameA}</th>
              <th colspan="2" style="color:${ink}">${nameB}</th>
            </tr>
            <tr>
              <th>行星</th>
              <th style="color:${ink}">意識</th>
              <th style="color:${tc.designRed}">潛意識</th>
              <th style="color:${ink}">意識</th>
              <th style="color:${tc.designRed}">潛意識</th>
            </tr>
          </thead>
          <tbody>${(result.personA.planets ?? []).map((p, i) => {
            const pb = result.personB.planets?.[i]
            return `<tr class="${i % 2 === 1 ? 'alt' : ''}">
              <td style="color:${sub}">${p.name}</td>
              <td style="color:${ink};font-weight:700">${p.blackGate}.${p.blackLine}</td>
              <td style="color:${tc.designRed}">${p.redGate}.${p.redLine}</td>
              <td style="color:${ink};font-weight:700">${pb?.blackGate ?? '—'}.${pb?.blackLine ?? ''}</td>
              <td style="color:${tc.designRed}">${pb?.redGate ?? '—'}.${pb?.redLine ?? ''}</td>
            </tr>`
          }).join('')}</tbody>
        </table>`)
    : ''

  // 跟畫面一致：標題用一般文字色（不是強調色），下面接一行「合圖定義 X / 9 中心 · 開放 Y 中心」文字
  const themeSection = section('能量場整合主題',
    `<div class="theme-header">
      <div class="theme-label">${theme.label}</div>
      <div class="theme-sub">合圖定義 ${result.compositeDefinedCount} / 9 中心 · 開放 ${result.compositeOpenCount} 中心</div>
    </div>
    <div class="theme-grid">
      <div class="theme-block"><div class="theme-block-title">戀愛關係</div><p class="theme-block-text">${theme.love}</p></div>
      <div class="theme-block"><div class="theme-block-title">工作夥伴</div><p class="theme-block-text">${theme.work}</p></div>
    </div>`)

  const connSection = section('四種核心連結動力',
    (['electromagnetic', 'companionship', 'compromise', 'dominance'] as const).map(type => {
      const cfg = CONN_META[type]
      const items = result[type]
      const rows = items.length === 0
        ? `<div class="conn-empty">無相關通道</div>`
        : items.map((conn, i) =>
            `<div class="conn-row ${i % 2 === 1 ? 'alt' : ''}">
              <div class="conn-id-col">
                <span class="conn-id" style="color:${cfg.color}">${conn.channelId}</span>
                <span class="conn-centers">${CENTER_NAME[conn.centerA] ?? conn.centerA}—${CENTER_NAME[conn.centerB] ?? conn.centerB}</span>
              </div>
              <span class="conn-gates">${nameA}：${conn.aGates.length ? conn.aGates.join(', ') : '—'} ／ ${nameB}：${conn.bGates.length ? conn.bGates.join(', ') : '—'}</span>
            </div>`
          ).join('')
      return `<div class="conn-group">
        <div class="conn-header" style="background:${cfg.bg}">
          <span class="conn-title" style="color:${cfg.color}">${cfg.label}（${items.length}）</span>
          <span class="conn-desc">${cfg.desc}</span>
        </div>${rows}</div>`
    }).join('')
  )

  const definedChIds = result.compositeDefinedChannelIds ?? []
  const channelsSection = definedChIds.length > 0
    ? section(`合圖定義通道（${definedChIds.length}）`, channelTagsFor(definedChIds))
    : ''

  const resonanceItems = (result.profileResonance ?? [])
    .map(line => PROFILE_RESONANCE_DESC[line])
    .filter((info): info is { title: string; desc: string } => !!info)
  const resonanceSection = section('人生角色共鳴',
    `<div class="profile-names">
      <span style="color:${crimson};font-weight:700">${nameA} ${aProfile}</span>
      <span style="font-weight:700">${nameB} ${bProfile}</span>
    </div>` + (resonanceItems.length === 0
      ? `<p class="resonance-none">兩人人生角色沒有共同爻線，各自的觀點框架較為不同。</p>`
      : resonanceItems.map(info =>
          `<div class="resonance-row"><span class="resonance-label">${info.title}</span><span class="resonance-desc">${info.desc}</span></div>`
        ).join('')
    )
  )

  const authoritySection = section('策略與內在權威',
    `<div class="authority-grid">
      <div class="authority-card" style="border-left-color:${crimson}">
        <div class="authority-meta">${nameA} 的權威</div>
        <div class="authority-name" style="color:${crimson}">${aAuth}</div>
        ${aAuthTip ? `<p class="authority-tip">${aAuthTip}</p>` : ''}
      </div>
      <div class="authority-card" style="border-left-color:${ink}">
        <div class="authority-meta">${nameB} 的權威</div>
        <div class="authority-name">${bAuth}</div>
        ${bAuthTip ? `<p class="authority-tip">${bAuthTip}</p>` : ''}
      </div>
    </div>`)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; background: ${bg}; color: ${ink}; padding: 28px 24px; max-width: 700px; margin: 0 auto; }
  h1  { color: ${crimson}; font-size: 20px; font-weight: 700; margin-bottom: 14px; }
  .person-header { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: ${cardBg}; border: 1px solid ${border}; border-radius: 10px; padding: 12px 16px; margin-bottom: 14px; }
  .person-header-name { font-weight: 700; font-size: 14px; margin-bottom: 2px; }
  .person-header-meta { font-size: 11px; color: ${sub}; }
  .graph-card { background: ${cardBg}; border: 1px solid ${border}; border-radius: 10px; overflow: hidden; margin-bottom: 14px; }
  .graph-title { color: ${sub}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 10px 14px 4px; }
  .graph-container { max-width: 460px; margin: 0 auto; }
  .section { background: ${cardBg}; border: 1px solid ${border}; border-radius: 10px; overflow: hidden; margin-bottom: 14px; }
  .section-title { background: ${dimBg}; padding: 7px 14px; font-size: 10px; font-weight: 700; color: ${sub}; text-transform: uppercase; letter-spacing: 0.8px; }
  .theme-header { padding: 12px 14px; border-bottom: 1px solid ${border}; }
  .theme-label { font-size: 16px; font-weight: 700; color: ${ink}; margin-bottom: 4px; }
  .theme-sub { font-size: 12px; color: ${sub}; }
  .theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 14px; }
  .theme-block { background: ${bg}; border-radius: 8px; padding: 10px; }
  .theme-block-title { font-size: 10px; font-weight: 700; color: ${sub}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
  .theme-block-text { font-size: 12px; color: ${sub}; line-height: 1.6; }
  .conn-group { border: 1px solid ${border}; border-radius: 8px; overflow: hidden; margin: 6px 14px; }
  .conn-header { padding: 8px 12px; background: ${altRow}; }
  .conn-title { font-size: 12px; font-weight: 700; display: block; margin-bottom: 2px; }
  .conn-desc { font-size: 11px; color: ${sub}; }
  .conn-row { display: flex; gap: 8px; padding: 6px 12px; font-size: 12px; align-items: flex-start; }
  .conn-row.alt { background: ${bg}; }
  .conn-id-col { min-width: 70px; display: flex; flex-direction: column; }
  .conn-id { font-weight: 700; }
  .conn-centers { font-size: 10px; color: ${sub}; margin-top: 1px; }
  .conn-gates { color: ${sub}; }
  .conn-empty { padding: 8px 12px; font-size: 12px; color: ${sub}; }
  .tags { padding: 10px 14px; display: flex; flex-wrap: wrap; gap: 5px; }
  .tag { background: ${dimBg}; border: 1px solid ${border}; border-radius: 5px; padding: 2px 8px; font-size: 11px; color: ${sub}; }
  .tag-active { background: ${accentBg}; border-color: ${crimson}; color: ${crimson}; font-weight: 600; }
  .planet-table { width: 100%; border-collapse: collapse; }
  .planet-table th { padding: 5px 8px; font-size: 10px; font-weight: 700; text-align: left; border-bottom: 1px solid ${border}; }
  .planet-group-row th { padding-top: 8px; }
  .planet-table td { padding: 5px 8px; font-size: 11px; }
  .planet-table tr.alt { background: ${altRow}; }
  .profile-names { display: flex; gap: 16px; padding: 10px 14px; border-bottom: 1px solid ${border}; font-size: 14px; }
  .resonance-row { padding: 8px 14px; border-bottom: 1px solid ${border}; }
  .resonance-row:last-child { border-bottom: none; }
  .resonance-label { font-size: 12px; font-weight: 700; color: ${crimson}; display: block; margin-bottom: 2px; }
  .resonance-desc { font-size: 12px; color: ${sub}; line-height: 1.5; }
  .resonance-none { padding: 10px 14px; font-size: 12px; color: ${sub}; }
  .authority-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 14px; }
  .authority-card { border-left: 3px solid; padding-left: 12px; }
  .authority-meta { font-size: 10px; font-weight: 700; color: ${sub}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 2px; }
  .authority-name { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
  .authority-tip { font-size: 12px; color: ${sub}; line-height: 1.55; }
  .legend { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 14px 8px; font-size: 11px; color: ${sub}; }
  .legend-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .footer { margin-top: 20px; padding: 8px 0; background: ${paperDeep}; border-top: 1px solid ${ink}; border-radius: 8px 8px 0 0; text-align: center; color: ${sub}; font-size: 10px; }
</style>
</head>
<body>
  <h1>${nameA} x ${nameB} 合圖</h1>

  <div class="person-header">
    <div>
      <div class="person-header-name" style="color:${crimson}">${nameA}</div>
      <div class="person-header-meta">${aDate} · ${aTime}</div>
      <div class="person-header-meta">${aCity}</div>
      <div class="person-header-meta">${aType} · ${aProfile}</div>
    </div>
    <div>
      <div class="person-header-name">${nameB}</div>
      <div class="person-header-meta">${bDate} · ${bTime}</div>
      <div class="person-header-meta">${bCity}</div>
      <div class="person-header-meta">${bType} · ${bProfile}</div>
    </div>
  </div>

  <div class="graph-card">
    <div class="graph-title">合圖 Body Graph</div>
    <div class="legend">
      <span class="legend-dot" style="background:#111111"></span>${nameA}（黑）
      <span class="legend-dot" style="background:${ACT_UNCONSCIOUS}"></span>${nameB}（紅）
    </div>
    <div class="graph-container">${svgMarkup}</div>
  </div>

  ${planetTable}
  ${themeSection}
  ${connSection}
  ${channelsSection}
  ${resonanceSection}
  ${authoritySection}

  <div class="footer"><p>© Retsnom</p></div>
</body>
</html>`
}

export async function downloadCompositePdf(result: CreateCompositeResult, mode: PdfThemeMode = 'light', chartName?: string | null): Promise<void> {
  const html = buildCompositeHtml(result, mode)
  const { uri } = await Print.printToFileAsync({ html, base64: false })
  const fallbackName = `${result.personA.name ?? 'A'} x ${result.personB.name ?? 'B'}`
  const filename = buildPdfFilename('合圖', chartName || fallbackName)
  await shareGeneratedPdf(uri, filename, '儲存或分享合圖分析報告')
}

function buildTransitHtml(result: CreateTransitResult, mode: PdfThemeMode): string {
  const { bg, ink, crimson, sub, cardBg, border, dimBg, altRow, paperDeep, accentBg } = pdfPalette(mode)
  const tc = mode === 'dark' ? darkColors : lightColors

  // 流日圖的黑/紅語意跟個人圖不同：黑＝個人（personality+design 都算），紅＝今日流日，
  // 兩者都激活時疊成條紋——這裡要跟畫面共用的 buildTransitBodyGraphProps() 算法完全一致，
  // 不能沿用 buildActivations() 預設的 personality/design 判斷法（那是給個人圖用的）
  const activations: Record<number, GateActivation> = {}
  for (const g of result.personalityGates) activations[g] = { ...activations[g], c: true }
  for (const g of result.designGates)      activations[g] = { ...activations[g], c: true }
  for (const g of result.transit.allGates) activations[g] = { ...activations[g], u: true }

  const svgChart: PendingChart = {
    name: '流日',
    birthDate: '', birthTime: '', birthCity: '', timezone: '',
    type: '', authority: '', profile: '', definition: '',
    centers: result.combined.definedCenterIds,
    channels: result.combined.definedChannelIds,
    gates: [],
  }
  const svgMarkup = buildBodyGraphSvg(svgChart, activations)

  const now = new Date()
  const ts  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

  // Format transit date
  const transitDate = result.transit.computedAt
    ? new Date(result.transit.computedAt).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : ts

  // 今日行星閘門：跟畫面（TransitView.tsx）一致，個人的潛意識/意識 + 今日流日三欄並排比較
  const transitPlanetsTable = result.transit.planets.length > 0
    ? section('今日行星閘門',
        `<table class="planet-table">
          <thead><tr>
            <th>行星</th>
            <th style="color:${tc.designRed}">潛意識</th>
            <th style="color:${ink}">意識</th>
            <th style="color:${tc.transitWarmText}">流日</th>
          </tr></thead>
          <tbody>
            ${result.transit.planets.map((tp, i) => {
              const pp = result.personalPlanets?.find(p => p.planetName === tp.planetName)
              return `<tr class="${i % 2 === 1 ? 'alt' : ''}">
                <td style="color:${sub}">${tp.planetName}</td>
                <td style="color:${tc.designRed};font-weight:700">${pp ? `${pp.design.gate}.${pp.design.line}` : '—'}</td>
                <td style="color:${ink};font-weight:700">${pp ? `${pp.personality.gate}.${pp.personality.line}` : '—'}</td>
                <td style="color:${tc.transitWarmText};font-weight:700">${tp.gate}.${tp.line}</td>
              </tr>`
            }).join('')}
          </tbody>
        </table>`)
    : ''

  // 流日影響：跟畫面（TransitView.tsx / TransitAnalysis.tsx 共用的 ImpactCard）一致，
  // 依 kind 分組成卡片（標籤 chips ＋ 固定說明文案），不是每個 layer 各自一行 label/detail
  const impactKinds = ['center-activated', 'new-channel', 'completing-channel'] as const
  const impactColor: Record<ImpactKind, string> = {
    'center-activated':   tc.em,
    'new-channel':        tc.transit,
    'completing-channel': tc.compro,
  }
  const impactCards = impactKinds.map(kind => {
    const items = result.impact.layers.filter(l => l.kind === kind)
    if (items.length === 0) return ''
    const color = impactColor[kind]
    return `<div class="impact-card" style="border-left-color:${color}">
      <div class="impact-kind" style="color:${color}">${IMPACT_LABEL[kind]}</div>
      <div class="impact-chips">${items.map(l => `<span class="impact-chip" style="background:${color}22;color:${color}">${l.label}</span>`).join('')}</div>
      <p class="impact-desc">${IMPACT_DESC[kind]}</p>
    </div>`
  }).join('')

  const impactSection = result.impact.layers.length > 0
    ? section('流日影響分析', impactCards)
    : section('流日影響分析', `<div class="impact-empty">今日流日對此圖表影響不顯著</div>`)

  const personalGateSet = new Set(result.personalGates)
  const transitOnlyGates = result.transit.allGates.filter(g => !personalGateSet.has(g))

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; background: ${bg}; color: ${ink}; padding: 28px 24px; max-width: 700px; margin: 0 auto; }
  h1  { color: ${crimson}; font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .meta { color: ${sub}; font-size: 12px; margin-bottom: 20px; }

  .graph-card { background: ${cardBg}; border: 1px solid ${border}; border-radius: 10px; overflow: hidden; margin-bottom: 14px; }
  .graph-title { color: ${sub}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 10px 14px 4px; }
  .graph-container { max-width: 460px; margin: 0 auto; }

  .section { background: ${cardBg}; border: 1px solid ${border}; border-radius: 10px; overflow: hidden; margin-bottom: 14px; }
  .section-title { background: ${dimBg}; padding: 7px 14px; font-size: 10px; font-weight: 700; color: ${sub}; text-transform: uppercase; letter-spacing: 0.8px; }
  .row { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 14px; border-bottom: 1px solid ${border}; }
  .row:last-child { border-bottom: none; }
  .label { color: ${sub}; font-size: 12px; }
  .value { color: ${ink}; font-size: 13px; font-weight: 600; text-align: right; max-width: 60%; }
  .accent { color: ${crimson}; }

  .tags { padding: 10px 14px; display: flex; flex-wrap: wrap; gap: 5px; }
  .tag { background: ${dimBg}; border: 1px solid ${border}; border-radius: 5px; padding: 2px 8px; font-size: 11px; color: ${sub}; }
  .tag-active { background: ${accentBg}; border-color: ${crimson}; color: ${crimson}; font-weight: 600; }
  .gate-tag { color: ${crimson}; font-weight: 700; }

  .planet-table { width: 100%; border-collapse: collapse; }
  .planet-table th { padding: 6px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 1px solid ${border}; }
  .planet-table td { padding: 6px 14px; font-size: 12px; }
  .planet-table tr.alt { background: ${altRow}; }

  .impact-card { border-left: 3px solid; padding: 10px 14px; border-bottom: 1px solid ${border}; }
  .impact-card:last-child { border-bottom: none; }
  .impact-kind { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
  .impact-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; }
  .impact-chip { border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
  .impact-desc { font-size: 12px; color: ${sub}; line-height: 1.5; }
  .impact-empty { padding: 10px 14px; font-size: 12px; color: ${sub}; }

  .legend { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 14px 8px; font-size: 11px; color: ${sub}; }
  .legend-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .legend-dot-stripe { background: repeating-linear-gradient(45deg, #111111 0px, #111111 2px, ${ACT_UNCONSCIOUS} 2px, ${ACT_UNCONSCIOUS} 4px); }

  .footer { margin-top: 20px; padding: 8px 0; background: ${paperDeep}; border-top: 1px solid ${ink}; border-radius: 8px 8px 0 0; text-align: center; color: ${sub}; font-size: 10px; }
</style>
</head>
<body>
  <h1>個人圖 × 今日流日分析</h1>
  <p class="meta">流日時間：${transitDate}</p>

  <!-- Body Graph -->
  <div class="graph-card">
    <div class="graph-title">個人 + 流日 Body Graph</div>
    <div class="legend">
      <span class="legend-dot" style="background:#111111"></span>個人
      <span class="legend-dot" style="background:${ACT_UNCONSCIOUS}"></span>流日
      <span class="legend-dot legend-dot-stripe"></span>共有
    </div>
    <div class="graph-container">${svgMarkup}</div>
  </div>

  <!-- 流日行星閘門 -->
  ${transitPlanetsTable}

  <!-- 流日影響分析 -->
  ${impactSection}

  <!-- 合成已定義中心 -->
  ${section(`合成已定義中心（${result.combined.definedCenterIds.length}）`, centerTagsFor(result.combined.definedCenterIds))}

  <!-- 合成定義通道 -->
  ${result.combined.definedChannelIds.length > 0 ? section(`合成定義通道（${result.combined.definedChannelIds.length}）`, channelTagsFor(result.combined.definedChannelIds)) : ''}

  <!-- 個人激活閘門 -->
  ${result.personalGates.length > 0 ? section(`個人激活閘門（${result.personalGates.length}）`, gateTags(result.personalGates)) : ''}

  <!-- 流日新增閘門 -->
  ${transitOnlyGates.length > 0 ? section(`今日流日新增閘門（${transitOnlyGates.length}）`, gateTags(transitOnlyGates)) : ''}

  <div class="footer"><p>© Retsnom</p></div>
</body>
</html>`
}

export async function downloadTransitPdf(result: CreateTransitResult, mode: PdfThemeMode = 'light', chartName?: string | null): Promise<void> {
  const html = buildTransitHtml(result, mode)
  const { uri } = await Print.printToFileAsync({ html, base64: false })
  const filename = buildPdfFilename('流日', chartName)
  await shareGeneratedPdf(uri, filename, '儲存或分享流日分析報告')
}
