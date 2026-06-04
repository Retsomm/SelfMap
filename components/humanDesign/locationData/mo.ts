import type { GeoResult } from './types'

export const MO_LOCATIONS: GeoResult[] = [
  { id: 7011, name: '澳門', country: '澳門', admin1: '澳門半島', timezone: 'Asia/Macau', latitude: 22.1987, longitude: 113.5439 },
  { id: 7012, name: '氹仔', country: '澳門', admin1: '離島', timezone: 'Asia/Macau', latitude: 22.1667, longitude: 113.5667 },
  { id: 7013, name: '路環', country: '澳門', admin1: '離島', timezone: 'Asia/Macau', latitude: 22.1171, longitude: 113.5590 },
]

export const MO_ALIASES: Record<string, number> = {
  '澳門': 7011, 'macao': 7011, 'macau': 7011,
  '氹仔': 7012, 'taipa': 7012,
  '路環': 7013, 'coloane': 7013,
}
