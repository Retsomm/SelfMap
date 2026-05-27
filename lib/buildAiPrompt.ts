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

export const buildAiPrompt = (r: HdResult): string => {
  const crossLabel =
    (CROSS_TYPE_LABELS[r.incarnationCross.crossType] ?? r.incarnationCross.crossType) +
    '之' + r.incarnationCross.crossName
  const definedCenters = (Object.keys(CENTER_INFO) as CenterName[]).filter(id => r.definedCenterIds.has(id))
  const openCenters = (Object.keys(CENTER_INFO) as CenterName[]).filter(id => !r.definedCenterIds.has(id))
  const channels =
    r.definedChannels
      .map(ch => `${ch.id}（${fmtCenterName(CENTER_INFO[ch.centerA].name)}—${fmtCenterName(CENTER_INFO[ch.centerB].name)}）`)
      .join('、') || '無'
  const planetRows = r.planets
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
