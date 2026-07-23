import { HD_TYPE_META } from '@shared/humanDesign/hd-type-meta'
import { HD_AUTHORITY_META } from '@shared/humanDesign/hd-authority-meta'

export const STRATEGY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(HD_TYPE_META).map(([type, meta]) => [type, meta.strategy])
)

export const SIGNATURE_MAP: Record<string, { positive: string; negative: string }> = Object.fromEntries(
  Object.entries(HD_TYPE_META).map(([type, meta]) => [type, { positive: meta.signature, negative: meta.notSelf }])
)

export const AUTHORITY_TIP: Record<string, string> = Object.fromEntries(
  Object.values(HD_AUTHORITY_META).map(meta => [meta.name, meta.tip])
)

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
