'use client'

type Token =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'li'; text: string }
  | { type: 'hr' }
  | { type: 'p'; text: string }

function parseLine(line: string): Token | null {
  if (line.startsWith('### ')) return { type: 'h3', text: line.slice(4) }
  if (line.startsWith('## '))  return { type: 'h2', text: line.slice(3) }
  if (line.startsWith('# '))   return { type: 'h1', text: line.slice(2) }
  if (/^[-*]\s/.test(line))    return { type: 'li', text: line.replace(/^[-*]\s/, '') }
  if (line.trim() === '---')   return { type: 'hr' }
  if (line.trim() === '')      return null
  return { type: 'p', text: line }
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-(--ink)">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

/**
 * Renders an array of markdown-like lines into React nodes.
 * Handles headings (h1–h3), bullet lists (- / *), horizontal rules (---),
 * paragraphs, and inline bold (**text**). Lists are flushed and wrapped in
 * a <ul> whenever a non-list token or end of input is reached.
 */
export const renderMarkdownLines = (lines: string[]): React.ReactNode[] => {
  const tokens: Token[] = []
  for (const line of lines) {
    const token = parseLine(line)
    if (token) tokens.push(token)
  }

  const elements: React.ReactNode[] = []
  let listBuffer: string[] = []

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return
    elements.push(
      <ul key={key} className="space-y-2 mb-6 list-none pl-0">
        {listBuffer.map((item, i) => (
          <li key={i} className="text-base leading-relaxed text-(--ink) flex gap-2">
            <span className="text-(--ink-soft) shrink-0 mt-0.5">—</span>
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    )
    listBuffer = []
  }

  tokens.forEach((token, i) => {
    if (token.type !== 'li' && listBuffer.length > 0) {
      flushList(`list-${i}`)
    }

    switch (token.type) {
      case 'h1':
        elements.push(
          <h1 key={i} className="font-serif italic text-3xl md:text-4xl text-(--ink) leading-tight mt-10 mb-6 first:mt-0">
            {renderInline(token.text)}
          </h1>
        )
        break
      case 'h2':
        elements.push(
          <h2 key={i} className="font-mono text-[13px] md:text-[15px] tracking-[0.14em] uppercase text-(--ink) mt-10 mb-4 pb-2 border-b border-(--ink)/30">
            {renderInline(token.text)}
          </h2>
        )
        break
      case 'h3':
        elements.push(
          <h3 key={i} className="font-mono text-[12px] md:text-[14px] tracking-[0.12em] uppercase text-(--ink-soft) mt-8 mb-3">
            {renderInline(token.text)}
          </h3>
        )
        break
      case 'p':
        elements.push(
          <p key={i} className="text-base leading-relaxed text-(--ink) mb-5">
            {renderInline(token.text)}
          </p>
        )
        break
      case 'li':
        listBuffer.push(token.text)
        break
      case 'hr':
        elements.push(<hr key={i} className="border-0 border-t border-(--ink)/20 my-10" />)
        break
    }
  })

  if (listBuffer.length > 0) {
    flushList('list-end')
  }

  return elements
}

export default function HdMarkdown({ content }: { content: string }) {
  return <div className="hd-prose">{renderMarkdownLines(content.split('\n'))}</div>
}
