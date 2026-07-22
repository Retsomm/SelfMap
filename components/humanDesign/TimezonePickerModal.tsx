'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ALL_TIMEZONES } from '@/shared/humanDesign/timezones'

interface TimezonePickerModalProps {
  onSelect: (zone: string, label: string) => void
  onClose: () => void
}

export default function TimezonePickerModal({ onSelect, onClose }: TimezonePickerModalProps) {
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^utc/, '').trim()
    if (!q) return ALL_TIMEZONES
    return ALL_TIMEZONES.filter(t => t.label.toLowerCase().includes(q))
  }, [query])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40"
      style={{ zIndex: 100000 }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="timezoneModalTitle"
        tabIndex={-1}
        className="bg-(--paper) border border-(--ink) px-6 py-5 w-full max-w-sm mx-4 shadow-xl outline-none flex flex-col gap-3"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 id="timezoneModalTitle" className="font-mono text-[13px] tracking-widest uppercase text-(--ink)">
          選擇時區
        </h2>

        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜尋 UTC 偏移量，例如 8 或 +08:00"
          className="font-mono text-[14px] border border-(--ink) bg-(--paper) text-(--ink) px-3 py-1.5 w-full outline-none placeholder:text-(--ink-soft)"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />

        <div className="flex-1 overflow-y-auto border border-(--ink-soft)" style={{ minHeight: 0 }}>
          {filtered.length === 0 && (
            <div className="font-mono text-[12px] text-(--ink-soft) px-3 py-4 text-center">
              找不到符合的時區
            </div>
          )}
          {filtered.map(t => (
            <div
              key={t.label}
              role="button"
              tabIndex={0}
              onClick={() => { onSelect(t.zone, t.label); onClose() }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(t.zone, t.label); onClose() }
              }}
              className="px-3 py-2 cursor-pointer hover:bg-black/5 font-mono text-[13px] text-(--ink)"
              style={{ borderBottom: '1px dotted rgba(43,31,20,0.18)' }}
            >
              {t.label}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="font-mono text-[12px] tracking-widest uppercase text-(--ink-soft) border border-(--ink-soft) px-4 py-1.5 cursor-pointer transition-colors duration-120 hover:text-(--ink) hover:border-(--ink)"
          >
            取消
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
