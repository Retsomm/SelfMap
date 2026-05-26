// ─── 黃道經度 → 閘門 + 線 ──────────────────────────────────────────────────

// 人類圖閘門輪從水瓶座 2°（黃道 302°）開始，Gate 41 為起點，每個閘門佔 5.625°
// 此偏移值由官方人類圖系統規範，與春分點（0° Aries）不同
const HD_WHEEL_OFFSET = 302

const GATE_SEQUENCE = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42,  3,
  27, 24,  2, 23,  8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33,  7,  4, 29, 59, 40, 64, 47,  6, 46, 18, 48, 57, 32, 50,
  28, 44,  1, 43, 14, 34,  9,  5, 26, 11, 10, 58, 38, 54, 61, 60,
]

export interface GateAndLine {
  gate: number
  line: number
  full: string
}

export const degreeToGateAndLine = (degree: number): GateAndLine => {
  const normalized = ((degree - HD_WHEEL_OFFSET) % 360 + 360) % 360
  const slot = Math.floor(normalized / 5.625)       // 0~63，對應閘門序列位置
  const gate = GATE_SEQUENCE[slot]
  const lineFraction = (normalized % 5.625) / 5.625
  const line = Math.floor(lineFraction * 6) + 1     // 1~6
  return { gate, line, full: `${gate}.${line}` }
}

export interface PlanetGateResult {
  planetName: string
  black: GateAndLine   // Personality 意識層
  red: GateAndLine     // Design 潛意識層
  display: string      // 例如 "23.4 / 45.6"
}

export const calculatePlanetGates = (
  personalityLongitude: number,
  designLongitude: number,
  planetName = '未知行星'
): PlanetGateResult => {
  const black = degreeToGateAndLine(personalityLongitude)
  const red   = degreeToGateAndLine(designLongitude)
  return { planetName, black, red, display: `${black.full} / ${red.full}` }
}

// ─── Types ─────────────────────────────────────────────────────────────────

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

export interface HumanDesignChart {
  type: HumanDesignType
  authority: Authority
  profile: string
  definition: string
  centers: Center[]
  channels: Channel[]
  gates: number[]
}

// ─── 36 Channels 完整對照表（匯出供 API 使用）──────────────────────────────

export interface ChannelDef {
  id: string
  gateA: number
  gateB: number
  centerA: CenterName
  centerB: CenterName
}

export const CHANNEL_DEFS: ChannelDef[] = [
  { id: '1-8',   gateA: 1,  gateB: 8,  centerA: 'g',          centerB: 'throat'      },
  { id: '2-14',  gateA: 2,  gateB: 14, centerA: 'g',          centerB: 'sacral'      },
  { id: '3-60',  gateA: 3,  gateB: 60, centerA: 'sacral',     centerB: 'root'        },
  { id: '4-63',  gateA: 4,  gateB: 63, centerA: 'ajna',       centerB: 'head'        },
  { id: '5-15',  gateA: 5,  gateB: 15, centerA: 'sacral',     centerB: 'g'           },
  { id: '6-59',  gateA: 6,  gateB: 59, centerA: 'solarPlexus',centerB: 'sacral'      },
  { id: '7-31',  gateA: 7,  gateB: 31, centerA: 'g',          centerB: 'throat'      },
  { id: '9-52',  gateA: 9,  gateB: 52, centerA: 'sacral',     centerB: 'root'        },
  { id: '10-20', gateA: 10, gateB: 20, centerA: 'g',          centerB: 'throat'      },
  { id: '10-34', gateA: 10, gateB: 34, centerA: 'g',          centerB: 'sacral'      },
  { id: '10-57', gateA: 10, gateB: 57, centerA: 'g',          centerB: 'spleen'      },
  { id: '11-56', gateA: 11, gateB: 56, centerA: 'ajna',       centerB: 'throat'      },
  { id: '12-22', gateA: 12, gateB: 22, centerA: 'throat',     centerB: 'solarPlexus' },
  { id: '13-33', gateA: 13, gateB: 33, centerA: 'g',          centerB: 'throat'      },
  { id: '16-48', gateA: 16, gateB: 48, centerA: 'throat',     centerB: 'spleen'      },
  { id: '17-62', gateA: 17, gateB: 62, centerA: 'ajna',       centerB: 'throat'      },
  { id: '18-58', gateA: 18, gateB: 58, centerA: 'spleen',     centerB: 'root'        },
  { id: '19-49', gateA: 19, gateB: 49, centerA: 'root',       centerB: 'solarPlexus' },
  { id: '20-34', gateA: 20, gateB: 34, centerA: 'throat',     centerB: 'sacral'      },
  { id: '20-57', gateA: 20, gateB: 57, centerA: 'throat',     centerB: 'spleen'      },
  { id: '21-45', gateA: 21, gateB: 45, centerA: 'ego',        centerB: 'throat'      },
  { id: '23-43', gateA: 23, gateB: 43, centerA: 'ajna',       centerB: 'throat'      },
  { id: '24-61', gateA: 24, gateB: 61, centerA: 'ajna',       centerB: 'head'        },
  { id: '25-51', gateA: 25, gateB: 51, centerA: 'g',          centerB: 'ego'         },
  { id: '26-44', gateA: 26, gateB: 44, centerA: 'ego',        centerB: 'spleen'      },
  { id: '27-50', gateA: 27, gateB: 50, centerA: 'sacral',     centerB: 'spleen'      },
  { id: '28-38', gateA: 28, gateB: 38, centerA: 'spleen',     centerB: 'root'        },
  { id: '29-46', gateA: 29, gateB: 46, centerA: 'sacral',     centerB: 'g'           },
  { id: '30-41', gateA: 30, gateB: 41, centerA: 'solarPlexus',centerB: 'root'        },
  { id: '32-54', gateA: 32, gateB: 54, centerA: 'spleen',     centerB: 'root'        },
  { id: '34-57', gateA: 34, gateB: 57, centerA: 'sacral',     centerB: 'spleen'      },
  { id: '35-36', gateA: 35, gateB: 36, centerA: 'throat',     centerB: 'solarPlexus' },
  { id: '37-40', gateA: 37, gateB: 40, centerA: 'solarPlexus',centerB: 'ego'         },
  { id: '39-55', gateA: 39, gateB: 55, centerA: 'root',       centerB: 'solarPlexus' },
  { id: '42-53', gateA: 42, gateB: 53, centerA: 'sacral',     centerB: 'root'        },
  { id: '47-64', gateA: 47, gateB: 64, centerA: 'ajna',       centerB: 'head'        },
]

