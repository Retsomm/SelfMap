import type SwissEphemeris from '@swisseph/browser'
export { Planet, LunarPoint, HouseSystem, CalculationFlag, CalendarType } from '@swisseph/core'

type SweInstance = InstanceType<typeof SwissEphemeris>

let sweInstance: SweInstance | null = null
let initPromise: Promise<SweInstance> | null = null

/**
 * 初始化 Swiss Ephemeris WebAssembly（僅限瀏覽器端呼叫）。
 * 使用動態 import 確保 server 端不會載入此 WASM 模組。
 * 所有時間計算皆以 UTC 為基準。
 * 不傳 flag 讓函式庫自動選擇最佳模式（瀏覽器預設 Moshier，精度已足夠閘門計算）。
 */
export const initSwissEph = async (): Promise<SweInstance> => {
  if (sweInstance) return sweInstance
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      const { default: SwissEphemeris } = await import('@swisseph/browser')
      const swe = new SwissEphemeris()
      await swe.init('/swisseph.wasm')
      sweInstance = swe
      return swe
    } catch (err) {
      initPromise = null
      sweInstance = null
      throw err
    }
  })()

  return initPromise
}
