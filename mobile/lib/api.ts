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
