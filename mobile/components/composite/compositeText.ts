import { type ThemeColors } from '@/constants/tokens'

/**
 * 合圖分析的文案／配色──儲存前的計算結果（CompositeView.tsx）與儲存後的
 * 圖表詳情（CompositeInfo.tsx）共用同一份，避免兩邊各自維護造成內容或配色不一致。
 */

export type ConnectionKind = 'electromagnetic' | 'companionship' | 'compromise' | 'dominance'

export const CONN_LABEL: Record<ConnectionKind, string> = {
  electromagnetic: '電磁關係 (Electromagnetic)',
  companionship:   '陪伴關係 (Companionship)',
  compromise:      '妥協關係 (Compromise)',
  dominance:       '支配關係 (Dominance)',
}

export const CONN_DESC: Record<ConnectionKind, string> = {
  electromagnetic: '互補吸引 — 一方有 A 閘門，另一方有 B 閘門，合力激活完整通道。最經典的「致命吸引力」，容易一見鍾情但也容易相愛相殺。',
  companionship:   '默契安全 — 兩人擁有相同的閘門或通道，相處起來最不費力，如靈魂伴侶或老朋友。',
  compromise:      '關係摩擦源 — 一方擁有完整通道，另一方只有其中一個閘門，長期易累積委屈與不平衡感。',
  dominance:       '單向引導 — 一方在某條通道有能量，另一方完全開放，空白的那方會單向受到能量制約。',
}

/** 四種連結動力的顏色——直接沿用 app 既有主題色票，確保跟其他畫面（含明暗主題）一致 */
export function connColors(Colors: ThemeColors): Record<ConnectionKind, { color: string; bg: string }> {
  return {
    electromagnetic: { color: Colors.em,     bg: Colors.emDimBg },
    companionship:   { color: Colors.comp,   bg: Colors.compDimBg },
    compromise:      { color: Colors.compro, bg: Colors.comproDimBg },
    dominance:       { color: Colors.dom,    bg: Colors.domDimBg },
  }
}

export const INTEGRATION_THEME: Record<string, { label: string; love: string; work: string }> = {
  '9+0': {
    label: '全滿（9+0）— Nowhere to go',
    love: '極度甜蜜與黏人。能量場完全自給自足，外人很難融入。兩人會深深沉浸在彼此的世界中，但也容易因為缺乏外在刺激而感到窒息或過度封閉。',
    work: '過於封閉。團隊內部可能非常有默契，但極易忽略外部市場的變化或同事、客戶的客觀意見。',
  },
  '8+1': {
    label: '8+1 — Have some fun',
    love: '最舒服的互動模式。彼此有足夠的能量連結，同時留有「空白」作為陽光照進來的窗口。雙方擁有各自呼吸與消化的空間，關係健康且長久。',
    work: '黃金搭檔。既有共同努力的交集，又有一起去體驗、探索外部世界的窗口。',
  },
  '7+2': {
    label: '7+2 — Work to do',
    love: '最舒服的互動模式之一。保有兩個空白中心，彼此連結同時仍有足夠的獨立呼吸空間，長期相處不易窒息。',
    work: '黃金搭檔。既有共同努力的交集，又有兩扇開放的窗口迎接外在刺激與機會。',
  },
  '6+3+': {
    label: '6+3+ — Better to be free',
    love: '連結感較淡。兩人在一起時仍有太多未定因素，容易流於平淡或像朋友。通常需要藉由共同的興趣、小孩或外在媒介來維繫緊密感。',
    work: '適合團隊合作。保持高度的獨立性與自由度，不會對彼此造成過度制約，適合鬆散型的專案合作或大團隊中的平行分工。',
  },
}

export const PROFILE_RESONANCE_DESC: Record<number, { title: string; desc: string }> = {
  1: { title: '1 爻共鳴', desc: '兩人都需要足夠的安全感與底層研究，能深深理解彼此打基礎的必要。' },
  2: { title: '2 爻共鳴', desc: '兩人都需要獨處與等待被呼喚的空間，彼此能體諒對方的隱士特質。' },
  3: { title: '3 爻共鳴', desc: '兩人都能理解試錯與碰撞的學習過程，不會因為失敗而互相責備。' },
  4: { title: '4 爻共鳴', desc: '兩人都重視人脈與穩定的社群，能在圈子建設上形成默契。' },
  5: { title: '5 爻共鳴', desc: '兩人都帶有被投射的特質，需要互相留意實際的期待落差。' },
  6: { title: '6 爻共鳴', desc: '兩人都有長遠的人生週期觀，能理解彼此不同階段的冷靜與退後。' },
}
