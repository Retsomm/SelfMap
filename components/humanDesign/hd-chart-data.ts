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
  name: { zh: string; en: string }
  desc: { zh: string; en: string }
}

export const HD_CHANNELS: ChartChannel[] = [
  { id: 'c64-47', from: 64, to: 47, name: { zh: '抽象通道',     en: 'Abstraction'    }, desc: { zh: '混亂中尋找意義的心智模式。從過去經驗中提煉故事。',  en: 'The mental pattern of finding meaning in chaos. Distilling stories from past experiences.' } },
  { id: 'c61-24', from: 61, to: 24, name: { zh: '覺知通道',     en: 'Awareness'      }, desc: { zh: '思考者的通道。對未知抱有持續的好奇。',              en: "The thinker's channel. A persistent curiosity about the unknown." } },
  { id: 'c63-4',  from: 63, to: 4,  name: { zh: '邏輯通道',     en: 'Logic'          }, desc: { zh: '懷疑與解答的心智節奏。需要時間驗證。',              en: 'The mental rhythm of doubt and answers. Requires time to verify.' } },
  { id: 'c17-62', from: 17, to: 62, name: { zh: '接受通道',     en: 'Acceptance'     }, desc: { zh: '組織者的通道。將意見化為事實與細節。',              en: "The organizer's channel. Turning opinions into facts and details." } },
  { id: 'c43-23', from: 43, to: 23, name: { zh: '架構通道',     en: 'Structuring'    }, desc: { zh: '天才或怪人。需要在對的時機被傾聽。',                en: 'Genius or eccentric. Must be heard at the right moment.' } },
  { id: 'c11-56', from: 11, to: 56, name: { zh: '好奇通道',     en: 'Curiosity'      }, desc: { zh: '說書人的通道。將想法化為刺激他人的故事。',          en: "The storyteller's channel. Turning ideas into stories that stimulate others." } },
  { id: 'c20-34', from: 20, to: 34, name: { zh: '魅力通道',     en: 'Charisma'       }, desc: { zh: '當下的展現者。忙碌於此刻的力量。',                  en: 'The present-moment exhibitor. The power of being busy in the now.' } },
  { id: 'c34-57', from: 34, to: 57, name: { zh: '力量通道',     en: 'Power'          }, desc: { zh: '原型化的存在。完美的生存直覺。',                    en: 'Archetypal existence. Perfect survival instinct.' } },
  { id: 'c20-57', from: 20, to: 57, name: { zh: '腦波通道',     en: 'The Brainwave'  }, desc: { zh: '當下的直覺洞察，瞬間即達。',                        en: 'Intuitive insight in the present moment — instantaneous.' } },
  { id: 'c10-20', from: 10, to: 20, name: { zh: '覺醒通道',     en: 'Awakening'      }, desc: { zh: '忠於自己的當下展現。',                              en: 'Authentic expression in the now — true to oneself.' } },
  { id: 'c10-34', from: 10, to: 34, name: { zh: '探索通道',     en: 'Exploration'    }, desc: { zh: '依循自己的信念而行動。',                            en: "Acting in accordance with one's own convictions." } },
  { id: 'c10-57', from: 10, to: 57, name: { zh: '完美形式通道', en: 'Perfected Form' }, desc: { zh: '對自我生存的直覺。',                               en: "Intuition of one's own survival and self-expression." } },
  { id: 'c16-48', from: 16, to: 48, name: { zh: '才華通道',     en: 'The Wavelength' }, desc: { zh: '深度的天賦透過練習被表達。',                        en: 'Deep talent expressed through dedicated practice.' } },
  { id: 'c12-22', from: 12, to: 22, name: { zh: '開放通道',     en: 'Openness'       }, desc: { zh: '社交與情感的優雅表達。',                            en: 'Graceful expression of social and emotional experience.' } },
  { id: 'c21-45', from: 21, to: 45, name: { zh: '金錢通道',     en: 'Money'          }, desc: { zh: '物質世界中的控制與管理。',                          en: 'Control and management in the material world.' } },
  { id: 'c26-44', from: 26, to: 44, name: { zh: '投降通道',     en: 'Surrender'      }, desc: { zh: '記憶、傳遞與商業本能。',                            en: 'Memory, transmission, and commercial instinct.' } },
  { id: 'c40-37', from: 40, to: 37, name: { zh: '社群通道',     en: 'Community'      }, desc: { zh: '部落的承諾與情感契約。',                            en: 'The tribal promise and emotional contract.' } },
  { id: 'c51-25', from: 51, to: 25, name: { zh: '啟蒙通道',     en: 'Initiation'     }, desc: { zh: '震撼與覺醒。為更高目的而震驚他人。',                en: 'Shock and awakening. Initiating others for a higher purpose.' } },
  { id: 'c2-14',  from: 2,  to: 14, name: { zh: '節奏通道',     en: 'The Beat'       }, desc: { zh: '生命方向與資源的舵手。',                            en: 'The helmsman of life direction and resources.' } },
  { id: 'c1-8',   from: 1,  to: 8,  name: { zh: '啟發通道',     en: 'Inspiration'    }, desc: { zh: '創意的榜樣。獨特性的展示。',                        en: 'A model of creativity. The display of uniqueness.' } },
  { id: 'c13-33', from: 13, to: 33, name: { zh: '浪子通道',     en: 'The Prodigal'   }, desc: { zh: '見證者。承載秘密與故事。',                          en: 'The witness. Carrying secrets and stories.' } },
  { id: 'c7-31',  from: 7,  to: 31, name: { zh: '領導通道',     en: 'The Alpha'      }, desc: { zh: '未來的領袖。被選擇而非自薦。',                      en: 'The future leader. Chosen, not self-appointed.' } },
  { id: 'c15-5',  from: 15, to: 5,  name: { zh: '節律通道',     en: 'Rhythm'         }, desc: { zh: '自然韻律中的極端與愛。',                            en: 'Extremes and love within the rhythms of nature.' } },
  { id: 'c46-29', from: 46, to: 29, name: { zh: '發現通道',     en: 'Discovery'      }, desc: { zh: '說「是」之前需深思的承諾。',                        en: 'The commitment that requires deep reflection before saying yes.' } },
  { id: 'c42-53', from: 42, to: 53, name: { zh: '成熟通道',     en: 'Maturation'     }, desc: { zh: '完成週期、平衡的能量。',                            en: 'The energy of completing cycles and finding balance.' } },
  { id: 'c9-52',  from: 9,  to: 52, name: { zh: '專注通道',     en: 'Concentration'  }, desc: { zh: '專注於細節的決心。',                                en: 'The determination to focus on details.' } },
  { id: 'c3-60',  from: 3,  to: 60, name: { zh: '突變通道',     en: 'Mutation'       }, desc: { zh: '創新出於限制中的能量。',                            en: 'Innovation arising from the energy within limitation.' } },
  { id: 'c27-50', from: 27, to: 50, name: { zh: '守護通道',     en: 'Preservation'   }, desc: { zh: '對價值的維護與培育。',                              en: 'Maintaining and nurturing values.' } },
  { id: 'c19-49', from: 19, to: 49, name: { zh: '綜效通道',     en: 'Synthesis'      }, desc: { zh: '對需求與敏感度的感應。',                            en: 'Sensing needs and cultivating sensitivity.' } },
  { id: 'c39-55', from: 39, to: 55, name: { zh: '情緒通道',     en: 'Emoting'        }, desc: { zh: '情緒的挑釁與豐盈。',                                en: 'Emotional provocation and the fullness of feeling.' } },
  { id: 'c41-30', from: 41, to: 30, name: { zh: '識別通道',     en: 'Recognition'    }, desc: { zh: '感受的能量驅動體驗。',                              en: 'The energy of feeling driving experience.' } },
  { id: 'c6-59',  from: 6,  to: 59, name: { zh: '親密通道',     en: 'Mating'         }, desc: { zh: '繁衍與打破隔閡的能量。',                            en: 'The energy of reproduction and breaking down barriers.' } },
  { id: 'c36-35', from: 36, to: 35, name: { zh: '無常通道',     en: 'Transitoriness' }, desc: { zh: '尋求各種體驗的萬事通。',                            en: 'The jack-of-all-trades seeking all manner of experiences.' } },
  { id: 'c18-58', from: 18, to: 58, name: { zh: '評判通道',     en: 'Judgment'       }, desc: { zh: '挑戰並改善現狀的能量。',                            en: 'The energy to challenge and improve the existing order.' } },
  { id: 'c28-38', from: 28, to: 38, name: { zh: '掙扎通道',     en: 'Struggle'       }, desc: { zh: '為值得之事奮戰。',                                  en: 'Fighting for what is worth fighting for.' } },
  { id: 'c32-54', from: 32, to: 54, name: { zh: '蛻變通道',     en: 'Transformation' }, desc: { zh: '驅動野心與物質提升。',                              en: 'Driving ambition and material ascent.' } },
]

