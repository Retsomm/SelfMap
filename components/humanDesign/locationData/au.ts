import type { GeoResult } from './types'

export const AU_LOCATIONS: GeoResult[] = [
  { id: 4001, name: 'Sydney', country: 'Australia', admin1: 'New South Wales', timezone: 'Australia/Sydney', latitude: -33.8688, longitude: 151.2093 },
  { id: 4002, name: 'Melbourne', country: 'Australia', admin1: 'Victoria', timezone: 'Australia/Melbourne', latitude: -37.8136, longitude: 144.9631 },
  { id: 4003, name: 'Brisbane', country: 'Australia', admin1: 'Queensland', timezone: 'Australia/Brisbane', latitude: -27.4698, longitude: 153.0251 },
  { id: 4004, name: 'Perth', country: 'Australia', admin1: 'Western Australia', timezone: 'Australia/Perth', latitude: -31.9505, longitude: 115.8605 },
  { id: 4005, name: 'Adelaide', country: 'Australia', admin1: 'South Australia', timezone: 'Australia/Adelaide', latitude: -34.9285, longitude: 138.6007 },
  { id: 4006, name: 'Canberra', country: 'Australia', admin1: 'ACT', timezone: 'Australia/Sydney', latitude: -35.2809, longitude: 149.1300 },
  { id: 4007, name: 'Gold Coast', country: 'Australia', admin1: 'Queensland', timezone: 'Australia/Brisbane', latitude: -28.0167, longitude: 153.4000 },
  { id: 4008, name: 'Darwin', country: 'Australia', admin1: 'Northern Territory', timezone: 'Australia/Darwin', latitude: -12.4634, longitude: 130.8456 },
  { id: 4009, name: 'Hobart', country: 'Australia', admin1: 'Tasmania', timezone: 'Australia/Hobart', latitude: -42.8821, longitude: 147.3272 },
  { id: 4010, name: 'Newcastle', country: 'Australia', admin1: 'New South Wales', timezone: 'Australia/Sydney', latitude: -32.9283, longitude: 151.7817 },
]

export const AU_ALIASES: Record<string, number> = {
  'sydney': 4001, '雪梨': 4001, '悉尼': 4001,
  'melbourne': 4002, '墨爾本': 4002,
  'brisbane': 4003, '布里斯本': 4003,
  'perth': 4004, '伯斯': 4004,
  'adelaide': 4005, '阿德萊德': 4005,
  'canberra': 4006, '坎培拉': 4006,
  'gold coast': 4007, '黃金海岸': 4007,
  'darwin': 4008, '達爾文': 4008,
  'hobart': 4009, '荷伯特': 4009,
  'newcastle': 4010,
}
