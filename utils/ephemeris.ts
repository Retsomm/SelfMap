// Derive UTC offset (hours) from IANA timezone at a specific moment.
// Uses Intl to handle DST correctly — e.g. "Asia/Taipei" → 8, "America/New_York" in summer → -4
export function getOffsetFromTimezone(tz: string | undefined | null, at: Date): number {
  if (!tz) return 0
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(at)
    const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0')
    const fakeUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'))
    return Math.round((fakeUtc - at.getTime()) / 60000) / 60
  } catch {
    return 0
  }
}

// 加 Z 強制當作 UTC 解析，避免瀏覽器套用本地時區導致偏移算兩次
export const toUtcDate = (date: string, time: string, offsetHours: number): Date => {
  if (!Number.isFinite(offsetHours) || offsetHours < -24 || offsetHours > 24) {
    throw new Error('Invalid date, time, or offset provided for Human Design calculation')
  }
  const asUtcMs = new Date(`${date}T${time}:00Z`).getTime()
  if (!Number.isFinite(asUtcMs)) {
    throw new Error('Invalid date, time, or offset provided for Human Design calculation')
  }
  return new Date(asUtcMs - offsetHours * 3600 * 1000)
}

// 精確找到太陽退後 88° 的時刻（迭代法）
// 88 曆日只是初始估算，月亮每天移動 ~13°，幾小時的誤差就會導致線數錯誤
export const getDesignJd = (
  swe: { calculatePosition: (jd: number, body: number, flags?: number) => { longitude: number } },
  birthJd: number,
  flags?: number
): number => {
  if (!Number.isFinite(birthJd)) {
    throw new Error('Invalid ephemeris data: non-finite longitude/JD')
  }

  const birthSun = swe.calculatePosition(birthJd, 0, flags).longitude
  if (!Number.isFinite(birthSun)) {
    throw new Error('Invalid ephemeris data: non-finite longitude/JD')
  }
  const targetSun = ((birthSun - 88) + 360) % 360

  let jd = birthJd - 88

  for (let i = 0; i < 10; i++) {
    const currentSun = swe.calculatePosition(jd, 0, flags).longitude
    if (!Number.isFinite(currentSun) || !Number.isFinite(jd)) {
      throw new Error('Invalid ephemeris data: non-finite longitude/JD')
    }
    let diff = ((currentSun - targetSun) + 360) % 360
    if (diff > 180) diff -= 360
    if (Math.abs(diff) < 0.00001) break
    jd -= diff
  }

  return jd
}
