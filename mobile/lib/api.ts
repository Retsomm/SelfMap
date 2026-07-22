// Metro 會在 bundle 時替換 EXPO_PUBLIC_* 變數
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

export type ChartKind = 'personal' | 'composite' | 'transit'

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
  chartKind?: ChartKind | null
  meta?: {
    // 個人圖
    incarnationCross?: import('./pendingChart').IncarnationCross
    variables?: import('./pendingChart').Variables
    arrows?: import('./pendingChart').Arrows
    // 合圖
    personA?: { name: string | null; birthDate: string; birthTime?: string; birthCity: string; timezone?: string; type: string; profile: string; authority?: string; authorityTip?: string }
    personB?: { name: string | null; birthDate: string; birthTime?: string; birthCity: string; timezone?: string; type: string; profile: string; authority?: string; authorityTip?: string }
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
    // 流日（mobile 端 /api/transit/create 存檔格式，頂層 birthDate/birthCity 就是本人真實出生資料）
    transitSnapshot?: {
      computedAt: string
      planets: Array<{ planetName: string; gate: number; line: number }>
      allGates: number[]
      definedCenterIds: string[]
      definedChannels: Array<{ id: string }>
      combinedDefinedCenterIds: string[]
      combinedDefinedChannelIds: string[]
    }
    // 流日（web 端 saveChart.ts 存檔格式，頂層 birthDate/birthCity 存的是流日計算時刻的
    // 佔位資料（例如 birthCity 固定是字串 "流日"），真正的本人出生資料在這裡）
    transitMeta?: {
      personalBirthDate: string
      personalBirthTime: string
      personalBirthCity: string
      personalTimezone: string
      transitComputedAt: string
      transitPlanets: Array<{ planetName: string; gate: number; line: number; full?: string }>
    }
  } | null
  createdAt: string
}

/** 網頁端舊格式合圖偵測：出生資料（birthDate/birthTime/birthCity/timezone）用 '|' 分隔兩人資料 */
export function isLegacyPipeComposite(c: Pick<Chart, 'birthDate'>): boolean {
  return !!c.birthDate?.includes('|')
}

/** 判斷圖表是否為合圖，涵蓋網頁端舊格式（沒有 chartKind，靠 type='合圖' 或 pipe 分隔出生資料判斷） */
export function isCompositeChart(c: Pick<Chart, 'chartKind' | 'type' | 'birthDate'>): boolean {
  return c.chartKind === 'composite' || c.type === '合圖' || isLegacyPipeComposite(c)
}

const DEFAULT_TIMEOUT_MS = 10_000
// 星曆計算類 endpoint（個人圖／合圖／流日 的算圖與 preview）比較慢，給更長的 timeout
const EPHEMERIS_TIMEOUT_MS = 20_000
const RETRY_DELAY_MS = 600

/** 只重試網路層失敗（連線中斷、逾時），不重試已收到的 HTTP 錯誤回應，避免對有副作用的請求重複送出 */
function isTransientError(err: unknown): boolean {
  if (err && typeof err === 'object' && (err as { name?: unknown }).name === 'AbortError') return true
  return err instanceof TypeError
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string; timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  const { token, timeoutMs = DEFAULT_TIMEOUT_MS, retries = 0, ...init } = options
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
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
      const contentType = res.headers.get('content-type') ?? ''
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        if (contentType.includes('application/json')) {
          try { msg = (await res.json())?.error ?? msg } catch { /* ignore */ }
        }
        throw new Error(msg)
      }
      if (!contentType.includes('application/json')) {
        throw new Error(`Unexpected response (${contentType || 'no content-type'}) from ${path}`)
      }
      return (await res.json()) as T
    } catch (err) {
      if (attempt < retries && isTransientError(err)) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)))
        continue
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }
}

// GET /api/charts
export function getCharts(token: string) {
  return request<{ charts: Chart[] }>('/api/charts', { token, retries: 1 })
}

// POST /api/charts — server 端自動計算人類圖，mobile 只需傳出生資料
export type CreateChartPayload = {
  birthDate: string
  birthTime: string
  birthCity: string
  timezone: string
  name?: string
  chartKind?: ChartKind
}

export type ChartPreviewResponse = {
  chartId: null
  type: string
  authority: string
  profile: string
  definition: string
  centers: string[]
  channels: string[]
  gates: number[]
  planets?: StoredPlanet[]
  personalityGates?: number[]
  designGates?: number[]
  incarnationCross?: import('./pendingChart').IncarnationCross
  variables?: import('./pendingChart').Variables
  arrows?: import('./pendingChart').Arrows
}

// 不帶 token — server 端計算但不儲存 DB，回傳計算結果
export function previewChart(payload: CreateChartPayload) {
  return request<ChartPreviewResponse>('/api/charts', {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: EPHEMERIS_TIMEOUT_MS,
    retries: 1,
  })
}

// 有寫入副作用（會建立圖表），不重試，避免逾時後重送造成重複建立
export function createChart(token: string, payload: CreateChartPayload) {
  return request<{ chartId: string }>('/api/charts', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
    timeoutMs: EPHEMERIS_TIMEOUT_MS,
  })
}

// GET /api/charts/[id]
export function getChart(token: string, id: string) {
  return request<{ chart: Chart }>(`/api/charts/${id}`, { token, retries: 1 })
}

