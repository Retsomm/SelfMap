import type { Authority, AuthorityInfo, CenterName, ChannelDef, HumanDesignType, CrossType } from './types'
import type { Center } from './types'

// 人類圖閘門輪從水瓶座 2°（黃道 302°）開始，Gate 41 為起點，每個閘門佔 5.625°
export const HD_WHEEL_OFFSET = 302

export const GATE_SEQUENCE = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42,  3,
  27, 24,  2, 23,  8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33,  7,  4, 29, 59, 40, 64, 47,  6, 46, 18, 48, 57, 32, 50,
  28, 44,  1, 43, 14, 34,  9,  5, 26, 11, 10, 58, 38, 54, 61, 60,
]

export const PROFILE_LABELS: Record<string, string> = {
  '1/3': '調查者／殉道者',
  '1/4': '調查者／機會主義者',
  '2/4': '隱士／機會主義者',
  '2/5': '隱士／異端者',
  '3/5': '殉道者／異端者',
  '3/6': '殉道者／角色模範',
  '4/6': '機會主義者／角色模範',
  '4/1': '機會主義者／調查者',
  '5/1': '異端者／調查者',
  '5/2': '異端者／隱士',
  '6/2': '角色模範／隱士',
  '6/3': '角色模範／殉道者',
}

export const TYPE_LABELS: Record<HumanDesignType, string> = {
  'Manifestor': '顯示者',
  'Generator': '生產者',
  'Manifesting Generator': '顯示生產者',
  'Projector': '投射者',
  'Reflector': '反映者',
}

