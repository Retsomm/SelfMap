// Human Design chart geometry and descriptive data for the BodyGraph SVG.

export const HD_PALETTE = {
  mustard: '#e6c542',
  olive:   '#9bbf52',
  tan:     '#c69a5d',
  crimson: '#d04830',
  ink:     '#2b1f14',
  paper:   '#efe5d0',
}

// Activation colours
export const ACT_CONSCIOUS   = '#000000'  // Personality / 意識 = 黑
export const ACT_UNCONSCIOUS = '#d04830'  // Design / 非意識 = 紅

// Center geometry — viewBox 700 × 920
// gateAnchors: gate number → [x, y] on the center's perimeter
export const CENTERS_GEOM: Record<string, {
  shape: 'tri-up' | 'tri-down' | 'square' | 'diamond' | 'tri-left' | 'tri-right'
  color: string
  points: string
  rect?: [number, number, number, number]
  gateAnchors: Record<number, [number, number]>
}> = {
  head: {
    shape: 'tri-up',
    color: HD_PALETTE.mustard,
    points: '350,10 290,115 410,115',
    gateAnchors: { 64: [320, 115], 61: [350, 115], 63: [380, 115] },
  },
  ajna: {
    shape: 'tri-down',
    color: HD_PALETTE.olive,
    points: '290,175 410,175 350,275',
    gateAnchors: {
      47: [320, 175], 24: [350, 175], 4: [380, 175],
      17: [332, 252], 43: [350, 263], 11: [368, 252],
    },
  },
  throat: {
    shape: 'square',
    color: HD_PALETTE.tan,
    rect: [300, 295, 100, 100],
    points: '300,295 400,295 400,395 300,395',
    gateAnchors: {
      62: [320, 295], 23: [350, 295], 56: [380, 295],
      35: [400, 315], 12: [400, 340], 45: [400, 370],
      16: [300, 318], 20: [300, 348],
      33: [332, 395], 31: [350, 395], 8: [368, 395],
    },
  },
  g: {
    shape: 'diamond',
    color: HD_PALETTE.mustard,
    points: '350,415 425,485 350,555 275,485',
    gateAnchors: {
      13: [332, 433], 7: [350, 423], 1: [368, 433],
      25: [410, 498],
      10: [288, 478],
      15: [332, 537], 2: [350, 545], 46: [368, 537],
    },
  },
  // 意志力中心 — "heart" in chart data, "ego" in lib types
  heart: {
    shape: 'tri-left',
    color: HD_PALETTE.crimson,
    points: '475,520 475,585 410,552',
    gateAnchors: {
      21: [472, 524],
      26: [416, 555],
      51: [438, 540],
      40: [472, 580],
    },
  },
  spleen: {
    shape: 'tri-right',
    color: HD_PALETTE.tan,
    points: '120,580 120,660 200,620',
    gateAnchors: {
      48: [148, 594],
      57: [180, 610],
      44: [200, 620],
      50: [184, 628],
      18: [164, 638],
      28: [148, 646],
      32: [132, 654],
    },
  },
  sacral: {
    shape: 'square',
    color: HD_PALETTE.crimson,
    rect: [300, 600, 100, 100],
    points: '300,600 400,600 400,700 300,700',
    gateAnchors: {
      5:  [320, 600], 14: [350, 600], 29: [380, 600],
      34: [300, 618], 27: [300, 660],
      59: [400, 630],
      42: [320, 700], 3: [350, 700], 9: [380, 700],
    },
  },
  // 情緒中心 — "solar" in chart data, "solarPlexus" in lib types
  solar: {
    shape: 'tri-left',
    color: HD_PALETTE.tan,
    points: '580,580 580,660 500,620',
    gateAnchors: {
      36: [568, 586],
      22: [544, 598],
      37: [520, 610],
      6:  [502, 619],
      49: [520, 630],
      55: [544, 642],
      30: [568, 654],
    },
  },
  root: {
    shape: 'square',
    color: HD_PALETTE.tan,
    rect: [300, 760, 100, 100],
    points: '300,760 400,760 400,860 300,860',
    gateAnchors: {
      58: [300, 778], 38: [300, 803], 54: [300, 828],
      53: [332, 760], 60: [350, 760], 52: [368, 760],
      19: [400, 778], 39: [400, 803], 41: [400, 828],
    },
  },
}

