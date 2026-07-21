/**
 * Server-side HD compute — uses initSwissEphServer (讀 WASM 檔案) 取代
 * browser 版 initSwissEph (dynamic import + fetch)，避免 dev server ESM 衝突。
 */
import { initSwissEphServer } from '@/lib/swissEphServer'
import { buildHdResult } from '@/lib/computeHdResultCore'
import type { HdResult } from '@/lib/buildAiPrompt'

export const computeHdResultServer = async (
  date: string,
  time: string,
  timezone: string,
): Promise<HdResult> => {
  const swe = await initSwissEphServer()
  return buildHdResult(swe, date, time, timezone)
}
