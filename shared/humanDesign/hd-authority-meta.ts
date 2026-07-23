// Single source of truth for the seven Human Design authorities' Chinese
// name and tip text, previously duplicated verbatim across
// lib/humanDesign/constants.ts (web, AUTHORITY_INFO) and
// mobile/lib/hd-constants.ts (AUTHORITY_TIP), plus a hand-written
// zh-name → English-key reverse map duplicated in mobile/lib/hd-sheet-builders.ts
// (AUTHORITY_ZH_TO_KEY) alongside web's derived AUTHORITY_KEY_MAP.

export type AuthorityKey =
  | 'Emotional'
  | 'Sacral'
  | 'Splenic'
  | 'Ego'
  | 'Self-Projected'
  | 'Mental'
  | 'Lunar'

export interface HumanDesignAuthorityMeta {
  name: string
  tip: string
}

export const HD_AUTHORITY_META: Record<AuthorityKey, HumanDesignAuthorityMeta> = {
  'Emotional':       { name: '情緒權威',     tip: '等待情緒波浪完整走完，清晰出現後再決定' },
  'Sacral':          { name: '薦骨權威',     tip: '傾聽薦骨的即時嗯哼聲，it 是 yes，嗯是 no' },
  'Splenic':         { name: '脾中心權威',   tip: '相信當下一閃而過的直覺，它不會說第二次' },
  'Ego':             { name: '意志力權威',   tip: '只承諾你真心想要且能兌現的事' },
  'Self-Projected':  { name: '自我投射權威', tip: '對信任的人大聲說出想法，聆聽自己的聲音找到方向' },
  'Mental':          { name: '邏輯權威',     tip: '和不同的人討論，透過外在反饋找到清晰' },
  'Lunar':           { name: '月亮週期權威', tip: '等待完整的月亮週期（28天）再做重大決定' },
}

export const HD_AUTHORITY_ZH_TO_KEY: Record<string, AuthorityKey> = Object.fromEntries(
  Object.entries(HD_AUTHORITY_META).map(([key, meta]) => [meta.name, key as AuthorityKey])
)
