import type { HdResult } from '@/lib/buildAiPrompt'
import type { CenterName, ChannelDef } from '@/lib/humanDesign/types'
import type { TransitPlanetRow } from '@/lib/computeTransit'
import { CROSS_TYPE_LABELS } from '@/lib/humanDesign/constants'

export interface SaveChartParams {
  result: HdResult
  date: string
  time: string
  locationLabel: string
  timezone: string
}

export const saveChart = async ({ result, date, time, locationLabel, timezone }: SaveChartParams): Promise<void> => {
  const res = await fetch('/api/charts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `${locationLabel} · ${date}`,
      birthDate: date,
      birthTime: time,
      birthCity: locationLabel,
      timezone,
      type: result.type,
      authority: result.authority.name,
      profile: result.profile.profile,
      definition: result.definition.label,
      centers: [...result.definedCenterIds],
      channels: result.definedChannels.map(ch => ch.id),
      gates: [...result.allGates],
      incarnationCross: {
        crossType:      result.incarnationCross.crossType,
        crossTypeLabel: CROSS_TYPE_LABELS[result.incarnationCross.crossType] ?? result.incarnationCross.crossType,
        crossBaseName:  result.incarnationCross.crossBaseName,
        crossName:      result.incarnationCross.crossName,
        gatesLabel:     result.incarnationCross.gatesLabel,
        variant:        result.incarnationCross.variant,
        sunGate:        result.incarnationCross.persSunGate,
      },
      variables: {
        digestion:   result.variables.digestion,
        environment: result.variables.environment,
        perspective: result.variables.perspective,
        motivation:  result.variables.motivation,
      },
      arrows: {
        topLeft:     (result.planets[0]?.red.tone   ?? 1) <= 3,
        bottomLeft:  (result.planets[3]?.red.tone   ?? 1) <= 3,
        topRight:    (result.planets[0]?.black.tone ?? 1) <= 3,
        bottomRight: (result.planets[3]?.black.tone ?? 1) <= 3,
      },
      planets: (result.planets ?? []).map(p => ({
        name:      p.planetName,
        blackGate: p.black.gate,
        blackLine: p.black.line,
        redGate:   p.red.gate,
        redLine:   p.red.line,
      })),
      // black = Personality（意識），red = Design（潛意識）
      personalityGates: (result.planets ?? []).map(p => p.black.gate),
      designGates:      (result.planets ?? []).map(p => p.red.gate),
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? '儲存失敗')
}

export interface SaveTransitChartParams {
  personal: HdResult
  personalBirthDate: string
  personalBirthTime: string
  personalBirthCity: string
  personalTimezone: string
  transitComputedAt: string
  transitAllGates: Set<number>
  transitDefinedCenterIds: Set<CenterName>
  transitDefinedChannels: ChannelDef[]
  transitPlanets: TransitPlanetRow[]
}

/** 將流日圖存成 Chart 記錄，type 取個人類型，chartKind='transit'。
 *  meta.transitMeta 額外保留個人出生資料與流日行星閘門，供之後重新顯示完整流日圖（而非誤讀為個人圖）。 */
