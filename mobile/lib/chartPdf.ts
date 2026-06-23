import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import {
  ACT_CONSCIOUS,
  ACT_UNCONSCIOUS,
  CENTER_ORDER,
  CENTERS_GEOM,
  HD_CHANNELS,
  HD_GATES,
  HD_PALETTE,
  INTEGRATION_PAIRS,
} from './hd-chart-data'
import { findChannelById } from './hd-normalizers'
import {
  STRATEGY_MAP,
  SIGNATURE_MAP,
  AUTHORITY_TIP,
  CENTER_NAME,
  ALL_CENTER_IDS,
  normalizeCenterAlias,
} from './hd-constants'
import type { PendingChart } from './pendingChart'
import type { CreateCompositeResult, CreateTransitResult } from './api'

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

function buildBodyGraphSvg(chart: PendingChart): string {
  const act = buildActivations(chart)
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

function buildHtml(chart: PendingChart): string {
  const bg      = '#efe5d0'
  const ink     = '#2b1f14'
  const crimson = '#c8553d'
  const sub     = '#6b5a44'
  const cardBg  = '#faf7f0'
  const border  = '#c8b99a'
  const dimBg   = '#e7d9bd'

  const svgMarkup = buildBodyGraphSvg(chart)

  const row = (label: string, value: string, accent = false) =>
    `<div class="row"><span class="label">${label}</span><span class="value${accent ? ' accent' : ''}">${value}</span></div>`

  const tags = (items: string[]) =>
    `<div class="tags">${items.map(i => `<span class="tag">${i}</span>`).join('')}</div>`

  const gateTags = (gates: number[]) =>
    `<div class="tags">${gates.map(g => `<span class="tag gate-tag">${g}</span>`).join('')}</div>`

  const section = (title: string, body: string) =>
    `<div class="section"><div class="section-title">${title}</div>${body}</div>`

  const now = new Date()
  const ts  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

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

  .section { background: ${cardBg}; border: 1px solid ${border}; border-radius: 10px; overflow: hidden; margin-bottom: 14px; }
  .section-title { background: ${dimBg}; padding: 7px 14px; font-size: 10px; font-weight: 700; color: ${sub}; text-transform: uppercase; letter-spacing: 0.8px; }
  .row { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 14px; border-bottom: 1px solid #ede4d6; }
  .row:last-child { border-bottom: none; }
  .label { color: ${sub}; font-size: 12px; }
  .value { color: ${ink}; font-size: 13px; font-weight: 600; text-align: right; max-width: 60%; }
  .accent { color: ${crimson}; }

  .tags { padding: 10px 14px; display: flex; flex-wrap: wrap; gap: 5px; }
  .tag { background: ${dimBg}; border: 1px solid ${border}; border-radius: 5px; padding: 2px 8px; font-size: 11px; color: ${sub}; }
  .gate-tag { color: ${crimson}; font-weight: 700; }

  .planet-table { width: 100%; border-collapse: collapse; }
  .planet-table th { padding: 6px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 1px solid ${border}; }
  .planet-table td { padding: 6px 14px; font-size: 12px; }
  .planet-table tr.alt { background: #f7f0e5; }

  .arrows-table { width: 100%; border-collapse: collapse; }
  .arrows-table th { padding: 5px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 1px solid ${border}; color: ${sub}; }
  .arrows-table td { padding: 7px 12px; font-size: 12px; vertical-align: top; }
  .arrows-table tr.alt { background: #f7f0e5; }
  .arrows-table .dir { font-size: 18px; font-weight: 700; color: ${crimson}; width: 28px; text-align: center; }
  .arrows-table .cat { font-size: 11px; color: ${sub}; min-width: 80px; }
  .arrows-table .cat small { font-size: 10px; display: block; }
  .arrows-table .val { font-weight: 700; color: ${ink}; min-width: 80px; }
  .arrows-table .desc { color: ${sub}; font-size: 11px; line-height: 1.4; }

  .legend { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 14px 8px; font-size: 11px; color: ${sub}; }
  .legend-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }

  .footer { margin-top: 24px; text-align: center; color: ${sub}; font-size: 10px; }
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
    ${svgMarkup}
  </div>

  <!-- 設計核心 -->
  ${section('設計核心',
    row('能量類型', chart.type, true) +
    row('內在權威', chart.authority, true) +
    row('人生角色', chart.profile) +
    row('定義',    chart.definition)
  )}

  <!-- 已定義中心 -->
  ${chart.centers.length > 0 ? section(`已定義中心（${chart.centers.length}）`, tags(chart.centers)) : ''}

  <!-- 定義通道 -->
  ${chart.channels.length > 0 ? section(`定義通道（${chart.channels.length}）`, tags(chart.channels)) : ''}

  <!-- 行星對照 -->
  ${planetsSection}

  <!-- 輪迴交叉 -->
  ${crossSection}

  <!-- 四箭頭 -->
  ${arrowsSection}

  <!-- 激活閘門 -->
  ${section(`激活閘門（${chart.gates.length}）`, gateTags(chart.gates))}

  <div class="footer"><p>© Retsnom · SelfMap · ${ts}</p></div>
</body>
</html>`
}

// ─── Public exports ────────────────────────────────────────────────────────────

export async function downloadChartAsPdf(chart: PendingChart): Promise<void> {
  const html = buildHtml(chart)
  const { uri } = await Print.printToFileAsync({ html, base64: false })

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: '儲存或分享人類圖報告',
      UTI: 'com.adobe.pdf',
    })
  } else {
    const { Alert } = await import('react-native')
    Alert.alert('PDF 已產生', `報告已儲存至：${uri}`)
  }
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

  return `以下是我的 Human Design（人類圖）資料，請根據這些資料為我進行深度解讀：

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

請從類型策略、人生角色、決策權威、輪迴交叉等角度綜合解讀，並給出實際生活中可應用的建議。`
}

// ─── Composite / Transit prompt ───────────────────────────────────────────────

export function generateCompositeAiPrompt(result: CreateCompositeResult): string {
  const fmt = (conn: Array<{ channelId: string }>) =>
    conn.length > 0 ? conn.map(c => c.channelId).join('、') : '無'

  const personALabel = result.personA.name ?? '人物 A'
  const personBLabel = result.personB.name ?? '人物 B'

  return `以下是兩人的 Human Design（人類圖）合圖資料，請根據這些資料進行深度的合圖關係解讀：

【${personALabel}】
出生資料：${result.personA.birthDate}，${result.personA.birthCity}
能量類型：${result.personA.type}
人生角色：${result.personA.profile}

【${personBLabel}】
出生資料：${result.personB.birthDate}，${result.personB.birthCity}
能量類型：${result.personB.type}
人生角色：${result.personB.profile}

【合圖整合主題】
${result.integrationTheme}（已定義 ${result.compositeDefinedCount} / 9 中心，開放 ${result.compositeOpenCount} 中心）

【人生角色共鳴爻線】
${result.profileResonance.length > 0 ? result.profileResonance.join('、') + ' 爻' : '無'}

【通道連結動態】
電磁連結：${fmt(result.electromagnetic)}
陪伴連結：${fmt(result.companionship)}
妥協連結：${fmt(result.compromise)}
支配連結：${fmt(result.dominance)}

請從以下角度進行合圖分析：
1. 兩人類型與策略的互動模式
2. 人生角色的共鳴與互補
3. 電磁、陪伴、妥協、支配等通道連結動力
4. 整體能量場整合度，並給出實際相處建議。`
}

export function generateTransitAiPrompt(result: CreateTransitResult): string {
  const planetRows = result.transit.planets
    .map(p => `  ${p.planetName}：${p.gate}.${p.line}`)
    .join('\n')

  const personalCenters = result.personalDefinedCenterIds.map(id => CENTER_NAME[id] ?? id).join('、') || '無'
  const transitCenters  = result.transit.definedCenterIds.map(id => CENTER_NAME[id] ?? id).join('、') || '無'

  const impactRows = result.impact.layers.length > 0
    ? result.impact.layers.map(l => `  ${l.label}：${l.detail}`).join('\n')
    : '  今日流日對此圖表影響不顯著'

  return `以下是我的個人人類圖與今日流日的合成分析資料，請根據這些資料進行流日解讀：

【個人圖資料】
已定義中心：${personalCenters}
已定義通道：${result.personalDefinedChannelIds.join('、') || '無'}
激活閘門數：${result.personalGates.length}

【今日流日行星閘門】
${planetRows}

【今日流日定義中心】
${transitCenters}

【流日影響分析】
${impactRows}

請解讀今日流日對我的影響，包括：
1. 流日激活了哪些空白中心，有什麼暫時的能量體驗
2. 新增的流日通道帶來什麼機會或挑戰
3. 如何善用今日流日的能量進行決策與行動建議。`
}

// ─── Composite / Transit PDF download ────────────────────────────────────────

const COMPOSITE_THEME_CFG: Record<string, { label: string; love: string; work: string }> = {
  '9+0':  { label: '全滿（9+0）— Nowhere to go',    love: '極度甜蜜與黏人。能量場完全自給自足，外人很難融入。兩人會深深沉浸在彼此的世界中，但也容易因為缺乏外在刺激而感到窒息或過度封閉。', work: '過於封閉。團隊內部可能非常有默契，但極易忽略外部市場的變化或同事、客戶的客觀意見。' },
  '8+1':  { label: '8+1 — Have some fun',            love: '最舒服的互動模式。彼此有足夠的能量連結，同時留有「空白」作為陽光照進來的窗口。雙方擁有各自呼吸與消化的空間，關係健康且長久。',     work: '黃金搭檔。既有共同努力的交集，又有一起去體驗、探索外部世界的窗口。' },
  '7+2':  { label: '7+2 — Work to do',               love: '最舒服的互動模式之一。保有兩個空白中心，彼此連結同時仍有足夠的獨立呼吸空間，長期相處不易窒息。',                                 work: '黃金搭檔。既有共同努力的交集，又有兩扇開放的窗口迎接外在刺激與機會。' },
  '6+3+': { label: '6+3+ — Better to be free',       love: '連結感較淡。兩人在一起時仍有太多未定因素，容易流於平淡或像朋友。通常需要藉由共同的興趣、小孩或外在媒介來維繫緊密感。',         work: '適合團隊合作。保持高度的獨立性與自由度，不會對彼此造成過度制約，適合鬆散型的專案合作或大團隊中的平行分工。' },
}

const COMPOSITE_LINE_RESONANCE: { line: number; label: string; desc: string }[] = [
  { line: 1, label: '1 爻共鳴', desc: '兩人都需要足夠的安全感與底層研究，能深深理解彼此打基礎的必要。' },
  { line: 2, label: '2 爻共鳴', desc: '兩人都需要獨處與等待被呼喚的空間，彼此能體諒對方的隱士特質。' },
  { line: 3, label: '3 爻共鳴', desc: '兩人都能理解試錯與碰撞的學習過程，不會因為失敗而互相責備。' },
  { line: 4, label: '4 爻共鳴', desc: '兩人都重視人脈與穩定的社群，能在圈子建設上形成默契。' },
  { line: 5, label: '5 爻共鳴', desc: '兩人都帶有被投射的特質，需要互相留意實際的期待落差。' },
  { line: 6, label: '6 爻共鳴', desc: '兩人都有長遠的人生週期觀，能理解彼此不同階段的冷靜與退後。' },
]

function buildCompositeHtml(result: CreateCompositeResult): string {
  const bg      = '#efe5d0'
  const ink     = '#2b1f14'
  const crimson = '#c8553d'
  const sub     = '#6b5a44'
  const cardBg  = '#faf7f0'
  const border  = '#c8b99a'
  const dimBg   = '#e7d9bd'

  const nameA = escapeHtml(result.personA.name ?? 'A')
  const nameB = escapeHtml(result.personB.name ?? 'B')
  const aDate    = escapeHtml(result.personA.birthDate)
  const aTime    = escapeHtml(result.personA.birthTime)
  const aCity    = escapeHtml(result.personA.birthCity)
  const aType    = escapeHtml(result.personA.type)
  const aProfile = escapeHtml(result.personA.profile)
  const aAuth    = escapeHtml(result.personA.authority)
  const aAuthTip = result.personA.authorityTip ? escapeHtml(result.personA.authorityTip) : ''
  const bDate    = escapeHtml(result.personB.birthDate)
  const bTime    = escapeHtml(result.personB.birthTime)
  const bCity    = escapeHtml(result.personB.birthCity)
  const bType    = escapeHtml(result.personB.type)
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

  const section = (title: string, body: string) =>
    `<div class="section"><div class="section-title">${title}</div>${body}</div>`

  const now = new Date()
  const ts  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

  const theme = COMPOSITE_THEME_CFG[result.integrationTheme] ?? COMPOSITE_THEME_CFG['6+3+']

  const CONN_META = {
    electromagnetic: { label: '電磁關係 (Electromagnetic)', color: '#c8553d', desc: '互補吸引 — 一方有 A 閘門，另一方有 B 閘門，合力激活完整通道。最經典的「致命吸引力」，容易一見鍾情但也容易相愛相殺。' },
    companionship:   { label: '陪伴關係 (Companionship)',   color: '#3a8c6e', desc: '默契安全 — 兩人擁有相同的閘門或通道，相處起來最不費力，如靈魂伴侶或老朋友。' },
    compromise:      { label: '妥協關係 (Compromise)',      color: '#8a6ba8', desc: '關係摩擦源 — 一方擁有完整通道，另一方只有其中一個閘門，長期易累積委屈與不平衡感。' },
    dominance:       { label: '支配關係 (Dominance)',       color: '#6b5a44', desc: '單向引導 — 一方在某條通道有能量，另一方完全開放，空白的那方會單向受到能量制約。' },
  } as const

  const planetTable = (result.personA.planets?.length ?? 0) > 0
    ? section('行星閘門對照',
        `<table class="planet-table">
          <thead><tr>
            <th>行星</th>
            <th style="color:${crimson}">${nameA} 意識（黑）</th>
            <th style="color:${crimson}">潛意識（紅）</th>
            <th style="color:${ink}">${nameB} 意識（黑）</th>
            <th style="color:${ink}">潛意識（紅）</th>
          </tr></thead>
          <tbody>${(result.personA.planets ?? []).map((p, i) => {
            const pb = result.personB.planets?.[i]
            return `<tr class="${i % 2 === 1 ? 'alt' : ''}">
              <td style="color:${sub}">${p.name}</td>
              <td style="color:${crimson};font-weight:700">${p.blackGate}.${p.blackLine}</td>
              <td style="color:${crimson}">${p.redGate}.${p.redLine}</td>
              <td style="color:${ink};font-weight:700">${pb?.blackGate ?? '—'}.${pb?.blackLine ?? ''}</td>
              <td style="color:${ink}">${pb?.redGate ?? '—'}.${pb?.redLine ?? ''}</td>
            </tr>`
          }).join('')}</tbody>
        </table>`)
    : ''

  const themeSection = section('能量場整合主題',
    `<div class="stat-row">
      <div class="stat-box"><div class="stat-num">${result.integrationTheme}</div><div class="stat-label">整合主題</div></div>
      <div class="stat-box"><div class="stat-num">${result.compositeDefinedCount}</div><div class="stat-label">已定義中心</div></div>
      <div class="stat-box"><div class="stat-num" style="color:${sub}">${result.compositeOpenCount}</div><div class="stat-label">開放中心</div></div>
    </div>
    <div class="theme-label">${theme.label}</div>
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
              <span class="conn-id" style="color:${cfg.color}">${conn.channelId}</span>
              <span class="conn-gates">${nameA}：${conn.aGates.length ? conn.aGates.join(', ') : '—'} ／ ${nameB}：${conn.bGates.length ? conn.bGates.join(', ') : '—'}</span>
            </div>`
          ).join('')
      return `<div class="conn-group">
        <div class="conn-header">
          <span class="conn-title" style="color:${cfg.color}">${cfg.label}（${items.length}）</span>
          <span class="conn-desc">${cfg.desc}</span>
        </div>${rows}</div>`
    }).join('')
  )

  const definedChIds = result.compositeDefinedChannelIds ?? []
  const channelsSection = definedChIds.length > 0
    ? section(`合圖定義通道（${definedChIds.length}）`,
        `<div class="tags">${definedChIds.map(ch => `<span class="tag">${ch}</span>`).join('')}</div>`)
    : ''

  const resonanceItems = COMPOSITE_LINE_RESONANCE.filter(lr => result.profileResonance?.includes(lr.line))
  const resonanceSection = section('人生角色共鳴',
    `<div class="profile-names">
      <span style="color:${crimson};font-weight:700">${nameA} ${aProfile}</span>
      <span style="font-weight:700">${nameB} ${bProfile}</span>
    </div>` + (resonanceItems.length === 0
      ? `<p class="resonance-none">兩人人生角色沒有共同爻線，各自的觀點框架較為不同。</p>`
      : resonanceItems.map(lr =>
          `<div class="resonance-row"><span class="resonance-label">${lr.label}</span><span class="resonance-desc">${lr.desc}</span></div>`
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
  .section { background: ${cardBg}; border: 1px solid ${border}; border-radius: 10px; overflow: hidden; margin-bottom: 14px; }
  .section-title { background: ${dimBg}; padding: 7px 14px; font-size: 10px; font-weight: 700; color: ${sub}; text-transform: uppercase; letter-spacing: 0.8px; }
  .stat-row { display: flex; gap: 10px; padding: 12px 14px; }
  .stat-box { flex: 1; background: ${bg}; border-radius: 8px; padding: 10px; text-align: center; }
  .stat-num { font-size: 22px; font-weight: 800; color: ${crimson}; }
  .stat-label { font-size: 11px; color: ${sub}; margin-top: 2px; }
  .theme-label { padding: 4px 14px 8px; font-size: 15px; font-weight: 700; color: ${crimson}; }
  .theme-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 14px 14px; }
  .theme-block { background: ${bg}; border-radius: 8px; padding: 10px; }
  .theme-block-title { font-size: 10px; font-weight: 700; color: ${sub}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
  .theme-block-text { font-size: 12px; color: ${sub}; line-height: 1.6; }
  .conn-group { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin: 6px 14px; }
  .conn-header { padding: 8px 12px; background: #f7f0e5; }
  .conn-title { font-size: 12px; font-weight: 700; display: block; margin-bottom: 2px; }
  .conn-desc { font-size: 11px; color: ${sub}; }
  .conn-row { display: flex; gap: 8px; padding: 6px 12px; font-size: 12px; }
  .conn-row.alt { background: ${bg}; }
  .conn-id { font-weight: 700; min-width: 60px; }
  .conn-gates { color: ${sub}; }
  .conn-empty { padding: 8px 12px; font-size: 12px; color: ${sub}; }
  .tags { padding: 10px 14px; display: flex; flex-wrap: wrap; gap: 5px; }
  .tag { background: ${dimBg}; border: 1px solid ${border}; border-radius: 5px; padding: 2px 8px; font-size: 11px; color: ${sub}; }
  .planet-table { width: 100%; border-collapse: collapse; }
  .planet-table th { padding: 5px 8px; font-size: 10px; font-weight: 700; text-align: left; border-bottom: 1px solid ${border}; }
  .planet-table td { padding: 5px 8px; font-size: 11px; }
  .planet-table tr.alt { background: #f7f0e5; }
  .profile-names { display: flex; gap: 16px; padding: 10px 14px; border-bottom: 1px solid #ede4d6; font-size: 14px; }
  .resonance-row { padding: 8px 14px; border-bottom: 1px solid #ede4d6; }
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
  .footer { margin-top: 24px; text-align: center; color: ${sub}; font-size: 10px; }
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
    ${svgMarkup}
  </div>

  ${planetTable}
  ${themeSection}
  ${connSection}
  ${channelsSection}
  ${resonanceSection}
  ${authoritySection}

  <div class="footer"><p>© Retsnom · SelfMap · ${ts}</p></div>
</body>
</html>`
}

export async function downloadCompositePdf(result: CreateCompositeResult): Promise<void> {
  const html = buildCompositeHtml(result)
  const { uri } = await Print.printToFileAsync({ html, base64: false })

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: '儲存或分享合圖分析報告',
      UTI: 'com.adobe.pdf',
    })
  } else {
    const { Alert } = await import('react-native')
    Alert.alert('PDF 已產生', `報告已儲存至：${uri}`)
  }
}

