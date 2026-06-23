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
    rect: [300, 325, 100, 100],
    points: '300,325 400,325 400,425 300,425',
    gateAnchors: {
      62: [320, 325], 23: [350, 325], 56: [380, 325],
      35: [400, 345], 12: [400, 370], 45: [400, 400],
      16: [300, 348], 20: [300, 378],
      33: [332, 425], 31: [350, 425], 8: [368, 425],
    },
  },
  g: {
    shape: 'diamond',
    color: HD_PALETTE.mustard,
    points: '350,470 425,540 350,610 275,540',
    gateAnchors: {
      13: [332, 488], 7: [350, 478], 1: [368, 488],
      25: [410, 553],
      10: [288, 533],
      15: [332, 592], 2: [350, 600], 46: [368, 592],
    },
  },
  // 意志力中心 — "heart" in chart data, "ego" in lib types
  heart: {
    shape: 'tri-left',
    color: HD_PALETTE.crimson,
    points: '475,575 475,640 410,607',
    gateAnchors: {
      21: [472, 579],
      26: [415, 606],
      51: [438, 595],
      40: [472, 600],
    },
  },
  spleen: {
    shape: 'tri-right',
    color: HD_PALETTE.tan,
    points: '120,630 120,710 200,670',
    gateAnchors: {
      48: [140, 640],
      57: [160, 650],
      44: [195, 665],
      50: [184, 678],
      18: [164, 688],
      28: [148, 696],
      32: [132, 704],
    },
  },
  sacral: {
    shape: 'square',
    color: HD_PALETTE.crimson,
    rect: [300, 655, 100, 100],
    points: '300,655 400,655 400,755 300,755',
    gateAnchors: {
      5:  [330, 655], 14: [350, 655], 29: [370, 655],
      34: [300, 655], 27: [300, 710],
      59: [400, 700],
      42: [320, 755], 3: [350, 755], 9: [380, 755],
    },
  },
  // 情緒中心 — "solar" in chart data, "solarPlexus" in lib types
  solar: {
    shape: 'tri-left',
    color: HD_PALETTE.tan,
    points: '580,630 580,710 500,670',
    gateAnchors: {
      36: [568, 636],
      22: [544, 648],
      37: [520, 660],
      6:  [502, 669],
      49: [520, 680],
      55: [544, 692],
      30: [568, 704],
    },
  },
  root: {
    shape: 'square',
    color: HD_PALETTE.tan,
    rect: [300, 815, 100, 100],
    points: '300,815 400,815 400,915 300,915',
    gateAnchors: {
      58: [300, 828], 38: [300, 858], 54: [300, 888],
      53: [320, 815], 60: [350, 815], 52: [380, 815],
      19: [400, 828], 39: [400, 858], 41: [400, 888],
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
  { id: 'c64-47', from: 64, to: 47, name: { zh: '抽象思考通道', en: 'Abstract Thinking' }, desc: { zh: '你的邏輯思維很享受和深奧問題搏鬥，對哲學、歷史、意識這些「太虛」的東西感到真正有趣。你的頓悟通常在放鬆時出現——發呆的瞬間突然就通了；你幫別人解決問題的能力往往比解決自己問題的能力還強。',  en: 'The mental pattern of finding meaning in chaos. Distilling stories from past experiences.' } },
  { id: 'c61-24', from: 61, to: 24, name: { zh: '思想家通道',   en: 'The Thinker'    }, desc: { zh: '你的腦袋是一台永遠在轉的思考機器，想要把人生每一件事都搞清楚、都合理化。你的頓悟通常不在用力想的時候出現，而是放鬆的瞬間突然「叮」一聲就通了；你幫別人解決問題的能力往往比解決自己問題的能力還強。',              en: "The thinker's channel. A persistent curiosity about the unknown." } },
  { id: 'c63-4',  from: 63, to: 4,  name: { zh: '邏輯思考通道', en: 'The Logical Mind' }, desc: { zh: '你的腦袋是一台永遠關不掉的分析機器，天生就愛用邏輯拆解問題、推敲可能性。你幫別人解問題往往比解決自己的問題還順手，最重要的功課是在「認真分析」和「享受當下」之間找到平衡。',              en: 'The mental rhythm of doubt and answers. Requires time to verify.' } },
  { id: 'c17-62', from: 17, to: 62, name: { zh: '組織力通道',   en: 'The Organizer'  }, desc: { zh: '你天生善於把各種資訊、事實、細節整合在一起變成有說服力的論點，在需要策略、分析、說服人的場合特別能發揮。但你的腦袋不會停，要學會選擇時機，在真正想清楚且對方需要聽的時候再開口，影響力才能最大化。',              en: "The organizer's channel. Turning opinions into facts and details." } },
  { id: 'c43-23', from: 43, to: 23, name: { zh: '建構通道',     en: 'Structuring'    }, desc: { zh: '你腦袋裡有別人沒有的東西，洞見常常比周圍人超前好幾步，同樣一句話從你嘴裡說出來，有人覺得天才也有人困惑，差別在時機和對象對不對。在開口之前先問自己「現在是說這個的時機嗎？對方聽得進去嗎？」',                en: 'Genius or eccentric. Must be heard at the right moment.' } },
  { id: 'c11-56', from: 11, to: 56, name: { zh: '好奇心通道',   en: 'Curiosity'      }, desc: { zh: '你是個天生的故事收集者，對人和各種觀念感興趣，能把複雜的事情說得生動有趣，讓人聽完有「哦！原來是這樣」的感覺。要注意你分享的是觀點和詮釋，不是放諸四海皆準的真理，找到輕鬆分享但不強迫別人接受的平衡點。',          en: "The storyteller's channel. Turning ideas into stories that stimulate others." } },
  { id: 'c20-34', from: 20, to: 34, name: { zh: '忙碌通道',     en: 'Keeping Busy'   }, desc: { zh: '當你找到一件真心喜歡的事，你會整個人燃起來，精力充沛停不下來，旁邊的人光看著你就會被帶動。但不是每一件事都值得你去忙——你的能量是真正的資源，只為你愛的事忙才是這條通道最美的狀態。',                  en: 'The present-moment exhibitor. The power of being busy in the now.' } },
  { id: 'c34-57', from: 34, to: 57, name: { zh: '力量通道',     en: 'Power'          }, desc: { zh: '這條通道讓你天生精力充沛，在關鍵時刻反應特別快特別準，在危機處理上特別厲害。你很自然地想替人療傷解決問題，但要先照顧好自己才能照顧好別人，選擇值得你投入力量的人和事，全力以赴。',                    en: 'Archetypal existence. Perfect survival instinct.' } },
  { id: 'c20-57', from: 20, to: 57, name: { zh: '衝動通道',     en: 'Involuntary'    }, desc: { zh: '你有一種X光眼，能分辨一個人說的話是不是真心的、一個計畫方向對不對，而且你的話常常是不由自主蹦出來的直覺反應。要練習的不是壓住直覺，而是給直覺一個緩衝——感受到了先在心裡確認，這是說出來的時機嗎？',                        en: 'Intuitive insight in the present moment — instantaneous.' } },
  { id: 'c10-20', from: 10, to: 20, name: { zh: '覺醒通道',     en: 'Awakening'      }, desc: { zh: '你對「真不真實」有一種近乎本能的敏感，要求自己活得誠實有原則，這種處世態度讓身邊的人不自覺開始思考「我是不是也可以更做自己一點」。你只在乎當下，這種活在當下的能量是你給周圍人最大的禮物之一。',                              en: 'Authentic expression in the now — true to oneself.' } },
  { id: 'c10-34', from: 10, to: 34, name: { zh: '探索通道',     en: 'Exploration'    }, desc: { zh: '你就是要走自己的路，當你按照自己的感覺和直覺行動，你會感覺對了、有力量；但如果為了配合別人而偏離自己的方向，你會迷失。這條通道有個特別能量：當你真的活出自己的樣子，你身邊的人也會被感染，開始有勇氣去做自己。',            en: "Acting in accordance with one's own convictions." } },
  { id: 'c10-57', from: 10, to: 57, name: { zh: '生存力通道',   en: 'Survival'       }, desc: { zh: '你有一種很難用邏輯解釋的化險為夷能力，脾中心有一套超靈敏的生存雷達，在危險靠近之前就悄悄提醒你。你的直覺靠「聽起來對不對」來判斷，前提是你要願意相信它——壓住直覺，是你最可惜的事。',               en: "Intuition of one's own survival and self-expression." } },
  { id: 'c16-48', from: 16, to: 48, name: { zh: '才華通道',     en: 'Talent'         }, desc: { zh: '你對「把事情做好」有一種近乎執著的渴望，天生就有深度，有強烈的動力把自己的才華磨到極致。要小心的陷阱是變成永遠在「準備中」的人——才華需要被使用，不是被囤積，你已經比你以為的更有能力了。',                        en: 'Deep talent expressed through dedicated practice.' } },
  { id: 'c12-22', from: 12, to: 22, name: { zh: '開放通道',     en: 'Openness'       }, desc: { zh: '你情緒豐沛且充滿熱情，你的情緒場域有很強的感染力，你開心周圍人也輕鬆，你悶悶不樂整個空間氣氛也會跟著沉。要學會的不是壓下情緒，而是知道什麼時候適合跟人互動、什麼時候需要先給自己一點空間。',                            en: 'Graceful expression of social and emotional experience.' } },
  { id: 'c21-45', from: 21, to: 45, name: { zh: '金錢通道',     en: 'Money'          }, desc: { zh: '你對金錢和資源有天生的嗅覺，對怎麼讓資源流動這件事有很強的本能，喜歡掌控局面並讓資源發揮最大效益。照顧自己利益的同時也真心在意周圍人的需求，才能得到錢和人心；貪得無厭是這條通道最大的暗礁。',                          en: 'Control and management in the material world.' } },
  { id: 'c26-44', from: 26, to: 44, name: { zh: '進取通道',     en: 'Enterprise'     }, desc: { zh: '你有一種讓人願意買單的能力，不管是賣產品、推動計畫還是說服別人接受你的想法，你都有辦法讓對方覺得合理並支持你。你同時有商業嗅覺和化解衝突的社交天賦，幫助別人變好的同時也讓自己得到應得的，才是最能持續發光的模式。',                            en: 'Memory, transmission, and commercial instinct.' } },
  { id: 'c40-37', from: 40, to: 37, name: { zh: '社群通道',     en: 'Community'      }, desc: { zh: '你心目中理想的世界是大家像家人一樣彼此信任共同努力，你有凝聚力，當你在場一群人會開始有向心力和歸屬感。你對誠信有清楚的底線，說話不算話的人你無法忍受——你就像群體裡的黏著劑，讓大家聚在一起不散掉。',                            en: 'The tribal promise and emotional contract.' } },
  { id: 'c51-25', from: 51, to: 25, name: { zh: '開創通道',     en: 'Initiation'     }, desc: { zh: '你有一種擋不住的開拓精神，喜歡把自己和別人推進新的領域和可能性，第一個衝出去證明現況是可以被突破的。你對「無條件的愛」有很深的嚮往，是一種更大的、對所有人都開放的心靈層次的愛。',                en: 'Shock and awakening. Initiating others for a higher purpose.' } },
  { id: 'c2-14',  from: 2,  to: 14, name: { zh: '煉金士通道',   en: 'The Alchemist'  }, desc: { zh: '你有一種點石成金的本事，能把搖搖欲墜的爛攤子讓它重新站起來。你有強烈的個人節奏感和財務嗅覺，但要把能量放在真正值得的事上——當你全心投入和你頻率對的事，身邊的人都會被感染、跟著被帶動。',                            en: 'The helmsman of life direction and resources.' } },
  { id: 'c1-8',   from: 1,  to: 8,  name: { zh: '靈感通道',     en: 'Inspiration'    }, desc: { zh: '你天生就是那種走進房間讓人自然看過來的人，不是刻意表現，而是你身上有說不清楚的氣場——創意、自信與說話方式讓人不自覺想跟著你走。你的天賦在等待邀請後才能真正發光，等人來找你，才是你最省力也最有影響力的方式。',                        en: 'A model of creativity. The display of uniqueness.' } },
  { id: 'c13-33', from: 13, to: 33, name: { zh: '浪蕩子通道',   en: 'The Prodigal'   }, desc: { zh: '你是一個天生的故事收藏家，走過很多路看過很多事，每一段經歷都變成了你的智慧庫。你是個很好的傾聽者，讓人有「跟你說話很安全」的感覺；但要注意白天的事容易帶到睡眠裡，給自己多一點安靜的時間沉澱。',                          en: 'The witness. Carrying secrets and stories.' } },
  { id: 'c7-31',  from: 7,  to: 31, name: { zh: '首領通道',     en: 'The Alpha'      }, desc: { zh: '你不需要大聲宣告「我是老大」，人們就是會自動把你當成領頭的那個人，靠邏輯、方向感和讓人信任的氣質讓大家願意跟著你走。最理想的狀態是等人們真的認同你、主動邀請你來領導的時候再出手。',                      en: 'The future leader. Chosen, not self-appointed.' } },
  { id: 'c15-5',  from: 15, to: 5,  name: { zh: '韻律通道',     en: 'Rhythm'         }, desc: { zh: '你有一種天生的時間感，知道什麼時候該開始、什麼時候該等待，這感覺不是用腦袋算出來的，是從身體裡感受到的。當你真的進入自己的韻律，你總能在對的時間點出現在對的地方——你就像一條有生命力的河流，帶著身邊的人一起往前走。',                            en: 'Extremes and love within the rhythms of nature.' } },
  { id: 'c46-29', from: 46, to: 29, name: { zh: '發現通道',     en: 'Discovery'      }, desc: { zh: '你是那種先跳進去再說的人，而且神奇的是通常都成功了——你投入之後才慢慢搞清楚這件事的意義。但前提是要把這股能量放在對的事情上，每次承諾投入之前先讓直覺說話，一次只專注在一件真正對的事上。',                        en: 'The commitment that requires deep reflection before saying yes.' } },
  { id: 'c42-53', from: 42, to: 53, name: { zh: '循環通道',     en: 'Cycles'         }, desc: { zh: '你的人生是一本一本寫完再換下一本的書，成長和改變有週期——工作、感情、居住地、人生方向都會歷經完整的開始、過程和結束。要把心力投注在對的週期裡，在一開始選擇的時候讓直覺帶你選，你的薦骨能量會在你承諾之後把你固定住直到週期走完。',                            en: 'The energy of completing cycles and finding balance.' } },
  { id: 'c9-52',  from: 9,  to: 52, name: { zh: '專注力通道',   en: 'Concentration'  }, desc: { zh: '你一旦決定要做一件事，就會把所有心力都壓在上面直到做到位為止。你的能量像一匹蓄勢待發的馬，要等到資源到位、計畫完整才會放開韁繩——讓直覺帶你找到值得全力投入的事，然後就放心地專注下去。',                                en: 'The determination to focus on details.' } },
  { id: 'c3-60',  from: 3,  to: 60, name: { zh: '突變通道',     en: 'Mutation'       }, desc: { zh: '你的成長和改變常常是突然發生的——某一天睡一覺起來就覺得要換個方向，某個契機一出現整個人就開始大轉彎。這種飛躍式的變化是你前進的方式，當你卡關時，音樂和大自然是你最好的朋友，讓自己慢下來，給事情一點時間發酵。',                            en: 'Innovation arising from the energy within limitation.' } },
  { id: 'c27-50', from: 27, to: 50, name: { zh: '守護通道',     en: 'Preservation'   }, desc: { zh: '你天生就有照顧別人的本能，看到有需要的人會自然地想伸出手，願意把別人的需求放在自己前面。但你必須正視一個課題：你太容易忽略自己的需求——在伸出手幫助別人之前，先聽一下直覺：這個人、這件事，真的值得我投入嗎？',              en: 'Maintaining and nurturing values.' } },
  { id: 'c19-49', from: 19, to: 49, name: { zh: '敏感通道',     en: 'Sensitivity'    }, desc: { zh: '你對別人的感受靈敏得有點不可思議，光是你在場很多人就覺得安心，你有一種讓人感覺「被照顧到」的能力。但你太容易感受到別人的需求，卻很容易忘記自己也有需求——你要愛自己，才能持續愛別人。',                            en: 'Sensing needs and cultivating sensitivity.' } },
  { id: 'c39-55', from: 39, to: 55, name: { zh: '感性通道',     en: 'Emoting'        }, desc: { zh: '你的情緒從來不是淺嚐即止的那種，感受到的開心是真的很開心，感受到的難過也是真的很難過。你低潮的時候真的沒有人能替你開燈，只有你自己準備好了才會亮起來；音樂是你最好的朋友，而你最低潮的時候往往也是能創作出最觸動人心的東西的時候。',                                en: 'Emotional provocation and the fullness of feeling.' } },
  { id: 'c41-30', from: 41, to: 30, name: { zh: '夢想通道',     en: 'Recognition'    }, desc: { zh: '你心裡永遠裝著一個大夢想，使命感強，看事情的視角通常比周圍人更遠更寬，有辦法讓別人也看到那個藍圖和感受到那個熱情。用清明的情緒去追夢，找到真心認同你的人一起走，夢想才有辦法真正落地。',              en: 'The energy of feeling driving experience.' } },
  { id: 'c6-59',  from: 6,  to: 59, name: { zh: '親密通道',     en: 'Connecting'     }, desc: { zh: '你身上有一種天生的吸引力，讓你走進一個場合，人們就會被你吸引過來。這條通道的能量關於連結與創造，你有從無到有的創作力；但在感情上要讓情緒先沉澱，等心裡真的清明了再做決定——不要在情緒最高點的時候做選擇。',                            en: 'The energy of reproduction and breaking down barriers.' } },
  { id: 'c36-35', from: 36, to: 35, name: { zh: '萬事通通道',   en: 'Versatility'    }, desc: { zh: '你對新鮮感有一種停不下來的渴望，一件事做久了就開始想下一個，你就是需要不斷體驗不斷前進才覺得自己是活著的。你在乎的是過程不是結果，有帶頭體驗人生的本事，很多人跟在你後面才敢去試那些自己不敢試的事。',                            en: 'The jack-of-all-trades seeking all manner of experiences.' } },
  { id: 'c18-58', from: 18, to: 58, name: { zh: '評判通道',     en: 'Judgement'      }, desc: { zh: '你眼睛很利，什麼地方不對勁一眼就看出來，而且通常也知道怎麼解決，非常適合做顧問、評論、稽核這類型的工作。但要注意對家人朋友說出的「建議」，在對方耳裡很可能聽起來像「你哪裡不好」——把批判力用在值得改善的制度或系統上，效果最好。',                            en: 'The energy to challenge and improve the existing order.' } },
  { id: 'c28-38', from: 28, to: 38, name: { zh: '掙扎通道',     en: 'Struggle'       }, desc: { zh: '你有一種骨子裡的反骨，只要覺得某件事不公平或有人說這樣做不可能，你就會燃起鬥志。你的人生有點像一直在逆風走路，這種韌性是真正的天賦，最大的功課是學會分辨哪些值得堅持、哪些應該放手。',                                  en: 'Fighting for what is worth fighting for.' } },
  { id: 'c32-54', from: 32, to: 54, name: { zh: '轉化通道',     en: 'Transformation' }, desc: { zh: '你有強烈的想要往上走的驅動力，會主動尋找能幫助你成長的人和機會，對哪個計畫會成哪個不會成有很準的直覺感。但這股驅動力容易讓你變成工作狂——成功要帶著人一起走才能走得長遠。',                              en: 'Driving ambition and material ascent.' } },
]

// Gate descriptive data
export interface ChartGate {
  name: { zh: string; en: string }
  center: string  // chart center key (heart/solar, not ego/solarPlexus)
  desc: { zh: string; en: string }
}

export const HD_GATES: Record<number, ChartGate> = {
  1:  { name: { zh: '創意表達',          en: 'The Creative'          }, center: 'g',      desc: { zh: '你就是那種「我要做自己」說得最理直氣壯的人。你的想法、你的創意、你看世界的角度，就是你跟別人最不一樣的地方。別人可能不懂你在做什麼，但等到成果出來，大家才發現你早就走在前面了。\n你的功課：把創意真正活出來，而不只是停在腦袋裡想。',      en: 'The role of creativity: leading others through uniqueness.' } },
  2:  { name: { zh: '高我的方向感',      en: 'The Receptive'         }, center: 'g',      desc: { zh: '你是那種會莫名「知道」資源在哪、方向在哪的人，像是內建了一個隱形的 GPS。你不一定能解釋為什麼，但你就是感覺得到什麼東西是對的、什麼資源是該用上的。\n你的功課：信任你那個說不清楚的「感覺」，它通常是對的。',      en: 'Mastery of direction: knowing where you are headed.' } },
  3:  { name: { zh: '新開端',            en: 'Ordering'              }, center: 'sacral', desc: { zh: '你是那種最擅長把「爛攤子」整理好、重新開始的人。不管是一段新關係、新計畫還是新的人生階段，你都很懂得怎麼打底、建立基礎。但記住，種子種下去之後，得等它自己長，你急也急不來。\n你的功課：學會等待，把舊的怨氣先放下，新的東西才進得來。',        en: 'The mutative force that births new order from chaos.' } },
  4:  { name: { zh: '解題達人',          en: 'Formulization'         }, center: 'ajna',   desc: { zh: '你的腦袋就是一台停不下來的解題機器。朋友說個困擾，你馬上就有三個方案。但有時候，人家只是想找人聊聊，不一定真的要你出解法。\n你的功課：先問問「你需要我幫你想辦法，還是只是說說？」這一句話會讓你受益無窮。',        en: 'The youthful formula: proposing possible answers.' } },
  5:  { name: { zh: '等待時機',          en: 'Fixed Rhythms'         }, center: 'sacral', desc: { zh: '你跟宇宙的時鐘是同步的，只要你耐得住性子。你有一種天生的節奏感，什麼時候該動、什麼時候該等，你的身體其實都知道，只是你的腦袋常常想提早開跑。\n你的功課：建立一些固定的生活習慣，讓自己跟上那個自然的節奏，別催自己。',                en: 'The rhythm of waiting and the sense of ritual.' } },
  6:  { name: { zh: '親密關係的試金石',  en: 'Friction'              }, center: 'solar',  desc: { zh: '你對親密關係的嗅覺特別靈敏，你天生就在測試——這個人值不值得讓我靠近？不是故意要挑剔，只是你需要先確認「門」開不開，才願意真正走進去。\n你的功課：讓連結自然發生，不用硬闖，也不用躲。',                  en: 'The regulating gate of intimate relationships.' } },
  7:  { name: { zh: '指引方向',          en: 'The Role of Self'      }, center: 'g',      desc: { zh: '你身上有種領導的氣質，不是那種發號施令的，而是讓人「莫名就覺得跟著你沒問題」的那種。你能看到方向，也能帶大家往那走。但帶路不等於替人過生活，別忘了這個界線。\n你的功課：指出方向就好，讓別人自己走那條路。',                  en: 'Behind-the-scenes leadership and guidance.' } },
  8:  { name: { zh: '貢獻',              en: 'Contribution'          }, center: 'throat', desc: { zh: '你最怕閒著沒事做，一定要覺得自己有在貢獻什麼才踏實。你天生就是那種主動問「需要我幫忙嗎」的人，而且你的想法通常很有創意，幫了忙還能順帶帶動整個氣氛。\n你的功課：幫忙是你的天性，但記得「幫忙」跟「全部扛下來」是兩件事。',            en: 'Showing uniqueness and inviting others to join.' } },
  9:  { name: { zh: '細節控',            en: 'Focus'                 }, center: 'sacral', desc: { zh: '你是那種看合約會一行一行讀完的人，別人忽略的小細節，你都看得到。你不是在雞蛋裡挑骨頭，你只是真的覺得細節很重要——而且你通常是對的。\n你的功課：把你的細節力用在真正值得的事上，別為了不重要的小事鑽牛角尖。',                en: 'Focus on details and patient perseverance.' } },
  10: { name: { zh: '愛自己',            en: 'Behavior of the Self'  }, center: 'g',      desc: { zh: '你來這裡，就是要做個「愛自己」的活生生示範。當你真的活出自己的樣子，不演給別人看、不配合別人期待，你的存在本身就會讓周圍的人鬆動、有所啟發。\n你的功課：忠於自己，不要因為別人的眼光就改變你走路的姿態。',                  en: 'Love for oneself and persistence in self-expression.' } },
  11: { name: { zh: '各種點子的大富翁',  en: 'Ideas'                 }, center: 'ajna',   desc: { zh: '你的腦袋每天都有新想法進駐，而且這些想法都是為了讓大家更和諧、更好的那種。你對「一起比較好」這件事有天生的信仰，總是在想怎麼讓大家更團結。\n你的功課：想法很多很好，但先找到願意聽的人再分享，不然說得再精彩也白費。',                  en: 'Receiving and organizing inspiration.' } },
  12: { name: { zh: '謹慎發言',          en: 'Caution'               }, center: 'throat', desc: { zh: '你說話很謹慎，常常想了很久才開口。有時候別人等得有點焦，但你說出來的東西，通常都是仔細考慮過的，很有分量。你心裡其實有很多話，只是你要確定「現在說對嗎」。\n你的功課：找到感覺對的時機說話，別逼自己配合別人的節奏開口。',              en: 'The ability to speak at the right moment.' } },
  13: { name: { zh: '默默蒐集故事',      en: 'The Listener'          }, center: 'g',      desc: { zh: '你特別會聽人說話，而且是那種讓人「說著說著就把心裡話都講出來」的那種。你聽到的故事、秘密、人生經歷，在你這裡都被好好保存著，等待某天轉化成智慧。\n你的功課：聽別人說話是你的天賦，但也要有人聽你說，別把自己變成無底洞。',              en: "The witness who holds others' stories in memory." } },
  14: { name: { zh: '財富磁鐵',          en: 'Power Skills'          }, center: 'sacral', desc: { zh: '你身上有一種自然吸引資源的能量，不是說你天生財運好，而是你做事的方式很容易帶來豐盛的結果。重點是，你得把這些資源用對地方——用在你真正熱愛的事上面。\n你的功課：清楚自己真正想要什麼，財富才會流向對的方向。',            en: 'The power to accumulate resources through work.' } },
  15: { name: { zh: '擁抱各種人',        en: 'Extremes'              }, center: 'g',      desc: { zh: '你天生對「人跟人之間的差異」有一種很高的包容度。你可以和各種不同背景的人相處，而且很自然。你的存在讓周圍的人感覺「做自己是被允許的」。\n你的功課：你的日常節奏可能跟別人不一樣，接受這件事，別替自己覺得奇怪。',                  en: 'Love for the full range of human behavior.' } },
  16: { name: { zh: '熱情選手',          en: 'Enthusiasm'            }, center: 'throat', desc: { zh: '你有很強的鑑賞力，你能一眼看出什麼東西有潛力、什麼值得支持。而且你不只看，你還會大聲說出來，帶動大家一起燃起熱情。\n你的功課：你的熱情很有感染力，但注意別因為太投入就對別人期望過高。',                  en: 'Achieving mastery through practice and enthusiasm.' } },
  17: { name: { zh: '觀點大師',          en: 'Opinions'              }, center: 'ajna',   desc: { zh: '你的腦袋裡常常有很清晰的想法和意見，而且你能有條有理地說出來。你不只願意說，你也願意聽別人的反駁——因為你相信辯論是讓真相更清楚的方式。\n你的功課：有時候「我有個想法」比「我告訴你應該怎麼做」更容易讓人接受。',              en: 'Logical observation and the formation of arguments.' } },
  18: { name: { zh: '想把事情做更好',    en: 'Correction'            }, center: 'spleen', desc: { zh: '你天生就有一雙找問題的眼睛，不是要挑毛病，而是因為你相信「東西可以更好」。你對舊習慣、舊傳統很敏感，總是在想有沒有更進步的做法。\n你的功課：對自己寬容一點，你不用把每件事都修到完美，包括自己。',                en: 'Keen sensitivity to imperfection and the drive to correct it.' } },
  19: { name: { zh: '渴望連結',          en: 'Wanting'               }, center: 'root',   desc: { zh: '你需要被需要，也需要去需要別人。聽起來有點繞，但就是這樣——你的幸福感跟「歸屬感」高度相關。你比別人更早感受到周圍的人需要什麼，常常在對方說出口之前你就懂了。\n你的功課：照顧別人之前，先確認自己的需求有沒有被照顧到。',              en: 'A sensitive radar for fundamental needs.' } },
  20: { name: { zh: '活在當下',          en: 'The Now'               }, center: 'throat', desc: { zh: '你最真實的力量，來自你能不能完全活在「這一刻」。不帶著昨天的遺憾，不掛念明天的計畫，就是現在、此刻、這裡。聽起來簡單，但你知道這其實是最難的修煉。\n你的功課：少想一點過去和未來，把注意力收回到現在正在發生的事。',                    en: 'Expression of this very present moment.' } },
  21: { name: { zh: '掌控資源',          en: 'The Hunter'            }, center: 'heart',  desc: { zh: '你對「誰管什麼、怎麼管」這件事很在意，因為你天生就有管理資源、掌控局面的能力。你不是控制狂，你只是清楚知道事情要怎麼跑才順。\n你的功課：學習放手讓別人也有控制權，合作比單打獨鬥更長遠。',                en: 'Control over territory and resources.' } },
  22: { name: { zh: '優雅開口',          en: 'Grace'                 }, center: 'solar',  desc: { zh: '你說話有一種時機感，你不是那種隨時隨地都要發表意見的人。你等到對的時刻，用對的方式說，說出來的話就特別有分量、特別動人。\n你的功課：情緒好的時候才分享，情緒不對的時候先等等，效果會差很多。',                    en: 'Open and graceful expression of emotions.' } },
  23: { name: { zh: '說破舊觀念',        en: 'Assimilation'          }, center: 'throat', desc: { zh: '你說話常常讓人嚇一跳——不是因為你粗魯，而是你說的東西太直接、太新、太不按牌理出牌。你天生就是要打破舊思維、引進新觀念的那個人。\n你的功課：等到別人真的願意聽你說，再開口——你的話很有力，要用在對的時機。',                en: 'Voicing insight at the right moment.' } },
  24: { name: { zh: '反覆思考',          en: 'Rationalization'       }, center: 'ajna',   desc: { zh: '你的腦袋有個特別的模式：同一件事你會想很多次，從不同角度想、想到出現新答案為止。旁人可能覺得「好了啦你想太多」，但你就是需要這個過程。\n你的功課：接受自己就是這樣運作的，別為了「想太多」而自責。',                  en: 'Returning again and again to a thought until understanding emerges.' } },
  25: { name: { zh: '純粹之愛',          en: 'Spirit of the Self'    }, center: 'g',      desc: { zh: '你對生命有一種很純粹、很乾淨的愛——不是那種浪漫的愛，而是一種「萬物皆可被愛」的感覺。你不太計較，你相信每個人都值得被善待。\n你的功課：這份純粹的愛是你最珍貴的東西，好好保護它，別讓它被消耗殆盡。',                    en: 'The purity of unconditional love.' } },
  26: { name: { zh: '說服高手',          en: 'The Egoist'            }, center: 'heart',  desc: { zh: '你天生就知道怎麼讓人聽進去你說的話。你不是在耍手段，你只是真的很懂怎麼把一件事說得讓人安心、讓人覺得「好像真的是這樣耶」。\n你的功課：用這份說服力去做對的事，別讓它變成你騙自己的工具。',                  en: 'The gift of persuasion and presentation.' } },
  27: { name: { zh: '天生滋養者',        en: 'Caring'                }, center: 'sacral', desc: { zh: '你就是那種會在大家聚餐時自動多點一道菜、朋友難過時自動遞衛生紙的人。照顧別人對你來說很自然，幾乎是本能反應。\n你的功課：照顧人是你的天賦，但先照顧好自己，你才能持續給出這份溫暖。',                en: 'Nurturing values and life itself.' } },
  28: { name: { zh: '玩家',              en: 'The Game Player'       }, center: 'spleen', desc: { zh: '你把人生當成一場遊戲——不是說你不認真，而是你很清楚每場遊戲都有結束的那天，所以你想要活得盡興。你有種「來都來了，不如豁出去」的勇氣。\n你的功課：勇氣很好，但也要問問自己：這個冒險，有意義嗎？',                en: 'The instinct to take risks in pursuit of meaning.' } },
  29: { name: { zh: '什麼都說好',        en: 'Saying Yes'            }, center: 'sacral', desc: { zh: '你的嘴巴跟你的理智不一定同步，別人還沒說完你就點頭說「好」了。你喜歡投入、喜歡參與、喜歡承諾——但有時候這些「好」會把你累垮。\n你的功課：在說「好」之前，先停一秒問自己「我真的想做這件事嗎」。',                    en: 'The power of committing to an experience.' } },
  30: { name: { zh: '情感的深水區',      en: 'Feelings'              }, center: 'solar',  desc: { zh: '你對情緒的感受特別深刻，喜悅、渴望、失落——你都能感受到很完整。你不只是「有感覺」，你是那種會把感覺活得非常徹底的人。\n你的功課：感受力是你的禮物，別壓抑它，但也不用讓情緒把你淹沒。',                    en: 'The burning desire for and longing of experience.' } },
  31: { name: { zh: '天然領袖',          en: 'Influence'             }, center: 'throat', desc: { zh: '你說話就是有種讓人想聽的質感，不是因為你說話大聲，而是你說的東西有邏輯、有方向感，讓人覺得「跟著這個人感覺不會走偏」。\n你的功課：等到別人邀請你說話，效果會比你主動「我來告訴你們」好得多。',              en: 'The voice of the democratically chosen leader.' } },
  32: { name: { zh: '只投入長遠',        en: 'Continuity'            }, center: 'spleen', desc: { zh: '你是個非常重視「這能不能持久」的人。你不喜歡短暫的東西，不管是工作、感情還是投資，你都想確認「這能走多遠」再決定投不投入。\n你的功課：穩定是你的強項，但別讓「害怕失敗」變成你不敢嘗試新事物的理由。',                  en: 'Recognizing what is worth preserving.' } },
  33: { name: { zh: '收集故事的旅人',    en: 'Privacy'               }, center: 'throat', desc: { zh: '你就是那種「我曾經……」開頭講起來能講三個小時的人。你的人生經歷豐富，而且你特別懂得從這些經歷裡提煉出智慧。你需要定期從人群中抽身，閉關整理自己，然後再以更有力量的姿態回來。\n你的功課：知道什麼時候該退場休息，別把自己操壞了，充飽電才能繼續說好故事。',                  en: 'Distilling stories through retreat.' } },
  34: { name: { zh: '我靠自己',          en: 'Power'                 }, center: 'sacral', desc: { zh: '你身上有一種純粹的力量，不靠別人、完全從自己來的那種。你投入一件事的時候，爆發力驚人，存在感超強，整個場子的能量都會因為你的出現而提升。\n你的功課：這股力量很強大，別把它浪費在不值得的事情上，先確認方向對了再全力衝。',                    en: 'A pure burst of energy in the present moment.' } },
  35: { name: { zh: '什麼都想試試',      en: 'Change'                }, center: 'throat', desc: { zh: '你是天生的體驗主義者，你想把人生每種滋味都嚐一遍。工作、感情、旅行、生活方式——你都想親身感受，而不是只聽別人說。你的故事多、閱歷豐，是朋友圈裡最有話題的那個人。\n你的功課：體驗很好，但挑對時機再投入，期望越高的地方，失望也容易越大。',                  en: 'The jack-of-all-trades who seeks to experience everything.' } },
  36: { name: { zh: '情緒轉化大師',      en: 'Crisis'                }, center: 'solar',  desc: { zh: '你的人生不缺戲劇性，各種情緒高潮低潮你都經歷過。但正因為你走過那些坑，你才有能力幫別人找到出路。你是那種「我懂那種感覺」說出來最有說服力的人。\n你的功課：要從情緒裡走出來，而不是一直待在裡面。你的功能是引導，不是陪人一起困住。',                  en: 'Growing through new experiences and crisis.' } },
  37: { name: { zh: '家庭黏著劑',        en: 'Friendship'            }, center: 'solar',  desc: { zh: '你天生就是把大家凝聚在一起的那個人。一頓飯、一個擁抱、一個溫暖的眼神——你就是這樣把關係牢牢黏住的。對你來說，「大家好才是真的好」不是口號，是你真實的生活態度。\n你的功課：照顧別人是你的天賦，但先確認彼此的承諾是對等的，別讓自己一直付出卻換來理所當然。',                  en: 'The warmth of tribal bargains and bonds.' } },
  38: { name: { zh: '天生反骨',          en: 'The Fighter'           }, center: 'root',   desc: { zh: '你看到不公平、不合理的事情，就是會忍不住站出來說話。你天生對「強權」很敏感，有種為弱勢發聲的衝動。你的戰鬥力很強，但有時候也會不小心為了吵架而吵架。\n你的功課：選擇值得你戰鬥的戰場，不然可能花了一輩子精力，卻搞不清楚自己在為什麼而戰。',                  en: 'The determination to fight for what is meaningful.' } },
  39: { name: { zh: '天生愛挑釁',        en: 'Provocation'           }, center: 'root',   desc: { zh: '你的存在就會讓人「有反應」，不管你想不想。你喜歡試探、喜歡逗弄，看看能從別人那裡激發出什麼。你就像一根能讓人驚醒的棍子，戳對了地方，能讓沉睡的人活過來。\n你的功課：你的挑釁力道很猛，要懂得選時機，不然對方還沒被激活，就先被嚇跑了。',                  en: 'Stirring emotions in search of clarity.' } },
  40: { name: { zh: '做完事要放鬆',      en: 'Aloneness'             }, center: 'heart',  desc: { zh: '你意志力很強，答應的事一定做到，而且做得很好。但你同時也需要大量的獨處時間來恢復能量——不是因為你內向，而是你的電池就是這樣充的。\n你的功課：做完事、付出之後，要學會跟別人說「我需要一個人待一下」，這不是自私，這是必要。',                  en: 'The balance between work and time alone.' } },
  41: { name: { zh: '想像力超豐富',      en: 'Contraction'           }, center: 'root',   desc: { zh: '你的腦袋就是一部電影製作機，不斷產出各種畫面、故事和可能性。你的幻想超真實，有時候連你自己都會信以為真。你是那種能把普通的事情說得精彩萬分的人。\n你的功課：想像力是天賦，但要放在可以實現的目標上，別讓自己活在一個沒有出口的幻想世界裡。',              en: 'The starting point for imagining all possibilities.' } },
  42: { name: { zh: '有頭有尾',          en: 'Growth'                }, center: 'sacral', desc: { zh: '你相信「種什麼就收什麼」，所以你做事很認真，也很在意付出有沒有得到應有的回報。你特別擅長幫別人把事情做完整、做到收尾，是個很好的合作夥伴。\n你的功課：不要什麼都自己扛，量力而為，一次做好一件事比同時做很多件半吊子的事更有意義。',                  en: 'The energy to complete a cycle.' } },
  43: { name: { zh: '突然就懂了',        en: 'Insight'               }, center: 'ajna',   desc: { zh: '你的洞見很特別，常常是一種「突然就想通了」的感覺，說不清楚從哪來，但就是很確定。問題是你很清楚，但說出來別人不一定聽得懂，因為你想到的東西往往超前了大家一截。\n你的功課：等到對的時機再說出你的洞見，說早了沒人懂，說對了時機就會有人說「對！就是這樣！」',                en: 'Sudden flashes of individual understanding.' } },
  44: { name: { zh: '偵測趨勢的天線',    en: 'Alertness'             }, center: 'spleen', desc: { zh: '你對「模式」特別敏感——什麼事情在重複、什麼趨勢要來了、什麼行為背後有隱藏的問題——你都能聞出來。這個本能可以用在商業、人際關係，或是任何需要看出規律的地方。\n你的功課：你是個警報器，負責發出訊號，但不用每個警報都親自去處理，引導別人去行動就好。',              en: 'Memory of people and intuitive judgment of others.' } },
  45: { name: { zh: '帶領大家走向豐盛',  en: 'The Gatherer'          }, center: 'throat', desc: { zh: '你有一種自然的影響力，能帶著一群人朝同一個方向走。你關心大家有沒有足夠的資源、有沒有被照顧好，這不是管太多，這就是你天生的領導方式。\n你的功課：帶領是你的天賦，但要帶真正需要你帶的人，不是每個人都適合跟著你，也不是每個群體都值得你付出。',            en: 'The tribal king and integrator of resources.' } },
  46: { name: { zh: '運氣其實是準備好了',en: 'Love of the Body'      }, center: 'g',      desc: { zh: '你常常在「不對的時間找對的東西」，但最後都找到意外的好東西。這不是單純的好運，而是你的心態讓你隨時對美好的事物保持開放，機會才能進來。\n你的功課：放下執著，別執著一定要找到什麼，反而有時候放鬆了，更好的東西自己就來了。',              en: 'Dedication to the experience of the body.' } },
  47: { name: { zh: '答案會自己來',      en: 'Realization'           }, center: 'ajna',   desc: { zh: '你的腦袋裡常常有很多還沒解開的謎題，那種「想了很久、還沒想通」的感覺你很熟悉。但有意思的是，你的答案常常不是「想」出來的，而是在某個放鬆的瞬間突然就出現了。\n你的功課：不要強迫自己想出答案，放輕鬆，靈感通常在你不刻意追的時候才會來找你。',                  en: 'Extracting insight from chaos.' } },
  48: { name: { zh: '深不見底的智慧之井',en: 'Depth'                 }, center: 'spleen', desc: { zh: '你是個有深度的人，你對事情的理解常常比別人深很多層。人們喜歡來找你，因為你能提供別處找不到的洞見。但你有時候會擔心自己「懂的不夠多」——其實你的深度已經夠了。\n你的功課：停止等到「準備好了」再分享，你現在知道的，就已經是別人需要的了。',                  en: 'The source and foundation of deep talent.' } },
  49: { name: { zh: '堅守底線的改革者',  en: 'Principles'            }, center: 'solar',  desc: { zh: '你對「對的事情」很有感覺，一旦感覺不對，你說「不」的速度比誰都快。你不是在挑剔，你只是有明確的人道主義原則，不符合的你就是沒辦法接受。\n你的功課：你的底線是值得尊重的，但偶爾也要問自己——是真的不對，還是還沒到你想要的那樣？',              en: 'Revolutionary sensitivity to tribal principles and contracts.' } },
  50: { name: { zh: '價值觀的守護者',    en: 'Values'                }, center: 'spleen', desc: { zh: '你對「什麼是對的、什麼是重要的」有非常強烈的感受，而且你希望自己做的每一件事都和這些價值觀一致。公平、誠信、對大家好——這些不是你掛在嘴上說的，是你活出來的。\n你的功課：別讓外界的期待把你的責任感壓垮，你不用扛起所有人的道德重量。',              en: 'The custodian of tribal values and laws.' } },
  51: { name: { zh: '給人驚嚇',          en: 'Shock'                 }, center: 'heart',  desc: { zh: '你的言行有時會讓人大吃一驚，但往往就是這個「驚嚇」讓人清醒過來，開始改變。你就是那種說出一句話讓全場安靜、然後大家開始認真思考的人。\n你的功課：電光石火的能量很強，選好時機用，效果最大，不然嚇到的人還沒醒，關係就先破裂了。',                  en: 'Awakening others through surprise and shock.' } },
  52: { name: { zh: '安靜如山',          en: 'Stillness'             }, center: 'root',   desc: { zh: '就算外面再亂，你有一種能讓自己靜下來的能力，像一座山一樣——不動如山那種。這種安定感讓周圍的人光是靠近你，就覺得踏實很多。\n你的功課：你的靜也需要空間，找到讓你真正能做喜歡的事、進入心流狀態的方式，那才是你最充電的時刻。',                  en: 'The energy of stillness and focus on the task at hand.' } },
  53: { name: { zh: '永遠在起跑線上',    en: 'Beginnings'            }, center: 'root',   desc: { zh: '你最擅長「開始」，任何新計畫、新嘗試、新連結，你都能帶起一股新鮮的能量推動大家起頭。但起頭之後要維持下去，對你來說就比較困難了——這沒什麼問題，起跑本來就是一種天賦。\n你的功課：接受自己是「開端型」的人，找到能接力的夥伴，你負責點火，別人負責燒下去。',                  en: 'The pressure that initiates new cycles.' } },
  54: { name: { zh: '野心勃勃',          en: 'Ambition'              }, center: 'root',   desc: { zh: '你有很強烈的「想往上走」的欲望——不只是物質上，心靈上、社會地位上也一樣。你擅長建立有用的連結、尋找能幫助你前進的盟友，而且你清楚知道欲望本身就是你最大的動力。\n你的功課：野心是好的，但不要同時追太多目標，有時候貪多嚼不爛，先把眼前一件事做好更重要。',                  en: 'The drive to ascend materially and spiritually.' } },
  55: { name: { zh: '情緒豐盛的靈魂',    en: 'Abundance'             }, center: 'solar',  desc: { zh: '你的情緒世界非常飽滿，高興起來可以整個人都在發光，低落的時候也是低到讓旁人擔心。這兩種狀態都是真實的你，而且你的創造力往往在情緒最深的時候，迸發出最亮的光。\n你的功課：尊重自己的情緒起伏，找到你自己的節奏，音樂、獨處都是你最好的朋友。',                  en: 'The emotional sense of abundance or lack.' } },
  56: { name: { zh: '說故事',            en: 'Stimulation'           }, center: 'throat', desc: { zh: '你有一種把生活中的細節說成有趣故事的天賦，你對人生意義的觀察很獨到，說出來的東西常常讓人會心一笑、又覺得有點道理。你是人群裡最有趣的那個講者。\n你的功課：你分享的是觀點，不是真理，別要求大家都認同你，讓對的人自然被你吸引就好。',                  en: 'Stimulating others through storytelling.' } },
  57: { name: { zh: '瞬間直覺',          en: 'Intuitive Clarity'     }, center: 'spleen', desc: { zh: '你有一種很細膩的直覺，就像一陣風悄悄告訴你「這不太對」或「這個人可以信任」。這份直覺很真實，只是你有時候不確定要不要相信它。\n你的功課：相信那個第一秒的感覺，它通常比你想了三天之後的結論更準。',                  en: 'The deepest intuitive insight of the present moment.' } },
  58: { name: { zh: '天生充電寶',        en: 'Vitality'              }, center: 'root',   desc: { zh: '你的活力和對生命的熱情是真實的，不是裝出來的。你就是那種走進房間，整個氣氛都會亮起來的人。你相信事情可以更好，這份相信本身就已經讓旁邊的人感覺好多了。\n你的功課：不是每個場合都需要你的能量，選擇你真心想投入的地方，別把自己散得到處都是。',                  en: 'The joy of improvement and vitality.' } },
  59: { name: { zh: '建立親密連結',      en: 'Sexuality'             }, center: 'sacral', desc: { zh: '你天生會發出某種「靠近我吧」的訊號，讓人感覺想跟你親近。不管是工作上的合作還是私下的感情，你都有能力迅速拉近距離、打破隔閡。\n你的功課：親密感是你的天賦，但讓連結自然發生，不要每次都主動出擊，等對方也準備好了再走近。',                  en: 'The reproductive power to break down barriers between people.' } },
  60: { name: { zh: '在限制裡找出路',    en: 'Limitation'            }, center: 'root',   desc: { zh: '你比任何人都懂得「就這樣」的生活哲學——不是認命，而是你有本事把手上的牌打到最好。你不跟現實硬幹，你找縫隙、找可能，在規則裡找到屬於自己的空間。\n你的功課：接受「有些限制無法突破」這件事，反而能讓你把能量用在真正可以改變的地方。',                  en: 'Cultivating mutation within limitation.' } },
  61: { name: { zh: '熱愛思考宇宙謎題',  en: 'Inner Truth'           }, center: 'head',   desc: { zh: '「為什麼」是你最常問的問題。你對生命的意義、宇宙的運作方式、人存在的原因，充滿了好奇。你的頭腦喜歡去那些大部分人懶得想的地方探索。\n你的功課：真理不是靠不斷追問「想」出來的，有時候放空、放鬆，答案反而會自己冒出來找你。',                en: 'The mysterious pressure to explore the unknown.' } },
  62: { name: { zh: '把複雜說清楚',      en: 'Details'               }, center: 'throat', desc: { zh: '你最厲害的地方，就是能把很複雜的東西整理成清楚、有條理的資訊，讓別人一聽就懂。你重視細節、重視事實，說話有根有據，很有說服力。\n你的功課：細節固然重要，但有時候說太多會讓人抓不到重點，試著先說結論，再補細節。',                  en: 'Naming things precisely with language.' } },
  63: { name: { zh: '懷疑一切',          en: 'Doubt'                 }, center: 'head',   desc: { zh: '你是天生的質疑者，「這樣真的對嗎？」「有沒有更好的辦法？」是你腦袋裡常常跑出來的問題。你不是故意難搞，你只是習慣先懷疑，確認沒問題之後才放心。\n你的功課：懷疑是好工具，但別讓它變成你什麼都無法相信的障礙，有些事可以先試了再確認。',                  en: 'The logical starting point: reasonable doubt.' } },
  64: { name: { zh: '腦子裡永遠有很多畫面',en: 'Confusion'           }, center: 'head',   desc: { zh: '你的頭腦就像一個不停播放的電影院，各種畫面、可能性、想法輪番上陣。你常常感覺靈感來了，但又說不清楚它意味著什麼。沒關係，你的工作不是把它全部解開，而是成為那個在混沌裡保持好奇的人。\n你的功課：接受腦袋不一定能理解所有的事，讓內在的指引來帶路，而不是讓腦袋一直轉。',            en: 'Reflecting on the past to piece together meaning.' } },
}

// Center descriptive data
export interface ChartCenter {
  id: string
  name: { zh: string; en: string }
  type: { zh: string; en: string }
  color: string
  summary: { zh: string; en: string }
  description: { zh: string; en: string }
  definedContent: { zh: string; en: string }
  openContent: { zh: string; en: string }
  gates: number[]
  keywords: { zh: string[]; en: string[] }
}

export const HD_CENTERS_INFO: Record<string, ChartCenter> = {
  head: {
    id: 'head',
    name: { zh: '頭腦中心', en: 'Head Center' },
    type: { zh: '靈感中心', en: 'Pressure Center' },
    color: 'mustard',
    summary: { zh: '靈感的接收天線，驅動你不斷追問的壓力源頭。', en: 'The source of inspiration, questions, and mental pressure.' },
    description: { zh: '頭頂中心在人類圖的最頂端，是靈感的來源地。它就像一根天線，負責從外頭接收靈感和各種「突然想通了！」的瞬間。真理、懷疑、天馬行空的念頭，都是從這裡冒出來的。', en: 'The Head Center sits at the top and acts like an antenna, receiving inspiration, sudden insights, and existential questions. It pushes the Ajna downward with pressure to think and find answers.' },
    definedContent: { zh: '你是個靈感製造機！腦袋裡永遠在轉，想法一個接一個，而且你有辦法啟發身邊的人一起動腦。不過要小心——想法太多，有時候會讓自己壓力爆表，甚至覺得要把每個靈感都實現才行。其實不是每個靈感都值得追，學會篩選，才是真正厲害的地方。', en: 'You are an inspiration machine — ideas constantly flow in. You have the ability to spark curiosity in others. But watch out: too many ideas can become overwhelming pressure. Not every inspiration needs to be pursued; learning to filter is your real superpower.' },
    openContent: { zh: '你對各種想法都很開放，走進哪個圈子就能被那個環境啟發，博物館、電影院、跟聰明人喝咖啡，都能讓你靈感大爆發。但這也是個小陷阱——你可能會不小心把別人的問題當成自己的在煩惱，忙了半天，解決的其實是別人的人生課題。下次腦袋轉不停的時候，先問問自己：「這是我的問題，還是我在替別人煩惱？」', en: "You are highly open to all kinds of ideas. Any environment can spark inspiration in you. But the trap is absorbing others' questions and worrying about problems that aren't yours. When your mind won't stop, ask: \"Is this my question, or am I solving someone else's life?\"" },
    gates: [64, 61, 63],
    keywords: { zh: ['靈感', '壓力', '提問', '想像'], en: ['Inspiration', 'Pressure', 'Questioning', 'Imagination'] },
  },
  ajna: {
    id: 'ajna',
    name: { zh: '邏輯中心', en: 'Ajna Center' },
    type: { zh: '覺察中心', en: 'Awareness Center' },
    color: 'olive',
    summary: { zh: '分析、思考與概念建構的腦袋運作中樞。', en: 'The hub of conceptualization, analysis, and meaning-making.' },
    description: { zh: '邏輯中心負責把接收到的靈感不斷過濾、消化、拆解，試著搞清楚「這到底是什麼意思」。邏輯中心就是「腦袋轉不停」的來源地，過去、現在、未來都想串在一起。', en: 'The Ajna organizes inspiration into thoughts, concepts, and beliefs. It constantly filters, digests, and deconstructs incoming information, trying to make sense of everything.' },
    definedContent: { zh: '你有固定的思考模式，做事條理分明，很適合做需要動腦的工作。但問題是，你的腦袋幾乎沒有休息的時候，甚至會拿一些根本還沒發生的事來煩惱——「萬一這樣怎麼辦？萬一那樣又怎麼辦？」那些事還沒發生耶。試試靜坐或冥想，讓腦袋稍微喘口氣，你會更清醒。', en: 'You have consistent thinking patterns and work methodically. But your brain almost never fully shuts off — you worry about things that haven\'t happened yet. Try meditation to give your mind breathing room. You\'ll think even more clearly when you do.' },
    openContent: { zh: '你比較沒有固定的思考框架，反而能看到更多可能性，常常讓別人驚訝：「你怎麼知道我在想什麼！」這是你的超能力，因為你很能感受別人的思維。但也因為太開放，容易分心、健忘，記事本真的很重要。（愛因斯坦也是邏輯中心開放，所以你在很好的同伴裡。）', en: "You have no fixed thinking framework, which lets you see more possibilities. Others often wonder how you know what they're thinking — that's your gift. But this openness can make you scattered and forgetful. A notebook is your best friend." },
    gates: [47, 24, 4, 17, 43, 11],
    keywords: { zh: ['思考', '理解', '概念', '邏輯'], en: ['Thinking', 'Understanding', 'Concepts', 'Logic'] },
  },
  throat: {
    id: 'throat',
    name: { zh: '喉嚨中心', en: 'Throat Center' },
    type: { zh: '表達 · 行動', en: 'Manifestation' },
    color: 'tan',
    summary: { zh: '說出來、做出來——把內在轉化為語言與行動的出口。', en: 'The crucial gateway that transforms inner life into language and action.' },
    description: { zh: '喉嚨中心是整個人類圖裡的「表達樞紐」。所有中心最終都想透過這裡發聲——不管是你的想法、情緒、還是行動力，都想借喉嚨說出來、表現出來。', en: 'The Throat is the central hub of expression in Human Design. Every center ultimately wants to speak through it — whether thoughts, emotions, or actions, all seek to be voiced and manifested here.' },
    definedContent: { zh: '你表達能力很穩定，有自己的節奏和風格。你很會說故事，也很適合領導、教學、或任何需要「讓人聽進去」的工作。不過要注意，你的喉嚨像個出口，很多話想說出去，有時候可能說得太多反而失去重點。', en: 'Your expression is consistent — you have your own rhythm and style. You are great at storytelling and suited for leadership or teaching. Just watch out for saying too much and losing the point.' },
    openContent: { zh: '你不是不會講話，而是需要對的氛圍和對象。一旦碰到有定義的人，話匣子可能就開了，而且停不下來！但要留意：有時候話說出口，前後可能不太一致，因為你的表達方式很受當下的人和環境影響。這不是你的問題，這是你的設計。', en: "You speak best with the right people in the right atmosphere. With a defined-Throat person nearby, you might not be able to stop talking. Just know: your expression shifts with your environment — inconsistency isn't a flaw, it's your design." },
    gates: [62, 23, 56, 35, 12, 45, 33, 8, 31, 16, 20],
    keywords: { zh: ['表達', '顯化', '行動', '聲音'], en: ['Expression', 'Manifestation', 'Action', 'Voice'] },
  },
  g: {
    id: 'g',
    name: { zh: 'G 中心', en: 'Identity / G Center' },
    type: { zh: '身份與方向', en: 'Identity & Direction' },
    color: 'mustard',
    summary: { zh: '身份認同、人生方向與愛的內在羅盤。', en: 'The compass of love, direction, and identity.' },
    description: { zh: '自我定位中心是關於「我是誰」以及「我要往哪裡去」的中心。愛的能量、方向感、跟靈性的連結，都在這裡。它是一個菱形，位在人類圖的中間偏上方。', en: 'The G Center is about "who am I" and "where am I going." Love, direction, and spiritual connection all live here. It is the diamond-shaped center in the upper-middle of the bodygraph.' },
    definedContent: { zh: '你很清楚自己是誰，目標感強，不容易被旁人帶偏。你的人生方向很穩定，而且一旦找到自己的路，就能走得非常堅定。唯一要注意的是，你可能太想幫別人指路，結果自己分心了。', en: 'You know who you are and have a strong sense of direction. Once you find your path, you walk it with conviction. Just watch out for getting so focused on guiding others that you lose your own focus.' },
    openContent: { zh: '你非常有彈性，能適應不同的人和環境，有很強的同理心。但也因為沒有固定的「自我方向感」，容易受身邊的人影響。如果跟到一個很有方向感的夥伴，你會跟著一起飛；但如果身邊都是迷路的人，你可能也會跟著打轉。慎選你的圈子，真的很重要。', en: 'You are highly adaptable with strong empathy. But without a fixed sense of direction, you absorb the identity and direction of those around you. With a grounded partner you soar; with lost ones you drift. Choosing your environment and circle is essential.' },
    gates: [7, 1, 13, 25, 46, 2, 15, 10],
    keywords: { zh: ['方向', '愛', '身份', '磁場'], en: ['Direction', 'Love', 'Identity', 'Magnetic Field'] },
  },
  heart: {
    id: 'heart',
    name: { zh: '意志力中心', en: 'Heart / Will' },
    type: { zh: '能量中心', en: 'Motor Center' },
    color: 'crimson',
    summary: { zh: '意志力、承諾與物質追求的驅動引擎。', en: 'The small but powerful engine of willpower, courage, and commitment.' },
    description: { zh: '心臟中心負責的是意志力和自我意識，也和物質世界的追求有關——財富、名望、成就感，都是這裡在驅動。', en: 'The Heart Center is about willpower, self-worth, and the drive for material achievement — wealth, recognition, and accomplishment all originate here.' },
    definedContent: { zh: '你意志力超強，一旦決定要做，很少有人攔得住你。你天生就有一股「我就是要搞定它」的氣場，讓人信服。但也要學著讓自己「放鬆一下」，因為你很容易親力親為，而且對別人的效率沒耐心，很想自己來。慢下來，讓別人有追上你的機會。', en: "Once you decide to do something, almost nothing stops you. You carry a compelling \"I will get it done\" energy. But learn to rest — you tend to do everything yourself and have little patience for others' pace. Slow down and let others catch up." },
    openContent: { zh: '大部分的人都是這樣！意志力不是你的強項，這不代表你沒能力，只是你做事可能比較難持之以恆。最大的陷阱是：很容易被身邊意志力強的人「激勵」，然後跟著做一些超出自己負荷的承諾，最後搞得很累又後悔。記得，你不需要證明什麼。', en: "Most people have an open Heart. Sustained willpower isn't your strength — and that's fine. The trap is getting swept up by someone else's drive and over-committing. You have nothing to prove to anyone." },
    gates: [21, 40, 26, 51],
    keywords: { zh: ['意志', '承諾', '價值', '勇氣'], en: ['Willpower', 'Commitment', 'Value', 'Courage'] },
  },
  spleen: {
    id: 'spleen',
    name: { zh: '脾中心', en: 'Spleen' },
    type: { zh: '覺察中心 · 即時', en: 'Awareness · Intuitive' },
    color: 'tan',
    summary: { zh: '瞬時的生存直覺、健康本能與安全感偵測器。', en: 'Present-moment intuition, health, and survival instinct.' },
    description: { zh: '脾中心是生存本能的中心，它像一套內建雷達，隨時在掃描周圍的環境，幫你判斷哪些東西安不安全、對不對勁。它不靠邏輯，純粹靠本能，反應極快。', en: "The Spleen is the center of survival instinct — a built-in radar constantly scanning the environment for what's safe and what isn't. It operates purely on instinct, not logic, and reacts in an instant." },
    definedContent: { zh: '你有很強的直覺力，而且那個直覺幾乎都是對的——只是它只說一次，不重複。你走進一家餐廳，可能瞬間就知道今天要不要留下來；見到一個人，幾秒內就有感覺。這個警報器很珍貴，要相信它。你身體的免疫系統通常也比較強。', en: 'Your intuition is strong and reliable — it just speaks once and never repeats. You can walk into a place and instantly know whether to stay. This inner alarm is precious. Trust it. Your immune system tends to be robust too.' },
    openContent: { zh: '你容易被別人的恐懼或不安感染，有時候會莫名地緊張，其實那不是你的感受，是你吸收了旁邊的人。你對靈性的感應力很敏銳，但也因為沒有穩定的「內建雷達」，對某些情況的判斷會比較猶豫。對外來刺激可能也比較敏感，可以留意這一點。', en: "You easily absorb others' fears and anxieties — that vague unease you feel is often not yours. You're highly sensitive to spiritual and energetic states. Without a stable built-in radar, you may hesitate in some judgments. You may also be more sensitive to external stimuli." },
    gates: [48, 57, 44, 50, 32, 28, 18],
    keywords: { zh: ['直覺', '當下', '本能', '健康'], en: ['Intuition', 'Present', 'Instinct', 'Health'] },
  },
  sacral: {
    id: 'sacral',
    name: { zh: '薦骨中心', en: 'Sacral' },
    type: { zh: '能量中心', en: 'Motor Center' },
    color: 'crimson',
    summary: { zh: '生命力、創造力與持續工作能量的引擎。', en: 'The engine of life force, work capacity, and response.' },
    description: { zh: '薦骨中心大約有70%的人是有定義的，是人類圖裡最重要的能量來源之一，也是「生產者」類型的核心。它像一台發電機，給你源源不絕的動力去做、去創造。', en: 'About 70% of people have a defined Sacral. It is one of the most powerful energy sources in Human Design and the core of the Generator type — a generator that gives you endless motivation to do and create.' },
    definedContent: { zh: '你就是那種能把事情做完的人，不管是工作還是生活，都有用不完的勁。你的直覺反應也很可靠——當薦骨說「好」，你會感覺到內心有股力量往前推；當它說「不」，你會莫名覺得哪裡怪怪的。學會聽這個信號，是你這輩子最值得學的功課。', en: 'You are someone who gets things done — in work and life, your energy seems endless. Your gut response is highly reliable: a "yes" feels like a push forward; a "no" feels subtly off. Learning to listen to this signal is your most important life skill.' },
    openContent: { zh: '你的能量有點像手機電池，不像別人那樣可以一直充電一直用。你更適合短跑而不是馬拉松，工作的方式建議不要硬撐，懂得找人幫忙、分工合作才是王道。你的厲害在於：你可以客觀地看出別人能量用在哪裡最值，然後幫大家導流。', en: "Your energy is more like a phone battery than a power plant — finite, not sustainable all day. You're built for sprints, not marathons. Learning to delegate and collaborate is your wisdom. Your gift: you can objectively see where others' energy is best spent." },
    gates: [5, 14, 29, 59, 9, 3, 42, 27, 34],
    keywords: { zh: ['回應', '生命力', '工作', '繁衍'], en: ['Response', 'Life Force', 'Work', 'Reproduction'] },
  },
  solar: {
    id: 'solar',
    name: { zh: '情緒中心', en: 'Solar Plexus' },
    type: { zh: '能量中心 · 覺察', en: 'Motor · Awareness' },
    color: 'tan',
    summary: { zh: '情緒波動、感受敏銳與情感清明的能量中心。', en: 'The source of emotional waves, sensitivity, and emotional truth.' },
    description: { zh: '情緒中心是九大中心裡影響力最大的一個，它像海浪一樣，有高有低，不停起伏。它同時是「覺察中心」也是「動力中心」，情緒不只是感受，它還有推動力。', en: 'The Solar Plexus is the most influential of the nine centers. Like ocean waves, it rises and falls constantly. It is both an awareness center and a motor — emotions are not just feelings, they carry driving force.' },
    definedContent: { zh: '你的情緒就像浪潮，一波接一波。你常常上一秒開心到飛起來，下一秒又不知道為什麼低落。這不是你的毛病，這是你的設計。最重要的原則就是：情緒高漲的時候，不要做重大決定。等浪潮平靜下來再說，你的判斷才會清晰。你的情緒也有很強的感染力，你開心的話周圍的人都會跟著輕鬆，你悶的話整個空間的氣氛也會跟著沉。', en: 'Your emotions move like tides. One moment soaring, next moment inexplicably low — this is your design, not a flaw. The golden rule: never make important decisions when emotions are high. Wait for the wave to settle. Your emotional state is highly contagious; when you\'re light, others lift too.' },
    openContent: { zh: '你不是沒感情，只是你的情緒大多來自「吸收」了別人的感受。獨處的時候，你通常很平靜；一旦進入人群，你可能馬上被旁邊那個人的焦慮或興奮給帶走。學著區分「這是我的情緒，還是別人的？」是你的必修課。', en: "You're not emotionless — you just tend to absorb others' feelings. Alone, you're usually calm. In a crowd, you quickly catch whoever's anxiety or excitement is nearby. Learning to ask \"Is this my emotion or someone else's?\" is your essential practice." },
    gates: [36, 22, 37, 6, 49, 55, 30],
    keywords: { zh: ['情緒', '波', '清明', '感受'], en: ['Emotions', 'Wave', 'Clarity', 'Feelings'] },
  },
  root: {
    id: 'root',
    name: { zh: '根部中心', en: 'Root' },
    type: { zh: '能量中心 · 壓力', en: 'Motor · Pressure' },
    color: 'tan',
    summary: { zh: '腎上腺素驅動的行動壓力與生存節奏。', en: 'The foundation of adrenaline-driven momentum and survival pressure.' },
    description: { zh: '根中心在人類圖最下方，是壓力中心之一，它儲存的是腎上腺素，讓你有動力去「動起來」、去面對截止日期、去完成事情。', en: 'The Root Center sits at the bottom of the bodygraph. It is a pressure center that stores adrenaline — driving you to act, meet deadlines, and get things done.' },
    definedContent: { zh: '你是那種「壓力越大、越有勁」的人，天生就能在混亂中找到節奏。就算身邊一片兵荒馬亂，你還是能穩穩處理。但要小心的是，你容易腎上腺素飆高就衝進去，有時候沒評估清楚就行動，反而造成失衡。你腳下可能一直在打節拍，那是腎上腺素在叫你動的信號。', en: "You thrive under pressure — the more chaotic, the more grounded you feel. You can handle a crisis others would flee from. But watch out: adrenaline rushes can push you into action before you've fully assessed the situation. That restless energy in your legs? That's your signal to move." },
    openContent: { zh: '你一個人的時候很放鬆，什麼事都不能逼你；但一旦有人施壓、趕截止日期，你就容易被推著走，然後壓力大到喘不過氣。你做事的節奏是「等到感覺對了才動」，旁人可能覺得你在拖，但其實那就是你的方式。對自己好一點，別讓別人的急迫感變成你的壓力。', en: "Alone, you're completely at ease. But add external pressure or a deadline and you can quickly get swept into overwhelm. Your natural rhythm is \"move when it feels right.\" Others may see this as procrastination — but it's your design. Don't let others' urgency become your stress." },
    gates: [53, 60, 52, 19, 39, 41, 58, 38, 54],
    keywords: { zh: ['壓力', '驅動', '節奏', '腎上腺'], en: ['Pressure', 'Drive', 'Rhythm', 'Adrenaline'] },
  },
}

// Legend items for the left column
export const LEGEND_ITEMS = [
  { id: 'head',   cls: 'tri-up',    color: '#d9c25e', cn: '頭腦',   en: 'Head',         code: 'I' },
  { id: 'ajna',   cls: 'tri-down',  color: '#a8c065', cn: '邏輯',   en: 'Ajna',         code: 'II' },
  { id: 'throat', cls: 'square',    color: '#b89968', cn: '喉嚨',   en: 'Throat',       code: 'III' },
  { id: 'g',      cls: 'diamond',   color: '#d9c25e', cn: 'G 中心', en: 'Identity',     code: 'IV' },
  { id: 'heart',  cls: 'tri-left',  color: '#c8553d', cn: '意志力', en: 'Will',         code: 'V' },
  { id: 'spleen', cls: 'tri-right', color: '#b89968', cn: '直覺',   en: 'Spleen',       code: 'VI' },
  { id: 'sacral', cls: 'square',    color: '#c8553d', cn: '薦骨',   en: 'Sacral',       code: 'VII' },
  { id: 'solar',  cls: 'tri-left',  color: '#b89968', cn: '情緒',   en: 'Solar Plexus', code: 'VIII' },
  { id: 'root',   cls: 'square',    color: '#b89968', cn: '根部',   en: 'Root',         code: 'IX' },
]
