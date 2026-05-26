import { initSwissEph } from '@/lib/swissEph'

// 加 Z 強制當作 UTC 解析，避免瀏覽器套用本地時區導致偏移算兩次
export const toUtcDate = (date: string, time: string, offsetHours: number): Date => {
  const asUtcMs = new Date(`${date}T${time}:00Z`).getTime()
  return new Date(asUtcMs - offsetHours * 3600 * 1000)
}

// 精確找到太陽退後 88° 的時刻（迭代法）
// 88 曆日只是初始估算，月亮每天移動 ~13°，幾小時的誤差就會導致線數錯誤
export const getDesignJd = (
  swe: { calculatePosition: (jd: number, body: number) => { longitude: number } },
  birthJd: number
): number => {
  const birthSun = swe.calculatePosition(birthJd, 0).longitude
  const targetSun = ((birthSun - 88) + 360) % 360

  let jd = birthJd - 88

  for (let i = 0; i < 10; i++) {
    const currentSun = swe.calculatePosition(jd, 0).longitude
    let diff = ((currentSun - targetSun) + 360) % 360
    if (diff > 180) diff -= 360
    if (Math.abs(diff) < 0.00001) break
    jd -= diff
  }

  return jd
}