export const saveTransitChart = async (p: SaveTransitChartParams): Promise<void> => {
  // Convert UTC ISO to Taipei time (UTC+8) without relying on toLocaleString
  const taipeiDate = (() => {
    const d = new Date(new Date(p.transitComputedAt).getTime() + 8 * 60 * 60 * 1000)
    return isNaN(d.getTime()) ? new Date(Date.now() + 8 * 60 * 60 * 1000) : d
  })()
  const transitDate = taipeiDate.toISOString().slice(0, 10)
  const transitTime = `${String(taipeiDate.getUTCHours()).padStart(2, '0')}:${String(taipeiDate.getUTCMinutes()).padStart(2, '0')}`

  const res = await fetch('/api/charts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `流日圖 · ${transitDate}`,
      birthDate: transitDate,
      birthTime: transitTime,
      birthCity: '流日',
      timezone: 'Asia/Taipei',
      type: p.personal.type,
      authority: p.personal.authority.name,
      profile: p.personal.profile.profile,
      definition: p.personal.definition.label,
      centers: [...p.transitDefinedCenterIds],
      channels: p.transitDefinedChannels.map(ch => ch.id),
      gates: [...p.transitAllGates],
      chartKind: 'transit',
      incarnationCross: {
        crossType:      p.personal.incarnationCross.crossType,
        crossTypeLabel: CROSS_TYPE_LABELS[p.personal.incarnationCross.crossType] ?? p.personal.incarnationCross.crossType,
        crossBaseName:  p.personal.incarnationCross.crossBaseName,
        crossName:      p.personal.incarnationCross.crossName,
        gatesLabel:     p.personal.incarnationCross.gatesLabel,
        variant:        p.personal.incarnationCross.variant,
        sunGate:        p.personal.incarnationCross.persSunGate,
      },
      variables: {
        digestion:   p.personal.variables.digestion,
        environment: p.personal.variables.environment,
        perspective: p.personal.variables.perspective,
        motivation:  p.personal.variables.motivation,
      },
      arrows: {
        topLeft:     (p.personal.planets[0]?.red.tone   ?? 1) <= 3,
        bottomLeft:  (p.personal.planets[3]?.red.tone   ?? 1) <= 3,
        topRight:    (p.personal.planets[0]?.black.tone ?? 1) <= 3,
        bottomRight: (p.personal.planets[3]?.black.tone ?? 1) <= 3,
      },
      planets: (p.personal.planets ?? []).map(pl => ({
        name:      pl.planetName,
        blackGate: pl.black.gate,
        blackLine: pl.black.line,
        redGate:   pl.red.gate,
        redLine:   pl.red.line,
      })),
      personalityGates: (p.personal.planets ?? []).map(pl => pl.black.gate),
      designGates:      (p.personal.planets ?? []).map(pl => pl.red.gate),
      transitMeta: {
        personalBirthDate: p.personalBirthDate,
        personalBirthTime: p.personalBirthTime,
        personalBirthCity: p.personalBirthCity,
        personalTimezone:  p.personalTimezone,
        transitComputedAt: p.transitComputedAt,
        transitPlanets: p.transitPlanets.map(pl => ({
          planetName: pl.planetName,
          gate:       pl.gate,
          line:       pl.line,
          full:       pl.full,
        })),
      },
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? '儲存失敗')
}

export interface SaveCompositeChartParams {
  resultA: HdResult
  resultB: HdResult
  dateA: string; timeA: string; locationA: string; timezoneA: string
  dateB: string; timeB: string; locationB: string; timezoneB: string
  compositeDefinedCenterIds: Set<CenterName>
  compositeDefinedChannels: ChannelDef[]
  compositeAllGates: Set<number>
}

/** 將合圖存成單一 Chart 記錄，type='composite'，兩人資料以 '|' 分隔編碼。 */
export const saveCompositeChart = async (p: SaveCompositeChartParams): Promise<void> => {
  const requiredFields = [p.dateA, p.dateB, p.timeA, p.timeB, p.locationA, p.locationB, p.timezoneA, p.timezoneB]
  if (requiredFields.some(f => !f)) throw new Error('合圖欄位不完整，無法儲存')

  const authorityA = p.resultA.authority?.name
  const authorityB = p.resultB.authority?.name
  const profileA = p.resultA.profile?.profile
  const profileB = p.resultB.profile?.profile
  const definitionA = p.resultA.definition?.label
  const definitionB = p.resultB.definition?.label
  if (!authorityA || !authorityB || !profileA || !profileB || !definitionA || !definitionB) {
    throw new Error('合圖計算結果不完整，無法儲存')
  }

  const centers = [...p.compositeDefinedCenterIds]
  const channels = p.compositeDefinedChannels.map(ch => ch.id).filter(Boolean)
  const gates = [...p.compositeAllGates].filter(g => typeof g === 'number')

  const res = await fetch('/api/charts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `${p.locationA} × ${p.locationB}`,
      birthDate: `${p.dateA}|${p.dateB}`,
      birthTime: `${p.timeA}|${p.timeB}`,
      birthCity: `${p.locationA}|${p.locationB}`,
      timezone: `${p.timezoneA}|${p.timezoneB}`,
      type: 'composite',
      authority: `${authorityA} / ${authorityB}`,
      profile: `${profileA} / ${profileB}`,
      definition: `${definitionA} / ${definitionB}`,
      centers,
      channels,
      gates,
      chartKind: 'composite',
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? '儲存失敗')
}
