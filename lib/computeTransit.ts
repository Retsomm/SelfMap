import { initSwissEph, Planet, LunarPoint } from '@/lib/swissEph'
import { calculatePlanetGates, calculateCentersAndChannels } from '@/lib/humanDesign'
import type { CenterName } from '@/lib/humanDesign/types'
import type { ChannelDef } from '@/lib/humanDesign/types'
import type { Activations } from '@/lib/humanDesign/types'
import type { HdResult } from '@/lib/buildAiPrompt'
import { CHANNEL_DEFS } from '@/lib/humanDesign'

export interface TransitPlanetRow {
  planetName: string
  gate: number
  line: number
  full: string
}

export interface TransitResult {
  planets: TransitPlanetRow[]
  allGates: Set<number>
  definedCenterIds: Set<CenterName>
  definedChannels: ChannelDef[]
  computedAt: string
}

let sweCache: Awaited<ReturnType<typeof initSwissEph>> | null = null

/** 計算指定時刻（預設當下）的流日行星閘門（只取意識層/黑色，無設計層）。
 *  targetDate 用於重建舊格式流日圖：舊記錄存的 birthDate/birthTime/timezone
 *  其實就是當初計算流日的確切時刻，換算回 UTC Date 後可精準重算當天的流日行星。 */
export const computeTransit = async (targetDate: Date = new Date()): Promise<TransitResult> => {
  if (!sweCache) sweCache = await initSwissEph()
  const swe = sweCache

  const now = targetDate
  const jd = swe.dateToJulianDay(now)
  const lon = (body: Parameters<typeof swe.calculatePosition>[1]) =>
    swe.calculatePosition(jd, body).longitude

  const sunLon = lon(Planet.Sun)
  const nnLon = lon(LunarPoint.TrueNode)

  const planetLons: [string, number][] = [
    ['太陽',   sunLon],
    ['地球',   (sunLon + 180) % 360],
    ['月亮',   lon(Planet.Moon)],
    ['北交點', nnLon],
    ['南交點', (nnLon + 180) % 360],
    ['水星',   lon(Planet.Mercury)],
    ['金星',   lon(Planet.Venus)],
    ['火星',   lon(Planet.Mars)],
    ['木星',   lon(Planet.Jupiter)],
    ['土星',   lon(Planet.Saturn)],
    ['天王星', lon(Planet.Uranus)],
    ['海王星', lon(Planet.Neptune)],
    ['冥王星', lon(Planet.Pluto)],
  ]

  const planets: TransitPlanetRow[] = planetLons.map(([name, pLon]) => {
    const result = calculatePlanetGates(pLon, pLon, name)
    return {
      planetName: name,
      gate: result.black.gate,
      line: result.black.line,
      full: result.black.full,
    }
  })

  const allGates = new Set<number>(planets.map(p => p.gate))
  const { definedCenterIds, definedChannels } = calculateCentersAndChannels(allGates)

  return { planets, allGates, definedCenterIds, definedChannels, computedAt: now.toISOString() }
}

/** 將個人圖 + 流日圖合併成一份 Activations，供 BodyGraph 使用。
 *  c: true → 個人圖閘門（黑色）
 *  u: true → 流日閘門（紅色）
 *  c + u   → 兩者共有（條紋）
 */
export const buildCombinedActivations = (
  personal: HdResult,
  transit: TransitResult,
): Activations => {
  const out: Activations = {}
  for (const g of personal.allGates) {
    out[g] = { c: true, u: false }
  }
  for (const g of transit.allGates) {
    out[g] = { c: out[g]?.c ?? false, u: true }
  }
  return out
}

export interface TransitImpactLayer {
  kind: 'center-activated' | 'new-channel' | 'completing-channel'
  label: string
  detail: string
}

/**
 * 分析流日對個人圖的三層影響：
 * 1. 空白中心被啟動
 * 2. 帶來全新通道
 * 3. 補完個人圖半條通道
 */
export const analyzeTransitImpact = (
  personal: HdResult,
  transit: TransitResult,
): TransitImpactLayer[] => {
  const layers: TransitImpactLayer[] = []

  // 第一層：空白中心被流日激活
  for (const cId of transit.definedCenterIds) {
    if (!personal.definedCenterIds.has(cId)) {
      layers.push({
        kind: 'center-activated',
        label: cId,
        detail: `你原本開放的能量中心，今天因流日被暫時定義，帶來不熟悉的衝動或情緒底色。`,
      })
    }
  }

  // 第二層：流日帶來個人圖沒有的全新通道（兩端閘門都不在個人圖裡）
  for (const ch of transit.definedChannels) {
    const inPersonal = personal.allGates.has(ch.gateA) || personal.allGates.has(ch.gateB)
    const alreadyDefined = personal.definedChannels.some(pc => pc.id === ch.id)
    if (!inPersonal && !alreadyDefined) {
      layers.push({
        kind: 'new-channel',
        label: ch.id,
        detail: `流日帶來你原本沒有的通道 ${ch.id}，你可能會想用這個頻率做事，但完全不屬於你原本的設計。`,
      })
    }
  }

  // 第三層：個人圖有一半閘門，流日補上另一半，形成完整通道
  for (const ch of CHANNEL_DEFS) {
    const aInPersonal = personal.allGates.has(ch.gateA)
    const bInPersonal = personal.allGates.has(ch.gateB)
    const aInTransit = transit.allGates.has(ch.gateA)
    const bInTransit = transit.allGates.has(ch.gateB)
    const alreadyFullPersonal = personal.definedChannels.some(pc => pc.id === ch.id)
    if (alreadyFullPersonal) continue

    const completedByTransit =
      (aInPersonal && !bInPersonal && bInTransit) ||
      (bInPersonal && !aInPersonal && aInTransit)

    if (completedByTransit) {
      layers.push({
        kind: 'completing-channel',
        label: ch.id,
        detail: `你本身有通道 ${ch.id} 其中一端，流日補上另一端，你會短暫感受到擁有完整通道的感覺，能量散去後容易有失落感。`,
      })
    }
  }

  return layers
}