export const CENTER_ORDER = ['head', 'ajna', 'throat', 'g', 'heart', 'spleen', 'sacral', 'solar', 'root']

// Integration channel pairs — rendered as trunk + spur, not individual lines
export const INTEGRATION_PAIRS = new Set(['10-20', '10-34', '10-57', '20-34', '34-57', '20-57'])

// Channel data
export interface ChartChannel {
  id: string
  from: number
  to: number
  name: string
  en: string
  desc: string
}

export const HD_CHANNELS: ChartChannel[] = [
  { id: 'c64-47', from: 64, to: 47, name: '抽象通道', en: 'Abstraction',     desc: '混亂中尋找意義的心智模式。從過去經驗中提煉故事。' },
  { id: 'c61-24', from: 61, to: 24, name: '覺知通道', en: 'Awareness',       desc: '思考者的通道。對未知抱有持續的好奇。' },
  { id: 'c63-4',  from: 63, to: 4,  name: '邏輯通道', en: 'Logic',           desc: '懷疑與解答的心智節奏。需要時間驗證。' },
  { id: 'c17-62', from: 17, to: 62, name: '接受通道', en: 'Acceptance',      desc: '組織者的通道。將意見化為事實與細節。' },
  { id: 'c43-23', from: 43, to: 23, name: '架構通道', en: 'Structuring',     desc: '天才或怪人。需要在對的時機被傾聽。' },
  { id: 'c11-56', from: 11, to: 56, name: '好奇通道', en: 'Curiosity',       desc: '說書人的通道。將想法化為刺激他人的故事。' },
  { id: 'c20-34', from: 20, to: 34, name: '魅力通道', en: 'Charisma',        desc: '當下的展現者。忙碌於此刻的力量。' },
  { id: 'c34-57', from: 34, to: 57, name: '力量通道', en: 'Power',           desc: '原型化的存在。完美的生存直覺。' },
  { id: 'c20-57', from: 20, to: 57, name: '腦波通道', en: 'The Brainwave',   desc: '當下的直覺洞察，瞬間即達。' },
  { id: 'c10-20', from: 10, to: 20, name: '覺醒通道', en: 'Awakening',       desc: '忠於自己的當下展現。' },
  { id: 'c10-34', from: 10, to: 34, name: '探索通道', en: 'Exploration',     desc: '依循自己的信念而行動。' },
  { id: 'c10-57', from: 10, to: 57, name: '完美形式通道', en: 'Perfected Form', desc: '對自我生存的直覺。' },
  { id: 'c16-48', from: 16, to: 48, name: '才華通道', en: 'The Wavelength',  desc: '深度的天賦透過練習被表達。' },
  { id: 'c12-22', from: 12, to: 22, name: '開放通道', en: 'Openness',        desc: '社交與情感的優雅表達。' },
  { id: 'c21-45', from: 21, to: 45, name: '金錢通道', en: 'Money',           desc: '物質世界中的控制與管理。' },
  { id: 'c26-44', from: 26, to: 44, name: '投降通道', en: 'Surrender',       desc: '記憶、傳遞與商業本能。' },
  { id: 'c40-37', from: 40, to: 37, name: '社群通道', en: 'Community',       desc: '部落的承諾與情感契約。' },
  { id: 'c51-25', from: 51, to: 25, name: '啟蒙通道', en: 'Initiation',      desc: '震撼與覺醒。為更高目的而震驚他人。' },
  { id: 'c2-14',  from: 2,  to: 14, name: '節奏通道', en: 'The Beat',        desc: '生命方向與資源的舵手。' },
  { id: 'c1-8',   from: 1,  to: 8,  name: '啟發通道', en: 'Inspiration',     desc: '創意的榜樣。獨特性的展示。' },
  { id: 'c13-33', from: 13, to: 33, name: '浪子通道', en: 'The Prodigal',    desc: '見證者。承載秘密與故事。' },
  { id: 'c7-31',  from: 7,  to: 31, name: '領導通道', en: 'The Alpha',       desc: '未來的領袖。被選擇而非自薦。' },
  { id: 'c15-5',  from: 15, to: 5,  name: '節律通道', en: 'Rhythm',          desc: '自然韻律中的極端與愛。' },
  { id: 'c46-29', from: 46, to: 29, name: '發現通道', en: 'Discovery',       desc: '說「是」之前需深思的承諾。' },
  { id: 'c42-53', from: 42, to: 53, name: '成熟通道', en: 'Maturation',      desc: '完成週期、平衡的能量。' },
  { id: 'c9-52',  from: 9,  to: 52, name: '專注通道', en: 'Concentration',   desc: '專注於細節的決心。' },
  { id: 'c3-60',  from: 3,  to: 60, name: '突變通道', en: 'Mutation',        desc: '創新出於限制中的能量。' },
  { id: 'c27-50', from: 27, to: 50, name: '守護通道', en: 'Preservation',    desc: '對價值的維護與培育。' },
  { id: 'c19-49', from: 19, to: 49, name: '綜效通道', en: 'Synthesis',       desc: '對需求與敏感度的感應。' },
  { id: 'c39-55', from: 39, to: 55, name: '情緒通道', en: 'Emoting',         desc: '情緒的挑釁與豐盈。' },
  { id: 'c41-30', from: 41, to: 30, name: '識別通道', en: 'Recognition',     desc: '感受的能量驅動體驗。' },
  { id: 'c6-59',  from: 6,  to: 59, name: '親密通道', en: 'Mating',          desc: '繁衍與打破隔閡的能量。' },
  { id: 'c36-35', from: 36, to: 35, name: '無常通道', en: 'Transitoriness',  desc: '尋求各種體驗的萬事通。' },
  { id: 'c18-58', from: 18, to: 58, name: '評判通道', en: 'Judgment',        desc: '挑戰並改善現狀的能量。' },
  { id: 'c28-38', from: 28, to: 38, name: '掙扎通道', en: 'Struggle',        desc: '為值得之事奮戰。' },
  { id: 'c32-54', from: 32, to: 54, name: '蛻變通道', en: 'Transformation',  desc: '驅動野心與物質提升。' },
]

