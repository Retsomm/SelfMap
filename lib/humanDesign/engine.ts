import { CHANNEL_DEFS, CENTER_INFO, AUTHORITY_INFO } from './constants'
import type {
  CenterName,
  HumanDesignType,
  Authority,
  AuthorityInfo,
  ChannelDef,
  Center,
  Channel,
  HumanDesignChart,
} from './types'

const hashStr = (s: string): number => {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0
  }
  return Math.abs(h)
}

const seededGate = (seed: number, offset: number): number =>
  (Math.abs(hashStr(`${seed}-${offset}`)) % 64) + 1

const seededLine = (seed: number, offset: number): number =>
  (Math.abs(hashStr(`${seed}-line-${offset}`)) % 6) + 1

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

export const generateChart = (
  birthDate: string,
  birthTime: string,
  birthCity: string
): HumanDesignChart => {
  const seed = hashStr(`${birthDate}|${birthTime}|${birthCity}`)

  const activeGates = new Set<number>()
  const personalityGates: Array<{ gate: number; line: number }> = []
  const designGates: Array<{ gate: number; line: number }> = []

  for (let i = 0; i < 10; i++) {
    const pg = seededGate(seed, i)
    const pl = seededLine(seed, i)
    personalityGates.push({ gate: pg, line: pl })
    activeGates.add(pg)

    const dg = seededGate(seed + 88888, i)
    const dl = seededLine(seed + 88888, i)
    designGates.push({ gate: dg, line: dl })
    activeGates.add(dg)
  }

  const { definedChannels, definedCenterIds } = resolveGraph(activeGates)
  const type       = deriveType(definedCenterIds, definedChannels)
  const authority  = deriveAuthority(type, definedCenterIds)
  const definition = deriveDefinition(definedCenterIds, definedChannels)

  const personalitySunLine = personalityGates[0].line
  const designSunLine = designGates[0].line
  const profile = `${personalitySunLine}/${designSunLine}`

  const centers: Center[] = (Object.keys(CENTER_INFO) as CenterName[]).map(id => ({
    id,
    ...CENTER_INFO[id],
    defined: definedCenterIds.has(id),
  }))

  const channels: Channel[] = CHANNEL_DEFS.map(ch => ({
    id: ch.id,
    from: ch.centerA,
    to: ch.centerB,
    defined: definedChannels.some(d => d.id === ch.id),
    gates: [ch.gateA, ch.gateB],
  }))

  return { type, authority, profile, definition, centers, channels, gates: Array.from(activeGates) }
}

interface AnalysisInput {
  type: string
  authority: string
  profile: string
  definition: string
  definedCenters: string[]
  activeGates: number[]
}

export const buildChartFromAnalysis = (analysis: AnalysisInput): HumanDesignChart => {
  const activeGates = new Set<number>(analysis.activeGates)
  const { definedChannels, definedCenterIds } = resolveGraph(activeGates)

  const derivedType      = deriveType(definedCenterIds, definedChannels)
  const derivedAuthority = deriveAuthority(derivedType, definedCenterIds)
  const definition       = deriveDefinition(definedCenterIds, definedChannels)

  const centers: Center[] = (Object.keys(CENTER_INFO) as CenterName[]).map(id => ({
    id,
    ...CENTER_INFO[id],
    defined: definedCenterIds.has(id),
  }))

  const channels: Channel[] = CHANNEL_DEFS.map(ch => ({
    id: ch.id,
    from: ch.centerA,
    to: ch.centerB,
    defined: definedChannels.some(d => d.id === ch.id),
    gates: [ch.gateA, ch.gateB],
  }))

  return {
    type: derivedType,
    authority: derivedAuthority,
    profile: analysis.profile || '?/?',
    definition,
    centers,
    channels,
    gates: analysis.activeGates,
  }
}
