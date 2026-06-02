'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '@/i18n'

interface GeoResult {
  id: number
  name: string
  country: string
  admin1?: string
  timezone: string
  latitude: number
  longitude: number
}

// 台灣全部縣市靜態清單（Asia/Taipei UTC+8，含中英文別名）
const TW_LOCATIONS: GeoResult[] = [
  { id: 9001, name: '台北市', country: '台灣', admin1: '台北市', timezone: 'Asia/Taipei', latitude: 25.0330, longitude: 121.5654 },
  { id: 9002, name: '新北市', country: '台灣', admin1: '新北市', timezone: 'Asia/Taipei', latitude: 25.0169, longitude: 121.4627 },
  { id: 9003, name: '桃園市', country: '台灣', admin1: '桃園市', timezone: 'Asia/Taipei', latitude: 24.9937, longitude: 121.3009 },
  { id: 9004, name: '台中市', country: '台灣', admin1: '台中市', timezone: 'Asia/Taipei', latitude: 24.1477, longitude: 120.6736 },
  { id: 9005, name: '台南市', country: '台灣', admin1: '台南市', timezone: 'Asia/Taipei', latitude: 22.9998, longitude: 120.2270 },
  { id: 9006, name: '高雄市', country: '台灣', admin1: '高雄市', timezone: 'Asia/Taipei', latitude: 22.6273, longitude: 120.3014 },
  { id: 9007, name: '基隆市', country: '台灣', admin1: '基隆市', timezone: 'Asia/Taipei', latitude: 25.1283, longitude: 121.7419 },
  { id: 9008, name: '新竹市', country: '台灣', admin1: '新竹市', timezone: 'Asia/Taipei', latitude: 24.8038, longitude: 120.9647 },
  { id: 9009, name: '嘉義市', country: '台灣', admin1: '嘉義市', timezone: 'Asia/Taipei', latitude: 23.4800, longitude: 120.4491 },
  { id: 9010, name: '新竹縣', country: '台灣', admin1: '新竹縣', timezone: 'Asia/Taipei', latitude: 24.8387, longitude: 121.0177 },
  { id: 9011, name: '苗栗縣', country: '台灣', admin1: '苗栗縣', timezone: 'Asia/Taipei', latitude: 24.5602, longitude: 120.8214 },
  { id: 9012, name: '彰化縣', country: '台灣', admin1: '彰化縣', timezone: 'Asia/Taipei', latitude: 24.0518, longitude: 120.5161 },
  { id: 9013, name: '南投縣', country: '台灣', admin1: '南投縣', timezone: 'Asia/Taipei', latitude: 23.9609, longitude: 120.9719 },
  { id: 9014, name: '雲林縣', country: '台灣', admin1: '雲林縣', timezone: 'Asia/Taipei', latitude: 23.7092, longitude: 120.4313 },
  { id: 9015, name: '嘉義縣', country: '台灣', admin1: '嘉義縣', timezone: 'Asia/Taipei', latitude: 23.4518, longitude: 120.2555 },
  { id: 9016, name: '屏東縣', country: '台灣', admin1: '屏東縣', timezone: 'Asia/Taipei', latitude: 22.5519, longitude: 120.5487 },
  { id: 9017, name: '宜蘭縣', country: '台灣', admin1: '宜蘭縣', timezone: 'Asia/Taipei', latitude: 24.7021, longitude: 121.7378 },
  { id: 9018, name: '花蓮縣', country: '台灣', admin1: '花蓮縣', timezone: 'Asia/Taipei', latitude: 23.9871, longitude: 121.6015 },
  { id: 9019, name: '台東縣', country: '台灣', admin1: '台東縣', timezone: 'Asia/Taipei', latitude: 22.7972, longitude: 121.0714 },
  { id: 9020, name: '澎湖縣', country: '台灣', admin1: '澎湖縣', timezone: 'Asia/Taipei', latitude: 23.5711, longitude: 119.5793 },
  { id: 9021, name: '金門縣', country: '台灣', admin1: '金門縣', timezone: 'Asia/Taipei', latitude: 24.4493, longitude: 118.3765 },
  { id: 9022, name: '連江縣', country: '台灣', admin1: '連江縣', timezone: 'Asia/Taipei', latitude: 26.1605, longitude: 119.9506 },
]