// Gate descriptive data
export interface ChartGate {
  name: string
  en: string
  center: string  // chart center key (heart/solar, not ego/solarPlexus)
  desc: string
}

export const HD_GATES: Record<number, ChartGate> = {
  1:  { name: '自我表達',    en: 'The Creative',          center: 'g',      desc: '創造的角色：以獨特性引領他人。' },
  2:  { name: '高我之愛',    en: 'The Receptive',         center: 'g',      desc: '方向的駕馭：知道自己往何處去。' },
  3:  { name: '秩序',        en: 'Ordering',              center: 'sacral', desc: '從混亂中誕生新秩序的突變力。' },
  4:  { name: '解答',        en: 'Formulization',         center: 'ajna',   desc: '青春的公式：提出可能的答案。' },
  5:  { name: '固定模式',    en: 'Fixed Rhythms',         center: 'sacral', desc: '等待的節奏與儀式感。' },
  6:  { name: '摩擦',        en: 'Friction',              center: 'solar',  desc: '親密關係的調節閘。' },
  7:  { name: '互動角色',    en: 'The Role of Self',      center: 'g',      desc: '幕後的領導與引導。' },
  8:  { name: '貢獻',        en: 'Contribution',          center: 'throat', desc: '展現獨特，邀請他人加入。' },
  9:  { name: '聚焦',        en: 'Focus',                 center: 'sacral', desc: '對細節的專注與耐性。' },
  10: { name: '自我行為',    en: 'Behavior of the Self',  center: 'g',      desc: '對自我的愛與堅持。' },
  11: { name: '想法',        en: 'Ideas',                 center: 'ajna',   desc: '靈感的接收與整理。' },
  12: { name: '謹慎',        en: 'Caution',               center: 'throat', desc: '對的時機說出口的能力。' },
  13: { name: '聆聽者',      en: 'The Listener',          center: 'g',      desc: '記憶他人故事的見證者。' },
  14: { name: '富有的力量',  en: 'Power Skills',          center: 'sacral', desc: '透過工作累積資源的力量。' },
  15: { name: '極端',        en: 'Extremes',              center: 'g',      desc: '對人類流動性的愛。' },
  16: { name: '熱忱',        en: 'Enthusiasm',            center: 'throat', desc: '透過練習達到精熟。' },
  17: { name: '意見',        en: 'Opinions',              center: 'ajna',   desc: '邏輯地觀察並提出論點。' },
  18: { name: '修正',        en: 'Correction',            center: 'spleen', desc: '對不完美的敏銳挑剔。' },
  19: { name: '需求',        en: 'Wanting',               center: 'root',   desc: '對基本需要的敏感雷達。' },
  20: { name: '當下',        en: 'The Now',               center: 'throat', desc: '此時此刻的展現。' },
  21: { name: '獵人',        en: 'The Hunter',            center: 'heart',  desc: '對領域與資源的控制。' },
  22: { name: '優雅',        en: 'Grace',                 center: 'solar',  desc: '情緒的開放表達。' },
  23: { name: '同化',        en: 'Assimilation',          center: 'throat', desc: '在對的時刻說出洞見。' },
  24: { name: '理性化',      en: 'Rationalization',       center: 'ajna',   desc: '反覆思索直至理解。' },
  25: { name: '自我精神',    en: 'Spirit of the Self',    center: 'g',      desc: '無條件之愛的純粹。' },
  26: { name: '利己主義者',  en: 'The Egoist',            center: 'heart',  desc: '說服與包裝的天賦。' },
  27: { name: '照顧',        en: 'Caring',                center: 'sacral', desc: '對價值與生命的養育。' },
  28: { name: '玩家',        en: 'The Game Player',       center: 'spleen', desc: '為意義而冒險的本能。' },
  29: { name: '說「是」',    en: 'Saying Yes',            center: 'sacral', desc: '承諾經驗的力量。' },
  30: { name: '感覺',        en: 'Feelings',              center: 'solar',  desc: '對體驗的渴望與火焰。' },
  31: { name: '影響力',      en: 'Influence',             center: 'throat', desc: '被選出的民主領袖之聲。' },
  32: { name: '延續',        en: 'Continuity',            center: 'spleen', desc: '識別何者值得保留。' },
  33: { name: '隱私',        en: 'Privacy',               center: 'throat', desc: '撤退中提煉故事。' },
  34: { name: '力量',        en: 'Power',                 center: 'sacral', desc: '當下的純粹能量爆發。' },
  35: { name: '改變',        en: 'Change',                center: 'throat', desc: '經歷一切的萬事通。' },
  36: { name: '危機',        en: 'Crisis',                center: 'solar',  desc: '透過新體驗成長。' },
  37: { name: '友誼',        en: 'Friendship',            center: 'solar',  desc: '部落契約的溫柔。' },
  38: { name: '對抗',        en: 'The Fighter',           center: 'root',   desc: '為意義而戰的決心。' },
  39: { name: '挑釁',        en: 'Provocation',           center: 'root',   desc: '挑動情緒尋求清明。' },
  40: { name: '單獨',        en: 'Aloneness',             center: 'heart',  desc: '工作與獨處的平衡。' },
  41: { name: '收縮',        en: 'Contraction',           center: 'root',   desc: '想像所有可能性的起點。' },
  42: { name: '成長',        en: 'Growth',                center: 'sacral', desc: '完成循環的能量。' },
  43: { name: '洞察',        en: 'Insight',               center: 'ajna',   desc: '突如其來的個人理解。' },
  44: { name: '警覺',        en: 'Alertness',             center: 'spleen', desc: '對人的記憶與直覺判斷。' },
  45: { name: '聚集者',      en: 'The Gatherer',          center: 'throat', desc: '部落的君王與資源整合者。' },
  46: { name: '身體之愛',    en: 'Love of the Body',      center: 'g',      desc: '對身體經驗的決心。' },
  47: { name: '實現',        en: 'Realization',           center: 'ajna',   desc: '從混沌中提煉洞見。' },
  48: { name: '深度',        en: 'Depth',                 center: 'spleen', desc: '才華的根源所在。' },
  49: { name: '原則',        en: 'Principles',            center: 'solar',  desc: '對部落契約的革命性敏感。' },
  50: { name: '價值',        en: 'Values',                center: 'spleen', desc: '對部落價值的守護。' },
  51: { name: '震驚',        en: 'Shock',                 center: 'heart',  desc: '透過震撼喚醒他人。' },
  52: { name: '靜止',        en: 'Stillness',             center: 'root',   desc: '專注於當下任務的能量。' },
  53: { name: '開始',        en: 'Beginnings',            center: 'root',   desc: '啟動新週期的壓力。' },
  54: { name: '野心',        en: 'Ambition',              center: 'root',   desc: '物質與精神向上的驅力。' },
  55: { name: '豐盛',        en: 'Abundance',             center: 'solar',  desc: '情緒的豐盛或匱乏感。' },
  56: { name: '說故事的人',  en: 'Stimulation',           center: 'throat', desc: '透過故事激發他人。' },
  57: { name: '直覺',        en: 'Intuitive Clarity',     center: 'spleen', desc: '當下最深的直覺洞察。' },
  58: { name: '生命力',      en: 'Vitality',              center: 'root',   desc: '對改善的喜悅。' },
  59: { name: '性',          en: 'Sexuality',             center: 'sacral', desc: '打破他人界線的繁衍力。' },
  60: { name: '限制',        en: 'Limitation',            center: 'root',   desc: '在限制中孕育突變。' },
  61: { name: '內在真理',    en: 'Inner Truth',           center: 'head',   desc: '探究未知的神秘壓力。' },
  62: { name: '細節',        en: 'Details',               center: 'throat', desc: '用語言精確命名。' },
  63: { name: '懷疑',        en: 'Doubt',                 center: 'head',   desc: '邏輯的起點：合理的懷疑。' },
  64: { name: '困惑',        en: 'Confusion',             center: 'head',   desc: '反思過去以拼湊意義。' },
}

