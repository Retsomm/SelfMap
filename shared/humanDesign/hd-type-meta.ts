// Single source of truth for the five Human Design types' Chinese label,
// strategy, and signature/not-self, previously duplicated verbatim across
// lib/humanDesign/constants.ts (web), mobile/lib/hd-constants.ts, and
// mobile/lib/hd-type-meta.ts.

export type HumanDesignTypeKey =
  | 'Manifestor'
  | 'Generator'
  | 'Manifesting Generator'
  | 'Projector'
  | 'Reflector'

export interface HumanDesignTypeMeta {
  label: string
  strategy: string
  signature: string
  notSelf: string
}

export const HD_TYPE_META: Record<HumanDesignTypeKey, HumanDesignTypeMeta> = {
  'Manifestor':              { label: '顯示者',     strategy: '告知後行動',            signature: '平靜', notSelf: '憤怒' },
  'Generator':                { label: '生產者',     strategy: '等待回應',              signature: '滿足', notSelf: '挫折' },
  'Manifesting Generator':    { label: '顯示生產者', strategy: '等待回應後告知',        signature: '滿足', notSelf: '挫折與憤怒' },
  'Projector':                { label: '投射者',     strategy: '等待邀請',              signature: '成功', notSelf: '苦澀' },
  'Reflector':                { label: '反映者',     strategy: '等待月亮週期（28天）',  signature: '驚喜', notSelf: '失望' },
}