// ─── Center 顯示資訊 ────────────────────────────────────────────────────────

export const CENTER_INFO: Record<CenterName, Omit<Center, 'id' | 'defined'>> = {
  head: {
    name: '頭腦中心',
    description: '靈感、疑問與精神壓力',
    summary: '思考的起點，處理靈感與存在之問',
    behavior: '你天生對人生大問充滿好奇，喜歡深思熟慮',
    positive: ['深刻洞察', '哲學思辨', '靈感來源'],
    blind: ['思考過載', '受他人疑問困擾', '決策癱瘓'],
    suggestion: '學會識別哪些問題值得你思考，哪些只是雜訊',
  },
  ajna: {
    name: '直覺中心',
    description: '概念化、分析與思維模式',
    summary: '理性分析中心，將靈感轉化為觀點',
    behavior: '你善於分析複雜問題，有獨特的思維框架',
    positive: ['邏輯清晰', '概念整合', '客觀分析'],
    blind: ['過度分析', '思維固化', '懷疑自己'],
    suggestion: '信任你的分析過程，但不要讓「確定感」成為你的包袱',
  },
  throat: {
    name: '喉嚨中心',
    description: '表達、溝通與行動',
    summary: '所有能量的對外出口，負責說話與行動',
    behavior: '你的存在就是為了被表達、被聽見',
    positive: ['清晰表達', '行動力', '領導影響'],
    blind: ['為說話而說話', '行動過快', '失去節奏'],
    suggestion: '等待正確的時機開口，你的聲音在對的時間最有力量',
  },
  g: {
    name: 'G 中心',
    description: '身份、方向感與愛',
    summary: '你是誰的核心，也是你人生方向的指南針',
    behavior: '你在對的環境中會知道自己要往哪裡去',
    positive: ['自我認同', '方向感明確', '磁吸正確的人'],
    blind: ['在錯誤環境迷失', '身份認同危機', '固執於既定路線'],
    suggestion: '讓環境帶你找到自己，不要強迫自己適應不對的地方',
  },
  ego: {
    name: '意志力中心',
    description: '意志、自我價值感與物質世界',
    summary: '關於承諾、價值與能量的源頭',
    behavior: '你在涉及資源、金錢與承諾的事情上有強大的影響力',
    positive: ['堅定承諾', '影響力', '物質成就'],
    blind: ['透支意志力', '過度承諾', '自我價值錯位'],
    suggestion: '只承諾你真心想做的事，你的意志力需要充分休息才能發揮',
  },
  sacral: {
    name: '薦骨中心',
    description: '生命力、工作能量與性',
    summary: '純粹的生命力來源，「做」的本能',
    behavior: '你有持續穩定的工作能量，喜歡被你真正熱愛的事情所驅動',
    positive: ['充沛精力', '持久耐力', '本能回應'],
    blind: ['不知道何時停止', '強迫自己做不對的事', '忽略身體訊號'],
    suggestion: '學會區分你的薦骨說 yes 還是 no，這是你最重要的導航系統',
  },
  solarPlexus: {
    name: '情緒中心',
    description: '情緒波浪、感受與直覺',
    summary: '你透過情緒波浪來處理生命，清晰在過程之後才會出現',
    behavior: '你的感受是深刻且有層次的，需要時間才能找到清晰',
    positive: ['情感深度', '創造力', '靈性感知'],
    blind: ['衝動決策', '情緒壓抑', '迴避感受'],
    suggestion: '重要決定請等待情緒波浪平靜後再做，給自己時間',
  },
  spleen: {
    name: '脾臟中心',
    description: '直覺、當下判斷與免疫系統',
    summary: '活在當下的本能智慧，一閃而過的直覺',
    behavior: '你有天生的生存本能和健康感知，直覺在瞬間出現',
    positive: ['即時判斷', '健康本能', '安全感知'],
    blind: ['無視直覺警告', '抓住恐懼不放', '害怕放手'],
    suggestion: '相信那個瞬間的直覺，它不會重複說第二次',
  },
  root: {
    name: '根部中心',
    description: '壓力、腎上腺素與推進力',
    summary: '生命的推進燃料，讓事情發生的動力',
    behavior: '你有能力在壓力下工作，把事情推向完成',
    positive: ['執行力', '推進力', '壓力轉化'],
    blind: ['被壓力驅使', '急於解決一切', '無法放鬆'],
    suggestion: '壓力是推進力，不是緊急信號。學會享受過程而非只看結果',
  },
}

