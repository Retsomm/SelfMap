import type { GeoResult } from './types'

export const UK_LOCATIONS: GeoResult[] = [
  { id: 6001, name: 'London', country: 'United Kingdom', admin1: 'England', timezone: 'Europe/London', latitude: 51.5074, longitude: -0.1278 },
  { id: 6002, name: 'Manchester', country: 'United Kingdom', admin1: 'England', timezone: 'Europe/London', latitude: 53.4808, longitude: -2.2426 },
  { id: 6003, name: 'Birmingham', country: 'United Kingdom', admin1: 'England', timezone: 'Europe/London', latitude: 52.4862, longitude: -1.8904 },
  { id: 6004, name: 'Edinburgh', country: 'United Kingdom', admin1: 'Scotland', timezone: 'Europe/London', latitude: 55.9533, longitude: -3.1883 },
  { id: 6005, name: 'Glasgow', country: 'United Kingdom', admin1: 'Scotland', timezone: 'Europe/London', latitude: 55.8642, longitude: -4.2518 },
  { id: 6006, name: 'Liverpool', country: 'United Kingdom', admin1: 'England', timezone: 'Europe/London', latitude: 53.4084, longitude: -2.9916 },
  { id: 6007, name: 'Bristol', country: 'United Kingdom', admin1: 'England', timezone: 'Europe/London', latitude: 51.4545, longitude: -2.5879 },
  { id: 6008, name: 'Leeds', country: 'United Kingdom', admin1: 'England', timezone: 'Europe/London', latitude: 53.8008, longitude: -1.5491 },
  { id: 6009, name: 'Cardiff', country: 'United Kingdom', admin1: 'Wales', timezone: 'Europe/London', latitude: 51.4816, longitude: -3.1791 },
  { id: 6010, name: 'Belfast', country: 'United Kingdom', admin1: 'Northern Ireland', timezone: 'Europe/London', latitude: 54.5973, longitude: -5.9301 },
]

export const UK_ALIASES: Record<string, number> = {
  'london': 6001, '倫敦': 6001, 'uk': 6001, 'united kingdom': 6001, 'britain': 6001,
  'manchester': 6002, '曼徹斯特': 6002,
  'birmingham': 6003, '伯明翰': 6003,
  'edinburgh': 6004, '愛丁堡': 6004,
  'glasgow': 6005, '格拉斯哥': 6005,
  'liverpool': 6006, '利物浦': 6006,
  'bristol': 6007,
  'leeds': 6008,
  'cardiff': 6009, '卡地夫': 6009,
  'belfast': 6010, '貝爾法斯特': 6010,
}
