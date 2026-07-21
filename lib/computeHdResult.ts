import { initSwissEph } from '@/lib/swissEph'
import { buildHdResult, type HdSweAdapter } from '@/lib/computeHdResultCore'
import type { HdResult } from '@/lib/buildAiPrompt'

let sweCache: Awaited<ReturnType<typeof initSwissEph>> | null = null

export const computeHdResult = async (
  date: string,
  time: string,
  timezone: string,
): Promise<HdResult> => {
  if (!sweCache) sweCache = await initSwissEph()
  return buildHdResult(sweCache as HdSweAdapter, date, time, timezone)
}