// Center descriptive data
export interface ChartCenter {
  id: string
  name: string
  en: string
  type: string
  color: string
  summary: string
  description: string
  gates: number[]
  keywords: string[]
}

export const HD_CENTERS_INFO: Record<string, ChartCenter> = {
  head: {
    id: 'head',
    name: '頂輪中心',
    en: 'Head Center',
    type: '靈感中心 · Pressure',
    color: 'mustard',
    summary: '靈感、疑問與心智壓力的源頭。',
    description: '頂輪是創意與啟發的入口。它以「壓力」的形式向下推動 Ajna 去思考、去尋找答案。有定義的頂輪是穩定的靈感源；無定義的頂輪則容易被外界的問題與思緒佔據。',
    gates: [64, 61, 63],
    keywords: ['靈感', '壓力', '提問', '想像'],
  },
  ajna: {
    id: 'ajna',
    name: '邏輯中心',
    en: 'Ajna Center',
    type: '覺察中心 · Awareness',
    color: 'olive',
    summary: '概念化、分析與意義建構的中樞。',
    description: '邏輯中心將頂輪的靈感整理為思緒、概念與信念。有定義時思考方式固定且可信；無定義時則具備接收多元觀點的彈性，但容易陷入「我必須確定」的執念。',
    gates: [47, 24, 4, 17, 43, 11],
    keywords: ['思考', '理解', '概念', '心智'],
  },
  throat: {
    id: 'throat',
    name: '喉嚨中心',
    en: 'Throat Center',
    type: '表達 · 行動 · Manifestation',
    color: 'tan',
    summary: '把內在轉化為語言與行動的關鍵閘口。',
    description: '喉嚨是所有顯化的出口。「說出來」與「做出來」皆由此發生。它必須被正確的能量（通過通道）連接，才能在對的時刻順利表達。',
    gates: [62, 23, 56, 35, 12, 45, 33, 8, 31, 7, 1, 13, 16, 20],
    keywords: ['表達', '顯化', '行動', '聲音'],
  },
  g: {
    id: 'g',
    name: 'G 中心',
    en: 'Identity / G Center',
    type: '身份與方向 · Self',
    color: 'mustard',
    summary: '愛、方向與身份認同的羅盤。',
    description: 'G 中心承載自我身份、人生方向與愛的座標。有定義者擁有恆定的自我感；無定義者像鏡子，會反映環境中的身份與方向，因此「在對的地方」格外關鍵。',
    gates: [7, 1, 13, 25, 46, 2, 15, 10],
    keywords: ['方向', '愛', '身份', '磁場'],
  },
  heart: {
    id: 'heart',
    name: '意志力中心',
    en: 'Heart / Will',
    type: '能量中心 · Motor',
    color: 'crimson',
    summary: '意志、勇氣與承諾的小而強大引擎。',
    description: '意志力中心驅動「我可以」的承諾。它運作的方式是「努力—休息」交替的脈動。有定義者能持續承諾；無定義者請避免向自己或他人證明價值。',
    gates: [21, 40, 26, 51],
    keywords: ['意志', '承諾', '價值', '勇氣'],
  },
  spleen: {
    id: 'spleen',
    name: '直覺中心',
    en: 'Spleen',
    type: '覺察中心 · 即時',
    color: 'tan',
    summary: '當下的直覺、健康與生存本能。',
    description: '直覺中心只在當下說一次話——細微、安靜、不重複。它監測健康、安全與品味。有定義時擁有可靠的本能；無定義時則對他人狀態極為敏感。',
    gates: [48, 57, 44, 50, 32, 28, 18],
    keywords: ['直覺', '當下', '本能', '健康'],
  },
  sacral: {
    id: 'sacral',
    name: '薦骨中心',
    en: 'Sacral',
    type: '能量中心 · Motor',
    color: 'crimson',
    summary: '生命力、工作力與回應的引擎。',
    description: '薦骨是地球上最強大的可持續能量源。它只回應外界的提問，以「嗯哼」或「嗯—嗯」的本能聲音表達。生產者與顯示生產者由此運作。',
    gates: [5, 14, 29, 59, 9, 3, 42, 27, 34],
    keywords: ['回應', '生命力', '工作', '繁衍'],
  },
  solar: {
    id: 'solar',
    name: '情緒中心',
    en: 'Solar Plexus',
    type: '能量中心 · 覺察',
    color: 'tan',
    summary: '情緒波動、敏感與情感真相之源。',
    description: '情緒中心以波的方式運作——高、低、中性。重要決策需等待「情緒清明」。它同時是情感覺察的所在，無定義者會放大他人的情緒。',
    gates: [36, 22, 37, 6, 49, 55, 30],
    keywords: ['情緒', '波', '清明', '感受'],
  },
  root: {
    id: 'root',
    name: '根部中心',
    en: 'Root',
    type: '能量中心 · 壓力',
    color: 'tan',
    summary: '腎上腺式驅動與生存壓力的底座。',
    description: '根部以「壓力」推動其他中心進入行動。它是燃料，也是節奏的起點。有定義時能在壓力下穩定運作；無定義時容易被「快點完成」的焦慮支配。',
    gates: [53, 60, 52, 19, 39, 41, 58, 38, 54],
    keywords: ['壓力', '驅動', '節奏', '腎上腺'],
  },
}

