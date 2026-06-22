import type { StoredPlanet } from './api'

export type IncarnationCross = {
  crossType: string
  crossTypeLabel: string
  crossBaseName: string
  crossName: string
  gatesLabel: string
  variant: number
}

export type Variables = {
  digestion:   { label: string; description: string }
  environment: { label: string; description: string }
  perspective: { label: string; description: string }
  motivation:  { label: string; description: string }
}

export type Arrows = {
  topLeft:     boolean  // Design 太陽（身體/飲食）：true = ←, false = →（紅色 / 潛意識）
  bottomLeft:  boolean  // Design 北交點（環境）：true = ←, false = →（紅色 / 潛意識）
  topRight:    boolean  // Personality 太陽（心智/動機）：true = ←, false = →（黑色 / 意識）
  bottomRight: boolean  // Personality 北交點（觀點）：true = ←, false = →（黑色 / 意識）
}

export type PendingChart = {
  name: string
  birthDate: string
  birthTime: string
  birthCity: string
  timezone: string
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
  incarnationCross?: IncarnationCross
  variables?: Variables
  arrows?: Arrows
}

let _pending: PendingChart | null = null

export const setPendingChart = (chart: PendingChart): void => { _pending = chart }
export const getPendingChart = (): PendingChart | null => _pending
export const clearPendingChart = (): void => { _pending = null }
