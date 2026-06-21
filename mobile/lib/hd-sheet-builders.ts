import {
  HD_CENTERS_INFO,
  HD_CHANNELS,
  HD_GATES,
  type ChartChannel,
} from '@/lib/hd-chart-data'
import {
  HD_TYPE_CONTENT,
  HD_AUTHORITY_CONTENT,
  HD_PROFILE_CONTENT,
  HD_DEFINITION_CONTENT,
} from '@/lib/hd-summary-data'
import { centerZh } from '@/lib/hd-normalizers'

export interface SheetContent {
  title: string
  subtitle: string
  sections: Array<{ label?: string; body: string }>
  highlights?: Array<{ label: string; text: string }>
  keywords: string[]
}

const AUTHORITY_ZH_TO_KEY: Record<string, string> = {
  '情緒權威':     'Emotional',
  '薦骨權威':     'Sacral',
  '脾中心權威':  'Splenic',
  '意志力權威':  'Ego',
  '自我投射權威': 'Self-Projected',
  '心智權威':     'Mental',
  '月亮週期權威': 'Lunar',
}

const DEFINITION_ZH_TO_KEY: Record<string, string> = {
  '單一定義人':           'Single',
  '二分定義人':           'Split',
  '三分定義人':           'Triple Split',
  '四分定義人':           'Quadruple Split',
  '無定義（反映者）': 'None',
}

export function buildCenterContent(id: string): SheetContent | null {
  const info = HD_CENTERS_INFO[id]
  if (!info) return null
  return {
    title: info.name.zh,
    subtitle: info.type.zh,
    sections: [
      { body: info.description.zh },
      { label: '已定義', body: info.definedContent.zh },
      { label: '開放', body: info.openContent.zh },
    ],
    keywords: info.keywords.zh,
  }
}

export function buildGateContent(num: number): SheetContent | null {
  const gate = HD_GATES[num]
  if (!gate) return null

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

export function buildTypeContent(typeKey: string): SheetContent | null {
  const d = HD_TYPE_CONTENT[typeKey]
  if (!d) return null
  return {
    title: d.title,
    subtitle: d.subtitle ?? '能量類型',
    sections: [{ body: d.intro }, ...d.paragraphs.map(p => ({ body: p }))],
    highlights: d.highlights,
    keywords: [],
  }
}

export function buildAuthorityContent(authorityKey: string): SheetContent | null {
  const key = AUTHORITY_ZH_TO_KEY[authorityKey] ?? authorityKey
  const d = HD_AUTHORITY_CONTENT[key]
  if (!d) return null
  return {
    title: d.title,
    subtitle: d.subtitle ?? '內在權威',
    sections: [{ body: d.intro }, ...d.paragraphs.map(p => ({ body: p }))],
    highlights: d.highlights,
    keywords: [],
  }
}

export function buildProfileContent(profile: string): SheetContent | null {
  const d = HD_PROFILE_CONTENT[profile]
  if (!d) return null
  return {
    title: d.title,
    subtitle: d.subtitle ?? '人生角色',
    sections: [{ body: d.intro }, ...d.paragraphs.map(p => ({ body: p }))],
    highlights: d.highlights,
    keywords: [],
  }
}

export function buildDefinitionContent(definitionKey: string): SheetContent | null {
  const key = DEFINITION_ZH_TO_KEY[definitionKey] ?? definitionKey
  const d = HD_DEFINITION_CONTENT[key]
  if (!d) return null
  return {
    title: d.title,
    subtitle: d.subtitle ?? '定義',
    sections: [{ body: d.intro }, ...d.paragraphs.map(p => ({ body: p }))],
    highlights: d.highlights,
    keywords: [],
  }
}
