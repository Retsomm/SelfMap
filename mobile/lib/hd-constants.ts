import { HD_TYPE_META } from '@shared/humanDesign/hd-type-meta'

export const STRATEGY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(HD_TYPE_META).map(([type, meta]) => [type, meta.strategy])
)

export const SIGNATURE_MAP: Record<string, { positive: string; negative: string }> = Object.fromEntries(
  Object.entries(HD_TYPE_META).map(([type, meta]) => [type, { positive: meta.signature, negative: meta.notSelf }])
)

export const AUTHORITY_TIP: Record<string, string> = {
  '情緒權威':     '等待情緒波浪完整走完，清晰出現後再決定',
  '薦骨權威':     '傾聽薦骨的即時嗯哼聲，it 是 yes，嗯是 no',
  '脾中心權威':   '相信當下一閃而過的直覺，它不會說第二次',
  '意志力權威':   '只承諾你真心想要且能兌現的事',
  '自我投射權威': '對信任的人大聲說出想法，聆聽自己的聲音找到方向',
  '邏輯權威':     '和不同的人討論，透過外在反饋找到清晰',
  '月亮週期權威': '等待完整的月亮週期（28天）再做重大決定',
}

export const CENTER_NAME: Record<string, string> = {
  head:        '頭腦中心',
  ajna:        '邏輯中心',
  throat:      '喉嚨中心',
  g:           'G 中心',
  ego:         '意志力中心',
  heart:       '意志力中心',
  spleen:      '脾中心',
  sacral:      '薦骨中心',
  solarPlexus: '情緒中心',
  solar:       '情緒中心',
  root:        '根部中心',
}

export const ALL_CENTER_IDS = [
  'head', 'ajna', 'throat', 'g', 'ego', 'spleen', 'sacral', 'solarPlexus', 'root',
] as const

// 正規化別名 → 正規 ID（以函式庫慣用的 key 為準）
export const CENTER_ALIAS: Record<string, string> = {
  heart:       'ego',
  will:        'ego',
  solar:       'solarPlexus',
  solarplexus: 'solarPlexus',
}

export const normalizeCenterAlias = (id: string): string => CENTER_ALIAS[id] ?? id
