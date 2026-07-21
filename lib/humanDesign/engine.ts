import {
  CHANNEL_DEFS, AUTHORITY_INFO,
  DIGESTION_MAP, ENVIRONMENT_MAP, PERSPECTIVE_MAP, MOTIVATION_MAP,
} from './constants'
import type {
  CenterName,
  HumanDesignType,
  Authority,
  AuthorityInfo,
  ChannelDef,
  GateAndLine,
  VariablesResult,
  PlanetRow,
  Activations,
} from './types'

const resolveGraph = (activeGates: Set<number>) => {
  const definedChannels = CHANNEL_DEFS.filter(
    ch => activeGates.has(ch.gateA) && activeGates.has(ch.gateB)
  )
  const definedCenterIds = new Set<CenterName>()
  for (const ch of definedChannels) {
    definedCenterIds.add(ch.centerA)
    definedCenterIds.add(ch.centerB)
  }
  return { definedChannels, definedCenterIds }
}

const isDefined = (ids: Set<CenterName>, id: CenterName) => ids.has(id)

/** BFS：從 motor centers 出發，確認是否存在通往 throat 的完整路徑 */
const hasMotorToThroatPath = (
  definedChannels: ChannelDef[],
  definedCenterIds: Set<CenterName>
): boolean => {
  const adj = new Map<CenterName, Set<CenterName>>()
  const add = (a: CenterName, b: CenterName) => {
    if (!adj.has(a)) adj.set(a, new Set())
    adj.get(a)!.add(b)
  }
  for (const ch of definedChannels) {
    add(ch.centerA, ch.centerB)
    add(ch.centerB, ch.centerA)
  }

  const motors: CenterName[] = ['root', 'sacral', 'solarPlexus', 'ego']
  const starts = motors.filter(m => definedCenterIds.has(m))
  const visited = new Set<CenterName>()
  const queue = [...starts]

  while (queue.length) {
    const cur = queue.shift()!
    if (cur === 'throat') return true
    if (visited.has(cur)) continue
    visited.add(cur)
    for (const nxt of adj.get(cur) ?? []) {
      if (!visited.has(nxt)) queue.push(nxt)
    }
  }
  return false
}

const deriveType = (
  definedCenterIds: Set<CenterName>,
  definedChannels: ChannelDef[]
): HumanDesignType => {
  if (definedCenterIds.size === 0) return 'Reflector'

  const sacral = isDefined(definedCenterIds, 'sacral')
  const throat = isDefined(definedCenterIds, 'throat')
  const motorToThroat = hasMotorToThroatPath(definedChannels, definedCenterIds)

  if (sacral) {
    return throat && motorToThroat ? 'Manifesting Generator' : 'Generator'
  }
  if (throat && motorToThroat) return 'Manifestor'
  return 'Projector'
}

const deriveAuthority = (
  type: HumanDesignType,
  definedCenterIds: Set<CenterName>
): Authority => {
  if (type === 'Reflector') return 'Lunar'
  if (isDefined(definedCenterIds, 'solarPlexus')) return 'Emotional'
  if (isDefined(definedCenterIds, 'sacral')) return 'Sacral'
  if (isDefined(definedCenterIds, 'spleen')) return 'Splenic'
  if (isDefined(definedCenterIds, 'ego')) return 'Ego'
  if (isDefined(definedCenterIds, 'g')) return 'Self-Projected'
  return 'Mental'
}

const deriveDefinition = (definedCenterIds: Set<CenterName>, definedChannels: ChannelDef[]): string => {
  if (definedCenterIds.size === 0) return 'None'

  const adj = new Map<CenterName, Set<CenterName>>()
  for (const ch of definedChannels) {
    if (!adj.has(ch.centerA)) adj.set(ch.centerA, new Set())
    if (!adj.has(ch.centerB)) adj.set(ch.centerB, new Set())
    adj.get(ch.centerA)!.add(ch.centerB)
    adj.get(ch.centerB)!.add(ch.centerA)
  }

  const visited = new Set<CenterName>()
  let groups = 0
  for (const start of definedCenterIds) {
    if (visited.has(start)) continue
    groups++
    const q = [start]
    while (q.length) {
      const cur = q.shift()!
      if (visited.has(cur)) continue
      visited.add(cur)
      for (const nxt of adj.get(cur) ?? []) {
        if (definedCenterIds.has(nxt) && !visited.has(nxt)) q.push(nxt)
      }
    }
  }

  return ['Single', 'Split', 'Triple Split', 'Quadruple Split'][Math.min(groups - 1, 3)]
}

