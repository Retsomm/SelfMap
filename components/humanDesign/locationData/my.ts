import type { GeoResult } from './types'

export const MY_LOCATIONS: GeoResult[] = [
  { id: 7031, name: '吉隆坡', country: '馬來西亞', admin1: '吉隆坡', timezone: 'Asia/Kuala_Lumpur', latitude: 3.1390, longitude: 101.6869 },
  { id: 7032, name: '檳城', country: '馬來西亞', admin1: '檳城州', timezone: 'Asia/Kuala_Lumpur', latitude: 5.4141, longitude: 100.3288 },
  { id: 7033, name: '新山', country: '馬來西亞', admin1: '柔佛州', timezone: 'Asia/Kuala_Lumpur', latitude: 1.4927, longitude: 103.7414 },
  { id: 7034, name: '馬六甲', country: '馬來西亞', admin1: '馬六甲州', timezone: 'Asia/Kuala_Lumpur', latitude: 2.1896, longitude: 102.2501 },
  { id: 7035, name: '怡保', country: '馬來西亞', admin1: '霹靂州', timezone: 'Asia/Kuala_Lumpur', latitude: 4.5975, longitude: 101.0901 },
  { id: 7036, name: '古晉', country: '馬來西亞', admin1: '砂拉越州', timezone: 'Asia/Kuching', latitude: 1.5497, longitude: 110.3590 },
  { id: 7037, name: '亞庇', country: '馬來西亞', admin1: '沙巴州', timezone: 'Asia/Kuching', latitude: 5.9804, longitude: 116.0735 },
]

export const MY_ALIASES: Record<string, number> = {
  '吉隆坡': 7031, 'kuala lumpur': 7031, 'kl': 7031,
  '檳城': 7032, 'penang': 7032, 'george town': 7032,
  '新山': 7033, 'johor bahru': 7033, 'jb': 7033,
  '馬六甲': 7034, 'malacca': 7034, 'melaka': 7034,
  '怡保': 7035, 'ipoh': 7035,
  '古晉': 7036, 'kuching': 7036,
  '亞庇': 7037, 'kota kinabalu': 7037,
}
