import type { GeoResult } from './types'

export const CA_LOCATIONS: GeoResult[] = [
  { id: 3001, name: 'Toronto', country: 'Canada', admin1: 'Ontario', timezone: 'America/Toronto', latitude: 43.6532, longitude: -79.3832 },
  { id: 3002, name: 'Vancouver', country: 'Canada', admin1: 'British Columbia', timezone: 'America/Vancouver', latitude: 49.2827, longitude: -123.1207 },
  { id: 3003, name: 'Montreal', country: 'Canada', admin1: 'Quebec', timezone: 'America/Toronto', latitude: 45.5017, longitude: -73.5673 },
  { id: 3004, name: 'Calgary', country: 'Canada', admin1: 'Alberta', timezone: 'America/Edmonton', latitude: 51.0447, longitude: -114.0719 },
  { id: 3005, name: 'Ottawa', country: 'Canada', admin1: 'Ontario', timezone: 'America/Toronto', latitude: 45.4215, longitude: -75.6972 },
  { id: 3006, name: 'Edmonton', country: 'Canada', admin1: 'Alberta', timezone: 'America/Edmonton', latitude: 53.5461, longitude: -113.4938 },
  { id: 3007, name: 'Winnipeg', country: 'Canada', admin1: 'Manitoba', timezone: 'America/Winnipeg', latitude: 49.8951, longitude: -97.1384 },
  { id: 3008, name: 'Halifax', country: 'Canada', admin1: 'Nova Scotia', timezone: 'America/Halifax', latitude: 44.6488, longitude: -63.5752 },
  { id: 3009, name: 'Quebec City', country: 'Canada', admin1: 'Quebec', timezone: 'America/Toronto', latitude: 46.8139, longitude: -71.2080 },
  { id: 3010, name: 'Victoria', country: 'Canada', admin1: 'British Columbia', timezone: 'America/Vancouver', latitude: 48.4284, longitude: -123.3656 },
]

export const CA_ALIASES: Record<string, number> = {
  'toronto': 3001, '多倫多': 3001,
  'vancouver': 3002, '溫哥華': 3002,
  'montreal': 3003, '蒙特婁': 3003,
  'calgary': 3004, '卡加利': 3004,
  'ottawa': 3005, '渥太華': 3005,
  'edmonton': 3006, '愛德蒙頓': 3006,
  'winnipeg': 3007, '溫尼伯': 3007,
  'halifax': 3008, '哈利法克斯': 3008,
  'quebec city': 3009, '魁北克市': 3009,
  'victoria': 3010,
}
