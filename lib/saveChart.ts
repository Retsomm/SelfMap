import type { HdResult } from '@/lib/buildAiPrompt'

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
