import type { GeoResult } from './types'

export const HK_LOCATIONS: GeoResult[] = [
  { id: 7001, name: '香港', country: '香港', admin1: '香港島', timezone: 'Asia/Hong_Kong', latitude: 22.3193, longitude: 114.1694 },
  { id: 7002, name: '九龍', country: '香港', admin1: '九龍', timezone: 'Asia/Hong_Kong', latitude: 22.3282, longitude: 114.1722 },
  { id: 7003, name: '新界', country: '香港', admin1: '新界', timezone: 'Asia/Hong_Kong', latitude: 22.4313, longitude: 114.0753 },
]

export const HK_ALIASES: Record<string, number> = {
  '香港': 7001, 'hong kong': 7001, 'hongkong': 7001, 'hk': 7001,
  '九龍': 7002, 'kowloon': 7002,
  '新界': 7003, 'new territories': 7003,
}
