import {
  HD_WHEEL_OFFSET,
  GATE_SEQUENCE,
  GATE_TO_CROSS_GROUP,
  CROSS_GROUPS,
  CROSS_BASE_NAMES,
} from './constants'
import type { GateAndLine, PlanetGateResult, ProfileResult, CrossType, IncarnationCross } from './types'

const GATE_SIZE  = 360 / 64          // 5.625°
const LINE_SIZE  = GATE_SIZE / 6     // 0.9375°
const COLOR_SIZE = LINE_SIZE / 6     // 0.15625°
const TONE_SIZE  = COLOR_SIZE / 6    // ≈0.026042°
const BASE_SIZE  = TONE_SIZE / 5     // ≈0.005208°

export const degreeToGateAndLine = (degree: number): GateAndLine => {
  if (!Number.isFinite(degree)) {
    throw new Error(`Invalid longitude: expected finite degree in [0,360), got ${degree}`)
  }
  const normalized   = ((degree - HD_WHEEL_OFFSET) % 360 + 360) % 360
  const slot         = Math.floor(normalized / GATE_SIZE)
  const gate         = GATE_SEQUENCE[slot]
  const gateOffset   = normalized % GATE_SIZE
  const line         = Math.floor(gateOffset / LINE_SIZE) + 1
  const lineOffset   = gateOffset % LINE_SIZE
  const color        = Math.floor(lineOffset / COLOR_SIZE) + 1
  const colorOffset  = lineOffset % COLOR_SIZE
  const tone         = Math.floor(colorOffset / TONE_SIZE) + 1
  const toneOffset   = colorOffset % TONE_SIZE
  const base         = Math.floor(toneOffset / BASE_SIZE) + 1
  return { gate, line, color, tone, base, full: `${gate}.${line}` }
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

export const calculateProfile = (
  persSunDegree: number,
  desSunDegree: number
): ProfileResult => {
  const personalitySun = degreeToGateAndLine(persSunDegree)
  const designSun      = degreeToGateAndLine(desSunDegree)
  return {
    profile: `${personalitySun.line}/${designSun.line}`,
    personalitySunLine: personalitySun.line,
    designSunLine: designSun.line,
    personalitySun,
    designSun,
  }
}

export const calculateIncarnationCross = (
  persSun: GateAndLine,
  persEarth: GateAndLine,
  desSun: GateAndLine,
  desEarth: GateAndLine,
): IncarnationCross => {
  const persLine = persSun.line
  const desLine  = desSun.line

  let type: CrossType
  if (persLine <= 3) {
    type = 'RAC'
  } else if (persLine === 4 && desLine === 1) {
    type = 'JC'
  } else {
    type = 'LAC'
  }

  // 官方 HD：LAC 以 design sun 家族命名（命運由潛意識軸定義），RAC/JC 以 pers sun 家族命名
  const namingGate = type === 'LAC' ? desSun : persSun
  const groupId    = GATE_TO_CROSS_GROUP[namingGate.gate] ?? -1

  if (groupId < 0) {
    throw new Error(`輪迴交叉閘門無效：閘門 ${namingGate.gate} 不屬於任何已知交叉群組`)
  }
  // 注意：persSun/persEarth 同群組，desSun/desEarth 同群組（因為 Earth 距 Sun 32 格，32 % 16 = 0），
  // 但 personality 軸與 design 軸的群組不需相同（設計時間 ~88° ≠ 整數倍的 90°）。
  // 交叉命名僅由 namingGate 決定，不需四閘門同群組。

  const baseName   = CROSS_BASE_NAMES[groupId]
  const groupGates = CROSS_GROUPS[groupId]
  const variant    = groupGates ? groupGates.indexOf(namingGate.gate) + 1 : 0

  const crossName  = `${baseName}${variant}`
  const gatesLabel = `${persSun.gate}/${persEarth.gate} | ${desSun.gate}/${desEarth.gate}`

  return {
    crossType: type,
    crossBaseName: baseName,
    crossName,
    variant,
    conscious:   `${persSun.full} / ${persEarth.full}`,
    unconscious: `${desSun.full} / ${desEarth.full}`,
    gatesLabel,
    persSunGate: persSun.gate,
    persSunLine: persLine,
  }
}