// Legend items for the left column
export const LEGEND_ITEMS = [
  { id: 'head',   cls: 'tri-up',    color: '#d9c25e', cn: '頂輪',   en: 'Head',         code: 'I' },
  { id: 'ajna',   cls: 'tri-down',  color: '#a8c065', cn: '邏輯',   en: 'Ajna',         code: 'II' },
  { id: 'throat', cls: 'square',    color: '#b89968', cn: '喉嚨',   en: 'Throat',       code: 'III' },
  { id: 'g',      cls: 'diamond',   color: '#d9c25e', cn: 'G 中心', en: 'Identity',     code: 'IV' },
  { id: 'heart',  cls: 'tri-left',  color: '#c8553d', cn: '意志力', en: 'Will',         code: 'V' },
  { id: 'spleen', cls: 'tri-right', color: '#b89968', cn: '直覺',   en: 'Spleen',       code: 'VI' },
  { id: 'sacral', cls: 'square',    color: '#c8553d', cn: '薦骨',   en: 'Sacral',       code: 'VII' },
  { id: 'solar',  cls: 'tri-left',  color: '#b89968', cn: '情緒',   en: 'Solar Plexus', code: 'VIII' },
  { id: 'root',   cls: 'square',    color: '#b89968', cn: '根部',   en: 'Root',         code: 'IX' },
]