// 台灣地名別名對照（臺 ↔ 台、簡稱等）
const TW_ALIASES: Record<string, number> = {
  '臺北': 9001, '台北': 9001, 'taipei': 9001,
  '臺北市': 9001, '台北市': 9001,
  '新北': 9002, '新北市': 9002, 'new taipei': 9002,
  '桃園': 9003, '桃園市': 9003, 'taoyuan': 9003,
  '臺中': 9004, '台中': 9004, '台中市': 9004, 'taichung': 9004,
  '臺南': 9005, '台南': 9005, '台南市': 9005, 'tainan': 9005,
  '高雄': 9006, '高雄市': 9006, 'kaohsiung': 9006,
  '基隆': 9007, '基隆市': 9007, 'keelung': 9007,
  '新竹市': 9008, 'hsinchu city': 9008,
  '嘉義市': 9009, 'chiayi city': 9009,
  '新竹': 9010, '新竹縣': 9010, 'hsinchu': 9010,
  '苗栗': 9011, '苗栗縣': 9011, 'miaoli': 9011,
  '彰化': 9012, '彰化縣': 9012, 'changhua': 9012,
  '南投': 9013, '南投縣': 9013, 'nantou': 9013,
  '雲林': 9014, '雲林縣': 9014, 'yunlin': 9014,
  '嘉義': 9015, '嘉義縣': 9015, 'chiayi': 9015,
  '屏東': 9016, '屏東縣': 9016, 'pingtung': 9016,
  '宜蘭': 9017, '宜蘭縣': 9017, 'yilan': 9017,
  '花蓮': 9018, '花蓮縣': 9018, 'hualien': 9018,
  '台東': 9019, '臺東': 9019, '台東縣': 9019, 'taitung': 9019,
  '澎湖': 9020, '澎湖縣': 9020, 'penghu': 9020,
  '金門': 9021, '金門縣': 9021, 'kinmen': 9021,
  '連江': 9022, '連江縣': 9022, '馬祖': 9022, 'matsu': 9022,
}

// 日本主要都市靜態清單（全境 Asia/Tokyo UTC+9）
const JP_LOCATIONS: GeoResult[] = [
  { id: 8001, name: '東京', country: '日本', admin1: '東京都', timezone: 'Asia/Tokyo', latitude: 35.6762, longitude: 139.6503 },
  { id: 8002, name: '大阪', country: '日本', admin1: '大阪府', timezone: 'Asia/Tokyo', latitude: 34.6937, longitude: 135.5023 },
  { id: 8003, name: '名古屋', country: '日本', admin1: '愛知県', timezone: 'Asia/Tokyo', latitude: 35.1815, longitude: 136.9066 },
  { id: 8004, name: '札幌', country: '日本', admin1: '北海道', timezone: 'Asia/Tokyo', latitude: 43.0642, longitude: 141.3469 },
  { id: 8005, name: '横浜', country: '日本', admin1: '神奈川県', timezone: 'Asia/Tokyo', latitude: 35.4437, longitude: 139.6380 },
  { id: 8006, name: '神戸', country: '日本', admin1: '兵庫県', timezone: 'Asia/Tokyo', latitude: 34.6901, longitude: 135.1956 },
  { id: 8007, name: '京都', country: '日本', admin1: '京都府', timezone: 'Asia/Tokyo', latitude: 35.0116, longitude: 135.7681 },
  { id: 8008, name: '福岡', country: '日本', admin1: '福岡県', timezone: 'Asia/Tokyo', latitude: 33.5904, longitude: 130.4017 },
  { id: 8009, name: '仙台', country: '日本', admin1: '宮城県', timezone: 'Asia/Tokyo', latitude: 38.2682, longitude: 140.8694 },
  { id: 8010, name: '広島', country: '日本', admin1: '広島県', timezone: 'Asia/Tokyo', latitude: 34.3853, longitude: 132.4553 },
  { id: 8011, name: '那覇', country: '日本', admin1: '沖縄県', timezone: 'Asia/Tokyo', latitude: 26.2124, longitude: 127.6809 },
  { id: 8012, name: '長崎', country: '日本', admin1: '長崎県', timezone: 'Asia/Tokyo', latitude: 32.7503, longitude: 129.8779 },
  { id: 8013, name: '金沢', country: '日本', admin1: '石川県', timezone: 'Asia/Tokyo', latitude: 36.5944, longitude: 136.6256 },
  { id: 8014, name: '新潟', country: '日本', admin1: '新潟県', timezone: 'Asia/Tokyo', latitude: 37.9161, longitude: 139.0364 },
  { id: 8015, name: '熊本', country: '日本', admin1: '熊本県', timezone: 'Asia/Tokyo', latitude: 32.8031, longitude: 130.7079 },
  { id: 8016, name: '鹿児島', country: '日本', admin1: '鹿児島県', timezone: 'Asia/Tokyo', latitude: 31.5966, longitude: 130.5571 },
  { id: 8017, name: '松山', country: '日本', admin1: '愛媛県', timezone: 'Asia/Tokyo', latitude: 33.8392, longitude: 132.7658 },
  { id: 8018, name: '高松', country: '日本', admin1: '香川県', timezone: 'Asia/Tokyo', latitude: 34.3428, longitude: 134.0466 },
  { id: 8019, name: '盛岡', country: '日本', admin1: '岩手県', timezone: 'Asia/Tokyo', latitude: 39.7036, longitude: 141.1527 },
  { id: 8020, name: '青森', country: '日本', admin1: '青森県', timezone: 'Asia/Tokyo', latitude: 40.8244, longitude: 140.7400 },
]

