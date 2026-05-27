import type SwissEphemeris from '@swisseph/browser'
export { Planet, LunarPoint, HouseSystem, CalculationFlag, CalendarType } from '@swisseph/core'

type SweInstance = InstanceType<typeof SwissEphemeris>

let sweInstance: SweInstance | null = null
let initPromise: Promise<SweInstance> | null = null

/**
 * 初始化 Swiss Ephemeris WebAssembly（僅限瀏覽器端呼叫）。
 * WASM 由 copy-webpack-plugin 在 build 時複製至 /_next/static/chunks/swisseph.wasm，
 * 確保 Vercel 部署包含此檔案且路徑固定可靠。
 */
export const initSwissEph = async (): Promise<SweInstance> => {
  if (sweInstance) return sweInstance
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      const { default: SwissEphemeris } = await import('@swisseph/browser')
      const swe = new SwissEphemeris()
      await swe.init('/_next/static/chunks/swisseph.wasm')
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
