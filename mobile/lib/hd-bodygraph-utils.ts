import { normalizeCenterId, normalizeChannelId } from '@/lib/hd-normalizers'
import { type CreateCompositeResult, type CreateTransitResult } from '@/lib/api'

export interface BodyGraphProps {
  definedCenterIds:  Set<string>
  definedChannelIds: Set<string>
  activations: Record<number, { c?: boolean; u?: boolean; t?: boolean }>
}

/**
 * Builds BodyGraph props from a composite (合圖) result.
 * Person A gates receive `c: true`, person B gates receive `u: true`.
 * When the same gate appears in both, both flags are set and the renderer
 * shows a split colour to indicate the dominance or shared activation.
 */
export function buildCompositeBodyGraphProps(result: CreateCompositeResult): BodyGraphProps {
  const definedCenterIds  = new Set(result.compositeDefinedCenterIds.map(normalizeCenterId))
  const definedChannelIds = new Set(
    (result.compositeDefinedChannelIds ?? [
      ...result.electromagnetic.map(c => c.channelId),
      ...result.companionship.map(c => c.channelId),
      ...result.compromise.map(c => c.channelId),
      ...result.dominance.map(c => c.channelId),
    ]).map(normalizeChannelId)
  )
  const activations: BodyGraphProps['activations'] = {}
  if (result.personA.allGates?.length && result.personB.allGates?.length) {
    for (const g of result.personA.allGates) activations[g] = { ...activations[g], c: true }
    for (const g of result.personB.allGates) activations[g] = { ...activations[g], u: true }
  } else {
    // Fallback for old API responses without allGates
    for (const type of ['electromagnetic', 'companionship', 'compromise', 'dominance'] as const) {
      for (const conn of result[type]) {
        for (const g of conn.aGates) activations[g] = { ...activations[g], c: true }
        for (const g of conn.bGates) activations[g] = { ...activations[g], u: true }
      }
    }
  }
  return { definedCenterIds, definedChannelIds, activations }
}

/**
 * Builds BodyGraph props from a transit (流日) result.
 * All personal gates (personality + design combined) → `c: true` (black).
 * Transit gates → `u: true` (red). Gates in both show as striped.
 */
export function buildTransitBodyGraphProps(data: CreateTransitResult): BodyGraphProps {
  const activations: BodyGraphProps['activations'] = {}
  for (const g of data.personalityGates) activations[g] = { ...activations[g], c: true }
  for (const g of data.designGates)      activations[g] = { ...activations[g], c: true }
  for (const g of data.transit.allGates) activations[g] = { ...activations[g], u: true }
  return {
    definedCenterIds:  new Set(data.combined.definedCenterIds.map(normalizeCenterId)),
    definedChannelIds: new Set(data.combined.definedChannelIds.map(normalizeChannelId)),
    activations,
  }
}
