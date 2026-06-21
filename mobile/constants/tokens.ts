// ── Editorial warm palette ── mirror the web's --paper / --ink theme ──────────

export const Colors = {
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

  // transit analysis highlight
  transitHighlightBg:     '#fdf3e5',
  transitHighlightBorder: '#b89968',
  transitWarmText:        '#8a6832',

  // shared-gate badge
  successText: '#5a8a3c',
  successBg:   '#eef3e4',
} as const

export type ThemeColors = typeof Colors

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
