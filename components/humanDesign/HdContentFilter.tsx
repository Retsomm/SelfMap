'use client'

import { useState, useMemo } from 'react'

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

// ─── Inline bold renderer ─────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-(--ink)">{part.slice(2, -2)}</strong>
      : part
  )
}

// ─── Markdown line renderer ───────────────────────────────────

function renderLines(lines: string[]): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let listBuf: string[] = []
  let key = 0

  const flushList = () => {
    if (!listBuf.length) return
    out.push(
      <ul key={`l${key++}`} className="space-y-2 mb-5 list-none pl-0">
        {listBuf.map((t, i) => (
          <li key={i} className="text-base leading-relaxed text-(--ink) flex gap-2">
            <span className="text-(--ink-soft) shrink-0">—</span>
            <span>{renderInline(t)}</span>
          </li>
        ))}
      </ul>
    )
    listBuf = []
  }

  for (const line of lines) {
    if (!line.trim()) { flushList(); continue }
    if (line.startsWith('### ')) {
      flushList()
      out.push(<h3 key={key++} className="font-mono text-[12px] md:text-[14px] tracking-[0.12em] uppercase text-(--ink-soft) mt-8 mb-3">{renderInline(line.slice(4))}</h3>)
    } else if (line.startsWith('## ')) {
      flushList()
      out.push(<h2 key={key++} className="font-mono text-[13px] md:text-[15px] tracking-[0.14em] uppercase text-(--ink) mt-10 mb-4 pb-2 border-b border-(--ink)/30">{renderInline(line.slice(3))}</h2>)
    } else if (line.startsWith('# ')) {
      flushList()
      out.push(<h1 key={key++} className="font-serif italic text-3xl md:text-4xl text-(--ink) leading-tight mt-10 mb-6 first:mt-0">{renderInline(line.slice(2))}</h1>)
    } else if (/^[-*]\s/.test(line)) {
      listBuf.push(line.replace(/^[-*]\s/, ''))
    } else if (line.trim() === '---') {
      flushList()
      out.push(<hr key={key++} className="border-0 border-t border-(--ink)/20 my-10" />)
    } else {
      flushList()
      out.push(<p key={key++} className="text-base leading-relaxed text-(--ink) mb-5">{renderInline(line)}</p>)
    }
  }
  flushList()
  return out
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

// ─── Gate (閘門) view — 64 individual buttons ──────────────────

function GateView({ content }: { content: string }) {
  const [active, setActive] = useState('all')
  const { intro, sections } = useMemo(() => parseGates(content), [content])

  const items = sections.map(s => ({ key: s.key, label: s.key }))
  const visible = active === 'all' ? sections : sections.filter(s => s.key === active)

  return (
    <div>
      <ItemFilterBar items={items} active={active} onSelect={setActive} />
      {active === 'all' && renderLines(intro)}
      {visible.map(s => (
        <div key={s.id} className="mb-6 pb-6 border-b border-(--ink)/10 last:border-0 last:pb-0">
          {renderLines(s.lines)}
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

  return (
    <div>
      <ItemFilterBar items={items} active={active} onSelect={setActive} />
      {active === 'all' && renderLines(intro)}
      {visible.map(s => (
        <div key={s.id} className="mb-8 pb-8 border-b border-(--ink)/10 last:border-0 last:pb-0">
          {renderLines(s.lines)}
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
