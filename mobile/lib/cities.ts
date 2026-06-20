export type City = {
  name: string       // 搜尋用（英文）
  display: string    // 顯示名稱
  country: string
  timezone: string
}

export const CITIES: City[] = [
  // 台灣
  { name: 'Taipei', display: '台北 Taipei', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'New Taipei', display: '新北 New Taipei', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Taichung', display: '台中 Taichung', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Tainan', display: '台南 Tainan', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Kaohsiung', display: '高雄 Kaohsiung', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Hsinchu', display: '新竹 Hsinchu', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Keelung', display: '基隆 Keelung', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Taoyuan', display: '桃園 Taoyuan', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Chiayi', display: '嘉義 Chiayi', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Hualien', display: '花蓮 Hualien', country: 'TW', timezone: 'Asia/Taipei' },
  // 中國
  { name: 'Beijing', display: '北京 Beijing', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Shanghai', display: '上海 Shanghai', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Guangzhou', display: '廣州 Guangzhou', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Shenzhen', display: '深圳 Shenzhen', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Chengdu', display: '成都 Chengdu', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Chongqing', display: '重慶 Chongqing', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Wuhan', display: '武漢 Wuhan', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Hangzhou', display: '杭州 Hangzhou', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Nanjing', display: '南京 Nanjing', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Xi\'an', display: '西安 Xi\'an', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Kunming', display: '昆明 Kunming', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Urumqi', display: '烏魯木齊 Urumqi', country: 'CN', timezone: 'Asia/Urumqi' },
  // 香港・澳門
  { name: 'Hong Kong', display: '香港 Hong Kong', country: 'HK', timezone: 'Asia/Hong_Kong' },
  { name: 'Macau', display: '澳門 Macau', country: 'MO', timezone: 'Asia/Macau' },
  // 日本
  { name: 'Tokyo', display: '東京 Tokyo', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Osaka', display: '大阪 Osaka', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Kyoto', display: '京都 Kyoto', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Nagoya', display: '名古屋 Nagoya', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Sapporo', display: '札幌 Sapporo', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Fukuoka', display: '福岡 Fukuoka', country: 'JP', timezone: 'Asia/Tokyo' },
  // 韓國
  { name: 'Seoul', display: '首爾 Seoul', country: 'KR', timezone: 'Asia/Seoul' },
  { name: 'Busan', display: '釜山 Busan', country: 'KR', timezone: 'Asia/Seoul' },
  // 東南亞
  { name: 'Singapore', display: '新加坡 Singapore', country: 'SG', timezone: 'Asia/Singapore' },
  { name: 'Bangkok', display: '曼谷 Bangkok', country: 'TH', timezone: 'Asia/Bangkok' },
  { name: 'Jakarta', display: '雅加達 Jakarta', country: 'ID', timezone: 'Asia/Jakarta' },
  { name: 'Kuala Lumpur', display: '吉隆坡 Kuala Lumpur', country: 'MY', timezone: 'Asia/Kuala_Lumpur' },
  { name: 'Manila', display: '馬尼拉 Manila', country: 'PH', timezone: 'Asia/Manila' },
  { name: 'Ho Chi Minh City', display: '胡志明市 Ho Chi Minh City', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  { name: 'Hanoi', display: '河內 Hanoi', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  // 南亞
  { name: 'Mumbai', display: 'Mumbai 孟買', country: 'IN', timezone: 'Asia/Kolkata' },
  { name: 'New Delhi', display: 'New Delhi 新德里', country: 'IN', timezone: 'Asia/Kolkata' },
  { name: 'Kolkata', display: 'Kolkata 加爾各答', country: 'IN', timezone: 'Asia/Kolkata' },
  { name: 'Bangalore', display: 'Bangalore 班加羅爾', country: 'IN', timezone: 'Asia/Kolkata' },
  { name: 'Dhaka', display: 'Dhaka 達卡', country: 'BD', timezone: 'Asia/Dhaka' },
  { name: 'Karachi', display: 'Karachi 卡拉奇', country: 'PK', timezone: 'Asia/Karachi' },
  // 中東
  { name: 'Dubai', display: 'Dubai 杜拜', country: 'AE', timezone: 'Asia/Dubai' },
  { name: 'Istanbul', display: 'Istanbul 伊斯坦堡', country: 'TR', timezone: 'Europe/Istanbul' },
  { name: 'Riyadh', display: 'Riyadh 利雅德', country: 'SA', timezone: 'Asia/Riyadh' },
  { name: 'Tehran', display: 'Tehran 德黑蘭', country: 'IR', timezone: 'Asia/Tehran' },
  // 大洋洲
  { name: 'Sydney', display: 'Sydney 雪梨', country: 'AU', timezone: 'Australia/Sydney' },
  { name: 'Melbourne', display: 'Melbourne 墨爾本', country: 'AU', timezone: 'Australia/Melbourne' },
  { name: 'Brisbane', display: 'Brisbane 布里斯本', country: 'AU', timezone: 'Australia/Brisbane' },
  { name: 'Perth', display: 'Perth 伯斯', country: 'AU', timezone: 'Australia/Perth' },
  { name: 'Auckland', display: 'Auckland 奧克蘭', country: 'NZ', timezone: 'Pacific/Auckland' },
  // 歐洲
  { name: 'London', display: 'London 倫敦', country: 'GB', timezone: 'Europe/London' },
  { name: 'Paris', display: 'Paris 巴黎', country: 'FR', timezone: 'Europe/Paris' },
  { name: 'Berlin', display: 'Berlin 柏林', country: 'DE', timezone: 'Europe/Berlin' },
  { name: 'Rome', display: 'Rome 羅馬', country: 'IT', timezone: 'Europe/Rome' },
  { name: 'Madrid', display: 'Madrid 馬德里', country: 'ES', timezone: 'Europe/Madrid' },
  { name: 'Amsterdam', display: 'Amsterdam 阿姆斯特丹', country: 'NL', timezone: 'Europe/Amsterdam' },
  { name: 'Vienna', display: 'Vienna 維也納', country: 'AT', timezone: 'Europe/Vienna' },
  { name: 'Zurich', display: 'Zurich 蘇黎世', country: 'CH', timezone: 'Europe/Zurich' },
  { name: 'Stockholm', display: 'Stockholm 斯德哥爾摩', country: 'SE', timezone: 'Europe/Stockholm' },
  { name: 'Moscow', display: 'Moscow 莫斯科', country: 'RU', timezone: 'Europe/Moscow' },
  { name: 'Warsaw', display: 'Warsaw 華沙', country: 'PL', timezone: 'Europe/Warsaw' },
  { name: 'Prague', display: 'Prague 布拉格', country: 'CZ', timezone: 'Europe/Prague' },
  { name: 'Budapest', display: 'Budapest 布達佩斯', country: 'HU', timezone: 'Europe/Budapest' },
  { name: 'Brussels', display: 'Brussels 布魯塞爾', country: 'BE', timezone: 'Europe/Brussels' },
  { name: 'Athens', display: 'Athens 雅典', country: 'GR', timezone: 'Europe/Athens' },
  // 北美
  { name: 'New York', display: 'New York 紐約', country: 'US', timezone: 'America/New_York' },
  { name: 'Los Angeles', display: 'Los Angeles 洛杉磯', country: 'US', timezone: 'America/Los_Angeles' },
  { name: 'Chicago', display: 'Chicago 芝加哥', country: 'US', timezone: 'America/Chicago' },
  { name: 'Houston', display: 'Houston 休士頓', country: 'US', timezone: 'America/Chicago' },
  { name: 'Phoenix', display: 'Phoenix 鳳凰城', country: 'US', timezone: 'America/Phoenix' },
  { name: 'San Francisco', display: 'San Francisco 舊金山', country: 'US', timezone: 'America/Los_Angeles' },
  { name: 'Seattle', display: 'Seattle 西雅圖', country: 'US', timezone: 'America/Los_Angeles' },
  { name: 'Miami', display: 'Miami 邁阿密', country: 'US', timezone: 'America/New_York' },
  { name: 'Boston', display: 'Boston 波士頓', country: 'US', timezone: 'America/New_York' },
  { name: 'Washington DC', display: 'Washington DC 華盛頓', country: 'US', timezone: 'America/New_York' },
  { name: 'Las Vegas', display: 'Las Vegas 拉斯維加斯', country: 'US', timezone: 'America/Los_Angeles' },
  { name: 'Denver', display: 'Denver 丹佛', country: 'US', timezone: 'America/Denver' },
  { name: 'Atlanta', display: 'Atlanta 亞特蘭大', country: 'US', timezone: 'America/New_York' },
  { name: 'Toronto', display: 'Toronto 多倫多', country: 'CA', timezone: 'America/Toronto' },
  { name: 'Vancouver', display: 'Vancouver 溫哥華', country: 'CA', timezone: 'America/Vancouver' },
  { name: 'Montreal', display: 'Montreal 蒙特婁', country: 'CA', timezone: 'America/Toronto' },
  { name: 'Mexico City', display: 'Mexico City 墨西哥城', country: 'MX', timezone: 'America/Mexico_City' },
  // 南美
  { name: 'Sao Paulo', display: 'São Paulo 聖保羅', country: 'BR', timezone: 'America/Sao_Paulo' },
  { name: 'Rio de Janeiro', display: 'Rio de Janeiro 里約熱內盧', country: 'BR', timezone: 'America/Sao_Paulo' },
  { name: 'Buenos Aires', display: 'Buenos Aires 布宜諾斯艾利斯', country: 'AR', timezone: 'America/Argentina/Buenos_Aires' },
  { name: 'Lima', display: 'Lima 利馬', country: 'PE', timezone: 'America/Lima' },
  { name: 'Santiago', display: 'Santiago 聖地牙哥', country: 'CL', timezone: 'America/Santiago' },
  { name: 'Bogota', display: 'Bogotá 波哥大', country: 'CO', timezone: 'America/Bogota' },
  // 非洲
  { name: 'Cairo', display: 'Cairo 開羅', country: 'EG', timezone: 'Africa/Cairo' },
  { name: 'Lagos', display: 'Lagos 拉哥斯', country: 'NG', timezone: 'Africa/Lagos' },
  { name: 'Nairobi', display: 'Nairobi 奈洛比', country: 'KE', timezone: 'Africa/Nairobi' },
  { name: 'Johannesburg', display: 'Johannesburg 約翰尼斯堡', country: 'ZA', timezone: 'Africa/Johannesburg' },
  { name: 'Casablanca', display: 'Casablanca 卡薩布蘭加', country: 'MA', timezone: 'Africa/Casablanca' },
]

export function searchCities(query: string): City[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.display.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q),
  ).slice(0, 8)
}
