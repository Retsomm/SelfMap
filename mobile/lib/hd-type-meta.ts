export type TypeMeta = { strategy: string; signature: string; notSelf: string }

export const TYPE_LABELS: Record<string, string> = {
  'Manifestor':              '顯示者',
  'Generator':                '生產者',
  'Manifesting Generator':    '顯示生產者',
  'Projector':                '投射者',
  'Reflector':                '反映者',
}

// 比對順序：完全相符 → 依 key 長度由長到短找最具體的子字串相符 → 原始字串
export function getTypeLabel(type: string | undefined | null): string {
  if (!type) return '—'
  if (TYPE_LABELS[type]) return TYPE_LABELS[type]
  const byLength = Object.entries(TYPE_LABELS).sort(([a], [b]) => b.length - a.length)
  return byLength.find(([k]) => type.includes(k))?.[1] ?? type
}

export const TYPE_META: Record<string, TypeMeta> = {
  Manifestor:              { strategy: '告知後行動',          signature: '平靜', notSelf: '憤怒' },
  Generator:               { strategy: '等待回應',            signature: '滿足', notSelf: '挫折' },
  'Manifesting Generator': { strategy: '等待回應後告知',      signature: '滿足', notSelf: '挫折與憤怒' },
  Projector:               { strategy: '等待邀請',            signature: '成功', notSelf: '苦澀' },
  Reflector:               { strategy: '等待月亮週期（28天）', signature: '驚喜', notSelf: '失望' },
}

export function getTypeMeta(type: string): TypeMeta {
  return (
    TYPE_META[type] ??
    Object.entries(TYPE_META).find(([k]) => type.includes(k))?.[1] ?? {
      strategy: '-', signature: '-', notSelf: '-',
    }
  )
}
