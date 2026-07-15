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
      // 載入 Swiss Ephemeris 資料檔（取代預設 Moshier 近似曆表）
      // Moshier 對北交點等慢速天體精度不足以撐起 Tone/Base 這麼細的刻度
      await swe.loadEphemerisFiles([
        { name: 'sepl_18.se1', url: '/ephe/sepl_18.se1' },
        { name: 'semo_18.se1', url: '/ephe/semo_18.se1' },
      ])
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