function buildTransitHtml(result: CreateTransitResult): string {
  const bg      = '#efe5d0'
  const ink     = '#2b1f14'
  const crimson = '#c8553d'
  const sub     = '#6b5a44'
  const cardBg  = '#faf7f0'
  const border  = '#c8b99a'
  const dimBg   = '#e7d9bd'

  // Bodygraph: personal gates keep personality/design colour; transit-only gates shown as conscious
  const svgChart: PendingChart = {
    name: '流日',
    birthDate: '', birthTime: '', birthCity: '', timezone: '',
    type: '', authority: '', profile: '', definition: '',
    centers: result.combined.definedCenterIds,
    channels: result.combined.definedChannelIds,
    gates: [...new Set([...result.personalGates, ...result.transit.allGates])],
    personalityGates: result.personalityGates,
    designGates: result.designGates,
  }
  const svgMarkup = buildBodyGraphSvg(svgChart)

  const row = (label: string, value: string, accent = false) =>
    `<div class="row"><span class="label">${label}</span><span class="value${accent ? ' accent' : ''}">${value}</span></div>`

  const tags = (items: string[]) =>
    `<div class="tags">${items.map(i => `<span class="tag">${i}</span>`).join('')}</div>`

  const gateTags = (gates: number[]) =>
    `<div class="tags">${gates.map(g => `<span class="tag gate-tag">${g}</span>`).join('')}</div>`

  const section = (title: string, body: string) =>
    `<div class="section"><div class="section-title">${title}</div>${body}</div>`

  const now = new Date()
  const ts  = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

  // Format transit date
  const transitDate = result.transit.computedAt
    ? new Date(result.transit.computedAt).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : ts

  // Transit planets table
  const transitPlanetsTable = result.transit.planets.length > 0
    ? section('今日流日行星閘門',
        `<table class="planet-table">
          <thead><tr>
            <th>行星</th>
            <th style="color:${crimson}">閘門.爻</th>
          </tr></thead>
          <tbody>
            ${result.transit.planets.map((p, i) =>
              `<tr class="${i % 2 === 1 ? 'alt' : ''}">
                <td style="color:${sub}">${p.planetName}</td>
                <td style="color:${crimson};font-weight:700">${p.gate}.${p.line}</td>
              </tr>`
            ).join('')}
          </tbody>
        </table>`)
    : ''

  // Impact analysis
  const impactSection = result.impact.layers.length > 0
    ? section('流日影響分析',
        result.impact.layers.map(l =>
          `<div class="impact-row"><span class="impact-label">${l.label}</span><span class="impact-detail">${l.detail}</span></div>`
        ).join('')
      )
    : ''

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

  .section { background: ${cardBg}; border: 1px solid ${border}; border-radius: 10px; overflow: hidden; margin-bottom: 14px; }
  .section-title { background: ${dimBg}; padding: 7px 14px; font-size: 10px; font-weight: 700; color: ${sub}; text-transform: uppercase; letter-spacing: 0.8px; }
  .row { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 14px; border-bottom: 1px solid #ede4d6; }
  .row:last-child { border-bottom: none; }
  .label { color: ${sub}; font-size: 12px; }
  .value { color: ${ink}; font-size: 13px; font-weight: 600; text-align: right; max-width: 60%; }
  .accent { color: ${crimson}; }

  .tags { padding: 10px 14px; display: flex; flex-wrap: wrap; gap: 5px; }
  .tag { background: ${dimBg}; border: 1px solid ${border}; border-radius: 5px; padding: 2px 8px; font-size: 11px; color: ${sub}; }
  .gate-tag { color: ${crimson}; font-weight: 700; }

  .planet-table { width: 100%; border-collapse: collapse; }
  .planet-table th { padding: 6px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 1px solid ${border}; }
  .planet-table td { padding: 6px 14px; font-size: 12px; }
  .planet-table tr.alt { background: #f7f0e5; }

  .impact-row { padding: 8px 14px; border-bottom: 1px solid #ede4d6; display: flex; flex-direction: column; gap: 2px; }
  .impact-row:last-child { border-bottom: none; }
  .impact-label { font-size: 12px; font-weight: 700; color: ${crimson}; }
  .impact-detail { font-size: 12px; color: ${sub}; line-height: 1.5; }

  .legend { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 14px 8px; font-size: 11px; color: ${sub}; }
  .legend-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }

  .footer { margin-top: 24px; text-align: center; color: ${sub}; font-size: 10px; }
</style>
</head>
<body>
  <h1>個人圖 × 今日流日分析</h1>
  <p class="meta">流日時間：${transitDate}</p>

  <!-- Body Graph -->
  <div class="graph-card">
    <div class="graph-title">合成 Body Graph（個人 + 流日）</div>
    <div class="legend">
      <span class="legend-dot" style="background:#111111"></span>個人意識（黑）
      <span class="legend-dot" style="background:${ACT_UNCONSCIOUS}"></span>個人潛意識（紅）
    </div>
    ${svgMarkup}
  </div>

  <!-- 流日行星閘門 -->
  ${transitPlanetsTable}

  <!-- 流日影響分析 -->
  ${impactSection}

  <!-- 合成已定義中心 -->
  ${result.combined.definedCenterIds.length > 0 ? section(`合成已定義中心（${result.combined.definedCenterIds.length}）`, tags(result.combined.definedCenterIds)) : ''}

  <!-- 合成定義通道 -->
  ${result.combined.definedChannelIds.length > 0 ? section(`合成定義通道（${result.combined.definedChannelIds.length}）`, tags(result.combined.definedChannelIds)) : ''}

  <!-- 個人激活閘門 -->
  ${result.personalGates.length > 0 ? section(`個人激活閘門（${result.personalGates.length}）`, gateTags(result.personalGates)) : ''}

  <!-- 流日新增閘門 -->
  ${transitOnlyGates.length > 0 ? section(`今日流日新增閘門（${transitOnlyGates.length}）`, gateTags(transitOnlyGates)) : ''}

  <div class="footer"><p>© Retsnom · SelfMap · ${ts}</p></div>
</body>
</html>`
}

export async function downloadTransitPdf(result: CreateTransitResult): Promise<void> {
  const html = buildTransitHtml(result)
  const { uri } = await Print.printToFileAsync({ html, base64: false })

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: '儲存或分享流日分析報告',
      UTI: 'com.adobe.pdf',
    })
  } else {
    const { Alert } = await import('react-native')
    Alert.alert('PDF 已產生', `報告已儲存至：${uri}`)
  }
}