// PATCH /api/charts/[id]（idempotent，可安全重試）
export function renameChart(token: string, id: string, name: string) {
  return request<{ ok: true }>(`/api/charts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
    token,
    retries: 1,
  })
}

// DELETE /api/charts/[id]（idempotent，可安全重試）
export function deleteChart(token: string, id: string) {
  return request<{ ok: true }>(`/api/charts/${id}`, {
    method: 'DELETE',
    token,
    retries: 1,
  })
}

// ─── Composite create (兩份出生資料 → 一筆合圖) ─────────────────────────────

export type CompositePlanet = {
  name: string
  blackGate: number
  blackLine: number
  redGate: number
  redLine: number
}

export type CompositePersonMeta = {
  name: string | null
  birthDate: string
  birthTime: string
  birthCity: string
  timezone: string
  type: string
  profile: string
  authority: string
  authorityTip: string
  allGates: number[]
  personalityGates: number[]
  designGates: number[]
  planets: CompositePlanet[]
}

export type CreateCompositeResult = {
  chartId: string | null
  integrationTheme: string
  compositeDefinedCount: number
  compositeOpenCount: number
  compositeDefinedCenterIds: string[]
  compositeDefinedChannelIds: string[]
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

/** previewOnly:true — 只計算合圖不存 DB，chartId 回傳 null（不需 token） */
export function previewCompositeChart(payload: CreateCompositePayload) {
  return request<CreateCompositeResult>('/api/composite/create', {
    method: 'POST',
    body: JSON.stringify({ ...payload, previewOnly: true }),
    timeoutMs: EPHEMERIS_TIMEOUT_MS,
    retries: 1,
  })
}

/** 帶 token — 計算合圖並存 DB，chartId 回傳儲存後的 id。有寫入副作用，不重試 */
export function createCompositeChart(token: string, payload: CreateCompositePayload) {
  return request<CreateCompositeResult>('/api/composite/create', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
    timeoutMs: EPHEMERIS_TIMEOUT_MS,
  })
}

// ─── Transit create (出生資料 + 流日 → 一筆合成圖) ───────────────────────────

export type CreateTransitResult = {
  chartId: string | null
  type: string
  profile: string
  authority: string
  personalGates: number[]
  personalityGates: number[]
  designGates: number[]
  personalPlanets?: Array<{
    planetName: string
    personality: { gate: number; line: number }
    design: { gate: number; line: number }
  }>
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

/** 不帶 token — 計算流日但不存 DB，chartId 回傳 null */
export function previewTransitChart(
  payload: { birthDate: string; birthTime: string; birthCity: string; timezone: string; name?: string },
) {
  return request<CreateTransitResult>('/api/transit/create', {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: EPHEMERIS_TIMEOUT_MS,
    retries: 1,
  })
}

/** 帶 token — 計算流日並存 DB，chartId 回傳儲存後的 id。有寫入副作用，不重試 */
export function createTransitChart(
  token: string,
  payload: { birthDate: string; birthTime: string; birthCity: string; timezone: string; name?: string },
) {
  return request<CreateTransitResult>('/api/transit/create', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
    timeoutMs: EPHEMERIS_TIMEOUT_MS,
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
  return request<TransitData>('/api/transit', { token, retries: 1 })
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
    retries: 1,
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
    retries: 1,
  })
}

// ─── Birth Profiles ───────────────────────────────────────────────────────────

export type RemoteBirthProfile = {
  id: string
  label: string
  date: string
  time: string
  timezone: string
  location: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export function getBirthProfiles(token: string) {
  return request<{ profiles: RemoteBirthProfile[] }>('/api/birth-profiles', { token, retries: 1 })
}

export type BirthProfilePayload = {
  label: string
  date: string
  time: string
  timezone: string
  location: string
  sortOrder?: number
}

export function createBirthProfile(token: string, payload: BirthProfilePayload) {
  return request<{ profile: RemoteBirthProfile }>('/api/birth-profiles', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
}

export function importBirthProfiles(token: string, profiles: BirthProfilePayload[]) {
  return request<{ profiles: RemoteBirthProfile[] }>('/api/birth-profiles', {
    method: 'POST',
    body: JSON.stringify({ profiles }),
    token,
  })
}

// PATCH 是完整覆寫同一組欄位，重送一次結果相同，可安全重試
export function updateBirthProfile(token: string, id: string, payload: Partial<BirthProfilePayload>) {
  return request<{ ok: true }>(`/api/birth-profiles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
    retries: 1,
  })
}

// 刪除本來就是 idempotent，重送一次結果相同，可安全重試
export function deleteBirthProfile(token: string, id: string) {
  return request<{ ok: true }>(`/api/birth-profiles/${id}`, {
    method: 'DELETE',
    token,
    retries: 1,
  })
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType = 'feature' | 'bugfix' | 'announcement'

export type AppNotification = {
  id: string
  title: string
  body: string
  type: NotificationType
  publishedAt: string
  createdAt: string
}

// GET /api/notifications — 公開端點，不需 token
export function getNotifications() {
  return request<{ notifications: AppNotification[] }>('/api/notifications', { retries: 1 })
}

// ─── Account ──────────────────────────────────────────────────────────────────

// DELETE /api/account/delete — 刪除帳號與所有關聯資料（出生資料、圖表），Clerk 帳號一併刪除
export function deleteAccount(token: string) {
  return request<{ ok: true }>('/api/account/delete', {
    method: 'DELETE',
    token,
  })
}
