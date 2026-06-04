import type { GeoResult } from './types'

export const SG_LOCATIONS: GeoResult[] = [
  { id: 7021, name: '新加坡', country: '新加坡', admin1: '新加坡', timezone: 'Asia/Singapore', latitude: 1.3521, longitude: 103.8198 },
]

export const SG_ALIASES: Record<string, number> = {
  '新加坡': 7021, 'singapore': 7021, 'sg': 7021,
}
