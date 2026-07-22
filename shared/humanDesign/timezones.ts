// 全世界目前實際使用中的 UTC 偏移量清單（web/mobile 共用）
// 這不是 IANA tzdata 的城市清單（那份有 419 筆，同一個偏移量常常有幾十個城市重複），
// 而是「每個偏移量只出現一次」的純時區選單，總共 39 筆。
//
// zone 是背後用來實際換算的代碼：
// - 整數小時一律用 Etc/GMT±N（注意 tzdata 對 Etc/GMT 的正負號是反過來的，
//   Etc/GMT-8 = UTC+8），這種寫法全年固定、不受任何地區日光節約時間影響，最準確。
// - 30/45 分這種非整點偏移量，tzdata 沒有對應的 Etc/GMT 寫法，優先改用該偏移量
//   全年穩定不變的真實地點（如 Asia/Calcutta、Australia/Darwin）。
// - 但紐芬蘭（-03:30／-02:30）、阿德雷德（+10:30）、查坦群島（+12:45／+13:45）
//   背後對應的地點本身會隨當地夏令時間在兩個偏移量之間切換——使用者在這裡是明確
//   手動選擇一個「固定」偏移量，不應該因為出生日期落在對方夏令時間季節就被
//   偷偷換算成另一個值。這幾筆改用 `UTC±HH:MM` 這種自我描述的固定偏移量標記，
//   由 getOffsetFromTimezone()（utils/ephemeris.ts）直接解析數字、不查 IANA/DST，
//   真正的城市比對（lib/cities.ts 的 matchCity）則仍使用一般 IANA 地區時區。
export interface TimezoneOption {
  label: string
  zone: string
}

export const ALL_TIMEZONES: TimezoneOption[] = [
  { label: 'UTC-11:00', zone: 'Etc/GMT+11' },
  { label: 'UTC-10:00', zone: 'Etc/GMT+10' },
  { label: 'UTC-09:30', zone: 'Pacific/Marquesas' },
  { label: 'UTC-09:00', zone: 'Etc/GMT+9' },
  { label: 'UTC-08:00', zone: 'Etc/GMT+8' },
  { label: 'UTC-07:00', zone: 'Etc/GMT+7' },
  { label: 'UTC-06:00', zone: 'Etc/GMT+6' },
  { label: 'UTC-05:00', zone: 'Etc/GMT+5' },
  { label: 'UTC-04:00', zone: 'Etc/GMT+4' },
  { label: 'UTC-03:30', zone: 'UTC-03:30' },
  { label: 'UTC-03:00', zone: 'Etc/GMT+3' },
  { label: 'UTC-02:30', zone: 'UTC-02:30' },
  { label: 'UTC-02:00', zone: 'Etc/GMT+2' },
  { label: 'UTC-01:00', zone: 'Etc/GMT+1' },
  { label: 'UTC+00:00', zone: 'Etc/GMT' },
  { label: 'UTC+01:00', zone: 'Etc/GMT-1' },
  { label: 'UTC+02:00', zone: 'Etc/GMT-2' },
  { label: 'UTC+03:00', zone: 'Etc/GMT-3' },
  { label: 'UTC+03:30', zone: 'Asia/Tehran' },
  { label: 'UTC+04:00', zone: 'Etc/GMT-4' },
  { label: 'UTC+04:30', zone: 'Asia/Kabul' },
  { label: 'UTC+05:00', zone: 'Etc/GMT-5' },
  { label: 'UTC+05:30', zone: 'Asia/Calcutta' },
  { label: 'UTC+05:45', zone: 'Asia/Katmandu' },
  { label: 'UTC+06:00', zone: 'Etc/GMT-6' },
  { label: 'UTC+06:30', zone: 'Asia/Rangoon' },
  { label: 'UTC+07:00', zone: 'Etc/GMT-7' },
  { label: 'UTC+08:00', zone: 'Etc/GMT-8' },
  { label: 'UTC+08:45', zone: 'Australia/Eucla' },
  { label: 'UTC+09:00', zone: 'Etc/GMT-9' },
  { label: 'UTC+09:30', zone: 'Australia/Darwin' },
  { label: 'UTC+10:00', zone: 'Etc/GMT-10' },
  { label: 'UTC+10:30', zone: 'UTC+10:30' },
  { label: 'UTC+11:00', zone: 'Etc/GMT-11' },
  { label: 'UTC+12:00', zone: 'Etc/GMT-12' },
  { label: 'UTC+12:45', zone: 'UTC+12:45' },
  { label: 'UTC+13:00', zone: 'Etc/GMT-13' },
  { label: 'UTC+13:45', zone: 'UTC+13:45' },
  { label: 'UTC+14:00', zone: 'Etc/GMT-14' },
]

// TimezonePickerModal（web 與 mobile 各自的版本）共用的搜尋過濾邏輯：
// 使用者輸入通常是「8」「+08:00」或「UTC+8」這類片段，一律去掉開頭的 "utc"、
// 轉小寫、去空白後，用 includes 比對每個選項的 label（同樣轉小寫），
// 查詢字串為空時直接回傳完整清單。
export function filterTimezones(query: string): TimezoneOption[] {
  const q = query.trim().toLowerCase().replace(/^utc/, '').trim()
  if (!q) return ALL_TIMEZONES
  return ALL_TIMEZONES.filter(t => t.label.toLowerCase().includes(q))
}
