import {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  Path,
  Pattern,
  Polygon,
  Rect,
  Svg,
  Text,
} from 'react-native-svg'
import {
  ACT_CONSCIOUS,
  ACT_UNCONSCIOUS,
  CENTER_ORDER,
  CENTERS_GEOM,
  HD_CHANNELS,
  HD_GATES,
  HD_PALETTE,
  INTEGRATION_PAIRS,
  type ChartChannel,
} from '@/lib/hd-chart-data'

export interface GateActivation {
  c?: boolean  // Personality / conscious (黑)
  u?: boolean  // Design / unconscious (紅)
  t?: boolean  // Transit (橙)
}

export interface BodyGraphProps {
  /** Set of defined center keys (e.g. 'head', 'sacral') */
  definedCenterIds?: Set<string>
  /** Map from gate number → activation state */
  activations?: Record<number, GateActivation>
  /** Defined channel ids (e.g. ['c64-47', 'c3-60']) */
  definedChannelIds?: Set<string>
  onPressCenter?: (centerId: string) => void
  onPressGate?: (gateNum: number) => void
  showGates?: boolean
}

function gateLoc(num: number): [number, number] | null {
  for (const c of Object.values(CENTERS_GEOM)) {
    if (c.gateAnchors[num]) return c.gateAnchors[num]
  }
  return null
}

function perpFoot(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): [number, number] {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const lenSq = dx * dx + dy * dy
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq
  return [a[0] + t * dx, a[1] + t * dy]
}

const STRIPE_FILL = 'url(#rb-stripes)'
const ACT_TRANSIT = '#f97316'  // 橙色（流日）

function activationFill(state: GateActivation | undefined): string | null {
  if (!state) return null
  if (state.c && state.u) return STRIPE_FILL  // 黑/紅條紋（個人 Personality + Design）
  if (state.c) return ACT_CONSCIOUS           // 純黑（Personality）
  if (state.u) return ACT_UNCONSCIOUS         // 純紅（Design）
  if (state.t) return ACT_TRANSIT             // 橙色（流日）
  return null
}

function ChannelSegment({
  x1, y1, x2, y2, fill, strokeWidth,
}: {
  x1: number; y1: number; x2: number; y2: number
  fill: string | null; strokeWidth: number
}) {
  const w = strokeWidth
  const inner = strokeWidth * 0.28
  if (fill) {
    return (
      <Line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={fill} strokeWidth={w} strokeLinecap="round"
      />
    )
  }
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={HD_PALETTE.ink} strokeWidth={w} strokeLinecap="round" opacity={0.95} />
      <Line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={HD_PALETTE.paper} strokeWidth={inner} strokeLinecap="round" />
    </G>
  )
}