export const AUTHORITY_INFO: Record<Authority, AuthorityInfo> = {
  'Emotional':       { name: '情緒權威', tip: '等待情緒波浪完整走完，清晰出現後再決定' },
  'Sacral':          { name: '薦骨權威', tip: '傾聽薦骨的即時嗯哼聲，it 是 yes，嗯是 no' },
  'Splenic':         { name: '脾中心權威', tip: '相信當下一閃而過的直覺，它不會說第二次' },
  'Ego':             { name: '意志力權威', tip: '只承諾你真心想要且能兌現的事' },
  'Self-Projected':  { name: '自我投射權威', tip: '對信任的人大聲說出想法，聆聽自己的聲音找到方向' },
  'Mental':          { name: '心智權威', tip: '和不同的人討論，透過外在反饋找到清晰' },
  'Lunar':           { name: '月亮週期權威', tip: '等待完整的月亮週期（28天）再做重大決定' },
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

// 入世十字：16 個基本十字群組
// 每組 4 個閘門，對應黃道輪上相隔 16 個位置（即 90°）的閘門
// 群組 ID 對應 GATE_SEQUENCE 中 pos % 16 的餘數
export const CROSS_GROUPS: readonly [number, number, number, number][] = [
  [41, 27, 31, 28],  // 0: 張力
  [19, 24, 33, 44],  // 1: 二元性
  [ 1,  2,  7, 13],  // 2: 人面獅身（Sphinx）
  [49, 23,  4, 43],  // 3: 革命
  [30,  8, 29, 14],  // 4: 四種方式
  [55, 20, 59, 34],  // 5: 沉睡鳳凰
  [37, 16, 40,  9],  // 6: 社群
  [63, 35, 64,  5],  // 7: 意識
  [22, 45, 47, 26],  // 8: 統治
  [36, 12,  6, 11],  // 9: 無邊界
  [25, 15, 46, 10],  // 10: 愛的容器（Vessel of Love）
  [17, 52, 18, 58],  // 11: 法則
  [21, 39, 48, 38],  // 12: 對立
  [51, 53, 57, 54],  // 13: 穿透
  [42, 62, 32, 61],  // 14: 持久
  [ 3, 56, 50, 60],  // 15: 限制
]

export const CROSS_BASE_NAMES: readonly string[] = [
  '張力',
  '二元性',
  '人面獅身',
  '革命',
  '四種方式',
  '沉睡鳳凰',
  '社群',
  '意識',
  '支配',
  '伊甸園',
  '愛的容器',
  '法則',
  '對立',
  '穿透',
  '持久',
  '限制',
]

export const CROSS_TYPE_LABELS: Record<CrossType, string> = {
  RAC: '右角度交叉',
  JC:  '並列交叉',
  LAC: '左角度交叉',
}

export const STRATEGY_MAP: Record<string, string> = {
  'Manifestor':           '告知後行動',
  'Generator':            '等待回應',
  'Manifesting Generator':'等待回應後告知',
  'Projector':            '等待邀請',
  'Reflector':            '等待月亮週期（28天）',
}

export const SIGNATURE_MAP: Record<string, { positive: string; negative: string }> = {
  'Manifestor':           { positive: '平靜', negative: '憤怒' },
  'Generator':            { positive: '滿足', negative: '挫折' },
  'Manifesting Generator':{ positive: '滿足', negative: '挫折與憤怒' },
  'Projector':            { positive: '成功', negative: '苦澀' },
  'Reflector':            { positive: '驚喜', negative: '失望' },
}

export const DIGESTION_MAP: Record<number, { label: string; description: string }> = {
  1: { label: 'Appetite（食慾型）',  description: '跟隨本能食慾，想吃什麼就吃什麼，不需遵循固定飲食規律' },
  2: { label: 'Taste（味覺型）',     description: '重視口感與風味，細細品嚐，讓味覺引導飲食選擇' },
  3: { label: 'Thirst（口渴型）',    description: '以補充水分為首要，口渴信號先於食慾信號' },
  4: { label: 'Touch（接觸型）',     description: '以當季新鮮蔬果為主，食材固定，不需要強迫有變化' },
  5: { label: 'Sound（聲音型）',     description: '在安靜環境中進食，讓身體聆聽消化的節奏' },
  6: { label: 'Light（光線型）',     description: '在自然採光充足的環境用餐，光線影響消化能量' },
}

export const ENVIRONMENT_MAP: Record<number, { label: string; description: string }> = {
  1: { label: 'Caves（洞穴）',    description: '需要私密、封閉的個人空間，如山洞般能完全退縮的場域' },
  2: { label: 'Markets（市集）',  description: '充滿活力的開放場所，多元刺激的市集般環境' },
  3: { label: 'Kitchens（廚房）', description: '工具一應俱全，轉換物質的地方，像是廚房一樣的濕熱環境' },
  4: { label: 'Mountains（山）',  description: '高處、開闊視野的環境，能俯瞰全局的高度' },
  5: { label: 'Valleys（山谷）',  description: '被山環繞、受到保護的低谷，溫暖而安全的包覆感' },
  6: { label: 'Shores（海岸）',   description: '海岸邊界，流動的過渡地帶，介於兩種世界之間' },
}

export const PERSPECTIVE_MAP: Record<number, { label: string; description: string }> = {
  1: { label: 'Survival（生存）',     description: '以生存視角觀察世界，關注資源與安全的基本需求' },
  2: { label: 'Possibility（可能性）', description: '著眼於未來潛力，能看見他人看不到的可能性' },
  3: { label: 'Power（力量）',        description: '觀察權力結構與動態，理解誰在影響誰' },
  4: { label: 'Personal（個人）',     description: '與週遭人相較之下，自己可以有所貢獻之處' },
  5: { label: 'Probability（機率）',  description: '以統計與規律評估事物，看見最可能發生的結果' },
  6: { label: 'Desire（欲望）',       description: '以欲望作為視角，洞察人們真正渴望的是什麼' },
}

export const MOTIVATION_MAP: Record<number, { label: string; description: string }> = {
  1: { label: 'Fear（恐懼）',      description: '追求個體知識與資源的安全感' },
  2: { label: 'Hope（希望）',      description: '對美好未來懷抱希望，相信事情終將變好' },
  3: { label: 'Desire（渴望）',    description: '被真實的熱情與渴望驅動，追求最深的心之所向' },
  4: { label: 'Need（需求）',      description: '回應真實需求，只做真正必要且有意義的事' },
  5: { label: 'Guilt（罪惡感）',   description: '以責任感為動力，透過省思自己對他人的影響來行動' },
  6: { label: 'Innocence（天真）', description: '以純粹天真的眼光看待世界，保持孩子般的開放' },
}

export const GATE_TO_CROSS_GROUP: Readonly<Record<number, number>> =
  CROSS_GROUPS.reduce<Record<number, number>>((acc, gates, groupId) => {
    gates.forEach(gate => { acc[gate] = groupId })
    return acc
  }, {})

export const PLANET_SYMBOLS: Record<string, string> = {
  '太陽': '☉', '地球': '⊕', '月亮': '☽',
  '北交點': '☊', '南交點': '☋',
  '水星': '☿', '金星': '♀', '火星': '♂',
  '木星': '♃', '土星': '♄', '天王星': '♅',
  '海王星': '♆', '冥王星': '♇',
}

// ── English display maps ────────────────────────────────────────────────────

export const TYPE_LABELS_EN: Record<HumanDesignType, string> = {
  'Manifestor':           'Manifestor',
  'Generator':            'Generator',
  'Manifesting Generator':'Manifesting Generator',
  'Projector':            'Projector',
  'Reflector':            'Reflector',
}

export const PROFILE_LABELS_EN: Record<string, string> = {
  '1/3': 'Investigator / Martyr',
  '1/4': 'Investigator / Opportunist',
  '2/4': 'Hermit / Opportunist',
  '2/5': 'Hermit / Heretic',
  '3/5': 'Martyr / Heretic',
  '3/6': 'Martyr / Role Model',
  '4/6': 'Opportunist / Role Model',
  '4/1': 'Opportunist / Investigator',
  '5/1': 'Heretic / Investigator',
  '5/2': 'Heretic / Hermit',
  '6/2': 'Role Model / Hermit',
  '6/3': 'Role Model / Martyr',
}

export const AUTHORITY_INFO_EN: Record<Authority, AuthorityInfo> = {
  'Emotional':      { name: 'Emotional Authority',       tip: 'Wait for emotional clarity after the wave passes before deciding.' },
  'Sacral':         { name: 'Sacral Authority',          tip: 'Listen to your sacral gut sound — uh-huh is yes, uhn-uhn is no.' },
  'Splenic':        { name: 'Splenic Authority',         tip: 'Trust the fleeting intuitive impulse in the moment — it won\'t repeat itself.' },
  'Ego':            { name: 'Ego Authority',             tip: 'Only commit to what you truly want and can deliver.' },
  'Self-Projected': { name: 'Self-Projected Authority',  tip: 'Speak your thoughts aloud to trusted people and listen to your own voice for direction.' },
  'Mental':         { name: 'Mental / No Inner Authority', tip: 'Discuss with different people and find clarity through outer reflection.' },
  'Lunar':          { name: 'Lunar Authority',           tip: 'Wait a full lunar cycle (28 days) before making major decisions.' },
}

export const STRATEGY_MAP_EN: Record<string, string> = {
  'Manifestor':           'Inform before acting',
  'Generator':            'Wait to respond',
  'Manifesting Generator':'Wait to respond, then inform',
  'Projector':            'Wait for the invitation',
  'Reflector':            'Wait a lunar cycle (28 days)',
}

export const SIGNATURE_MAP_EN: Record<string, { positive: string; negative: string }> = {
  'Manifestor':           { positive: 'Peace',        negative: 'Anger' },
  'Generator':            { positive: 'Satisfaction', negative: 'Frustration' },
  'Manifesting Generator':{ positive: 'Satisfaction', negative: 'Frustration & Anger' },
  'Projector':            { positive: 'Success',      negative: 'Bitterness' },
  'Reflector':            { positive: 'Surprise',     negative: 'Disappointment' },
}

export const CROSS_TYPE_LABELS_EN: Record<CrossType, string> = {
  RAC: 'Right Angle Cross',
  JC:  'Juxtaposition Cross',
  LAC: 'Left Angle Cross',
}

export const CROSS_BASE_NAMES_EN: readonly string[] = [
  'Tension', 'Duality', 'Sphinx', 'Revolution', 'Four Ways', 'Sleeping Phoenix',
  'Community', 'Consciousness', 'Rulership', 'Eden', 'Vessel of Love', 'Laws',
  'Confrontation', 'Penetration', 'Continuity', 'Limitation',
]

export const DEFINITION_LABEL_EN: Record<string, string> = {
  'Single':          'Single Definition',
  'Split':           'Split Definition',
  'Triple Split':    'Triple Split',
  'Quadruple Split': 'Quadruple Split',
  'None':            'No Definition (Reflector)',
}

export const CENTER_NAMES_EN: Record<CenterName, string> = {
  head:        'Head',
  ajna:        'Ajna',
  throat:      'Throat',
  g:           'G Center',
  ego:         'Heart / Will',
  sacral:      'Sacral',
  solarPlexus: 'Solar Plexus',
  spleen:      'Spleen',
  root:        'Root',
}

export const DIGESTION_MAP_EN: Record<number, { label: string; description: string }> = {
  1: { label: 'Appetite',  description: 'Follow instinctive appetite — eat what you crave, no fixed dietary rules needed.' },
  2: { label: 'Taste',     description: 'Value flavour and texture; let your taste guide food choices.' },
  3: { label: 'Thirst',    description: 'Hydration first — thirst signals precede hunger.' },
  4: { label: 'Touch',     description: 'Prefer fresh, seasonal produce with consistent staples; no need to force variety.' },
  5: { label: 'Sound',     description: 'Eat in quiet environments so your body can tune into its digestive rhythm.' },
  6: { label: 'Light',     description: 'Dine in naturally lit spaces; lighting directly affects digestive energy.' },
}

export const ENVIRONMENT_MAP_EN: Record<number, { label: string; description: string }> = {
  1: { label: 'Caves',     description: 'Need private, enclosed personal space — a cave-like sanctuary for full withdrawal.' },
  2: { label: 'Markets',   description: 'Thrive in vibrant, open spaces with diverse stimulation.' },
  3: { label: 'Kitchens',  description: 'Need a well-equipped transformative space — warm, humid, practical.' },
  4: { label: 'Mountains', description: 'Elevated, expansive vantage points with a wide view of everything below.' },
  5: { label: 'Valleys',   description: 'Sheltered, valley-like environments — warm, protected, enclosed by mountains.' },
  6: { label: 'Shores',    description: 'Boundary zones like coastlines — fluid transitions between two worlds.' },
}

export const PERSPECTIVE_MAP_EN: Record<number, { label: string; description: string }> = {
  1: { label: 'Survival',    description: 'View the world through the lens of survival, resources, and basic safety.' },
  2: { label: 'Possibility', description: 'Naturally sees potential and future possibilities others overlook.' },
  3: { label: 'Power',       description: 'Observes power dynamics — who influences whom and how.' },
  4: { label: 'Personal',    description: 'Focused on where one can personally contribute compared to others.' },
  5: { label: 'Probability', description: 'Evaluates patterns and statistics to see the most likely outcomes.' },
  6: { label: 'Desire',      description: 'Reads through the lens of desire — what people truly long for.' },
}

export const MOTIVATION_MAP_EN: Record<number, { label: string; description: string }> = {
  1: { label: 'Fear',       description: 'Driven to seek individual knowledge and security.' },
  2: { label: 'Hope',       description: 'Motivated by hope for a better future — things will work out.' },
  3: { label: 'Desire',     description: 'Driven by authentic passion — pursuing what the heart truly wants.' },
  4: { label: 'Need',       description: 'Responds to genuine needs — only does what is truly necessary and meaningful.' },
  5: { label: 'Guilt',      description: 'Motivated by responsibility — acting from reflection on one\'s impact on others.' },
  6: { label: 'Innocence',  description: 'Sees the world with pure, child-like openness and wonder.' },
}

export const AUTHORITY_KEY_MAP: Record<string, Authority> = Object.entries(AUTHORITY_INFO).reduce<Record<string, Authority>>((acc, [k, v]) => {
  acc[k] = k as Authority
  acc[v.name] = k as Authority
  const enInfo = AUTHORITY_INFO_EN[k as Authority]
  if (enInfo) acc[enInfo.name] = k as Authority
  return acc
}, {})
