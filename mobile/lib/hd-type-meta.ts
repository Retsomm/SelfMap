export type TypeMeta = { strategy: string; signature: string; notSelf: string }

export const TYPE_LABELS: Record<string, string> = {
  'Manifestor':              '顯示者',
  'Generator':                '生產者',
  'Manifesting Generator':    '顯示生產者',
  'Projector':                '投射者',
  'Reflector':                '反映者',
}

export function getTypeLabel(type: string): string {
  return (
    TYPE_LABELS[type] ??
    Object.entries(TYPE_LABELS).find(([k]) => type.includes(k))?.[1] ??
    type
  )
}

export const TYPE_META: Record<string, TypeMeta> = {
  Manifestor:              { strategy: '告知',               signature: '和平', notSelf: '憤怒' },
  Generator:               { strategy: '等待回應',            signature: '滿足', notSelf: '沮喪' },
  'Manifesting Generator': { strategy: '等待回應，再告知',    signature: '滿足', notSelf: '沮喪' },
  Projector:               { strategy: '等待邀請',            signature: '成功', notSelf: '苦澀' },
  Reflector:               { strategy: '等待月循環（28 天）',  signature: '驚喜', notSelf: '失望' },
}

export function getTypeMeta(type: string): TypeMeta {
  return (
    TYPE_META[type] ??
    Object.entries(TYPE_META).find(([k]) => type.includes(k))?.[1] ?? {
      strategy: '-', signature: '-', notSelf: '-',
    }
  )
}
