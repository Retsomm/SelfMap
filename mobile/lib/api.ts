// Metro 會在 bundle 時替換 EXPO_PUBLIC_* 變數
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

export type StoredPlanet = {
  name: string
  blackGate: number
  blackLine: number
  redGate: number
  redLine: number
}

export type Chart = {
  id: string
  name: string | null
  birthDate: string
  birthTime: string
  birthCity: string
  timezone: string | null
  type: string
  authority: string
  profile: string
  definition: string
  centers: string[]
  channels: string[]
  gates: number[]
  personalityGates?: number[]
  designGates?: number[]
  planets?: StoredPlanet[]
  chartKind?: string | null
  meta?: {
    // 合圖
    personA?: { name: string | null; birthDate: string; birthCity: string; type: string; profile: string; authority?: string; authorityTip?: string }
    personB?: { name: string | null; birthDate: string; birthCity: string; type: string; profile: string; authority?: string; authorityTip?: string }
    compositeResult?: {
      integrationTheme: string
      compositeDefinedCount: number
      compositeOpenCount: number
      profileResonance: number[]
      electromagnetic: ConnectionDynamic[]
      companionship: ConnectionDynamic[]
      compromise: ConnectionDynamic[]
      dominance: ConnectionDynamic[]
    }
    // 流日
    transitSnapshot?: {
      computedAt: string
      planets: Array<{ planetName: string; gate: number; line: number }>
      allGates: number[]
      definedCenterIds: string[]
      definedChannels: Array<{ id: string }>
      combinedDefinedCenterIds: string[]
      combinedDefinedChannelIds: string[]
    }
  } | null
  createdAt: string
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })
    if (!res.ok) {
      let msg = `HTTP ${res.status}`
      try { msg = (await res.json())?.error ?? msg } catch { /* non-JSON body */ }
      throw new Error(msg)
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

// GET /api/charts
export function getCharts(token: string) {
  return request<{ charts: Chart[] }>('/api/charts', { token })
}

// POST /api/charts — server 端自動計算人類圖，mobile 只需傳出生資料
export type CreateChartPayload = {
  birthDate: string
  birthTime: string
  birthCity: string
  timezone: string
  name?: string
  chartKind?: 'personal' | 'composite' | 'transit'
}
export function createChart(token: string, payload: CreateChartPayload) {
  return request<{ chartId: string }>('/api/charts', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

// GET /api/charts/[id]
export function getChart(token: string, id: string) {
  return request<{ chart: Chart }>(`/api/charts/${id}`, { token })
}

// PATCH /api/charts/[id]
export function renameChart(token: string, id: string, name: string) {
  return request<{ ok: true }>(`/api/charts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
    token,
  })
}

// DELETE /api/charts/[id]
export function deleteChart(token: string, id: string) {
  return request<{ ok: true }>(`/api/charts/${id}`, {
    method: 'DELETE',
    token,
  })
}

// ─── Composite create (兩份出生資料 → 一筆合圖) ─────────────────────────────

export type CompositePersonMeta = {
  name: string | null
  birthDate: string
  birthCity: string
  type: string
  profile: string
}

export type CreateCompositeResult = {
  chartId: string
  integrationTheme: string
  compositeDefinedCount: number
  compositeOpenCount: number
  compositeDefinedCenterIds: string[]
  electromagnetic: ConnectionDynamic[]
  companionship: ConnectionDynamic[]
  compromise: ConnectionDynamic[]
  dominance: ConnectionDynamic[]
  profileResonance: number[]
  personA: CompositePersonMeta
  personB: CompositePersonMeta
}

export type CreateCompositePayload = {
  personA: { name?: string; birthDate: string; birthTime: string; birthCity: string; timezone: string }
  personB: { name?: string; birthDate: string; birthTime: string; birthCity: string; timezone: string }
  name?: string
}

export function createCompositeChart(token: string, payload: CreateCompositePayload) {
  return request<CreateCompositeResult>('/api/composite/create', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

// ─── Transit create (出生資料 + 流日 → 一筆合成圖) ───────────────────────────

export type CreateTransitResult = {
  chartId: string
  personalGates: number[]
  personalityGates: number[]
  designGates: number[]
  personalDefinedCenterIds: string[]
  personalDefinedChannelIds: string[]
  transit: {
    computedAt: string
    planets: Array<{ planetName: string; gate: number; line: number }>
    allGates: number[]
    definedCenterIds: string[]
    definedChannels: Array<{ id: string }>
  }
  combined: {
    definedCenterIds: string[]
    definedChannelIds: string[]
  }
  impact: { layers: ImpactLayer[] }
}

export function createTransitChart(
  token: string,
  payload: { birthDate: string; birthTime: string; birthCity: string; timezone: string; name?: string },
) {
  return request<CreateTransitResult>('/api/transit/create', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

// ─── Transit ─────────────────────────────────────────────────────────────────

export type TransitPlanet = { planetName: string; gate: number; line: number }
export type TransitData = {
  planets: TransitPlanet[]
  allGates: number[]
  definedCenterIds: string[]
  definedChannels: { id: string }[]
  computedAt: string
}

export function getTransit(token: string) {
  return request<TransitData>('/api/transit', { token })
}

export type ImpactLayer = {
  kind: 'center-activated' | 'new-channel' | 'completing-channel'
  label: string
  detail: string
}

export function getTransitImpact(token: string, chartId: string) {
  return request<{ layers: ImpactLayer[]; computedAt: string }>('/api/transit/impact', {
    method: 'POST',
    body: JSON.stringify({ chartId }),
    token,
  })
}

// ─── Composite ───────────────────────────────────────────────────────────────

export type ConnectionDynamic = {
  channelId: string
  type: string
  centerA: string
  centerB: string
  aGates: number[]
  bGates: number[]
}

export type CompositeResult = {
  integrationTheme: string
  compositeDefinedCount: number
  compositeOpenCount: number
  compositeDefinedCenterIds: string[]
  electromagnetic: ConnectionDynamic[]
  companionship: ConnectionDynamic[]
  compromise: ConnectionDynamic[]
  dominance: ConnectionDynamic[]
  profileResonance: number[]
  chartA: { id: string; name: string | null; profile: string; type: string }
  chartB: { id: string; name: string | null; profile: string; type: string }
}

export function getComposite(token: string, chartAId: string, chartBId: string) {
  return request<CompositeResult>('/api/composite', {
    method: 'POST',
    body: JSON.stringify({ chartAId, chartBId }),
    token,
  })
}
