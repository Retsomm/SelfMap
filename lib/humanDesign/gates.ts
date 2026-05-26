import { HD_WHEEL_OFFSET, GATE_SEQUENCE } from './constants'
import type { GateAndLine, PlanetGateResult, ProfileResult } from './types'

export const degreeToGateAndLine = (degree: number): GateAndLine => {
  const normalized = ((degree - HD_WHEEL_OFFSET) % 360 + 360) % 360
  const slot = Math.floor(normalized / 5.625)
  const gate = GATE_SEQUENCE[slot]
  const lineFraction = (normalized % 5.625) / 5.625
  const line = Math.floor(lineFraction * 6) + 1
  return { gate, line, full: `${gate}.${line}` }
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
