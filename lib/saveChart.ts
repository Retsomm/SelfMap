import type { HdResult } from '@/lib/buildAiPrompt'
import type { CenterName, ChannelDef } from '@/lib/humanDesign/types'

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
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? '儲存失敗')
}
