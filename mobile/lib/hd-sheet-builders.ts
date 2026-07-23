import {
  HD_CENTERS_INFO,
  HD_CHANNELS,
  HD_GATES,
  type ChartChannel,
} from '@shared/humanDesign/hd-chart-data'
import {
  HD_TYPE_CONTENT,
  HD_AUTHORITY_CONTENT,
  HD_PROFILE_CONTENT,
  HD_DEFINITION_CONTENT,
} from '@shared/humanDesign/hd-summary-data'
import { HD_CROSS_CONTENT } from '@shared/humanDesign/hd-cross-data'
import { HD_AUTHORITY_ZH_TO_KEY } from '@shared/humanDesign/hd-authority-meta'
import { centerZh } from '@/lib/hd-normalizers'

export interface SheetContent {
  title: string
  subtitle: string
  sections: Array<{ label?: string; body: string; dim?: boolean }>
  highlights?: Array<{ label: string; text: string }>
  keywords: string[]
}

const DEFINITION_ZH_TO_KEY: Record<string, string> = {
  '單一定義人':           'Single',
  '二分定義人':           'Split',
  '三分定義人':           'Triple Split',
  '四分定義人':           'Quadruple Split',
  '無定義（反映者）': 'None',
}

const NOT_FOUND: SheetContent = {
  title: '資料不存在',
  subtitle: '',
  sections: [{ body: '無法顯示此內容，請稍後再試。' }],
  keywords: [],
}

/**
 * @param id - Center key (e.g. 'head', 'sacral') from HD_CENTERS_INFO
 * @param defined - Whether this center is defined in the chart being viewed.
 *   When provided, the matching state (已定義/開放) is shown normally and the
 *   other, non-applicable state is dimmed. When omitted, both are shown plain.
 * @returns SheetContent with description, defined/open states, and keywords;
 *   falls back to a "not found" message when the id is unrecognised.
 */
export function buildCenterContent(id: string, defined?: boolean): SheetContent {
  const info = HD_CENTERS_INFO[id]
  if (!info) return NOT_FOUND
  return {
    title: info.name.zh,
    subtitle: info.type.zh,
    sections: [
      { body: info.description.zh },
      { label: '已定義', body: info.definedContent.zh, dim: defined === false },
      { label: '開放', body: info.openContent.zh, dim: defined === true },
    ],
    keywords: info.keywords.zh,
  }
}

/**
 * @param num - Gate number (1–64)
 * @returns SheetContent with description and related channels;
 *   falls back to a "not found" message when the gate number is unrecognised.
 */
export function buildGateContent(num: number): SheetContent {
  const gate = HD_GATES[num]
  if (!gate) return NOT_FOUND

  const relatedChannels = HD_CHANNELS.filter(ch => ch.from === num || ch.to === num)
  const sections: SheetContent['sections'] = [{ body: gate.desc.zh }]
  if (relatedChannels.length > 0) {
    sections.push({
      label: '相關通道',
      body: relatedChannels.map(ch => `${ch.from}–${ch.to}  ${ch.name.zh}`).join('\n'),
    })
  }

  return {
    title: `閘門 ${num}：${gate.name.zh}`,
    subtitle: `中心：${centerZh(gate.center)}`,
    sections,
    keywords: [],
  }
}

/**
 * @param ch - Channel data from HD_CHANNELS
 * @returns SheetContent with description and the two connecting gate names.
 *   Always succeeds because the caller already holds a valid ChartChannel.
 */
export function buildChannelContent(ch: ChartChannel): SheetContent {
  const fromGate = HD_GATES[ch.from]
  const toGate   = HD_GATES[ch.to]
  const fromName = fromGate ? `閘門 ${ch.from}・${fromGate.name.zh}` : `閘門 ${ch.from}`
  const toName   = toGate   ? `閘門 ${ch.to}・${toGate.name.zh}`   : `閘門 ${ch.to}`
  return {
    title: ch.name.zh,
    subtitle: `通道 ${ch.from}–${ch.to}`,
    sections: [
      { body: ch.desc.zh },
      { label: '連結閘門', body: `${fromName}  ⟷  ${toName}` },
    ],
    keywords: [],
  }
}

/**
 * @param typeKey - HD_TYPE_CONTENT lookup key (English type name)
 * @returns SheetContent with intro, paragraphs, and highlights;
 *   falls back to a "not found" message when the key is unrecognised.
 */
