export type City = {
  name: string       // 搜尋用（中英文都放這）
  display: string    // 顯示名稱
  country: string
  timezone: string
}

export const CITIES: City[] = [
  // ── 台灣 22 縣市 ──────────────────────────────────────────────────────────
  { name: 'Taipei 台北市', display: '台北市 Taipei', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'New Taipei 新北市', display: '新北市 New Taipei', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Taoyuan 桃園市', display: '桃園市 Taoyuan', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Taichung 台中市', display: '台中市 Taichung', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Tainan 台南市', display: '台南市 Tainan', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Kaohsiung 高雄市', display: '高雄市 Kaohsiung', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Keelung 基隆市', display: '基隆市 Keelung', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Hsinchu City 新竹市', display: '新竹市 Hsinchu City', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Chiayi City 嘉義市', display: '嘉義市 Chiayi City', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Hsinchu County 新竹縣', display: '新竹縣 Hsinchu County', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Miaoli 苗栗縣', display: '苗栗縣 Miaoli', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Changhua 彰化縣', display: '彰化縣 Changhua', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Nantou 南投縣', display: '南投縣 Nantou', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Yunlin 雲林縣', display: '雲林縣 Yunlin', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Chiayi County 嘉義縣', display: '嘉義縣 Chiayi County', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Pingtung 屏東縣', display: '屏東縣 Pingtung', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Yilan 宜蘭縣', display: '宜蘭縣 Yilan', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Hualien 花蓮縣', display: '花蓮縣 Hualien', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Taitung 台東縣', display: '台東縣 Taitung', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Penghu 澎湖縣', display: '澎湖縣 Penghu', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Kinmen 金門縣', display: '金門縣 Kinmen', country: 'TW', timezone: 'Asia/Taipei' },
  { name: 'Lienchiang Matsu 連江縣 馬祖', display: '連江縣（馬祖）Lienchiang', country: 'TW', timezone: 'Asia/Taipei' },

  // ── 中國 31 省市自治區 ───────────────────────────────────────────────────
  { name: 'Beijing 北京市', display: '北京市 Beijing', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Shanghai 上海市', display: '上海市 Shanghai', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Tianjin 天津市', display: '天津市 Tianjin', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Chongqing 重慶市', display: '重慶市 Chongqing', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Hebei Shijiazhuang 河北省 石家莊', display: '河北省 Hebei', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Shanxi Taiyuan 山西省 太原', display: '山西省 Shanxi', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Liaoning Shenyang 遼寧省 瀋陽', display: '遼寧省 Liaoning', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Jilin Changchun 吉林省 長春', display: '吉林省 Jilin', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Heilongjiang Harbin 黑龍江省 哈爾濱', display: '黑龍江省 Heilongjiang', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Jiangsu Nanjing 江蘇省 南京', display: '江蘇省 Jiangsu', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Zhejiang Hangzhou 浙江省 杭州', display: '浙江省 Zhejiang', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Anhui Hefei 安徽省 合肥', display: '安徽省 Anhui', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Fujian Fuzhou 福建省 福州', display: '福建省 Fujian', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Jiangxi Nanchang 江西省 南昌', display: '江西省 Jiangxi', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Shandong Jinan 山東省 濟南', display: '山東省 Shandong', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Henan Zhengzhou 河南省 鄭州', display: '河南省 Henan', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Hubei Wuhan 湖北省 武漢', display: '湖北省 Hubei', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Hunan Changsha 湖南省 長沙', display: '湖南省 Hunan', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Guangdong Guangzhou 廣東省 廣州', display: '廣東省 Guangdong', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Hainan Haikou 海南省 海口', display: '海南省 Hainan', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Sichuan Chengdu 四川省 成都', display: '四川省 Sichuan', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Guizhou Guiyang 貴州省 貴陽', display: '貴州省 Guizhou', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Yunnan Kunming 雲南省 昆明', display: '雲南省 Yunnan', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Shaanxi Xian 陝西省 西安', display: '陝西省 Shaanxi', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Gansu Lanzhou 甘肅省 蘭州', display: '甘肅省 Gansu', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Qinghai Xining 青海省 西寧', display: '青海省 Qinghai', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Inner Mongolia Hohhot 內蒙古 呼和浩特', display: '內蒙古 Inner Mongolia', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Guangxi Nanning 廣西 南寧', display: '廣西 Guangxi', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Tibet Lhasa 西藏 拉薩', display: '西藏 Tibet', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Ningxia Yinchuan 寧夏 銀川', display: '寧夏 Ningxia', country: 'CN', timezone: 'Asia/Shanghai' },
  { name: 'Xinjiang Urumqi 新疆 烏魯木齊', display: '新疆 Xinjiang', country: 'CN', timezone: 'Asia/Urumqi' },

  // ── 香港 ─────────────────────────────────────────────────────────────────
  { name: 'Hong Kong 香港', display: '香港 Hong Kong', country: 'HK', timezone: 'Asia/Hong_Kong' },
  { name: 'Kowloon 九龍', display: '九龍 Kowloon', country: 'HK', timezone: 'Asia/Hong_Kong' },
  { name: 'New Territories 新界', display: '新界 New Territories', country: 'HK', timezone: 'Asia/Hong_Kong' },

  // ── 澳門 ─────────────────────────────────────────────────────────────────
  { name: 'Macau 澳門', display: '澳門 Macau', country: 'MO', timezone: 'Asia/Macau' },
  { name: 'Taipa 氹仔', display: '氹仔 Taipa', country: 'MO', timezone: 'Asia/Macau' },
  { name: 'Coloane 路環', display: '路環 Coloane', country: 'MO', timezone: 'Asia/Macau' },

  // ── 日本 ─────────────────────────────────────────────────────────────────
  { name: 'Tokyo 東京', display: '東京 Tokyo', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Osaka 大阪', display: '大阪 Osaka', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Nagoya 名古屋', display: '名古屋 Nagoya', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Sapporo 札幌', display: '札幌 Sapporo', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Yokohama 横浜', display: '横浜 Yokohama', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Kobe 神戸', display: '神戸 Kobe', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Kyoto 京都', display: '京都 Kyoto', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Fukuoka 福岡', display: '福岡 Fukuoka', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Sendai 仙台', display: '仙台 Sendai', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Hiroshima 広島', display: '広島 Hiroshima', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Naha Okinawa 那覇 沖縄', display: '那覇（沖縄）Naha', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Nagasaki 長崎', display: '長崎 Nagasaki', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Kanazawa 金沢', display: '金沢 Kanazawa', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Niigata 新潟', display: '新潟 Niigata', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Kumamoto 熊本', display: '熊本 Kumamoto', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Kagoshima 鹿児島', display: '鹿児島 Kagoshima', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Matsuyama 松山', display: '松山 Matsuyama', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Takamatsu 高松', display: '高松 Takamatsu', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Morioka 盛岡', display: '盛岡 Morioka', country: 'JP', timezone: 'Asia/Tokyo' },
  { name: 'Aomori 青森', display: '青森 Aomori', country: 'JP', timezone: 'Asia/Tokyo' },

  // ── 新加坡 ───────────────────────────────────────────────────────────────
  { name: 'Singapore 新加坡', display: '新加坡 Singapore', country: 'SG', timezone: 'Asia/Singapore' },

  // ── 馬來西亞 ─────────────────────────────────────────────────────────────
  { name: 'Kuala Lumpur 吉隆坡', display: '吉隆坡 Kuala Lumpur', country: 'MY', timezone: 'Asia/Kuala_Lumpur' },
  { name: 'Penang 檳城', display: '檳城 Penang', country: 'MY', timezone: 'Asia/Kuala_Lumpur' },
  { name: 'Johor Bahru 新山', display: '新山 Johor Bahru', country: 'MY', timezone: 'Asia/Kuala_Lumpur' },
  { name: 'Malacca 馬六甲', display: '馬六甲 Malacca', country: 'MY', timezone: 'Asia/Kuala_Lumpur' },
  { name: 'Ipoh 怡保', display: '怡保 Ipoh', country: 'MY', timezone: 'Asia/Kuala_Lumpur' },
  { name: 'Kuching 古晉', display: '古晉 Kuching', country: 'MY', timezone: 'Asia/Kuching' },
  { name: 'Kota Kinabalu 亞庇', display: '亞庇 Kota Kinabalu', country: 'MY', timezone: 'Asia/Kuching' },

  // ── 韓國 ─────────────────────────────────────────────────────────────────
  { name: 'Seoul 首爾', display: '首爾 Seoul', country: 'KR', timezone: 'Asia/Seoul' },
  { name: 'Busan 釜山', display: '釜山 Busan', country: 'KR', timezone: 'Asia/Seoul' },

  // ── 東南亞（其他）────────────────────────────────────────────────────────
  { name: 'Bangkok 曼谷', display: '曼谷 Bangkok', country: 'TH', timezone: 'Asia/Bangkok' },
  { name: 'Jakarta 雅加達', display: '雅加達 Jakarta', country: 'ID', timezone: 'Asia/Jakarta' },
  { name: 'Manila 馬尼拉', display: '馬尼拉 Manila', country: 'PH', timezone: 'Asia/Manila' },
  { name: 'Ho Chi Minh City 胡志明市', display: '胡志明市 Ho Chi Minh City', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },
  { name: 'Hanoi 河內', display: '河內 Hanoi', country: 'VN', timezone: 'Asia/Ho_Chi_Minh' },

  // ── 南亞 ─────────────────────────────────────────────────────────────────
  { name: 'Mumbai 孟買', display: 'Mumbai 孟買', country: 'IN', timezone: 'Asia/Kolkata' },
  { name: 'New Delhi 新德里', display: 'New Delhi 新德里', country: 'IN', timezone: 'Asia/Kolkata' },
  { name: 'Kolkata 加爾各答', display: 'Kolkata 加爾各答', country: 'IN', timezone: 'Asia/Kolkata' },
  { name: 'Bangalore 班加羅爾', display: 'Bangalore 班加羅爾', country: 'IN', timezone: 'Asia/Kolkata' },
  { name: 'Dhaka 達卡', display: 'Dhaka 達卡', country: 'BD', timezone: 'Asia/Dhaka' },
  { name: 'Karachi 卡拉奇', display: 'Karachi 卡拉奇', country: 'PK', timezone: 'Asia/Karachi' },

  // ── 中東 ─────────────────────────────────────────────────────────────────
  { name: 'Dubai 杜拜', display: 'Dubai 杜拜', country: 'AE', timezone: 'Asia/Dubai' },
  { name: 'Istanbul 伊斯坦堡', display: 'Istanbul 伊斯坦堡', country: 'TR', timezone: 'Europe/Istanbul' },
  { name: 'Riyadh 利雅德', display: 'Riyadh 利雅德', country: 'SA', timezone: 'Asia/Riyadh' },
  { name: 'Tehran 德黑蘭', display: 'Tehran 德黑蘭', country: 'IR', timezone: 'Asia/Tehran' },

  // ── 英國 ─────────────────────────────────────────────────────────────────
  { name: 'London 倫敦', display: 'London 倫敦', country: 'GB', timezone: 'Europe/London' },
  { name: 'Manchester 曼徹斯特', display: 'Manchester 曼徹斯特', country: 'GB', timezone: 'Europe/London' },
  { name: 'Birmingham 伯明罕', display: 'Birmingham 伯明罕', country: 'GB', timezone: 'Europe/London' },
  { name: 'Edinburgh 愛丁堡', display: 'Edinburgh 愛丁堡', country: 'GB', timezone: 'Europe/London' },
  { name: 'Glasgow 格拉斯哥', display: 'Glasgow 格拉斯哥', country: 'GB', timezone: 'Europe/London' },
  { name: 'Liverpool 利物浦', display: 'Liverpool 利物浦', country: 'GB', timezone: 'Europe/London' },
  { name: 'Bristol 布里斯托', display: 'Bristol 布里斯托', country: 'GB', timezone: 'Europe/London' },
  { name: 'Leeds 里茲', display: 'Leeds 里茲', country: 'GB', timezone: 'Europe/London' },
  { name: 'Cardiff 卡迪夫', display: 'Cardiff 卡迪夫', country: 'GB', timezone: 'Europe/London' },
  { name: 'Belfast 貝爾法斯特', display: 'Belfast 貝爾法斯特', country: 'GB', timezone: 'Europe/London' },

  // ── 歐洲（其他）──────────────────────────────────────────────────────────
  { name: 'Paris 巴黎', display: 'Paris 巴黎', country: 'FR', timezone: 'Europe/Paris' },
  { name: 'Berlin 柏林', display: 'Berlin 柏林', country: 'DE', timezone: 'Europe/Berlin' },
  { name: 'Rome 羅馬', display: 'Rome 羅馬', country: 'IT', timezone: 'Europe/Rome' },
  { name: 'Madrid 馬德里', display: 'Madrid 馬德里', country: 'ES', timezone: 'Europe/Madrid' },
  { name: 'Amsterdam 阿姆斯特丹', display: 'Amsterdam 阿姆斯特丹', country: 'NL', timezone: 'Europe/Amsterdam' },
  { name: 'Vienna 維也納', display: 'Vienna 維也納', country: 'AT', timezone: 'Europe/Vienna' },
  { name: 'Zurich 蘇黎世', display: 'Zurich 蘇黎世', country: 'CH', timezone: 'Europe/Zurich' },
  { name: 'Stockholm 斯德哥爾摩', display: 'Stockholm 斯德哥爾摩', country: 'SE', timezone: 'Europe/Stockholm' },
  { name: 'Moscow 莫斯科', display: 'Moscow 莫斯科', country: 'RU', timezone: 'Europe/Moscow' },
  { name: 'Warsaw 華沙', display: 'Warsaw 華沙', country: 'PL', timezone: 'Europe/Warsaw' },
  { name: 'Prague 布拉格', display: 'Prague 布拉格', country: 'CZ', timezone: 'Europe/Prague' },
  { name: 'Budapest 布達佩斯', display: 'Budapest 布達佩斯', country: 'HU', timezone: 'Europe/Budapest' },
  { name: 'Brussels 布魯塞爾', display: 'Brussels 布魯塞爾', country: 'BE', timezone: 'Europe/Brussels' },
  { name: 'Athens 雅典', display: 'Athens 雅典', country: 'GR', timezone: 'Europe/Athens' },

  // ── 美國 ─────────────────────────────────────────────────────────────────
  { name: 'New York 紐約', display: 'New York 紐約', country: 'US', timezone: 'America/New_York' },
  { name: 'Los Angeles 洛杉磯', display: 'Los Angeles 洛杉磯', country: 'US', timezone: 'America/Los_Angeles' },
  { name: 'Chicago 芝加哥', display: 'Chicago 芝加哥', country: 'US', timezone: 'America/Chicago' },
  { name: 'Houston 休士頓', display: 'Houston 休士頓', country: 'US', timezone: 'America/Chicago' },
  { name: 'San Francisco 舊金山', display: 'San Francisco 舊金山', country: 'US', timezone: 'America/Los_Angeles' },
  { name: 'Seattle 西雅圖', display: 'Seattle 西雅圖', country: 'US', timezone: 'America/Los_Angeles' },
  { name: 'Miami 邁阿密', display: 'Miami 邁阿密', country: 'US', timezone: 'America/New_York' },
  { name: 'Boston 波士頓', display: 'Boston 波士頓', country: 'US', timezone: 'America/New_York' },
  { name: 'Las Vegas 拉斯維加斯', display: 'Las Vegas 拉斯維加斯', country: 'US', timezone: 'America/Los_Angeles' },
  { name: 'Denver 丹佛', display: 'Denver 丹佛', country: 'US', timezone: 'America/Denver' },
  { name: 'Atlanta 亞特蘭大', display: 'Atlanta 亞特蘭大', country: 'US', timezone: 'America/New_York' },
  { name: 'Dallas 達拉斯', display: 'Dallas 達拉斯', country: 'US', timezone: 'America/Chicago' },
  { name: 'Washington DC 華盛頓', display: 'Washington DC 華盛頓', country: 'US', timezone: 'America/New_York' },
  { name: 'Phoenix 鳳凰城', display: 'Phoenix 鳳凰城', country: 'US', timezone: 'America/Phoenix' },
  { name: 'Honolulu 檀香山', display: 'Honolulu 檀香山', country: 'US', timezone: 'Pacific/Honolulu' },
  { name: 'Anchorage 安克拉治', display: 'Anchorage 安克拉治', country: 'US', timezone: 'America/Anchorage' },
  { name: 'Portland 波特蘭', display: 'Portland 波特蘭', country: 'US', timezone: 'America/Los_Angeles' },
  { name: 'San Diego 聖地牙哥', display: 'San Diego 聖地牙哥', country: 'US', timezone: 'America/Los_Angeles' },
  { name: 'Austin 奧斯汀', display: 'Austin 奧斯汀', country: 'US', timezone: 'America/Chicago' },
  { name: 'Philadelphia 費城', display: 'Philadelphia 費城', country: 'US', timezone: 'America/New_York' },

  // ── 加拿大 ───────────────────────────────────────────────────────────────
  { name: 'Toronto 多倫多', display: 'Toronto 多倫多', country: 'CA', timezone: 'America/Toronto' },
  { name: 'Vancouver 溫哥華', display: 'Vancouver 溫哥華', country: 'CA', timezone: 'America/Vancouver' },
  { name: 'Montreal 蒙特婁', display: 'Montreal 蒙特婁', country: 'CA', timezone: 'America/Toronto' },
  { name: 'Calgary 卡加利', display: 'Calgary 卡加利', country: 'CA', timezone: 'America/Edmonton' },
  { name: 'Ottawa 渥太華', display: 'Ottawa 渥太華', country: 'CA', timezone: 'America/Toronto' },
  { name: 'Edmonton 愛德蒙頓', display: 'Edmonton 愛德蒙頓', country: 'CA', timezone: 'America/Edmonton' },
  { name: 'Winnipeg 溫尼伯', display: 'Winnipeg 溫尼伯', country: 'CA', timezone: 'America/Winnipeg' },
  { name: 'Halifax 哈利法克斯', display: 'Halifax 哈利法克斯', country: 'CA', timezone: 'America/Halifax' },
  { name: 'Quebec City 魁北克市', display: 'Quebec City 魁北克市', country: 'CA', timezone: 'America/Toronto' },
  { name: 'Victoria 維多利亞', display: 'Victoria 維多利亞', country: 'CA', timezone: 'America/Vancouver' },

  // ── 墨西哥、中南美 ───────────────────────────────────────────────────────
  { name: 'Mexico City 墨西哥城', display: 'Mexico City 墨西哥城', country: 'MX', timezone: 'America/Mexico_City' },
  { name: 'Sao Paulo 聖保羅', display: 'São Paulo 聖保羅', country: 'BR', timezone: 'America/Sao_Paulo' },
  { name: 'Rio de Janeiro 里約熱內盧', display: 'Rio de Janeiro 里約', country: 'BR', timezone: 'America/Sao_Paulo' },
  { name: 'Buenos Aires 布宜諾斯艾利斯', display: 'Buenos Aires 布宜諾斯艾利斯', country: 'AR', timezone: 'America/Argentina/Buenos_Aires' },
  { name: 'Lima 利馬', display: 'Lima 利馬', country: 'PE', timezone: 'America/Lima' },
  { name: 'Santiago 聖地牙哥', display: 'Santiago 聖地牙哥（智利）', country: 'CL', timezone: 'America/Santiago' },
  { name: 'Bogota 波哥大', display: 'Bogotá 波哥大', country: 'CO', timezone: 'America/Bogota' },

  // ── 大洋洲 ───────────────────────────────────────────────────────────────
  { name: 'Sydney 雪梨', display: 'Sydney 雪梨', country: 'AU', timezone: 'Australia/Sydney' },
  { name: 'Melbourne 墨爾本', display: 'Melbourne 墨爾本', country: 'AU', timezone: 'Australia/Melbourne' },
  { name: 'Brisbane 布里斯本', display: 'Brisbane 布里斯本', country: 'AU', timezone: 'Australia/Brisbane' },
  { name: 'Perth 伯斯', display: 'Perth 伯斯', country: 'AU', timezone: 'Australia/Perth' },
  { name: 'Adelaide 阿德萊德', display: 'Adelaide 阿德萊德', country: 'AU', timezone: 'Australia/Adelaide' },
  { name: 'Canberra 坎培拉', display: 'Canberra 坎培拉', country: 'AU', timezone: 'Australia/Sydney' },
  { name: 'Gold Coast 黃金海岸', display: 'Gold Coast 黃金海岸', country: 'AU', timezone: 'Australia/Brisbane' },
  { name: 'Darwin 達爾文', display: 'Darwin 達爾文', country: 'AU', timezone: 'Australia/Darwin' },
  { name: 'Hobart 荷巴特', display: 'Hobart 荷巴特', country: 'AU', timezone: 'Australia/Hobart' },
  { name: 'Newcastle 紐卡素', display: 'Newcastle 紐卡素', country: 'AU', timezone: 'Australia/Sydney' },
  { name: 'Auckland 奧克蘭', display: 'Auckland 奧克蘭', country: 'NZ', timezone: 'Pacific/Auckland' },

  // ── 非洲 ─────────────────────────────────────────────────────────────────
  { name: 'Cairo 開羅', display: 'Cairo 開羅', country: 'EG', timezone: 'Africa/Cairo' },
  { name: 'Lagos 拉哥斯', display: 'Lagos 拉哥斯', country: 'NG', timezone: 'Africa/Lagos' },
  { name: 'Nairobi 奈洛比', display: 'Nairobi 奈洛比', country: 'KE', timezone: 'Africa/Nairobi' },
  { name: 'Johannesburg 約翰尼斯堡', display: 'Johannesburg 約翰尼斯堡', country: 'ZA', timezone: 'Africa/Johannesburg' },
  { name: 'Casablanca 卡薩布蘭加', display: 'Casablanca 卡薩布蘭加', country: 'MA', timezone: 'Africa/Casablanca' },
]

/**
 * 依使用者輸入的關鍵字比對資料庫中的地點。
 * 優先找完全相符（忽略大小寫），找不到再退回子字串比對；
 * 子字串比對到超過一筆時視為輸入不夠明確，回傳 null 而非隨意取第一筆（避免時區算錯）。
 */
export function matchCity(query: string): City | null {
  const q = query.trim().toLowerCase()
  if (!q) return null

  const exact = CITIES.find(
    (c) => c.name.toLowerCase() === q || c.display.toLowerCase() === q,
  )
  if (exact) return exact

  const partialMatches = CITIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.display.toLowerCase().includes(q),
  )
  return partialMatches.length === 1 ? partialMatches[0] : null
}
