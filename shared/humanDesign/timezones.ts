// 全世界目前實際使用中的 UTC 偏移量清單（web/mobile 共用）
// 這不是 IANA tzdata 的城市清單（那份有 419 筆，同一個偏移量常常有幾十個城市重複），
// 而是「每個偏移量只出現一次」的純時區選單，總共 39 筆。
//
// zone 是背後用來實際換算的 IANA 代碼：
// - 整數小時一律用 Etc/GMT±N（注意 tzdata 對 Etc/GMT 的正負號是反過來的，
//   Etc/GMT-8 = UTC+8），這種寫法全年固定、不受任何地區日光節約時間影響，最準確。
// - 30/45 分這種非整點偏移量，tzdata 沒有對應的 Etc/GMT 寫法，改用該偏移量目前
//   全年穩定不變的真實地點（如 Asia/Calcutta、Australia/Darwin）。
// - 其中 -03:30／-02:30（加拿大紐芬蘭省）與 +12:45／+13:45（紐西蘭查坦群島）
//   背後對到同一個會隨當地夏令時間切換的地點，兩者只用同一個 zone 代碼——
//   若使用者輸入的出生日期剛好落在對方夏令時間的季節，實際換算出來的偏移量
//   會自動變成另一個值，這是已知取捨，不是 bug。
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
  { label: 'UTC-03:30', zone: 'America/St_Johns' },
  { label: 'UTC-03:00', zone: 'Etc/GMT+3' },
  { label: 'UTC-02:30', zone: 'America/St_Johns' },
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
  { label: 'UTC+10:30', zone: 'Australia/Adelaide' },
  { label: 'UTC+11:00', zone: 'Etc/GMT-11' },
  { label: 'UTC+12:00', zone: 'Etc/GMT-12' },
  { label: 'UTC+12:45', zone: 'Pacific/Chatham' },
  { label: 'UTC+13:00', zone: 'Etc/GMT-13' },
  { label: 'UTC+13:45', zone: 'Pacific/Chatham' },
  { label: 'UTC+14:00', zone: 'Etc/GMT-14' },
]