// ─── 推導引擎 ──────────────────────────────────────────────────────────────

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

/** 從 active gates 計算已定義通道與中心 */
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

  // 找出各定義中心形成的連通群組
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

// ─── 主要匯出函式 ───────────────────────────────────────────────────────────

export const generateChart = (
  birthDate: string,
  birthTime: string,
  birthCity: string
): HumanDesignChart => {
  const seed = hashStr(`${birthDate}|${birthTime}|${birthCity}`)

  // 模擬 personality（人格）與 design（設計）各 10 顆行星的 gate activation
  const activeGates = new Set<number>()
  const personalityGates: Array<{ gate: number; line: number }> = []
  const designGates: Array<{ gate: number; line: number }> = []

  for (let i = 0; i < 10; i++) {
    const pg = seededGate(seed, i)
    const pl = seededLine(seed, i)
    personalityGates.push({ gate: pg, line: pl })
    activeGates.add(pg)

    // design 用不同偏移模擬「88度前的太陽位置推算」
    const dg = seededGate(seed + 88888, i)
    const dl = seededLine(seed + 88888, i)
    designGates.push({ gate: dg, line: dl })
    activeGates.add(dg)
  }

  const { definedChannels, definedCenterIds } = resolveGraph(activeGates)

  const type = deriveType(definedCenterIds, definedChannels)
  const authority = deriveAuthority(type, definedCenterIds)
  const definition = deriveDefinition(definedCenterIds, definedChannels)

  // Profile = personality 太陽 line / design 太陽 line
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

  return {
    type,
    authority,
    profile,
    definition,
    centers,
    channels,
    gates: Array.from(activeGates),
  }
}

// ─── 從 AI 分析結果建立圖表 ─────────────────────────────────────────────────

interface AnalysisInput {
  type: string
  authority: string
  profile: string
  definition: string
  definedCenters: string[]
  activeGates: number[]
}

export const buildChartFromAnalysis = (analysis: AnalysisInput): HumanDesignChart => {
  const definedCenterIds = new Set<CenterName>(
    analysis.definedCenters.filter((id): id is CenterName =>
      ['head','ajna','throat','g','ego','sacral','solarPlexus','spleen','root'].includes(id)
    )
  )

  const activeGates = new Set<number>(analysis.activeGates)
  const { definedChannels } = resolveGraph(activeGates)

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

  const typeMap: Record<string, HumanDesignType> = {
    'Generator': 'Generator',
    'Manifesting Generator': 'Manifesting Generator',
    'Manifestor': 'Manifestor',
    'Projector': 'Projector',
    'Reflector': 'Reflector',
  }
  const authorityMap: Record<string, Authority> = {
    'Emotional': 'Emotional',
    'Sacral': 'Sacral',
    'Splenic': 'Splenic',
    'Ego': 'Ego',
    'Self-Projected': 'Self-Projected',
    'Mental': 'Mental',
    'Lunar': 'Lunar',
  }

  return {
    type: typeMap[analysis.type] ?? 'Generator',
    authority: authorityMap[analysis.authority] ?? 'Sacral',
    profile: analysis.profile || '?/?',
    definition: analysis.definition || 'Single',
    centers,
    channels,
    gates: analysis.activeGates,
  }
}