// Gate descriptive data
export interface ChartGate {
  name: { zh: string; en: string }
  center: string  // chart center key (heart/solar, not ego/solarPlexus)
  desc: { zh: string; en: string }
}

export const HD_GATES: Record<number, ChartGate> = {
  1:  { name: { zh: '自我表達',    en: 'The Creative'          }, center: 'g',      desc: { zh: '創造的角色：以獨特性引領他人。',      en: 'The role of creativity: leading others through uniqueness.' } },
  2:  { name: { zh: '高我之愛',    en: 'The Receptive'         }, center: 'g',      desc: { zh: '方向的駕馭：知道自己往何處去。',      en: 'Mastery of direction: knowing where you are headed.' } },
  3:  { name: { zh: '秩序',        en: 'Ordering'              }, center: 'sacral', desc: { zh: '從混亂中誕生新秩序的突變力。',        en: 'The mutative force that births new order from chaos.' } },
  4:  { name: { zh: '解答',        en: 'Formulization'         }, center: 'ajna',   desc: { zh: '青春的公式：提出可能的答案。',        en: 'The youthful formula: proposing possible answers.' } },
  5:  { name: { zh: '固定模式',    en: 'Fixed Rhythms'         }, center: 'sacral', desc: { zh: '等待的節奏與儀式感。',                en: 'The rhythm of waiting and the sense of ritual.' } },
  6:  { name: { zh: '摩擦',        en: 'Friction'              }, center: 'solar',  desc: { zh: '親密關係的調節閘。',                  en: 'The regulating gate of intimate relationships.' } },
  7:  { name: { zh: '互動角色',    en: 'The Role of Self'      }, center: 'g',      desc: { zh: '幕後的領導與引導。',                  en: 'Behind-the-scenes leadership and guidance.' } },
  8:  { name: { zh: '貢獻',        en: 'Contribution'          }, center: 'throat', desc: { zh: '展現獨特，邀請他人加入。',            en: 'Showing uniqueness and inviting others to join.' } },
  9:  { name: { zh: '聚焦',        en: 'Focus'                 }, center: 'sacral', desc: { zh: '對細節的專注與耐性。',                en: 'Focus on details and patient perseverance.' } },
  10: { name: { zh: '自我行為',    en: 'Behavior of the Self'  }, center: 'g',      desc: { zh: '對自我的愛與堅持。',                  en: 'Love for oneself and persistence in self-expression.' } },
  11: { name: { zh: '想法',        en: 'Ideas'                 }, center: 'ajna',   desc: { zh: '靈感的接收與整理。',                  en: 'Receiving and organizing inspiration.' } },
  12: { name: { zh: '謹慎',        en: 'Caution'               }, center: 'throat', desc: { zh: '對的時機說出口的能力。',              en: 'The ability to speak at the right moment.' } },
  13: { name: { zh: '聆聽者',      en: 'The Listener'          }, center: 'g',      desc: { zh: '記憶他人故事的見證者。',              en: "The witness who holds others' stories in memory." } },
  14: { name: { zh: '富有的力量',  en: 'Power Skills'          }, center: 'sacral', desc: { zh: '透過工作累積資源的力量。',            en: 'The power to accumulate resources through work.' } },
  15: { name: { zh: '極端',        en: 'Extremes'              }, center: 'g',      desc: { zh: '對人類流動性的愛。',                  en: 'Love for the full range of human behavior.' } },
  16: { name: { zh: '熱忱',        en: 'Enthusiasm'            }, center: 'throat', desc: { zh: '透過練習達到精熟。',                  en: 'Achieving mastery through practice and enthusiasm.' } },
  17: { name: { zh: '意見',        en: 'Opinions'              }, center: 'ajna',   desc: { zh: '邏輯地觀察並提出論點。',              en: 'Logical observation and the formation of arguments.' } },
  18: { name: { zh: '修正',        en: 'Correction'            }, center: 'spleen', desc: { zh: '對不完美的敏銳挑剔。',                en: 'Keen sensitivity to imperfection and the drive to correct it.' } },
  19: { name: { zh: '需求',        en: 'Wanting'               }, center: 'root',   desc: { zh: '對基本需要的敏感雷達。',              en: 'A sensitive radar for fundamental needs.' } },
  20: { name: { zh: '當下',        en: 'The Now'               }, center: 'throat', desc: { zh: '此時此刻的展現。',                    en: 'Expression of this very present moment.' } },
  21: { name: { zh: '獵人',        en: 'The Hunter'            }, center: 'heart',  desc: { zh: '對領域與資源的控制。',                en: 'Control over territory and resources.' } },
  22: { name: { zh: '優雅',        en: 'Grace'                 }, center: 'solar',  desc: { zh: '情緒的開放表達。',                    en: 'Open and graceful expression of emotions.' } },
  23: { name: { zh: '同化',        en: 'Assimilation'          }, center: 'throat', desc: { zh: '在對的時刻說出洞見。',                en: 'Voicing insight at the right moment.' } },
  24: { name: { zh: '理性化',      en: 'Rationalization'       }, center: 'ajna',   desc: { zh: '反覆思索直至理解。',                  en: 'Returning again and again to a thought until understanding emerges.' } },
  25: { name: { zh: '自我精神',    en: 'Spirit of the Self'    }, center: 'g',      desc: { zh: '無條件之愛的純粹。',                  en: 'The purity of unconditional love.' } },
  26: { name: { zh: '利己主義者',  en: 'The Egoist'            }, center: 'heart',  desc: { zh: '說服與包裝的天賦。',                  en: 'The gift of persuasion and presentation.' } },
  27: { name: { zh: '照顧',        en: 'Caring'                }, center: 'sacral', desc: { zh: '對價值與生命的養育。',                en: 'Nurturing values and life itself.' } },
  28: { name: { zh: '玩家',        en: 'The Game Player'       }, center: 'spleen', desc: { zh: '為意義而冒險的本能。',                en: 'The instinct to take risks in pursuit of meaning.' } },
  29: { name: { zh: '說「是」',    en: 'Saying Yes'            }, center: 'sacral', desc: { zh: '承諾經驗的力量。',                    en: 'The power of committing to an experience.' } },
  30: { name: { zh: '感覺',        en: 'Feelings'              }, center: 'solar',  desc: { zh: '對體驗的渴望與火焰。',                en: 'The burning desire for and longing of experience.' } },
  31: { name: { zh: '影響力',      en: 'Influence'             }, center: 'throat', desc: { zh: '被選出的民主領袖之聲。',              en: 'The voice of the democratically chosen leader.' } },
  32: { name: { zh: '延續',        en: 'Continuity'            }, center: 'spleen', desc: { zh: '識別何者值得保留。',                  en: 'Recognizing what is worth preserving.' } },
  33: { name: { zh: '隱私',        en: 'Privacy'               }, center: 'throat', desc: { zh: '撤退中提煉故事。',                    en: 'Distilling stories through retreat.' } },
  34: { name: { zh: '力量',        en: 'Power'                 }, center: 'sacral', desc: { zh: '當下的純粹能量爆發。',                en: 'A pure burst of energy in the present moment.' } },
  35: { name: { zh: '改變',        en: 'Change'                }, center: 'throat', desc: { zh: '經歷一切的萬事通。',                  en: 'The jack-of-all-trades who seeks to experience everything.' } },
  36: { name: { zh: '危機',        en: 'Crisis'                }, center: 'solar',  desc: { zh: '透過新體驗成長。',                    en: 'Growing through new experiences and crisis.' } },
  37: { name: { zh: '友誼',        en: 'Friendship'            }, center: 'solar',  desc: { zh: '部落契約的溫柔。',                    en: 'The warmth of tribal bargains and bonds.' } },
  38: { name: { zh: '對抗',        en: 'The Fighter'           }, center: 'root',   desc: { zh: '為意義而戰的決心。',                  en: 'The determination to fight for what is meaningful.' } },
  39: { name: { zh: '挑釁',        en: 'Provocation'           }, center: 'root',   desc: { zh: '挑動情緒尋求清明。',                  en: 'Stirring emotions in search of clarity.' } },
  40: { name: { zh: '單獨',        en: 'Aloneness'             }, center: 'heart',  desc: { zh: '工作與獨處的平衡。',                  en: 'The balance between work and time alone.' } },
  41: { name: { zh: '收縮',        en: 'Contraction'           }, center: 'root',   desc: { zh: '想像所有可能性的起點。',              en: 'The starting point for imagining all possibilities.' } },
  42: { name: { zh: '成長',        en: 'Growth'                }, center: 'sacral', desc: { zh: '完成循環的能量。',                    en: 'The energy to complete a cycle.' } },
  43: { name: { zh: '洞察',        en: 'Insight'               }, center: 'ajna',   desc: { zh: '突如其來的個人理解。',                en: 'Sudden flashes of individual understanding.' } },
  44: { name: { zh: '警覺',        en: 'Alertness'             }, center: 'spleen', desc: { zh: '對人的記憶與直覺判斷。',              en: 'Memory of people and intuitive judgment of others.' } },
  45: { name: { zh: '聚集者',      en: 'The Gatherer'          }, center: 'throat', desc: { zh: '部落的君王與資源整合者。',            en: 'The tribal king and integrator of resources.' } },
  46: { name: { zh: '身體之愛',    en: 'Love of the Body'      }, center: 'g',      desc: { zh: '對身體經驗的決心。',                  en: 'Dedication to the experience of the body.' } },
  47: { name: { zh: '實現',        en: 'Realization'           }, center: 'ajna',   desc: { zh: '從混沌中提煉洞見。',                  en: 'Extracting insight from chaos.' } },
  48: { name: { zh: '深度',        en: 'Depth'                 }, center: 'spleen', desc: { zh: '才華的根源所在。',                    en: 'The source and foundation of deep talent.' } },
  49: { name: { zh: '原則',        en: 'Principles'            }, center: 'solar',  desc: { zh: '對部落契約的革命性敏感。',            en: 'Revolutionary sensitivity to tribal principles and contracts.' } },
  50: { name: { zh: '價值',        en: 'Values'                }, center: 'spleen', desc: { zh: '對部落價值的守護。',                  en: 'The custodian of tribal values and laws.' } },
  51: { name: { zh: '震驚',        en: 'Shock'                 }, center: 'heart',  desc: { zh: '透過震撼喚醒他人。',                  en: 'Awakening others through surprise and shock.' } },
  52: { name: { zh: '靜止',        en: 'Stillness'             }, center: 'root',   desc: { zh: '專注於當下任務的能量。',              en: 'The energy of stillness and focus on the task at hand.' } },
  53: { name: { zh: '開始',        en: 'Beginnings'            }, center: 'root',   desc: { zh: '啟動新週期的壓力。',                  en: 'The pressure that initiates new cycles.' } },
  54: { name: { zh: '野心',        en: 'Ambition'              }, center: 'root',   desc: { zh: '物質與精神向上的驅力。',              en: 'The drive to ascend materially and spiritually.' } },
  55: { name: { zh: '豐盛',        en: 'Abundance'             }, center: 'solar',  desc: { zh: '情緒的豐盛或匱乏感。',                en: 'The emotional sense of abundance or lack.' } },
  56: { name: { zh: '說故事的人',  en: 'Stimulation'           }, center: 'throat', desc: { zh: '透過故事激發他人。',                  en: 'Stimulating others through storytelling.' } },
  57: { name: { zh: '直覺',        en: 'Intuitive Clarity'     }, center: 'spleen', desc: { zh: '當下最深的直覺洞察。',                en: 'The deepest intuitive insight of the present moment.' } },
  58: { name: { zh: '生命力',      en: 'Vitality'              }, center: 'root',   desc: { zh: '對改善的喜悅。',                      en: 'The joy of improvement and vitality.' } },
  59: { name: { zh: '性',          en: 'Sexuality'             }, center: 'sacral', desc: { zh: '打破他人界線的繁衍力。',              en: 'The reproductive power to break down barriers between people.' } },
  60: { name: { zh: '限制',        en: 'Limitation'            }, center: 'root',   desc: { zh: '在限制中孕育突變。',                  en: 'Cultivating mutation within limitation.' } },
  61: { name: { zh: '內在真理',    en: 'Inner Truth'           }, center: 'head',   desc: { zh: '探究未知的神秘壓力。',                en: 'The mysterious pressure to explore the unknown.' } },
  62: { name: { zh: '細節',        en: 'Details'               }, center: 'throat', desc: { zh: '用語言精確命名。',                    en: 'Naming things precisely with language.' } },
  63: { name: { zh: '懷疑',        en: 'Doubt'                 }, center: 'head',   desc: { zh: '邏輯的起點：合理的懷疑。',            en: 'The logical starting point: reasonable doubt.' } },
  64: { name: { zh: '困惑',        en: 'Confusion'             }, center: 'head',   desc: { zh: '反思過去以拼湊意義。',                en: 'Reflecting on the past to piece together meaning.' } },
}

