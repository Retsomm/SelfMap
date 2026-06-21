import { normalizeCenterId, normalizeChannelId } from '@/lib/hd-normalizers'
import { type CreateCompositeResult, type CreateTransitResult } from '@/lib/api'

export interface BodyGraphProps {
  definedCenterIds:  Set<string>
  definedChannelIds: Set<string>
  activations: Record<number, { c?: boolean; u?: boolean; t?: boolean }>
}

export function buildCompositeBodyGraphProps(result: CreateCompositeResult): BodyGraphProps {
  const definedCenterIds  = new Set(result.compositeDefinedCenterIds.map(normalizeCenterId))
  const definedChannelIds = new Set<string>([
    ...result.electromagnetic.map(c => normalizeChannelId(c.channelId)),
    ...result.companionship.map(c => normalizeChannelId(c.channelId)),
    ...result.compromise.map(c => normalizeChannelId(c.channelId)),
    ...result.dominance.map(c => normalizeChannelId(c.channelId)),
  ])
  const activations: BodyGraphProps['activations'] = {}
  for (const type of ['electromagnetic', 'companionship', 'compromise', 'dominance'] as const) {
    for (const conn of result[type]) {
      for (const g of conn.aGates) activations[g] = { ...activations[g], c: true }
      for (const g of conn.bGates) activations[g] = { ...activations[g], u: true }
    }
  }
  return { definedCenterIds, definedChannelIds, activations }
}

export function buildTransitBodyGraphProps(data: CreateTransitResult): BodyGraphProps {
  const activations: BodyGraphProps['activations'] = {}
  for (const g of data.personalityGates) activations[g] = { ...activations[g], c: true }
  for (const g of data.designGates)      activations[g] = { ...activations[g], u: true }
  for (const g of data.transit.allGates) {
    if (!activations[g]) activations[g] = { t: true }
  }
  return {
    definedCenterIds:  new Set(data.combined.definedCenterIds.map(normalizeCenterId)),
    definedChannelIds: new Set(data.combined.definedChannelIds.map(normalizeChannelId)),
    activations,
  }
}