const JP_ALIASES: Record<string, number> = {
  '東京': 8001, 'tokyo': 8001, '東京都': 8001,
  '大阪': 8002, 'osaka': 8002, '大阪市': 8002, '大阪府': 8002,
  '名古屋': 8003, 'nagoya': 8003,
  '札幌': 8004, 'sapporo': 8004, '北海道': 8004,
  '横浜': 8005, 'yokohama': 8005,
  '神戸': 8006, 'kobe': 8006,
  '京都': 8007, 'kyoto': 8007,
  '福岡': 8008, 'fukuoka': 8008,
  '仙台': 8009, 'sendai': 8009,
  '広島': 8010, 'hiroshima': 8010,
  '那覇': 8011, 'naha': 8011, '沖縄': 8011, 'okinawa': 8011,
  '長崎': 8012, 'nagasaki': 8012,
  '金沢': 8013, 'kanazawa': 8013,
  '新潟': 8014, 'niigata': 8014,
  '熊本': 8015, 'kumamoto': 8015,
  '鹿児島': 8016, 'kagoshima': 8016,
  '松山': 8017, 'matsuyama': 8017,
  '高松': 8018, 'takamatsu': 8018,
  '盛岡': 8019, 'morioka': 8019,
  '青森': 8020, 'aomori': 8020,
}

// 香港（Asia/Hong_Kong UTC+8）
const HK_LOCATIONS: GeoResult[] = [
  { id: 7001, name: '香港', country: '香港', admin1: '香港島', timezone: 'Asia/Hong_Kong', latitude: 22.3193, longitude: 114.1694 },
  { id: 7002, name: '九龍', country: '香港', admin1: '九龍', timezone: 'Asia/Hong_Kong', latitude: 22.3282, longitude: 114.1722 },
  { id: 7003, name: '新界', country: '香港', admin1: '新界', timezone: 'Asia/Hong_Kong', latitude: 22.4313, longitude: 114.0753 },
]
const HK_ALIASES: Record<string, number> = {
  '香港': 7001, 'hong kong': 7001, 'hongkong': 7001, 'hk': 7001,
  '九龍': 7002, 'kowloon': 7002,
  '新界': 7003, 'new territories': 7003,
}

// 澳門（Asia/Macau UTC+8）
const MO_LOCATIONS: GeoResult[] = [
  { id: 7011, name: '澳門', country: '澳門', admin1: '澳門半島', timezone: 'Asia/Macau', latitude: 22.1987, longitude: 113.5439 },
  { id: 7012, name: '氹仔', country: '澳門', admin1: '離島', timezone: 'Asia/Macau', latitude: 22.1667, longitude: 113.5667 },
  { id: 7013, name: '路環', country: '澳門', admin1: '離島', timezone: 'Asia/Macau', latitude: 22.1171, longitude: 113.5590 },
]
const MO_ALIASES: Record<string, number> = {
  '澳門': 7011, 'macao': 7011, 'macau': 7011,
  '氹仔': 7012, 'taipa': 7012,
  '路環': 7013, 'coloane': 7013,
}

