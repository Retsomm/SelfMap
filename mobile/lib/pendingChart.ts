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
  topLeft:     boolean  // true = ←, false = →
  bottomLeft:  boolean
  topRight:    boolean
  bottomRight: boolean
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