// Center descriptive data
export interface ChartCenter {
  id: string
  name: { zh: string; en: string }
  type: { zh: string; en: string }
  color: string
  summary: { zh: string; en: string }
  description: { zh: string; en: string }
  gates: number[]
  keywords: { zh: string[]; en: string[] }
}

export const HD_CENTERS_INFO: Record<string, ChartCenter> = {
  head: {
    id: 'head',
    name: { zh: '頂輪中心', en: 'Head Center' },
    type: { zh: '靈感中心', en: 'Pressure Center' },
    color: 'mustard',
    summary: { zh: '靈感、疑問與心智壓力的源頭。', en: 'The source of inspiration, questions, and mental pressure.' },
    description: { zh: '頂輪是創意與啟發的入口。它以「壓力」的形式向下推動 Ajna 去思考、去尋找答案。有定義的頂輪是穩定的靈感源；無定義的頂輪則容易被外界的問題與思緒佔據。', en: "The Head Center is the entry point for creativity and inspiration. It pushes the Ajna downward in the form of \"pressure\" to think and find answers. A defined Head provides a stable source of inspiration; an undefined Head is easily occupied by others' questions and thoughts." },
    gates: [64, 61, 63],
    keywords: { zh: ['靈感', '壓力', '提問', '想像'], en: ['Inspiration', 'Pressure', 'Questioning', 'Imagination'] },
  },
  ajna: {
    id: 'ajna',
    name: { zh: '邏輯中心', en: 'Ajna Center' },
    type: { zh: '覺察中心', en: 'Awareness Center' },
    color: 'olive',
    summary: { zh: '概念化、分析與意義建構的中樞。', en: 'The hub of conceptualization, analysis, and meaning-making.' },
    description: { zh: '邏輯中心將頂輪的靈感整理為思緒、概念與信念。有定義時思考方式固定且可信；無定義時則具備接收多元觀點的彈性，但容易陷入「我必須確定」的執念。', en: 'The Ajna organizes the Head\'s inspiration into thoughts, concepts, and beliefs. When defined, thinking patterns are consistent and reliable; when undefined, it can flexibly receive multiple perspectives but tends toward the obsession of "I must be certain."' },
    gates: [47, 24, 4, 17, 43, 11],
    keywords: { zh: ['思考', '理解', '概念', '心智'], en: ['Thinking', 'Understanding', 'Concepts', 'Mind'] },
  },
  throat: {
    id: 'throat',
    name: { zh: '喉嚨中心', en: 'Throat Center' },
    type: { zh: '表達 · 行動', en: 'Manifestation' },
    color: 'tan',
    summary: { zh: '把內在轉化為語言與行動的關鍵閘口。', en: 'The crucial gateway that transforms inner life into language and action.' },
    description: { zh: '喉嚨是所有顯化的出口。「說出來」與「做出來」皆由此發生。它必須被正確的能量（通過通道）連接，才能在對的時刻順利表達。', en: 'The Throat is the outlet for all manifestation. Both "saying it" and "doing it" happen here. It must be connected by the right energy (through channels) to express at the right moment.' },
    gates: [62, 23, 56, 35, 12, 45, 33, 8, 31, 7, 1, 13, 16, 20],
    keywords: { zh: ['表達', '顯化', '行動', '聲音'], en: ['Expression', 'Manifestation', 'Action', 'Voice'] },
  },
  g: {
    id: 'g',
    name: { zh: 'G 中心', en: 'Identity / G Center' },
    type: { zh: '身份與方向', en: 'Identity & Direction' },
    color: 'mustard',
    summary: { zh: '愛、方向與身份認同的羅盤。', en: 'The compass of love, direction, and identity.' },
    description: { zh: 'G 中心承載自我身份、人生方向與愛的座標。有定義者擁有恆定的自我感；無定義者像鏡子，會反映環境中的身份與方向，因此「在對的地方」格外關鍵。', en: 'The G Center carries the coordinates of self-identity, life direction, and love. Those with a defined G have a consistent sense of self; those with an undefined G reflect the identity and direction of their environment — making "being in the right place" especially critical.' },
    gates: [7, 1, 13, 25, 46, 2, 15, 10],
    keywords: { zh: ['方向', '愛', '身份', '磁場'], en: ['Direction', 'Love', 'Identity', 'Magnetic Field'] },
  },
  heart: {
    id: 'heart',
    name: { zh: '意志力中心', en: 'Heart / Will' },
    type: { zh: '能量中心', en: 'Motor Center' },
    color: 'crimson',
    summary: { zh: '意志、勇氣與承諾的小而強大引擎。', en: 'The small but powerful engine of willpower, courage, and commitment.' },
    description: { zh: '意志力中心驅動「我可以」的承諾。它運作的方式是「努力—休息」交替的脈動。有定義者能持續承諾；無定義者請避免向自己或他人證明價值。', en: 'The Heart Center drives the commitment of "I can." It operates in a cycle of effort and rest. Those with a defined Heart can sustain commitments; those with an undefined Heart should avoid proving their worth to themselves or others.' },
    gates: [21, 40, 26, 51],
    keywords: { zh: ['意志', '承諾', '價值', '勇氣'], en: ['Willpower', 'Commitment', 'Value', 'Courage'] },
  },
  spleen: {
    id: 'spleen',
    name: { zh: '直覺中心', en: 'Spleen' },
    type: { zh: '覺察中心 · 即時', en: 'Awareness · Intuitive' },
    color: 'tan',
    summary: { zh: '當下的直覺、健康與生存本能。', en: 'Present-moment intuition, health, and survival instinct.' },
    description: { zh: '直覺中心只在當下說一次話——細微、安靜、不重複。它監測健康、安全與品味。有定義時擁有可靠的本能；無定義時則對他人狀態極為敏感。', en: "The Spleen speaks only once in the present moment — subtle, quiet, non-repeating. It monitors health, safety, and taste. A defined Spleen provides reliable instincts; an undefined Spleen is highly sensitive to others' states." },
    gates: [48, 57, 44, 50, 32, 28, 18],
    keywords: { zh: ['直覺', '當下', '本能', '健康'], en: ['Intuition', 'Present', 'Instinct', 'Health'] },
  },
  sacral: {
    id: 'sacral',
    name: { zh: '薦骨中心', en: 'Sacral' },
    type: { zh: '能量中心', en: 'Motor Center' },
    color: 'crimson',
    summary: { zh: '生命力、工作力與回應的引擎。', en: 'The engine of life force, work capacity, and response.' },
    description: { zh: '薦骨是地球上最強大的可持續能量源。它只回應外界的提問，以「嗯哼」或「嗯—嗯」的本能聲音表達。生產者與顯示生產者由此運作。', en: 'The Sacral is the most powerful sustainable energy source on earth. It only responds to external questioning, expressing through instinctive sounds of "uh-huh" (yes) or "mm-mm" (no). Generators and Manifesting Generators operate from here.' },
    gates: [5, 14, 29, 59, 9, 3, 42, 27, 34],
    keywords: { zh: ['回應', '生命力', '工作', '繁衍'], en: ['Response', 'Life Force', 'Work', 'Reproduction'] },
  },
  solar: {
    id: 'solar',
    name: { zh: '情緒中心', en: 'Solar Plexus' },
    type: { zh: '能量中心 · 覺察', en: 'Motor · Awareness' },
    color: 'tan',
    summary: { zh: '情緒波動、敏感與情感真相之源。', en: 'The source of emotional waves, sensitivity, and emotional truth.' },
    description: { zh: '情緒中心以波的方式運作——高、低、中性。重要決策需等待「情緒清明」。它同時是情感覺察的所在，無定義者會放大他人的情緒。', en: 'The Solar Plexus operates in waves — high, low, neutral. Important decisions require waiting for "emotional clarity." It is also the seat of emotional awareness; those with an undefined Solar Plexus amplify others\' emotions.' },
    gates: [36, 22, 37, 6, 49, 55, 30],
    keywords: { zh: ['情緒', '波', '清明', '感受'], en: ['Emotions', 'Wave', 'Clarity', 'Feelings'] },
  },
  root: {
    id: 'root',
    name: { zh: '根部中心', en: 'Root' },
    type: { zh: '能量中心 · 壓力', en: 'Motor · Pressure' },
    color: 'tan',
    summary: { zh: '腎上腺式驅動與生存壓力的底座。', en: 'The foundation of adrenaline-driven momentum and survival pressure.' },
    description: { zh: '根部以「壓力」推動其他中心進入行動。它是燃料，也是節奏的起點。有定義時能在壓力下穩定運作；無定義時容易被「快點完成」的焦慮支配。', en: 'The Root pushes other centers into action through "pressure." It is fuel and the starting point of rhythm. A defined Root operates stably under pressure; an undefined Root easily falls under the anxiety of "hurry up and finish."' },
    gates: [53, 60, 52, 19, 39, 41, 58, 38, 54],
    keywords: { zh: ['壓力', '驅動', '節奏', '腎上腺'], en: ['Pressure', 'Drive', 'Rhythm', 'Adrenaline'] },
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
