import { fmtCenterName } from '@/utils/format'
import {
  CENTER_INFO,
  TYPE_LABELS,
  PROFILE_LABELS,
  STRATEGY_MAP,
  SIGNATURE_MAP,
  CROSS_TYPE_LABELS,
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

  return `以下是我的 Human Design（人類圖）資料，請根據這些資料為我進行深度解讀：

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

請從類型策略、人生角色、決策權威、輪迴交叉等角度綜合解讀，並給出實際生活中可應用的建議。`
}

/** 將兩份 HdResult 組合成可直接貼給 AI 的合盤解讀 prompt。 */
export const buildCompositeAiPrompt = (a: HdResult, b: HdResult): string => {
  const fmt = (r: HdResult, label: string) => {
    const crossLabel =
      (CROSS_TYPE_LABELS[r.incarnationCross.crossType] ?? r.incarnationCross.crossType) +
      '之' + r.incarnationCross.crossName
    const definedCenters = (Object.keys(CENTER_INFO) as CenterName[]).filter(id => r.definedCenterIds.has(id))
    const channels =
      r.definedChannels
        .map(ch => `${ch.id}（${fmtCenterName(CENTER_INFO[ch.centerA].name)}—${fmtCenterName(CENTER_INFO[ch.centerB].name)}）`)
        .join('、') || '無'
    return `【${label}】
類型：${r.type}（${TYPE_LABELS[r.type] ?? ''}）
人生角色：${r.profile.profile}（${PROFILE_LABELS[r.profile.profile] ?? '—'}）
決策權威：${r.authority.name}
輪迴交叉：${crossLabel}
已定義中心：${definedCenters.map(id => CENTER_INFO[id].name).join('、') || '無'}
已定義通道：${channels}`
  }

  return `以下是兩人的 Human Design（人類圖）合盤資料，請根據這些資料進行深度的合盤關係解讀：

${fmt(a, 'A 的人類圖')}

${fmt(b, 'B 的人類圖')}

請從以下角度進行合盤分析：
1. 兩人類型與策略的互動模式
2. 人生角色的共鳴與互補
3. 決策權威的相處節奏
4. 電磁、陪伴、妥協、支配等通道連結動力
5. 整體能量場整合度，並給出實際相處建議。`
}
