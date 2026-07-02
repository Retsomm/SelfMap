import { fmtCenterName } from '@/utils/format'
import type { CompositeAnalysis, ConnectionDynamic } from '@/lib/compositeAnalysis'
import {
  CENTER_INFO,
  TYPE_LABELS,
  PROFILE_LABELS,
  STRATEGY_MAP,
  SIGNATURE_MAP,
  CROSS_TYPE_LABELS,
  CHANNEL_DEFS,
  type AuthorityInfo,
  type HumanDesignType,
  type CenterName,
  type ChannelDef,
  type IncarnationCross,
  type VariablesResult,
  type ProfileResult,
  type PlanetRow,
} from '@/lib/humanDesign'

export interface HdResult {
  jd: number
  designJd: number
  utcTime: string
  designUtcTime: string
  planets: PlanetRow[]
  profile: ProfileResult
  type: HumanDesignType
  authority: AuthorityInfo
  definedCenterIds: Set<CenterName>
  definedChannels: ChannelDef[]
  allGates: Set<number>
  incarnationCross: IncarnationCross
  variables: VariablesResult
  definition: { raw: string; label: string }
}

/** 將 HdResult 組合成可直接貼給 AI 的人類圖解讀 prompt。 */
export const buildAiPrompt = (r: HdResult): string => {
  // 優先使用 CROSS_TYPE_LABELS 對照表，找不到則回退為原始 crossType 值
  const crossLabel =
    (CROSS_TYPE_LABELS[r.incarnationCross.crossType] ?? r.incarnationCross.crossType) +
    '之' + r.incarnationCross.crossName
  // 依 definedCenterIds 成員資格拆分已定義／開放中心
  const definedCenters = (Object.keys(CENTER_INFO) as CenterName[]).filter(id => r.definedCenterIds.has(id))
  const openCenters = (Object.keys(CENTER_INFO) as CenterName[]).filter(id => !r.definedCenterIds.has(id))
  // 通道以「閘門 id（中心A—中心B）」格式呈現，空白時回退為「無」
  const channels =
    r.definedChannels
      .map(ch => `${ch.id}（${fmtCenterName(CENTER_INFO[ch.centerA].name)}—${fmtCenterName(CENTER_INFO[ch.centerB].name)}）`)
      .join('、') || '無'
  // 行星閘門列：每行依序呈現 Personality（黑）與 Design（紅）位置，空陣列時回退為「無」
  const planetRows = (!r.planets || r.planets.length === 0)
    ? '  無'
    : r.planets
        .map(p => `  ${p.planetName}：Personality ${p.black.full} ／ Design ${p.red.full}`)
        .join('\n')

  return `以下是我的 Human Design（人類圖）資料，請根據這些資料為我進行深度解讀。
請只根據我提供的資料分析，不要自行推算或補充未提供的閘門、爻線與通道。
若發現資料之間有矛盾，請直接指出，不要強行解釋。

【類型 Type】
${r.type}（${TYPE_LABELS[r.type] ?? ''}）
策略：${STRATEGY_MAP[r.type] ?? '—'}
正向標誌：${SIGNATURE_MAP[r.type]?.positive ?? '—'} ／ 負向標誌：${SIGNATURE_MAP[r.type]?.negative ?? '—'}

【人生角色 Profile】
${r.profile.profile}（${PROFILE_LABELS[r.profile.profile] ?? '—'}）

【決策權威 Authority】
${r.authority.name}
${r.authority.tip}

【定義 Definition】
${r.definition.label}（${r.definition.raw}）
已定義 ${r.definedCenterIds.size} / 9 中心，激活 ${r.allGates.size} 閘門

【輪迴交叉 Incarnation Cross】
${crossLabel}
閘門組合：${r.incarnationCross.gatesLabel}

【四箭頭 Variables】
飲食方式（Digestion）：${r.variables.digestion.label} — ${r.variables.digestion.description}
適合環境（Environment）：${r.variables.environment.label} — ${r.variables.environment.description}
觀點（Perspective）：${r.variables.perspective.label} — ${r.variables.perspective.description}
思考動機（Motivation）：${r.variables.motivation.label} — ${r.variables.motivation.description}

【已定義能量中心】
${definedCenters.map(id => CENTER_INFO[id].name).join('、') || '無'}

【開放能量中心】
${openCenters.map(id => CENTER_INFO[id].name).join('、') || '無'}

【已定義通道 Defined Channels】
${channels}

【行星閘門 Planetary Gates】
${planetRows}

請依照以下結構解讀：

1. 核心設計總覽：
   用一段話說明我這張圖的整體主軸（類型 × 人生角色 × 輪迴交叉
   如何構成我的人生方向）。

2. 類型與策略：
   ${r.type}「${STRATEGY_MAP[r.type] ?? '—'}」在我的圖中具體是什麼樣子？
   哪些領域的邀請對我特別重要？${SIGNATURE_MAP[r.type]?.negative ?? '負向標誌'}感通常會從哪裡冒出來？

3. 決策權威實際操作：
   ${r.authority.name}在日常中如何辨識？請給出「這是真正的權威訊號」vs
   「這是頭腦假裝的訊號」的具體分辨方法，
   並結合我開放的能量中心，說明我容易被什麼帶偏。

4. ${r.definition.label}的課題：
   請說明我的定義中心之間的關係、是否存在缺口與橋接閘門，
   以及這會如何影響我對特定人事物的依賴。

5. 人生角色 ${r.profile.profile} 的運作方式：
   兩條爻線分別代表的行為模式如何搭配？
   這對我理解自己的成長歷程有什麼意義？

6. 通道與重要閘門：
   逐一解讀我已定義的通道（${channels}）的天賦與陰影面。
   行星閘門請聚焦在太陽/地球軸，其餘行星挑對主題有顯著影響的講即可，不必逐一羅列。

7. 開放中心的制約課題：
   在我開放的中心中，挑出對我影響最大的 2-3 個，
   深入說明「非自己」的行為長什麼樣子，
   以及我可以用什麼問句自我檢查。

8. 四箭頭的生活應用：
   ${r.variables.digestion.label}飲食、${r.variables.environment.label}環境、${r.variables.perspective.label}觀點、${r.variables.motivation.label}動機，
   分別給出一個具體可執行的生活調整。

9. 總結：
   給我 3-5 點依重要性排序的實際建議，
   每一點都要對應到前面的分析，不要泛泛而談。`
}

