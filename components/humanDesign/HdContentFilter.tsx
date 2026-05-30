'use client'

import { useState, useMemo } from 'react'
import { renderMarkdownLines } from './HdMarkdown'

// ─── Types ────────────────────────────────────────────────────

interface FlatSection {
  id: string
  key: string   // display label for button
  num: number   // sort/filter number
  lines: string[]
}

// ─── Parsers ──────────────────────────────────────────────────

function parseGates(content: string): { intro: string[]; sections: FlatSection[] } {
  const lines = content.split('\n')
  const intro: string[] = []
  const sections: FlatSection[] = []
  let cur: FlatSection | null = null

  for (const line of lines) {
    const m = line.match(/^🚪 閘門 (\d+)｜/)
    if (m) {
      if (cur) sections.push(cur)
      const n = parseInt(m[1])
      cur = { id: `gate-${n}`, key: String(n), num: n, lines: [line] }
    } else if (cur) {
      cur.lines.push(line)
    } else {
      intro.push(line)
    }
  }
  if (cur) sections.push(cur)
  return { intro, sections }
}

function parseChannels(content: string): { intro: string[]; sections: FlatSection[] } {
  const lines = content.split('\n')
  const intro: string[] = []
  const sections: FlatSection[] = []
  let cur: FlatSection | null = null

  for (const line of lines) {
    // match "N–M｜" or "N-M｜" (en-dash or hyphen)
    const m = line.match(/^(\d+)[–-](\d+)｜/)
    if (m) {
      if (cur) sections.push(cur)
      const n = parseInt(m[1])
      const label = `${m[1]}–${m[2]}`
      cur = { id: `ch-${m[1]}-${m[2]}`, key: label, num: n, lines: [line] }
    } else if (cur) {
      cur.lines.push(line)
    } else {
      intro.push(line)
    }
  }
  if (cur) sections.push(cur)
  return { intro, sections }
}

// ─── Item filter button bar ───────────────────────────────────

function ItemFilterBar({
  items, active, onSelect,
}: {
  items: { key: string; label: string }[]
  active: string
  onSelect: (k: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-8 pb-6 border-b border-(--ink)/15">
      <button
        type="button"
        aria-pressed={active === 'all'}
        onClick={() => onSelect('all')}
        className={`font-mono text-[11px] tracking-[0.1em] px-3 py-1 border transition-colors duration-120 cursor-pointer ${
          active === 'all'
            ? 'bg-(--ink) text-(--paper) border-(--ink)'
            : 'text-(--ink-soft) border-(--ink)/25 hover:text-(--ink) hover:border-(--ink)'
        }`}
      >
        全部
      </button>
      {items.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          aria-pressed={active === key}
          onClick={() => onSelect(key)}
          className={`font-mono text-[11px] tracking-[0.08em] px-2.5 py-1 border transition-colors duration-120 cursor-pointer ${
            active === key
              ? 'bg-(--ink) text-(--paper) border-(--ink)'
              : 'text-(--ink-soft) border-(--ink)/25 hover:text-(--ink) hover:border-(--ink)'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// Updates active filter key and tracks selection with umami (topic: 'gate' or 'channel').
const createHandleSelect = (topic: string, setActive: (k: string) => void) => (k: string) => {
  setActive(k)
  if (k !== 'all') window.umami?.track('hd-filter-click', { topic, filter: k })
}

// ─── Gate (閘門) view — 64 individual buttons ──────────────────

function GateView({ content }: { content: string }) {
  const [active, setActive] = useState('all')
  const { intro, sections } = useMemo(() => parseGates(content), [content])

  const items = sections.map(s => ({ key: s.key, label: s.key }))
  const visible = active === 'all' ? sections : sections.filter(s => s.key === active)

  const handleSelect = createHandleSelect('gate', setActive)

  return (
    <div>
      <ItemFilterBar items={items} active={active} onSelect={handleSelect} />
      {active === 'all' && renderMarkdownLines(intro)}
      {visible.map(s => (
        <div key={s.id} className="mb-6 pb-6 border-b border-(--ink)/10 last:border-0 last:pb-0">
          {renderMarkdownLines(s.lines)}
        </div>
      ))}
    </div>
  )
}

// ─── Channel (通道) view — 36 individual buttons ───────────────

function ChannelView({ content }: { content: string }) {
  const [active, setActive] = useState('all')
  const { intro, sections } = useMemo(() => parseChannels(content), [content])

  const items = sections.map(s => ({ key: s.key, label: s.key }))
  const visible = active === 'all' ? sections : sections.filter(s => s.key === active)

  const handleSelect = createHandleSelect('channel', setActive)

  return (
    <div>
      <ItemFilterBar items={items} active={active} onSelect={handleSelect} />
      {active === 'all' && renderMarkdownLines(intro)}
      {visible.map(s => (
        <div key={s.id} className="mb-8 pb-8 border-b border-(--ink)/10 last:border-0 last:pb-0">
          {renderMarkdownLines(s.lines)}
        </div>
      ))}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────

export default function HdContentFilter({ content, topic }: { content: string; topic: string }) {
  if (topic === 'gate')    return <GateView content={content} />
  if (topic === 'channel') return <ChannelView content={content} />
  return null
}
