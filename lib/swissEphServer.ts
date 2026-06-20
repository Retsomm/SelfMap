/**
 * Server-side Swiss Ephemeris loader.
 *
 * @swisseph/browser 是 ESM package，其內部 __esm 閉包依賴 CJS `exports`，
 * 在 Node.js ESM 環境下無法直接 import。
 *
 * 解法：用 readFileSync 讀取 swisseph.js（Emscripten 工廠），
 * 以 new Function 在 CJS-like scope 執行（module/exports 作為參數），
 * 再傳入 wasmBinary 讓 Emscripten 跳過 fetch，直接用 Buffer 初始化 WASM。
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// 數值常數（取自 @swisseph/core）
const SE_GREG_CAL = 1           // CalendarType.Gregorian
const SEFLG_MOSEPH = 4          // Moshier ephemeris（內建，不需外部檔案）
const SEFLG_SPEED = 256         // 計算速度
const DEFAULT_FLAGS = SEFLG_MOSEPH | SEFLG_SPEED  // 260

export interface SweServerInstance {
  dateToJulianDay(date: Date): number
  calculatePosition(julianDay: number, body: number): { longitude: number }
}

let _instance: SweServerInstance | null = null
let _promise: Promise<SweServerInstance> | null = null

export async function initSwissEphServer(): Promise<SweServerInstance> {
  if (_instance) return _instance
  if (_promise) return _promise

  _promise = (async () => {
    try {
      // 找 swisseph.js 和 swisseph.wasm 的絕對路徑
      // 不能用 require.resolve('@swisseph/browser')：webpack 會攔截並嘗試 bundle ESM 套件而失敗。
      // 改用 process.cwd()（Next.js API route 的 cwd 即專案根目錄）直接拼出 node_modules 路徑。
      const dist = resolve(process.cwd(), 'node_modules/@swisseph/browser/dist')
      const swissephJsPath = resolve(dist, 'swisseph.js')
      const wasmPath = resolve(dist, 'swisseph.wasm')

      // 讀取原始碼（Emscripten 工廠）和 WASM 二進位
      // swisseph.js 結尾有 `export default SwissEphModule;`（ESM 語法），
      // new Function 執行環境不是 module scope，必須先移除，否則 SyntaxError。
      // 正式環境的 bundler 會自動處理，本地 dev server 不會。
      const src = readFileSync(swissephJsPath, 'utf8')
        .replace(/\nexport default \w+;\s*$/, '')
      const wasmBinary = new Uint8Array(readFileSync(wasmPath))

      // 在 CJS-like scope 執行（繞過 "type": "module" 的 ESM 限制）
      const modObj = { exports: {} as Record<string, unknown> }
      // eslint-disable-next-line no-new-func
      const fn = new Function('module', 'exports', src)
      fn(modObj, modObj.exports)

      // UMD 尾段把 SwissEphModule 寫入 module.exports.default
      const SwissEphFactory = (modObj.exports.default ?? modObj.exports) as (
        opts: Record<string, unknown>
      ) => Promise<Record<string, unknown>>

      if (typeof SwissEphFactory !== 'function') {
        throw new Error('swisseph.js 工廠不是函式，請確認 @swisseph/browser 版本')
      }

      // 傳入 wasmBinary：Emscripten 直接用 Buffer 初始化，跳過 HTTP fetch
      const m = (await SwissEphFactory({ wasmBinary })) as Record<string, unknown>

      // 包裝 C 函式
      type Cwrap = (name: string, ret: string, args: string[]) => (...a: number[]) => number
      type Ccall = (name: string, ret: string, types: string[], args: unknown[]) => number
      const cwrap = m.cwrap as Cwrap
      const ccall = m.ccall as Ccall
      const malloc = m._malloc as (n: number) => number
      const free   = m._free  as (p: number) => void
      const getValue = m.getValue as (ptr: number, type: string) => number
      const UTF8ToString = m.UTF8ToString as (ptr: number) => string

      const _julday = cwrap('swe_julday_wrap', 'number', ['number', 'number', 'number', 'number', 'number'])

      const instance: SweServerInstance = {
        dateToJulianDay(date: Date): number {
          const y  = date.getUTCFullYear()
          const mo = date.getUTCMonth() + 1
          const d  = date.getUTCDate()
          const h  = date.getUTCHours()
                   + date.getUTCMinutes()     / 60
                   + date.getUTCSeconds()     / 3_600
                   + date.getUTCMilliseconds() / 3_600_000
          return _julday(y, mo, d, h, SE_GREG_CAL)
        },

        calculatePosition(julianDay: number, body: number): { longitude: number } {
          const xxPtr   = malloc(6 * 8)
          const serrPtr = malloc(256)
          const retflag = ccall(
            'swe_calc_ut_wrap', 'number',
            ['number', 'number', 'number', 'number', 'number'],
            [julianDay, body, DEFAULT_FLAGS, xxPtr, serrPtr],
          )
          if (retflag < 0) {
            const msg = UTF8ToString(serrPtr)
            free(xxPtr); free(serrPtr)
            throw new Error(`swe_calc_ut: ${msg}`)
          }
          const longitude = getValue(xxPtr, 'double')
          free(xxPtr); free(serrPtr)
          return { longitude }
        },
      }

      _instance = instance
      return instance
    } catch (err) {
      _promise = null
      throw err
    }
  })()

  return _promise
}
