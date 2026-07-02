'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'

export type Lang = 'zh'
export type LangDict = Record<string, unknown>

const CHINESE_FALLBACKS: Record<string, string> = {
  'nav.home': '首頁',
  'nav.humanDesign': '人類圖',
  'nav.about': '關於',
  'nav.openMenu': '開啟選單',
  'nav.navLabel': '導覽選單',
  'nav.closeMenu': '關閉選單',
  'nav.account': '帳號',
  'nav.signIn': '登入',
  'home.loadFromProfile': '從個人檔案載入',
  'home.inputLabel': '輸入資料',
  'home.dateLabel': '日期',
  'home.timeLabel': '時間',
  'home.locationLabel': '地點',
  'home.locationPlaceholder': '搜尋城市或地點',
  'home.locationSearchFailed': '地點搜尋失敗（狀態 {status}）',
  'home.locationNetworkError': '地點搜尋網路異常',
  'home.calculationError': '計算失敗，請稍後再試',
  'home.compositeError': '合圖計算失敗，請稍後再試',
  'home.compositeCalculating': '合圖計算中…',
  'home.compositeCalculate': '開始合圖',
  'home.generate': '生成人類圖',
  'home.loading': '載入中…',
  'home.calculating': '計算中…',
  'home.compositePersonA': '人物 A',
  'home.compositePersonB': '人物 B',
  'about.eyebrow': '關於 SelfMap',
  'about.heading': '把人類圖的複雜結構，變成一個能被看見、被理解、被使用的工具。',
  'about.whatTitle': '這是什麼',
  'about.whatBody': 'SelfMap 讓你把出生資料轉成清楚的人類圖分析，從九大中心、閘門、通道到輪迴交叉，一步一步幫你看見自己。',
  'about.techTitle': '技術與設計',
  'about.techBody': '我們使用 Swiss Ephemeris 與即時計算引擎，將複雜的天體與身體圖關係整理成可讀的視覺與文字摘要。',
  'about.privacyTitle': '隱私與資料',
  'about.privacyBody': '你的出生資料與圖表僅用於計算與呈現，帳號資料會妥善保管，並且可由你自行管理。',
  'about.contactTitle': '聯絡與合作',
  'about.contactBody': '若你對這個專案有任何想法、回饋或合作機會，歡迎透過網站聯絡我們。',
  'about.disclaimerTitle': '免責聲明',
  'about.disclaimerBody': '人類圖是一種自我探索與反思工具，提供的資訊僅供參考，不代表任何醫療或心理診斷。',
  'chart.annotations.head': '頭',
  'chart.annotations.ajna': '阿賈那',
  'chart.annotations.throat': '喉輪',
  'chart.annotations.g': 'G',
  'chart.annotations.ego': '自我',
  'chart.annotations.spleen': '脾',
  'chart.annotations.sacral': '薦骨',
  'chart.annotations.solarPlexus': '太陽神經叢',
  'chart.annotations.root': '根',
  'chart.designLabel': '設計',
  'chart.personalityLabel': '人格',
  'chart.gateIndex': '閘門索引',
  'chart.birthDate': '出生日期',
  'chart.birthTime': '出生時間',
  'chart.birthLocation': '出生地點',
  'chart.timezone': '時區',
  'chart.generatedAt': '生成時間',
  'chart.results': '分析結果',
  'chart.bodygraphAnalysis': '身體圖分析',
  'chart.typeCard': '類型',
  'chart.strategy': '策略',
  'chart.positive': '正面',
  'chart.negative': '負面',
  'chart.profileCard': '配置',
  'chart.authorityCard': '權威',
  'chart.definitionCard': '定義',
  'chart.crossCard': '輪迴交叉',
  'chart.variablesCard': '變數',
  'chart.digestion': '消化',
  'chart.environment': '環境',
  'chart.perspective': '視角',
  'chart.motivation': '動機',
  'chart.centersTitle': '九大中心',
  'chart.defined': '已定義',
  'chart.open': '開放',
  'chart.channelsTitle': '通道',
  'chart.noChannels': '目前尚未形成任何通道',
  'chart.downloading': '下載中…',
  'chart.download': '下載圖表',
  'chart.downloadSignIn': '先登入再下載',
  'chart.copied': '已複製',
  'chart.copyPrompt': '複製分析提示',
  'chart.copyPromptSignIn': '先登入再複製',
  'chart.saveChart': '儲存圖表',
  'chart.saveChartSignIn': '先登入再儲存',
  'chart.downloadFailed': '下載失敗',
  'chart.chartSaved': '圖表已儲存',
  'chart.saveFailed': '儲存失敗',
  'chart.definedCenters': '{count} 個已定義中心',
  'chart.close': '關閉',
  'composite.personA': '人物 A',
  'composite.personB': '人物 B',
  'composite.noConnections': '目前尚無連結動態',
  'composite.title': '合圖分析',
  'composite.subtitle': '兩張圖的整合關係',
  'composite.integrationTitle': '整合主題',
  'composite.definedCenters': '{count} 個已定義中心',
  'composite.openCenters': '{count} 個開放中心',
  'composite.loveLabel': '愛與關係',
  'composite.workLabel': '工作與成長',
  'composite.connectionTitle': '連結動態',
  'composite.electromagnetic': '電磁力',
  'composite.electromagneticDesc': '兩人間的吸引與衝突節點',
  'composite.companionship': '同伴關係',
  'composite.companionshipDesc': '彼此支持與陪伴的方式',
  'composite.compromise': '妥協與協調',
  'composite.compromiseDesc': '如何在不同節奏與需求中找到平衡',
  'composite.dominance': '主導與掌控',
  'composite.dominanceDesc': '誰更容易主導節奏與方向',
  'composite.compositeChannelsTitle': '合圖形成的通道',
  'composite.profileResonanceTitle': '配置共鳴',
  'composite.profileResonanceNone': '目前沒有明顯的配置共鳴',
  'composite.authorityTitle': '權威互動',
  'composite.authorityA': 'A 的權威',
  'composite.authorityB': 'B 的權威',
  'composite.downloading': '下載中…',
  'composite.download': '下載合圖',
  'composite.downloadSignIn': '先登入再下載',
  'composite.copied': '已複製',
  'composite.copyPrompt': '複製合圖提示',
  'composite.copyPromptSignIn': '先登入再複製',
  'composite.saveCharts': '儲存合圖',
  'composite.saveChartsSignIn': '先登入再儲存',
  'composite.copyFailed': '複製失敗',
  'composite.chartsSaved': '合圖已儲存',
  'composite.saveFailed': '合圖儲存失敗',
  'composite.theme9_0_label': '九加零',
  'composite.theme8_1_label': '八加一',
  'composite.theme7_2_label': '七加二',
  'composite.theme6_3_label': '六加三',
  'composite.line1': '第一線',
  'composite.line1Desc': '這是你在關係中最自然的表達方式。',
  'composite.line2': '第二線',
  'composite.line2Desc': '這是你在關係中需要穩定與支持的方式。',
  'composite.line3': '第三線',
  'composite.line3Desc': '這是你在關係中帶來創新與試探的方式。',
  'composite.line4': '第四線',
  'composite.line4Desc': '這是你在關係中建立安全與秩序的方式。',
  'composite.line5': '第五線',
  'composite.line5Desc': '這是你在關係中展現自由與洞察的方式。',
  'composite.line6': '第六線',
  'composite.line6Desc': '這是你在關係中整合與學習的方式。',
  'drawer.centerKicker': '中心',
  'drawer.description': '說明',
  'drawer.definedCenter': '已定義中心',
  'drawer.openCenter': '開放中心',
  'drawer.keywords': '關鍵字',
  'drawer.gates': '閘門',
  'drawer.gateKicker': '閘門',
  'drawer.in': '位於',
  'drawer.locatedIn': '位於',
  'drawer.reference': '參考',
  'drawer.channelKicker': '通道',
  'drawer.connects': '連接',
  'drawer.integrationKicker': '整合',
  'drawer.integrationTitle': '整合通道',
  'drawer.integrationSub': '四條整合通道',
  'drawer.integrationLead': '這些通道代表你整體的整合力量與表達方式。',
  'drawer.fourChannels': '四條主要通道',
  'drawer.gatesInvolved': '涉及閘門',
  'drawer.note': '備註',
  'drawer.integrationNote': '這些整合通道會影響你的整體節奏與表達方式。',
  'drawer.typeKicker': '類型',
  'drawer.keyTraits': '關鍵特質',
  'drawer.profileKicker': '配置',
  'drawer.authorityKicker': '權威',
  'drawer.definitionKicker': '定義',
  'drawer.crossKicker': '交叉',
  'drawer.crossGateNotFound': '沒有找到對應的交叉閘門內容。',
  'drawer.crossNotFound': '沒有找到對應的交叉內容。',
  'drawer.close': '關閉',
  'account.profile': '個人資料',
  'account.humanDesign': '人類圖',
  'account.connectedAccounts': '連結帳號',
  'account.signOut': '登出',
  'account.changeAvatar': '更換頭像',
  'account.noImage': '無頭像',
  'account.uploading': '上傳中…',
  'account.change': '更換',
  'account.edit': '編輯',
  'account.displayNamePlaceholder': '輸入顯示名稱',
  'account.saving': '儲存中…',
  'account.save': '儲存',
  'account.cancel': '取消',
  'account.noCharts': '目前沒有已儲存的人類圖',
  'account.goCalculate': '前往計算',
  'account.editChartTitle': '編輯圖表名稱',
  'account.deleteChart': '刪除圖表',
  'account.computing': '正在計算…',
  'account.noConnected': '尚未連結任何第三方帳號',
  'account.nameUpdated': '名稱已更新',
  'account.saveFailed': '儲存失敗',
  'account.imageTooLarge': '圖片大小不能超過 10MB',
  'account.avatarUpdated': '頭像已更新',
  'account.avatarUploadFailed': '頭像上傳失敗',
  'account.calcFailed': '計算失敗',
  'account.deleteChartConfirmTitle': '確認刪除',
  'account.deleteChartConfirm': '刪除',
  'account.deleteChartConfirmMessage': '確定要刪除此圖表嗎？',
  'account.birthProfiles': '出生檔案',
  'account.addBirthProfile': '新增出生檔案',
  'account.noBirthProfiles': '尚無出生檔案',
  'account.birthProfileLabelPlaceholder': '為此檔案命名',
  'account.birthProfileSaved': '出生檔案已儲存',
  'account.birthProfileSaveFailed': '出生檔案儲存失敗',
  'account.birthProfileDeleted': '出生檔案已刪除',
  'account.birthProfileDeleteFailed': '出生檔案刪除失敗',
  'account.deleteProfileConfirmMessage': '確定要刪除此出生檔案嗎？',
}

const get = (obj: LangDict, path: string): string => {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return path
    cur = (cur as LangDict)[p]
  }
  return typeof cur === 'string' ? cur : path
}

export type LangObj<T> = { zh: T; en: T }

const LangContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  pick: <T>(obj: LangObj<T> | T) => T
}>({
  lang: 'zh',
  setLang: () => {},
  t: (key) => key,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pick: (obj) => (typeof obj === 'object' && obj !== null && 'zh' in obj ? (obj as any).zh : obj) as never,
})

export const LanguageProvider = ({
  children,
  initialLang = 'zh',
  initialDict,
}: {
  children: ReactNode
  initialLang?: Lang
  initialDict: LangDict
}) => {
  useEffect(() => {
    document.documentElement.lang = 'zh-TW'
  }, [])

  const setLang = () => {}

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const base = CHINESE_FALLBACKS[key] ?? get(initialDict, key) ?? key
    let str = base
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v))
      }
    }
    return str
  }

  const pick = <T,>(obj: LangObj<T> | T): T => {
    if (typeof obj === 'object' && obj !== null && 'zh' in obj) {
      return (obj as LangObj<T>).zh
    }
    return obj as T
  }

  return (
    <LangContext.Provider value={{ lang: initialLang, setLang, t, pick }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
