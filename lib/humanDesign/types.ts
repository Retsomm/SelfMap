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
  full: string
}

export interface PlanetGateResult {
  planetName: string
  black: GateAndLine
  red: GateAndLine
  display: string
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
