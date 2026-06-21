import { HD_CHANNELS, type ChartChannel } from '@/lib/hd-chart-data'

// lib uses 'ego' / 'solarPlexus'; hd-chart-data uses 'heart' / 'solar'
const LIB_TO_CHART: Record<string, string> = {
  ego: 'heart',
  solarPlexus: 'solar',
}

export function normalizeCenterId(id: string): string {
  return LIB_TO_CHART[id] ?? id
}

// lib channel ids: '1-8', 'c2-14' → hd-chart-data ids: 'c1-8', 'c2-14'
export function normalizeChannelId(id: string): string {
  return id.startsWith('c') ? id : `c${id}`
}

export function findChannelById(rawId: string): ChartChannel | undefined {
  const id = normalizeChannelId(rawId)
  const found = HD_CHANNELS.find((ch) => ch.id === id)
  if (found) return found
  // try reversed gate order
  const inner = id.slice(1)
  const parts = inner.split('-')
  if (parts.length === 2) {
    const reversed = `c${parts[1]}-${parts[0]}`
    return HD_CHANNELS.find((ch) => ch.id === reversed)
  }
  return undefined
}
