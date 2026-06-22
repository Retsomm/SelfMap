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

export async function downloadCompositePdf(result: CreateCompositeResult): Promise<void> {
  // Build a minimal PendingChart to reuse downloadChartAsPdf's HTML renderer
  const aGates: number[] = []
  const bGates: number[] = []
  const channelIds: string[] = []
  for (const type of ['electromagnetic', 'companionship', 'compromise', 'dominance'] as const) {
    for (const conn of result[type]) {
      for (const g of conn.aGates) aGates.push(g)
      for (const g of conn.bGates) bGates.push(g)
      channelIds.push(conn.channelId)
    }
  }
  const allGates = [...new Set([...aGates, ...bGates])]
  const pendingChart: PendingChart = {
    name: `${result.personA.name ?? '人物 A'} × ${result.personB.name ?? '人物 B'}`,
    birthDate: `${result.personA.birthDate} ／ ${result.personB.birthDate}`,
    birthTime: '',
    birthCity: `${result.personA.birthCity} ／ ${result.personB.birthCity}`,
    timezone: '',
    type: '合圖（Composite）',
    authority: '',
    profile: `${result.personA.profile} ／ ${result.personB.profile}`,
    definition: `整合主題 ${result.integrationTheme}`,
    centers: result.compositeDefinedCenterIds,
    channels: channelIds,
    gates: allGates,
    personalityGates: [...new Set(aGates)],
    designGates: [...new Set(bGates)],
  }
  await downloadChartAsPdf(pendingChart)
}

export async function downloadTransitPdf(result: CreateTransitResult): Promise<void> {
  const pendingChart: PendingChart = {
    name: '個人 + 流日分析',
    birthDate: '',
    birthTime: '',
    birthCity: '',
    timezone: '',
    type: '流日合成（Transit）',
    authority: '',
    profile: '',
    definition: '',
    centers: result.combined.definedCenterIds,
    channels: result.combined.definedChannelIds,
    gates: [...new Set([...result.personalGates, ...result.transit.allGates])],
    personalityGates: result.personalityGates,
    designGates: result.designGates,
  }
  await downloadChartAsPdf(pendingChart)
}