const DEFINITION_LABEL: Record<string, string> = {
  'Single':          '單一定義人',
  'Split':           '二分定義人',
  'Triple Split':    '三分定義人',
  'Quadruple Split': '四分定義人',
  'None':            '無定義（反映者）',
}

export const calculateDefinition = (
  definedCenterIds: Set<CenterName>,
  definedChannels: ChannelDef[]
): { raw: string; label: string } => {
  const raw = deriveDefinition(definedCenterIds, definedChannels)
  return { raw, label: DEFINITION_LABEL[raw] ?? raw }
}

export const calculateVariables = (
  personalitySun: GateAndLine,
  designSun: GateAndLine,
  personalityNorthNode: GateAndLine,
  designNorthNode: GateAndLine,
): VariablesResult => {
  const validateColor = (color: number, field: string) => {
    if (!Number.isInteger(color) || color < 1 || color > 6) {
      throw new Error(`Invalid Human Design color: ${color} for ${field}`)
    }
  }
  validateColor(designSun.color,            'designSun')
  validateColor(designNorthNode.color,      'designNorthNode')
  validateColor(personalityNorthNode.color, 'personalityNorthNode')
  validateColor(personalitySun.color,       'personalitySun')
  return {
    digestion:   DIGESTION_MAP[designSun.color],
    environment: ENVIRONMENT_MAP[designNorthNode.color],
    perspective: PERSPECTIVE_MAP[personalityNorthNode.color],
    motivation:  MOTIVATION_MAP[personalitySun.color],
  }
}

export const calculateDefinedCenters = (allGates: Set<number>): Set<CenterName> =>
  resolveGraph(allGates).definedCenterIds

export const calculateCentersAndChannels = (allGates: Set<number>) =>
  resolveGraph(allGates)

export const calculateType = (
  definedCenterIds: Set<CenterName>,
  definedChannels: ChannelDef[]
): HumanDesignType => deriveType(definedCenterIds, definedChannels)

export const calculateAuthority = (definedCenters: Set<CenterName>, type?: HumanDesignType): AuthorityInfo => {
  if (type === 'Reflector' || definedCenters.size === 0) return AUTHORITY_INFO['Lunar']
  if (definedCenters.has('solarPlexus')) return AUTHORITY_INFO['Emotional']
  if (definedCenters.has('sacral'))      return AUTHORITY_INFO['Sacral']
  if (definedCenters.has('spleen'))      return AUTHORITY_INFO['Splenic']
  if (definedCenters.has('ego'))         return AUTHORITY_INFO['Ego']
  if (definedCenters.has('g'))           return AUTHORITY_INFO['Self-Projected']
  return AUTHORITY_INFO['Mental']
}

/**
 * 將行星列表轉換為閘門激活映射。
 *
 * 合併規則（冪等，與順序無關）：
 * - 閘門出現於 black（Personality/意識）→ 標記 c = true，保留既有 u 旗標
 * - 閘門出現於 red（Design/潛意識）→ 標記 u = true，保留既有 c 旗標
 * - 同一閘門同時出現於 black 與 red → 結果為 { c: true, u: true }
 */
export const toActivations = (planets: PlanetRow[]): Activations => {
  const out: Activations = {}
  for (const p of planets) {
    const cGate = p.black.gate
    const uGate = p.red.gate
    out[cGate] = { c: true, u: out[cGate]?.u ?? false }
    out[uGate] = { c: out[uGate]?.c ?? false, u: true }
  }
  return out
}
