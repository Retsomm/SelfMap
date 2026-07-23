// ── Editorial warm palette ── mirror the web's --paper / --ink theme ──────────
// 明色盤對應網頁版 :root，暗色盤對應網頁版 :root[data-theme="dark"]，
// 兩邊色票需保持同步（見 app/globals.css）

export type ThemeColors = {
  bg: string
  surface: string
  border: string
  text: string
  sub: string
  muted: string
  accent: string
  accentD: string
  red: string
  transit: string
  comp: string
  em: string
  compro: string
  dom: string
  gateBg: string
  gateBorder: string
  designRed: string
  planetRedText: string
  rowPressedBg: string
  overlay: string
  errorBg: string
  errorBorder: string
  transitDimBg: string
  compDimBg: string
  emDimBg: string
  comproDimBg: string
  domDimBg: string
  transitChipBg: string
  altRowBg: string
  transitWarmText: string
  successText: string
  successBg: string
}

export const lightColors: ThemeColors = {
  // backgrounds
  bg:      '#efe5d0',    // --paper
  surface: '#faf7f0',    // slightly lighter warm white for cards
  border:  '#c8b99a',    // warm border (ink at ~25% opacity on paper)

  // text
  text:    '#2b1f14',    // --ink
  sub:     '#6b5a44',    // --ink-soft
  muted:   '#9e8c78',    // lighter warm brown

  // accent  (web uses crimson as primary accent)
  accent:  '#c8553d',    // --crimson
  accentD: '#fce8e4',    // light crimson bg

  // semantic colours
  red:     '#c8553d',    // same as crimson
  transit: '#b89968',    // --tan   (flow / transit)
  comp:    '#a8c065',    // --olive (composite)
  em:      '#d9c25e',    // --mustard (electromagnetic)
  compro:  '#9e8c78',    // muted warm (compromise)
  dom:     '#6b5a44',    // ink-soft (dominance)

  // chart detail
  gateBg:        '#e7d9bd',   // --paper-deep
  gateBorder:    '#c9b89a',   // warm gate border
  designRed:     '#c8553d',   // same crimson for Design side
  planetRedText: '#d96a52',   // --crimson-2

  // interactive
  rowPressedBg: 'rgba(200,85,61,0.08)',  // crimson light press
  overlay:      'rgba(43,31,20,0.55)',   // ink overlay

  // error / status
  errorBg:     '#fce8e4',
  errorBorder: '#e8a090',

  // badge dim backgrounds
  transitDimBg:  '#f5ecd8',
  compDimBg:     '#eef3e4',
  emDimBg:       '#faf6e3',
  comproDimBg:   '#f0ede8',
  domDimBg:      '#f5f0e8',
  transitChipBg: '#f5ecd8',

  // table / list
  altRowBg: '#f7f0e5',

  // mobile-only：web 版沒有對應的流日暖色文字/共同閘門徽章功能，這裡不用同步 app/globals.css
  transitWarmText:        '#8a6832',

  // shared-gate badge（mobile-only，同上，web 沒有對應元件）
  successText: '#5a8a3c',
  successBg:   '#eef3e4',
}

export const darkColors: ThemeColors = {
  // backgrounds
  bg:      '#1c1712',    // --paper (dark)
  surface: '#241d16',    // card surface, one step up from bg
  border:  '#4a3d2e',    // warm dark border

  // text
  text:    '#ede3cf',    // --ink (dark)
  sub:     '#b7a688',    // --ink-soft (dark)
  muted:   '#8a7a63',    // de-emphasised warm tone

  // accent
  accent:  '#e17761',    // --crimson (dark)
  accentD: '#3a2420',    // dark crimson-tinted bg

  // semantic colours
  red:     '#e17761',
  transit: '#cbb086',    // --tan (dark)
  comp:    '#b9d17f',    // --olive (dark)
  em:      '#e8cf72',    // --mustard (dark)
  compro:  '#8a7a63',
  dom:     '#b7a688',

  // chart detail
  gateBg:        '#14100c',   // --paper-deep (dark)
  gateBorder:    '#4a3d2e',
  designRed:     '#e17761',
  planetRedText: '#ec8d78',   // --crimson-2 (dark)

  // interactive
  rowPressedBg: 'rgba(225,119,97,0.14)',
  overlay:      'rgba(0,0,0,0.55)',   // 遮罩固定深色，不隨主題翻轉

  // error / status
  errorBg:     '#3a2420',
  errorBorder: '#8a4a3a',

  // badge dim backgrounds
  transitDimBg:  '#2a2318',
  compDimBg:     '#22281c',
  emDimBg:       '#2c2718',
  comproDimBg:   '#26221c',
  domDimBg:      '#28231b',
  transitChipBg: '#2a2318',

  // table / list
  altRowBg: '#221c15',

  transitWarmText:        '#d4b483',

  // shared-gate badge
  successText: '#8fc26a',
  successBg:   '#212a1a',
}

export const Radius = {
  sm:  8,
  md:  10,
  lg:  14,
  xl:  16,
} as const

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 40,
} as const