// 新加坡（Asia/Singapore UTC+8）
const SG_LOCATIONS: GeoResult[] = [
  { id: 7021, name: '新加坡', country: '新加坡', admin1: '新加坡', timezone: 'Asia/Singapore', latitude: 1.3521, longitude: 103.8198 },
]
const SG_ALIASES: Record<string, number> = {
  '新加坡': 7021, 'singapore': 7021, 'sg': 7021,
}

// 馬來西亞（半島 Asia/Kuala_Lumpur，砂拉越/沙巴 Asia/Kuching）
const MY_LOCATIONS: GeoResult[] = [
  { id: 7031, name: '吉隆坡', country: '馬來西亞', admin1: '吉隆坡', timezone: 'Asia/Kuala_Lumpur', latitude: 3.1390, longitude: 101.6869 },
  { id: 7032, name: '檳城', country: '馬來西亞', admin1: '檳城州', timezone: 'Asia/Kuala_Lumpur', latitude: 5.4141, longitude: 100.3288 },
  { id: 7033, name: '新山', country: '馬來西亞', admin1: '柔佛州', timezone: 'Asia/Kuala_Lumpur', latitude: 1.4927, longitude: 103.7414 },
  { id: 7034, name: '馬六甲', country: '馬來西亞', admin1: '馬六甲州', timezone: 'Asia/Kuala_Lumpur', latitude: 2.1896, longitude: 102.2501 },
  { id: 7035, name: '怡保', country: '馬來西亞', admin1: '霹靂州', timezone: 'Asia/Kuala_Lumpur', latitude: 4.5975, longitude: 101.0901 },
  { id: 7036, name: '古晉', country: '馬來西亞', admin1: '砂拉越州', timezone: 'Asia/Kuching', latitude: 1.5497, longitude: 110.3590 },
  { id: 7037, name: '亞庇', country: '馬來西亞', admin1: '沙巴州', timezone: 'Asia/Kuching', latitude: 5.9804, longitude: 116.0735 },
]
const MY_ALIASES: Record<string, number> = {
  '吉隆坡': 7031, 'kuala lumpur': 7031, 'kl': 7031,
  '檳城': 7032, 'penang': 7032, 'george town': 7032,
  '新山': 7033, 'johor bahru': 7033, 'jb': 7033,
  '馬六甲': 7034, 'malacca': 7034, 'melaka': 7034,
  '怡保': 7035, 'ipoh': 7035,
  '古晉': 7036, 'kuching': 7036,
  '亞庇': 7037, 'kota kinabalu': 7037,
}

