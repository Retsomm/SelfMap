'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { HumanDesignChart, Center, CenterName } from '@/lib/humanDesign'

interface CenterConfig {
  id: CenterName
  x: number
  y: number
  w: number
  h: number
  rx: number
}

const CENTER_LAYOUT: CenterConfig[] = [
  { id: 'head',       x: 175, y: 20,  w: 100, h: 60, rx: 8  },
  { id: 'ajna',       x: 175, y: 110, w: 100, h: 60, rx: 8  },
  { id: 'throat',     x: 160, y: 210, w: 130, h: 55, rx: 8  },
  { id: 'g',          x: 150, y: 305, w: 150, h: 65, rx: 12 },
  { id: 'ego',        x: 335, y: 270, w: 80,  h: 55, rx: 8  },
  { id: 'sacral',     x: 150, y: 420, w: 150, h: 65, rx: 8  },
  { id: 'solarPlexus',x: 330, y: 390, w: 95,  h: 60, rx: 8  },
  { id: 'spleen',     x: 25,  y: 390, w: 95,  h: 60, rx: 8  },
  { id: 'root',       x: 160, y: 535, w: 130, h: 55, rx: 8  },
]

const CONNECTIONS: Array<{ from: CenterName; to: CenterName }> = [
  { from: 'head',   to: 'ajna'        },
  { from: 'ajna',   to: 'throat'      },
  { from: 'throat', to: 'g'           },
  { from: 'throat', to: 'ego'         },
  { from: 'g',      to: 'ego'         },
  { from: 'g',      to: 'sacral'      },
  { from: 'g',      to: 'spleen'      },
  { from: 'ego',    to: 'solarPlexus' },
  { from: 'sacral', to: 'solarPlexus' },
  { from: 'sacral', to: 'spleen'      },
  { from: 'sacral', to: 'root'        },
  { from: 'solarPlexus', to: 'root'   },
  { from: 'spleen', to: 'root'        },
]

const CENTER_LABELS: Record<CenterName, string> = {
  head:        '頭腦',
  ajna:        '直覺',
  throat:      '喉嚨',
  g:           'G 中心',
  ego:         '意志力',
  sacral:      '薦骨',
  solarPlexus: '情緒',
  spleen:      '脾臟',
  root:        '根部',
}

const getCenterMidpoint = (cfg: CenterConfig) => ({
  x: cfg.x + cfg.w / 2,
  y: cfg.y + cfg.h / 2,
})

const getCfgById = (id: CenterName): CenterConfig =>
  CENTER_LAYOUT.find((c) => c.id === id)!

interface SelfMapProps {
  chart: HumanDesignChart
  onCenterClick: (center: Center) => void
}

export default function SelfMap({ chart, onCenterClick }: SelfMapProps) {
  const [hoveredId, setHoveredId] = useState<CenterName | null>(null)

  const handleCenterClick = (center: Center) => {
    window.umami?.track('map-center-click', { center: center.id })
    onCenterClick(center)
  }

  const definedSet = new Set(
    chart.centers.filter((c) => c.defined).map((c) => c.id)
  )

  const definedChannelPairs = new Set(
    chart.channels
      .filter((ch) => ch.defined)
      .map((ch) => `${ch.from}-${ch.to}`)
  )

  const isChannelDefined = (from: CenterName, to: CenterName) =>
    definedChannelPairs.has(`${from}-${to}`) ||
    definedChannelPairs.has(`${to}-${from}`)

  return (
    <div className="flex items-center justify-center w-full h-full">
      <svg
        viewBox="0 0 450 620"
        className="w-full max-w-sm h-auto"
        style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.06))' }}
      >
        {CONNECTIONS.map(({ from, to }) => {
          const a = getCfgById(from)
          const b = getCfgById(to)
          const pa = getCenterMidpoint(a)
          const pb = getCenterMidpoint(b)
          const defined = isChannelDefined(from, to)

          return (
            <g key={`${from}-${to}`}>
              {defined && (
                <motion.line
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke="url(#flowGradient)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                />
              )}
              <line
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke={defined ? '#a5b4fc' : '#e4e4e7'}
                strokeWidth={defined ? 2 : 1}
                strokeDasharray={defined ? undefined : '4 4'}
                opacity={defined ? 0.6 : 0.4}
              />
            </g>
          )
        })}

        <defs>
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {CENTER_LAYOUT.map((cfg) => {
          const center = chart.centers.find((c) => c.id === cfg.id)!
          const isDefined = definedSet.has(cfg.id)
          const isHovered = hoveredId === cfg.id
          const mid = getCenterMidpoint(cfg)

          return (
            <motion.g
              key={cfg.id}
              style={{ cursor: 'pointer' }}
              onClick={() => handleCenterClick(center)}
              onHoverStart={() => setHoveredId(cfg.id)}
              onHoverEnd={() => setHoveredId(null)}
              whileHover={{ scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <rect
                x={cfg.x}
                y={cfg.y}
                width={cfg.w}
                height={cfg.h}
                rx={cfg.rx}
                fill={isDefined ? '#eef2ff' : 'white'}
                stroke={
                  isHovered
                    ? '#6366f1'
                    : isDefined
                    ? '#a5b4fc'
                    : '#e4e4e7'
                }
                strokeWidth={isHovered ? 2 : 1.5}
                opacity={isDefined ? 1 : 0.65}
                filter={isHovered && isDefined ? 'url(#glow)' : undefined}
              />

              {isDefined && (
                <rect
                  x={cfg.x}
                  y={cfg.y}
                  width={cfg.w}
                  height={cfg.h}
                  rx={cfg.rx}
                  fill="url(#flowGradient)"
                  opacity={0.08}
                />
              )}

              <text
                x={mid.x}
                y={mid.y - 6}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill={isDefined ? '#4338ca' : '#a1a1aa'}
                fontFamily="var(--font-mono)"
              >
                {CENTER_LABELS[cfg.id]}
              </text>
              <text
                x={mid.x}
                y={mid.y + 10}
                textAnchor="middle"
                fontSize={9}
                fill={isDefined ? '#6366f1' : '#d4d4d8'}
                fontFamily="var(--font-mono)"
              >
                {isDefined ? '已定義' : '未定義'}
              </text>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}
