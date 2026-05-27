'use client'

import type { CenterName, GateActivation, Activations } from '@/lib/humanDesign/types'
import {
  CENTERS_GEOM,
  CENTER_ORDER,
  HD_CHANNELS,
  HD_GATES,
  HD_PALETTE,
  HD_CENTERS_INFO,
  INTEGRATION_PAIRS,
  ACT_CONSCIOUS,
  ACT_UNCONSCIOUS,
  type ChartChannel,
} from './hd-chart-data'

export type { GateActivation, Activations }

export type SelectionKind = 'center' | 'gate' | 'channel' | 'integration'

export interface SelectionPayload {
  kind: SelectionKind
  id: string
  data: unknown
}

interface BodyGraphProps {
  onSelect: (sel: SelectionPayload) => void
  activeId?: string
  showGates?: boolean
  showAnnotations?: boolean
  showFace?: boolean
  showSilhouette?: boolean
  activations?: Activations
  // lib CenterName keys differ: ego → heart, solarPlexus → solar
  definedCenterIds?: Set<CenterName>
}

// Lookup gate anchor position across all centers
function gateLoc(num: number): { center: string; xy: [number, number] } | null {
  for (const [cKey, c] of Object.entries(CENTERS_GEOM)) {
    if (c.gateAnchors[num]) return { center: cKey, xy: c.gateAnchors[num] }
  }
  return null
}

// Foot of perpendicular from point p onto line segment (a, b)
function perpFoot(p: [number, number], a: [number, number], b: [number, number]): [number, number] {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const lenSq = dx * dx + dy * dy
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq
  return [a[0] + t * dx, a[1] + t * dy]
}

function activationFill(state: GateActivation | undefined): string | null {
  if (!state) return null
  if (state.c && state.u) return `url(#hd-rb-stripes)`
  if (state.c) return ACT_CONSCIOUS
  if (state.u) return ACT_UNCONSCIOUS
  return null
}

// lib uses 'ego' and 'solarPlexus'; chart uses 'heart' and 'solar'
const LIB_TO_CHART: Record<string, string> = {
  ego: 'heart',
  solarPlexus: 'solar',
}

