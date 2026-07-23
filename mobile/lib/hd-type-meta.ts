import { HD_TYPE_META } from '@shared/humanDesign/hd-type-meta'

export type TypeMeta = { strategy: string; signature: string; notSelf: string }

export const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(HD_TYPE_META).map(([type, meta]) => [type, meta.label])
)

// 比對順序：完全相符 → 依 key 長度由長到短找最具體的子字串相符 → 原始字串
export function getTypeLabel(type: string | undefined | null): string {
  if (!type) return '—'
  if (TYPE_LABELS[type]) return TYPE_LABELS[type]
  const byLength = Object.entries(TYPE_LABELS).sort(([a], [b]) => b.length - a.length)
  return byLength.find(([k]) => type.includes(k))?.[1] ?? type
}

export const TYPE_META: Record<string, TypeMeta> = Object.fromEntries(
  Object.entries(HD_TYPE_META).map(([type, meta]) => [type, {
    strategy: meta.strategy, signature: meta.signature, notSelf: meta.notSelf,
  }])
)

export function getTypeMeta(type: string): TypeMeta {
  return (
    TYPE_META[type] ??
    Object.entries(TYPE_META).find(([k]) => type.includes(k))?.[1] ?? {
      strategy: '-', signature: '-', notSelf: '-',
    }
  )
}