// 英國（Europe/London，含 BST/GMT 夏令時間）
const UK_LOCATIONS: GeoResult[] = [
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
const UK_ALIASES: Record<string, number> = {
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

// 美國（多時區）
const US_LOCATIONS: GeoResult[] = [
  { id: 5001, name: 'New York', country: 'United States', admin1: 'New York', timezone: 'America/New_York', latitude: 40.7128, longitude: -74.0060 },
  { id: 5002, name: 'Los Angeles', country: 'United States', admin1: 'California', timezone: 'America/Los_Angeles', latitude: 34.0522, longitude: -118.2437 },
  { id: 5003, name: 'Chicago', country: 'United States', admin1: 'Illinois', timezone: 'America/Chicago', latitude: 41.8781, longitude: -87.6298 },
  { id: 5004, name: 'Houston', country: 'United States', admin1: 'Texas', timezone: 'America/Chicago', latitude: 29.7604, longitude: -95.3698 },
  { id: 5005, name: 'San Francisco', country: 'United States', admin1: 'California', timezone: 'America/Los_Angeles', latitude: 37.7749, longitude: -122.4194 },
  { id: 5006, name: 'Seattle', country: 'United States', admin1: 'Washington', timezone: 'America/Los_Angeles', latitude: 47.6062, longitude: -122.3321 },
  { id: 5007, name: 'Miami', country: 'United States', admin1: 'Florida', timezone: 'America/New_York', latitude: 25.7617, longitude: -80.1918 },
  { id: 5008, name: 'Boston', country: 'United States', admin1: 'Massachusetts', timezone: 'America/New_York', latitude: 42.3601, longitude: -71.0589 },
  { id: 5009, name: 'Las Vegas', country: 'United States', admin1: 'Nevada', timezone: 'America/Los_Angeles', latitude: 36.1699, longitude: -115.1398 },
  { id: 5010, name: 'Denver', country: 'United States', admin1: 'Colorado', timezone: 'America/Denver', latitude: 39.7392, longitude: -104.9903 },
  { id: 5011, name: 'Atlanta', country: 'United States', admin1: 'Georgia', timezone: 'America/New_York', latitude: 33.7490, longitude: -84.3880 },
  { id: 5012, name: 'Dallas', country: 'United States', admin1: 'Texas', timezone: 'America/Chicago', latitude: 32.7767, longitude: -96.7970 },
  { id: 5013, name: 'Washington', country: 'United States', admin1: 'DC', timezone: 'America/New_York', latitude: 38.9072, longitude: -77.0369 },
  { id: 5014, name: 'Phoenix', country: 'United States', admin1: 'Arizona', timezone: 'America/Phoenix', latitude: 33.4484, longitude: -112.0740 },
  { id: 5015, name: 'Honolulu', country: 'United States', admin1: 'Hawaii', timezone: 'Pacific/Honolulu', latitude: 21.3069, longitude: -157.8583 },
  { id: 5016, name: 'Anchorage', country: 'United States', admin1: 'Alaska', timezone: 'America/Anchorage', latitude: 61.2181, longitude: -149.9003 },
  { id: 5017, name: 'Portland', country: 'United States', admin1: 'Oregon', timezone: 'America/Los_Angeles', latitude: 45.5051, longitude: -122.6750 },
  { id: 5018, name: 'San Diego', country: 'United States', admin1: 'California', timezone: 'America/Los_Angeles', latitude: 32.7157, longitude: -117.1611 },
  { id: 5019, name: 'Austin', country: 'United States', admin1: 'Texas', timezone: 'America/Chicago', latitude: 30.2672, longitude: -97.7431 },
  { id: 5020, name: 'Philadelphia', country: 'United States', admin1: 'Pennsylvania', timezone: 'America/New_York', latitude: 39.9526, longitude: -75.1652 },
]
const US_ALIASES: Record<string, number> = {
  'new york': 5001, 'nyc': 5001, '紐約': 5001,
  'los angeles': 5002, 'la': 5002, '洛杉磯': 5002,
  'chicago': 5003, '芝加哥': 5003,
  'houston': 5004, '休士頓': 5004,
  'san francisco': 5005, 'sf': 5005, '舊金山': 5005,
  'seattle': 5006, '西雅圖': 5006,
  'miami': 5007, '邁阿密': 5007,
  'boston': 5008, '波士頓': 5008,
  'las vegas': 5009, '拉斯維加斯': 5009,
  'denver': 5010, '丹佛': 5010,
  'atlanta': 5011, '亞特蘭大': 5011,
  'dallas': 5012, '達拉斯': 5012,
  'washington': 5013, 'dc': 5013, '華盛頓': 5013,
  'phoenix': 5014, '鳳凰城': 5014,
  'honolulu': 5015, '檀香山': 5015, '夏威夷': 5015,
  'anchorage': 5016, '安克拉治': 5016,
  'portland': 5017, '波特蘭': 5017,
  'san diego': 5018, '聖地牙哥': 5018,
  'austin': 5019, '奧斯汀': 5019,
  'philadelphia': 5020, '費城': 5020,
}

// 澳洲（多時區）
const AU_LOCATIONS: GeoResult[] = [
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
const AU_ALIASES: Record<string, number> = {
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

// 加拿大（多時區）
const CA_LOCATIONS: GeoResult[] = [
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
const CA_ALIASES: Record<string, number> = {
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

const ALL_STATIC = [...TW_LOCATIONS, ...JP_LOCATIONS, ...HK_LOCATIONS, ...MO_LOCATIONS, ...SG_LOCATIONS, ...MY_LOCATIONS, ...UK_LOCATIONS, ...US_LOCATIONS, ...AU_LOCATIONS, ...CA_LOCATIONS]
const ALL_ALIASES: Record<string, number> = { ...TW_ALIASES, ...JP_ALIASES, ...HK_ALIASES, ...MO_ALIASES, ...SG_ALIASES, ...MY_ALIASES, ...UK_ALIASES, ...US_ALIASES, ...AU_ALIASES, ...CA_ALIASES }

function searchStaticLocations(q: string): GeoResult[] {
  const trimmed = q.trim()
  const lower = trimmed.toLowerCase()
  if (lower.length < 1) return []

  // 精確比對別名
  const aliasId = ALL_ALIASES[trimmed] ?? ALL_ALIASES[lower]
  if (aliasId) {
    const match = ALL_STATIC.find(l => l.id === aliasId)
    return match ? [match] : []
  }

  // 部分比對 name / admin1
  return ALL_STATIC.filter(l =>
    l.name.includes(trimmed) ||
    l.name.toLowerCase().includes(lower) ||
    l.admin1?.includes(trimmed)
  )
}

interface Props {
  value: string          // display name
  onSelect: (timezone: string, label: string) => void
}

// Derive UTC offset (hours) from IANA timezone at a specific moment.
// Uses Intl to handle DST correctly — e.g. "Asia/Taipei" → 8, "America/New_York" in summer → -4
export function getOffsetFromTimezone(tz: string, at: Date): number {
  try {
    const tzPart = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(at).find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0'
    const m = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/)
    if (!m) return 0
    const sign = m[1] === '+' ? 1 : -1
    return sign * (parseInt(m[2]) + parseInt(m[3] ?? '0') / 60)
  } catch {
    return 0
  }
}

// Format numeric offset (hours) to ±HH:MM string
function formatOffset(offset: number): string {
  const totalMinutes = Math.round(offset * 60)
  const sign = totalMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(totalMinutes)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `UTC${sign}${hh}:${mm}`
}

export default function LocationPicker({ value, onSelect }: Props) {
  const { t, lang } = useLang()
  const [query, setQuery] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const [results, setResults] = useState<GeoResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external value changes during render (React-recommended pattern for derived state)
  if (prevValue !== value) {
    setPrevValue(value)
    setQuery(value)
  }

  // Cleanup pending debounce timer and in-flight fetch on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      abortRef.current?.abort()
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }

    // 台灣/日本地名優先走靜態清單，有結果就直接顯示，不呼叫外部 API
    const twMatches = searchStaticLocations(q)
    if (twMatches.length > 0) {
      setResults(twMatches)
      setOpen(true)
      setFetchError(null)
      return
    }

    // 非台灣地名走 Open-Meteo API
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=${lang}&format=json`,
        { signal: controller.signal }
      )
      if (controller.signal.aborted) return
      if (!res.ok) {
        setFetchError(t('home.locationSearchFailed', { status: res.status }))
        return
      }
      const json = await res.json()
      if (controller.signal.aborted) return
      setResults(json.results ?? [])
      setOpen(true)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setFetchError(t('home.locationNetworkError'))
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [t, lang])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(q), 320)
  }

  const handleSelect = (r: GeoResult) => {
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    setQuery(label)
    setOpen(false)
    setResults([])
    onSelect(r.timezone, label)
  }

  return (
    <div ref={containerRef} className="hd-input-group" style={{ position: 'relative', width: 180 }}>
      <label className="hd-input-label">{t('home.locationLabel')}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="hd-input-field"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t('home.locationPlaceholder')}
          style={{ width: '100%', paddingRight: loading ? 24 : 8 }}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          data-testid="location-input"
        />
        {loading && (
          <span style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--ink-soft)', pointerEvents: 'none',
          }}>…</span>
        )}
      </div>

      {fetchError && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#d04830', marginTop: 4 }}>
          {fetchError}
        </div>
      )}

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 200,
          background: 'var(--paper)',
          border: '1px solid var(--ink)',
          minWidth: 260,
          maxHeight: 220,
          overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(43,31,20,0.14)',
        }}>
          {results.map(r => {
            const offset = getOffsetFromTimezone(r.timezone, new Date())
            return (
              <div
                key={r.id}
                onClick={() => handleSelect(r)}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px dotted rgba(43,31,20,0.18)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-deep)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
                    {r.name}
                  </div>
                  {(r.admin1 || r.country) && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-soft)', marginTop: 2 }}>
                      {[r.admin1, r.country].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                  {formatOffset(offset)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