export default function BodyGraph({
  onSelect,
  activeId,
  showGates = true,
  showAnnotations = true,
  showFace = true,
  showSilhouette = true,
  activations = {},
  definedCenterIds,
}: BodyGraphProps) {
  const isDefined = (chartKey: string): boolean => {
    if (!definedCenterIds) return true  // no data = show all colored
    const libKey = Object.entries(LIB_TO_CHART).find(([, v]) => v === chartKey)?.[0] ?? chartKey
    return definedCenterIds.has(libKey as CenterName) || definedCenterIds.has(chartKey as CenterName)
  }
  // De-duplicate channel pairs
  const seenPairs = new Set<string>()
  const drawnChannels = HD_CHANNELS.filter(ch => {
    const key = `${Math.min(ch.from, ch.to)}-${Math.max(ch.from, ch.to)}`
    if (seenPairs.has(key)) return false
    seenPairs.add(key)
    return true
  })

  const findChannel = (a: number, b: number): ChartChannel | undefined =>
    drawnChannels.find(ch => {
      const lo = Math.min(ch.from, ch.to)
      const hi = Math.max(ch.from, ch.to)
      return lo === Math.min(a, b) && hi === Math.max(a, b)
    })

  const renderSegment = (
    x1: number, y1: number, x2: number, y2: number,
    fillColour: string | null, key: string,
    isActive: boolean,
  ) => {
    const w = isActive ? 7 : 5
    const inner = isActive ? 2 : 1.4
    if (fillColour) {
      return (
        <line key={key}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={fillColour}
          strokeWidth={w}
          strokeLinecap="round"
        />
      )
    }
    return (
      <g key={key}>
        <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={HD_PALETTE.ink} strokeWidth={w} strokeLinecap="round" opacity={0.95} />
        <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={HD_PALETTE.paper} strokeWidth={inner} strokeLinecap="round" pointerEvents="none" />
      </g>
    )
  }

  return (
    <svg className="hd-chart-svg" viewBox="0 -40 700 960" xmlns="http://www.w3.org/2000/svg">

      <defs>
        <pattern id="hd-rb-stripes" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
          <rect width="3.5" height="7" fill={ACT_CONSCIOUS} />
          <rect x="3.5" width="3.5" height="7" fill={ACT_UNCONSCIOUS} />
        </pattern>
      </defs>

      {/* Body silhouette */}
      {showSilhouette && (
        <g pointerEvents="none">
          <path
            d="M 350 -32
               C 230 -32, 195 80, 195 175
               C 200 240, 248 266, 283 274
               C 242 296, 148 384, 75 510
               C 60 640, 75 750, 145 815
               C 200 880, 285 905, 350 905
               C 415 905, 500 880, 555 815
               C 625 750, 640 640, 625 510
               C 552 384, 458 296, 417 274
               C 452 266, 500 240, 505 175
               C 505 80, 470 -32, 350 -32 Z"
            fill="rgba(43, 31, 20, 0.022)"
            stroke="rgba(43, 31, 20, 0.14)"
            strokeWidth="1.1"
          />
        </g>
      )}

      {/* Annotation lines */}
      {showAnnotations && (
        <g className="hd-annotations">
          <g>
            <path className="hd-annotation-line" d="M 385 65 L 540 55 L 575 75" />
            <text className="hd-annotation-label" x="545" y="98">頂輪</text>
          </g>
          <g>
            <path className="hd-annotation-line" d="M 305 210 L 160 210 L 130 225" />
            <text className="hd-annotation-label" x="40" y="239">邏輯中心</text>
          </g>
          <g>
            <path className="hd-annotation-line" d="M 300 345 L 175 345 L 145 360" />
            <text className="hd-annotation-label" x="40" y="374">喉嚨中心</text>
          </g>
          <g>
            <path className="hd-annotation-line" d="M 425 485 L 555 485 L 585 470" />
            <text className="hd-annotation-label" x="540" y="454">G 中心</text>
          </g>
          <g>
            <path className="hd-annotation-line" d="M 477 552 L 555 552 L 585 540" />
            <text className="hd-annotation-label" x="540" y="526">意志力中心</text>
          </g>
          <g>
            <path className="hd-annotation-line" d="M 118 625 L 40 625 L 10 640" />
            <text className="hd-annotation-label" x="5" y="654">直覺中心</text>
          </g>
          <g>
            <path className="hd-annotation-line" d="M 400 685 L 605 685 L 635 698" />
            <text className="hd-annotation-label" x="545" y="720">薦骨中心</text>
          </g>
          <g>
            <path className="hd-annotation-line" d="M 582 620 L 635 620 L 665 635" />
            <text className="hd-annotation-label" x="588" y="655">情緒中心</text>
          </g>
          <g>
            <path className="hd-annotation-line" d="M 400 810 L 540 810 L 575 820" />
            <text className="hd-annotation-label" x="540" y="842">根部中心</text>
          </g>
        </g>
      )}

      {/* Channels */}
      <g>
        {drawnChannels.map(ch => {
          const a = gateLoc(ch.from)
          const b = gateLoc(ch.to)
          if (!a || !b) return null
          const pairKey = `${Math.min(ch.from, ch.to)}-${Math.max(ch.from, ch.to)}`
          if (INTEGRATION_PAIRS.has(pairKey)) return null

          const id = `c-${ch.from}-${ch.to}`
          const isActive = activeId === id
          const aFill = activationFill(activations[ch.from])
          const bFill = activationFill(activations[ch.to])
          const mx = (a.xy[0] + b.xy[0]) / 2
          const my = (a.xy[1] + b.xy[1]) / 2

          return (
            <g key={id} className="hd-channel">
              {renderSegment(a.xy[0], a.xy[1], mx, my, aFill, 'halfA', isActive)}
              {renderSegment(mx, my, b.xy[0], b.xy[1], bFill, 'halfB', isActive)}
              <line
                className="hd-channel-hit"
                x1={a.xy[0]} y1={a.xy[1]}
                x2={b.xy[0]} y2={b.xy[1]}
                onClick={() => onSelect({ kind: 'channel', data: ch, id })}
              />
            </g>
          )
        })}

        {/* Integration compound (20-57 trunk + perpendicular spurs from 10 and 34) */}
        {(() => {
          const g20 = gateLoc(20)?.xy
          const g57 = gateLoc(57)?.xy
          const g10 = gateLoc(10)?.xy
          const g34 = gateLoc(34)?.xy
          if (!g20 || !g57 || !g10 || !g34) return null

          const foot10 = perpFoot(g10, g20, g57)
          const foot34 = perpFoot(g34, g20, g57)
          const isActive = activeId === 'integration'

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

          const handleClick = () => onSelect({
            kind: 'integration',
            id: 'integration',
            data: {
              channels: [
                findChannel(34, 57),
                findChannel(20, 57),
                findChannel(10, 20),
                findChannel(10, 34),
              ].filter(Boolean),
              gates: [10, 20, 34, 57],
            },
          })

          return (
            <g key="integration-compound">
              {renderSegment(g20[0], g20[1], tmx, tmy, fill20, 'trunk-20', isActive)}
              {renderSegment(tmx, tmy, g57[0], g57[1], fill57, 'trunk-57', isActive)}
              {renderSegment(g10[0], g10[1], s10mx, s10my, fill10, 'spur10-gate', isActive)}
              {renderSegment(s10mx, s10my, foot10[0], foot10[1], null, 'spur10-foot', isActive)}
              {renderSegment(g34[0], g34[1], s34mx, s34my, fill34, 'spur34-gate', isActive)}
              {renderSegment(s34mx, s34my, foot34[0], foot34[1], null, 'spur34-foot', isActive)}

              <line className="hd-channel-hit"
                x1={g20[0]} y1={g20[1]} x2={g57[0]} y2={g57[1]}
                onClick={handleClick} />
              <line className="hd-channel-hit"
                x1={g10[0]} y1={g10[1]} x2={foot10[0]} y2={foot10[1]}
                onClick={handleClick} />
              <line className="hd-channel-hit"
                x1={g34[0]} y1={g34[1]} x2={foot34[0]} y2={foot34[1]}
                onClick={handleClick} />

              <circle cx={foot10[0]} cy={foot10[1]} r="3" fill={HD_PALETTE.ink} pointerEvents="none" />
              <circle cx={foot34[0]} cy={foot34[1]} r="3" fill={HD_PALETTE.ink} pointerEvents="none" />
            </g>
          )
        })()}
      </g>

      {/* Centers */}
      <g>
        {CENTER_ORDER.map(k => {
          const c = CENTERS_GEOM[k]
          const info = HD_CENTERS_INFO[k]
          const isActive = activeId === `center-${k}`
          const defined = isDefined(k)
          return (
            <polygon
              key={k}
              className={`hd-center-shape${isActive ? ' active' : ''}`}
              points={c.points}
              fill={defined ? c.color : HD_PALETTE.paper}
              stroke={HD_PALETTE.ink}
              strokeWidth="2.8"
              strokeLinejoin="round"
              onClick={() => onSelect({ kind: 'center', data: info, id: `center-${k}` })}
            />
          )
        })}
      </g>

      {/* G-center smiley */}
      {showFace && (
        <g pointerEvents="none">
          <ellipse cx="338" cy="478" rx="2.6" ry="3.2" fill={HD_PALETTE.ink} />
          <ellipse cx="362" cy="478" rx="2.6" ry="3.2" fill={HD_PALETTE.ink} />
          <circle cx="339" cy="477" r="0.8" fill={HD_PALETTE.paper} />
          <circle cx="363" cy="477" r="0.8" fill={HD_PALETTE.paper} />
          <path d="M 338 492 Q 350 503 362 492" fill="none"
            stroke={HD_PALETTE.ink} strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="328" cy="492" rx="3" ry="1.8" fill={HD_PALETTE.crimson} opacity="0.45" />
          <ellipse cx="372" cy="492" rx="3" ry="1.8" fill={HD_PALETTE.crimson} opacity="0.45" />
        </g>
      )}

      {/* Gates */}
      {showGates && (
        <g>
          {CENTER_ORDER.map(k => {
            const c = CENTERS_GEOM[k]
            return Object.entries(c.gateAnchors).map(([num, [x, y]]) => {
              const gateNum = Number(num)
              const gateData = HD_GATES[gateNum]
              if (!gateData) return null
              const isActive = activeId === `gate-${num}-${k}`
              const state = activations[gateNum]
              const actFill = activationFill(state)
              const isActivated = !!actFill

              let circleFill: string
              if (isActive) circleFill = HD_PALETTE.ink
              else if (isActivated) circleFill = actFill!
              else circleFill = HD_PALETTE.paper

              const textFill = (isActive || isActivated) ? HD_PALETTE.paper : HD_PALETTE.ink

              return (
                <g
                  key={`${k}-${num}`}
                  className="hd-gate"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect({ kind: 'gate', data: { ...gateData, number: gateNum }, id: `gate-${num}-${k}` })
                  }}
                >
                  <circle
                    className="hd-gate-circle"
                    cx={x} cy={y} r="7.5"
                    style={{ fill: circleFill, stroke: HD_PALETTE.ink, strokeWidth: 1.4 }}
                  />
                  <text className="hd-gate-num" x={x} y={y} style={{ fill: textFill }}>
                    {num}
                  </text>
                </g>
              )
            })
          })}
        </g>
      )}
    </svg>
  )
}