export interface TransitAiInput {
  planets: { planetName: string; gate: number; line: number; full: string }[]
  allGates: Set<number>
  definedCenterIds: Set<CenterName>
  definedChannels: ChannelDef[]
  computedAt: string
}

/** 將個人圖 + 流日資料組合成可直接貼給 AI 的流日解讀 prompt。 */
export const buildTransitAiPrompt = (personal: HdResult, transit: TransitAiInput): string => {
  const personalDefinedCenters = (Object.keys(CENTER_INFO) as CenterName[]).filter(id => personal.definedCenterIds.has(id))
  const personalChannels = personal.definedChannels
    .map(ch => `${ch.id}（${fmtCenterName(CENTER_INFO[ch.centerA].name)}—${fmtCenterName(CENTER_INFO[ch.centerB].name)}）`)
    .join('、') || '無'
  const personalGates = [...personal.allGates].sort((a, b) => a - b).join('、') || '無'

  const openActivated = (Object.keys(CENTER_INFO) as CenterName[]).filter(
    id => !personal.definedCenterIds.has(id) && transit.definedCenterIds.has(id)
  )
  const sharedGates = [...transit.allGates].filter(g => personal.allGates.has(g)).sort((a, b) => a - b)
  const transitChannels = transit.definedChannels
    .map(ch => `${ch.id}（${fmtCenterName(CENTER_INFO[ch.centerA].name)}—${fmtCenterName(CENTER_INFO[ch.centerB].name)}）`)
    .join('、') || '無'

  // 個人擁有其中一個閘門、流日補上另一個閘門而合成的新通道
  const personalChannelIds = new Set(personal.definedChannels.map(ch => ch.id))
  const completingChannels = CHANNEL_DEFS
    .filter(ch => !personalChannelIds.has(ch.id))
    .map(ch => {
      const aInPersonal = personal.allGates.has(ch.gateA)
      const bInPersonal = personal.allGates.has(ch.gateB)
      const aInTransit = transit.allGates.has(ch.gateA)
      const bInTransit = transit.allGates.has(ch.gateB)
      if (aInPersonal && !bInPersonal && bInTransit) return `${ch.id}（個人 ${ch.gateA} + 流日 ${ch.gateB}）`
      if (bInPersonal && !aInPersonal && aInTransit) return `${ch.id}（個人 ${ch.gateB} + 流日 ${ch.gateA}）`
      return null
    })
    .filter((s): s is string => s !== null)
    .join('、') || '無'

  const transitDate = (() => {
    try {
      return new Date(transit.computedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    } catch { return transit.computedAt }
  })()

  const sunGate = transit.planets.find(p => p.planetName === '太陽')
  const earthGate = transit.planets.find(p => p.planetName === '地球')
  const sunEarthAxis = sunGate && earthGate ? `${sunGate.gate}-${earthGate.gate}` : '—'

  const openActivatedLabel = openActivated.length > 0 ? openActivated.map(id => CENTER_INFO[id].name).join('、') : '無'
  const sharedGatesLabel = sharedGates.length > 0 ? sharedGates.join('、') : '無'

  return `以下是我的個人人類圖與今日流日資料，請進行深度流日解讀。
請只根據我提供的資料分析，不要自行推算未提供的閘門、通道或中心。

【個人人類圖】
類型：${personal.type}（${TYPE_LABELS[personal.type] ?? ''}）
人生角色：${personal.profile.profile}（${PROFILE_LABELS[personal.profile.profile] ?? '—'}）
決策權威：${personal.authority.name}
已定義中心：${personalDefinedCenters.map(id => CENTER_INFO[id].name).join('、') || '無'}
已定義通道：${personalChannels}
個人激活閘門：${personalGates}

【流日時間】
${transitDate}（台北時間）

【流日行星閘門】
${transit.planets.map(p => `  ${p.planetName}：${p.full}`).join('\n')}

【疊加分析資料】
個人與流日共有閘門：${sharedGatesLabel}
流日獨立形成的通道：${transitChannels}
個人閘門+流日閘門合成的新通道：${completingChannels}
今日暫時被定義的開放中心：${openActivatedLabel}

請分析：
1. 今日整體流日天氣：太陽/地球軸（${sunEarthAxis}）的主題是什麼
2. 暫時被定義的${openActivatedLabel}中心，我可能有什麼不熟悉的體驗？哪些感受是「借來的」，不該當成自己的？
3. 共有閘門 ${sharedGatesLabel} 被流日強化，對我的既有特質有什麼放大效果？
4. 結合我的 ${personal.type} 策略（${STRATEGY_MAP[personal.type] ?? '—'}）與${personal.authority.name}，今天適合推進什麼、該避免什麼？
5. 給我 3-5 點今天具體可執行的建議，並註明時效（月亮閘門幾小時就會換，太陽閘門約 5-6 天）。`
}

/** 將兩份 HdResult 組合成可直接貼給 AI 的合圖解讀 prompt。 */
export const buildCompositeAiPrompt = (a: HdResult, b: HdResult, analysis: CompositeAnalysis): string => {
  const fmtPerson = (r: HdResult, label: string) => {
    const definedCenters = (Object.keys(CENTER_INFO) as CenterName[]).filter(id => r.definedCenterIds.has(id))
    const channels = r.definedChannels.map(ch => ch.id).join('、') || '無'
    return `【${label}】
能量類型：${r.type}（${TYPE_LABELS[r.type] ?? ''}）
人生角色：${r.profile.profile}
決策權威：${r.authority.name}
已定義中心：${definedCenters.map(id => fmtCenterName(CENTER_INFO[id].name)).join('、') || '無'}
已定義通道：${channels}`
  }

  const openCenters = (Object.keys(CENTER_INFO) as CenterName[]).filter(id => !analysis.compositeDefinedCenterIds.has(id))
  const openLabel = openCenters.length > 0
    ? '開放' + openCenters.map(id => fmtCenterName(CENTER_INFO[id].name)).join('、')
    : '無開放中心'

  const resonanceLabel = analysis.profileResonance.length > 0
    ? `有（${analysis.profileResonance.join('、')} 爻）`
    : '無'

  const fmtConn = (c: ConnectionDynamic) =>
    `${c.channelId}（${fmtCenterName(CENTER_INFO[c.centerA].name)}—${fmtCenterName(CENTER_INFO[c.centerB].name)}）`

  const fmtList = (list: ConnectionDynamic[]) => list.length > 0 ? list.map(fmtConn).join('、') : '無'

  // 妥協連結：擁有完整通道（兩個閘門）的一方是妥協方
  const fmtCompromiseList = (list: ConnectionDynamic[]) =>
    list.length > 0
      ? list.map(c => `${fmtConn(c)}，${c.aGates.length === 2 ? 'A' : 'B'}方妥協`).join('；')
      : '無'

  // 支配連結：擁有閘門的一方（另一方完全沒有）是支配方
  const fmtDominanceList = (list: ConnectionDynamic[]) =>
    list.length > 0
      ? list.map(c => `${fmtConn(c)}，${c.aGates.length > c.bGates.length ? 'A' : 'B'}方支配`).join('；')
      : '無'

  return `以下是兩人的 Human Design（人類圖）合圖資料，請根據這些資料進行深度的合圖關係解讀。
請只根據我提供的資料分析，不要自行推算或補充未提供的閘門與通道。

${fmtPerson(a, 'A 的人類圖')}

${fmtPerson(b, 'B 的人類圖')}

【合圖整合資料】
定義中心整合：${analysis.integrationTheme}（${openLabel}）
人生角色共鳴爻線：${resonanceLabel}
電磁連結：${fmtList(analysis.electromagnetic)}
陪伴連結：${fmtList(analysis.companionship)}
妥協連結：${fmtCompromiseList(analysis.compromise)}
支配連結：${fmtDominanceList(analysis.dominance)}

請從以下角度分析：
1. 兩人類型與策略的互動模式（含能量場的給予與接收）
2. 人生角色的共鳴、互補與潛在誤解
3. 決策權威差異造成的相處節奏，以及如何配合彼此的決策方式
4. 四類通道連結的動力：電磁的吸引與火花、陪伴的穩定基礎、
   妥協與支配連結中誰讓步誰主導，可能累積什麼壓力
5. 開放中心作為兩人共同課題的意義
6. 整體能量場整合度評估，並給出 3-5 點具體可執行的相處建議`
}
