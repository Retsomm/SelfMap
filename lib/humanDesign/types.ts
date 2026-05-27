export type CenterName =
  | 'head'
  | 'ajna'
  | 'throat'
  | 'g'
  | 'ego'
  | 'sacral'
  | 'solarPlexus'
  | 'spleen'
  | 'root'

export type HumanDesignType =
  | 'Manifestor'
  | 'Generator'
  | 'Manifesting Generator'
  | 'Projector'
  | 'Reflector'

export type Authority =
  | 'Emotional'
  | 'Sacral'
  | 'Splenic'
  | 'Ego'
  | 'Self-Projected'
  | 'Mental'
  | 'Lunar'

export interface GateAndLine {
  gate: number
  line: number
  color: number
  tone: number
  base: number
  full: string
}

export interface VariablesResult {
  digestion: { label: string; description: string }
  environment: { label: string; description: string }
  perspective: { label: string; description: string }
  motivation: { label: string; description: string }
}

export interface PlanetGateResult {
  planetName: string
  black: GateAndLine
  red: GateAndLine
  display: string
}

export interface PlanetRow extends PlanetGateResult {
  persLon: number
  desLon: number
}

export interface ProfileResult {
  profile: string
  personalitySunLine: number
  designSunLine: number
  personalitySun: GateAndLine
  designSun: GateAndLine
}

export interface Center {
  id: CenterName
  name: string
  defined: boolean
  description: string
  summary: string
  behavior: string
  positive: string[]
  blind: string[]
  suggestion: string
}

export interface Channel {
  id: string
  from: CenterName
  to: CenterName
  defined: boolean
  gates: [number, number]
}

export interface ChannelDef {
  id: string
  gateA: number
  gateB: number
  centerA: CenterName
  centerB: CenterName
}

export interface AuthorityInfo {
  name: string
  tip: string
}

export interface HumanDesignChart {
  type: HumanDesignType
  authority: Authority
  profile: string
  definition: string
  centers: Center[]
  channels: Channel[]
  gates: number[]
}

export type CrossType = 'RAC' | 'JC' | 'LAC'

export interface IncarnationCross {
  crossType: CrossType
  crossBaseName: string
  crossName: string       // e.g. "個人主題之伊甸園4"
  variant: number         // 1–4，personality sun 在十字群組中的第幾個位置
  conscious: string       // e.g. "11.3 / 12.6"（含 line）
  unconscious: string     // e.g. "6.2 / 36.5"（含 line）
  gatesLabel: string      // e.g. "11/12 | 6/36"（僅閘門號）
  persSunGate: number
  persSunLine: number
}