export function buildTypeContent(typeKey: string): SheetContent {
  const d = HD_TYPE_CONTENT[typeKey]
  if (!d) return NOT_FOUND
  return {
    title: d.title,
    subtitle: d.subtitle ?? '能量類型',
    sections: [{ body: d.intro }, ...d.paragraphs.map(p => ({ body: p }))],
    highlights: d.highlights,
    keywords: [],
  }
}

/**
 * @param authorityKey - Chinese authority label or English key;
 *   Chinese labels are mapped via HD_AUTHORITY_ZH_TO_KEY before lookup.
 * @returns SheetContent with intro, paragraphs, and highlights;
 *   falls back to a "not found" message when no matching entry is found.
 */
export function buildAuthorityContent(authorityKey: string): SheetContent {
  const key = HD_AUTHORITY_ZH_TO_KEY[authorityKey] ?? authorityKey
  const d = HD_AUTHORITY_CONTENT[key]
  if (!d) return NOT_FOUND
  return {
    title: d.title,
    subtitle: d.subtitle ?? '內在權威',
    sections: [{ body: d.intro }, ...d.paragraphs.map(p => ({ body: p }))],
    highlights: d.highlights,
    keywords: [],
  }
}

/**
 * @param profile - Profile string (e.g. '1/3')
 * @returns SheetContent with intro, paragraphs, and highlights;
 *   falls back to a "not found" message when the profile is unrecognised.
 */
export function buildProfileContent(profile: string): SheetContent {
  const d = HD_PROFILE_CONTENT[profile]
  if (!d) return NOT_FOUND
  return {
    title: d.title,
    subtitle: d.subtitle ?? '人生角色',
    sections: [{ body: d.intro }, ...d.paragraphs.map(p => ({ body: p }))],
    highlights: d.highlights,
    keywords: [],
  }
}

/**
 * @param definitionKey - Chinese definition label or English key;
 *   Chinese labels are mapped via DEFINITION_ZH_TO_KEY before lookup.
 * @returns SheetContent with intro, paragraphs, and highlights;
 *   falls back to a "not found" message when no matching entry is found.
 */
export function buildDefinitionContent(definitionKey: string): SheetContent {
  const key = DEFINITION_ZH_TO_KEY[definitionKey] ?? definitionKey
  const d = HD_DEFINITION_CONTENT[key]
  if (!d) return NOT_FOUND
  return {
    title: d.title,
    subtitle: d.subtitle ?? '定義',
    sections: [{ body: d.intro }, ...d.paragraphs.map(p => ({ body: p }))],
    highlights: d.highlights,
    keywords: [],
  }
}

const CROSS_TYPE_KEY: Record<string, 'RAC' | 'JC' | 'LAC'> = {
  RAC: 'RAC',
  JC:  'JC',
  LAC: 'LAC',
}

export function buildIncarnationCrossContent(params: {
  crossType: string
  crossTypeLabel: string
  crossBaseName: string
  variant: string | number
  gatesLabel: string
  sunGate?: number
}): SheetContent {
  const { crossType, crossTypeLabel, crossBaseName, variant, gatesLabel } = params
  const ctKey = CROSS_TYPE_KEY[crossType] ?? 'RAC'
  const title = `${crossTypeLabel}之${crossBaseName}${variant}`

  // sunGate 優先用 API 傳的值，fallback 從 gatesLabel 第一個數字解析（格式："11/12 | 6/36"）
  const resolvedSunGate: number = params.sunGate ?? parseInt(gatesLabel.split('/')[0], 10)
  const gateContent = HD_CROSS_CONTENT[resolvedSunGate]
  if (!gateContent) {
    return {
      title,
      subtitle: gatesLabel,
      sections: [{ body: '這個閘門的輪迴交叉內容暫時未收錄。' }],
      keywords: [],
    }
  }

  const entry = gateContent[ctKey]
  const sections: SheetContent['sections'] = []

  if (gateContent.intro) sections.push({ body: gateContent.intro })

  if (entry) {
    const paragraphs = entry.body.split('\n').filter(Boolean)
    paragraphs.forEach((p, i) => {
      sections.push({ label: i === 0 ? `${crossTypeLabel}・${entry.title}` : undefined, body: p })
    })
  } else {
    sections.push({ body: '此交叉類型的說明暫未收錄。' })
  }

  sections.push({ label: '閘門組合', body: gatesLabel })

  return {
    title,
    subtitle: gatesLabel,
    sections,
    keywords: [],
  }
}