export default function BodyGraph({
  definedCenterIds,
  activations = {},
  definedChannelIds,
  onPressCenter,
  onPressGate,
  showGates = true,
}: BodyGraphProps) {
  const isDefined = (k: string) =>
    !definedCenterIds || definedCenterIds.has(k)

  // Check channel defined state from definedChannelIds
  const isChannelDefined = (ch: ChartChannel) => {
    if (!definedChannelIds) return false
    const key = `c${Math.min(ch.from, ch.to)}-${Math.max(ch.from, ch.to)}`
    const keyAlt = `c${ch.from}-${ch.to}`
    return definedChannelIds.has(ch.id) || definedChannelIds.has(key) || definedChannelIds.has(keyAlt)
  }

  // De-duplicate channel pairs
  const seenPairs = new Set<string>()
  const drawnChannels = HD_CHANNELS.filter((ch) => {
    const key = `${Math.min(ch.from, ch.to)}-${Math.max(ch.from, ch.to)}`
    if (seenPairs.has(key)) return false
    seenPairs.add(key)
    return true
  })

  const SW = 10  // base stroke width

  return (
    <Svg viewBox="0 -40 700 1030" width="100%" height="100%">
      <Defs>
        <Pattern
          id="rb-stripes"
          patternUnits="userSpaceOnUse"
          width="7"
          height="7"
          patternTransform="rotate(45)"
        >
          <Rect x={0} y={0} width={3.5} height={7} fill={ACT_CONSCIOUS} />
          <Rect x={3.5} y={0} width={3.5} height={7} fill={ACT_UNCONSCIOUS} />
        </Pattern>
      </Defs>

      {/* Body silhouette */}
      <Path
        d="M 350 -32
           C 230 -32, 195 80, 195 175
           C 196 215, 218 260, 287 278
           C 286 302, 286 322, 285 330
           C 242 375, 148 420, 75 510
           C 60 640, 75 780, 145 850
           C 200 930, 285 960, 350 960
           C 415 960, 500 930, 555 850
           C 625 780, 640 640, 625 510
           C 552 420, 458 378, 415 330
           C 414 322, 414 302, 413 278
           C 482 260, 504 215, 505 175
           C 505 80, 470 -32, 350 -32 Z"
        fill="rgba(43, 31, 20, 0.04)"
        stroke="rgba(43, 31, 20, 0.18)"
        strokeWidth={1.1}
      />

      {/* Channels */}
      <G>
        {drawnChannels.map((ch) => {
          const a = gateLoc(ch.from)
          const b = gateLoc(ch.to)
          if (!a || !b) return null
          const pairKey = `${Math.min(ch.from, ch.to)}-${Math.max(ch.from, ch.to)}`
          if (INTEGRATION_PAIRS.has(pairKey)) return null

          // Two-gate rule: only render as defined when both gates have activation data
          const defined = isChannelDefined(ch) && activations[ch.from] != null && activations[ch.to] != null
          const aFill = defined ? activationFill(activations[ch.from]) : null
          const bFill = defined ? activationFill(activations[ch.to]) : null
          const mx = (a[0] + b[0]) / 2
          const my = (a[1] + b[1]) / 2

          return (
            <G key={ch.id}>
              <ChannelSegment x1={a[0]} y1={a[1]} x2={mx} y2={my} fill={aFill} strokeWidth={SW} />
              <ChannelSegment x1={mx} y1={my} x2={b[0]} y2={b[1]} fill={bFill} strokeWidth={SW} />
            </G>
          )
        })}

        {/* Integration compound */}
        {(() => {
          const g20 = gateLoc(20)
          const g57 = gateLoc(57)
          const g10 = gateLoc(10)
          const g34 = gateLoc(34)
          if (!g20 || !g57 || !g10 || !g34) return null

          const foot10 = perpFoot(g10, g20, g57)
          const foot34 = perpFoot(g34, g20, g57)

          const fill10 = activationFill(activations[10])
          const fill20 = activationFill(activations[20])
          const fill34 = activationFill(activations[34])
          const fill57 = activationFill(activations[57])

          const tmx = (g20[0] + g57[0]) / 2
          const tmy = (g20[1] + g57[1]) / 2
          const s10mx = (g10[0] + foot10[0]) / 2
          const s10my = (g10[1] + foot10[1]) / 2
          const s34mx = (g34[0] + foot34[0]) / 2
          const s34my = (g34[1] + foot34[1]) / 2

          return (
            <G key="integration">
              <ChannelSegment x1={g20[0]} y1={g20[1]} x2={tmx} y2={tmy} fill={fill20} strokeWidth={SW} />
              <ChannelSegment x1={tmx} y1={tmy} x2={g57[0]} y2={g57[1]} fill={fill57} strokeWidth={SW} />
              <ChannelSegment x1={g10[0]} y1={g10[1]} x2={s10mx} y2={s10my} fill={fill10} strokeWidth={SW} />
              <ChannelSegment x1={s10mx} y1={s10my} x2={foot10[0]} y2={foot10[1]} fill={null} strokeWidth={SW} />
              <ChannelSegment x1={g34[0]} y1={g34[1]} x2={s34mx} y2={s34my} fill={fill34} strokeWidth={SW} />
              <ChannelSegment x1={s34mx} y1={s34my} x2={foot34[0]} y2={foot34[1]} fill={null} strokeWidth={SW} />
              <Circle cx={foot10[0]} cy={foot10[1]} r={3} fill={HD_PALETTE.ink} />
              <Circle cx={foot34[0]} cy={foot34[1]} r={3} fill={HD_PALETTE.ink} />
            </G>
          )
        })()}
      </G>

      {/* Centers */}
      <G>
        {CENTER_ORDER.map((k) => {
          const c = CENTERS_GEOM[k]
          const defined = isDefined(k)
          return (
            <Polygon
              key={k}
              points={c.points}
              fill={defined ? c.color : HD_PALETTE.paper}
              stroke={HD_PALETTE.ink}
              strokeWidth={2.8}
              strokeLinejoin="round"
              onPress={() => onPressCenter?.(k)}
            />
          )
        })}
      </G>

      {/* G-center smiley face */}
      <G>
        <Ellipse cx={338} cy={533} rx={2.6} ry={3.2} fill={HD_PALETTE.ink} />
        <Ellipse cx={362} cy={533} rx={2.6} ry={3.2} fill={HD_PALETTE.ink} />
        <Circle cx={339} cy={532} r={0.8} fill={HD_PALETTE.paper} />
        <Circle cx={363} cy={532} r={0.8} fill={HD_PALETTE.paper} />
        <Path
          d="M 338 547 Q 350 558 362 547"
          fill="none"
          stroke={HD_PALETTE.ink}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <Ellipse cx={328} cy={547} rx={3} ry={1.8} fill={HD_PALETTE.crimson} opacity={0.45} />
        <Ellipse cx={372} cy={547} rx={3} ry={1.8} fill={HD_PALETTE.crimson} opacity={0.45} />
      </G>

      {/* Gates */}
      {showGates && (
        <G>
          {CENTER_ORDER.map((k) => {
            const c = CENTERS_GEOM[k]
            return Object.entries(c.gateAnchors).map(([num, [x, y]]) => {
              const gateNum = Number(num)
              const gateData = HD_GATES[gateNum]
              if (!gateData) return null
              const state = activations[gateNum]
              const actFill = activationFill(state)
              const isActivated = !!actFill

              const circleFill = isActivated ? actFill! : HD_PALETTE.paper
              // 條紋或純色激活時，文字用白色；未激活時用墨色
              const textFill = isActivated ? '#ffffff' : HD_PALETTE.ink

              return (
                <G key={`${k}-${num}`} onPress={() => onPressGate?.(gateNum)}>
                  <Circle
                    cx={x} cy={y} r={7.5}
                    fill={circleFill}
                    stroke={HD_PALETTE.ink}
                    strokeWidth={1.4}
                  />
                  <Text
                    x={x} y={y + 0.5}
                    fill={textFill}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fontSize={10.5}
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    {num}
                  </Text>
                </G>
              )
            })
          })}
        </G>
      )}
    </Svg>
  )
}
