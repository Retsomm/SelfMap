import { CHANNEL_DEFS } from '@/lib/humanDesign/constants'
import type { CenterName, ChannelDef } from '@/lib/humanDesign/types'
import type { HdResult } from '@/lib/buildAiPrompt'

export type ConnectionType = 'electromagnetic' | 'companionship' | 'compromise' | 'dominance'
export type IntegrationTheme = '9+0' | '8+1' | '7+2' | '6+3+'

export interface ConnectionDynamic {
  channelId: string
  centerA: CenterName
  centerB: CenterName
  type: ConnectionType
  aGates: number[]
  bGates: number[]
}

export interface CompositeAnalysis {
  integrationTheme: IntegrationTheme
  compositeDefinedCount: number
  compositeOpenCount: number
  compositeDefinedCenterIds: Set<CenterName>
  compositeDefinedChannels: ChannelDef[]
  electromagnetic: ConnectionDynamic[]
  companionship: ConnectionDynamic[]
  compromise: ConnectionDynamic[]
  dominance: ConnectionDynamic[]
  profileResonance: number[]
}

const resolveCompositeGraph = (gates: Set<number>) => {
  const definedChannels = CHANNEL_DEFS.filter(ch => gates.has(ch.gateA) && gates.has(ch.gateB))
  const definedCenterIds = new Set<CenterName>()
  for (const ch of definedChannels) {
    definedCenterIds.add(ch.centerA)
    definedCenterIds.add(ch.centerB)
  }
  return { definedChannels, definedCenterIds }
}

export const analyzeComposite = (a: HdResult, b: HdResult): CompositeAnalysis => {
  const compositeGates = new Set([...a.allGates, ...b.allGates])
  const { definedChannels: compositeDefinedChannels, definedCenterIds: compositeDefinedCenterIds } =
    resolveCompositeGraph(compositeGates)

  const compositeDefinedCount = compositeDefinedCenterIds.size
  const compositeOpenCount = 9 - compositeDefinedCount

  let integrationTheme: IntegrationTheme
  if (compositeOpenCount === 0) integrationTheme = '9+0'
  else if (compositeOpenCount === 1) integrationTheme = '8+1'
  else if (compositeOpenCount === 2) integrationTheme = '7+2'
  else integrationTheme = '6+3+'

  const electromagnetic: ConnectionDynamic[] = []
  const companionship: ConnectionDynamic[] = []
  const compromise: ConnectionDynamic[] = []
  const dominance: ConnectionDynamic[] = []

  for (const ch of CHANNEL_DEFS) {
    const { gateA, gateB } = ch
    const aHasA = a.allGates.has(gateA), aHasB = a.allGates.has(gateB)
    const bHasA = b.allGates.has(gateA), bHasB = b.allGates.has(gateB)
    const aAny = aHasA || aHasB
    const bAny = bHasA || bHasB
    if (!aAny && !bAny) continue

    const aFull = aHasA && aHasB
    const bFull = bHasA && bHasB
    const conn: ConnectionDynamic = {
      channelId: ch.id,
      centerA: ch.centerA,
      centerB: ch.centerB,
      type: 'dominance',
      aGates: [aHasA ? gateA : 0, aHasB ? gateB : 0].filter(Boolean),
      bGates: [bHasA ? gateA : 0, bHasB ? gateB : 0].filter(Boolean),
    }

    if (aFull && bFull) {
      conn.type = 'companionship'; companionship.push(conn)
    } else if ((aFull && bAny && !bFull) || (bFull && aAny && !aFull)) {
      conn.type = 'compromise'; compromise.push(conn)
    } else if ((aHasA && bHasB && !aHasB && !bHasA) || (aHasB && bHasA && !aHasA && !bHasB)) {
      conn.type = 'electromagnetic'; electromagnetic.push(conn)
    } else if ((aHasA && bHasA) || (aHasB && bHasB)) {
      conn.type = 'companionship'; companionship.push(conn)
    } else {
      conn.type = 'dominance'; dominance.push(conn)
    }
  }

  const parseLines = (profile: string) => profile.split('/').map(Number)
  const aLines = parseLines(a.profile.profile)
  const bLines = parseLines(b.profile.profile)
  const profileResonance = Array.from(new Set(aLines.filter(l => bLines.includes(l))))

  return {
    integrationTheme,
    compositeDefinedCount,
    compositeOpenCount,
    compositeDefinedCenterIds,
    compositeDefinedChannels,
    electromagnetic,
    companionship,
    compromise,
    dominance,
    profileResonance,
  }
}
