'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  type GeoResult,
  TW_LOCATIONS, TW_ALIASES,
  JP_LOCATIONS, JP_ALIASES,
  HK_LOCATIONS, HK_ALIASES,
  MO_LOCATIONS, MO_ALIASES,
  SG_LOCATIONS, SG_ALIASES,
  MY_LOCATIONS, MY_ALIASES,
  UK_LOCATIONS, UK_ALIASES,
  US_LOCATIONS, US_ALIASES,
  AU_LOCATIONS, AU_ALIASES,
  CA_LOCATIONS, CA_ALIASES,
  CN_LOCATIONS, CN_ALIASES,
} from './locationData'

const ALL_STATIC = [
  ...TW_LOCATIONS, ...JP_LOCATIONS, ...HK_LOCATIONS, ...MO_LOCATIONS,
  ...SG_LOCATIONS, ...MY_LOCATIONS, ...UK_LOCATIONS, ...US_LOCATIONS,
  ...AU_LOCATIONS, ...CA_LOCATIONS, ...CN_LOCATIONS,
]
const ALL_ALIASES: Record<string, number> = {
  ...TW_ALIASES, ...JP_ALIASES, ...HK_ALIASES, ...MO_ALIASES,
  ...SG_ALIASES, ...MY_ALIASES, ...UK_ALIASES, ...US_ALIASES,
  ...AU_ALIASES, ...CA_ALIASES, ...CN_ALIASES,
}

function searchStaticLocations(q: string): GeoResult[] {
  const trimmed = q.trim()
  const lower = trimmed.toLowerCase()
  if (lower.length < 1) return []
  const aliasId = ALL_ALIASES[trimmed] ?? ALL_ALIASES[lower]
  if (aliasId) {
    const match = ALL_STATIC.find(l => l.id === aliasId)
    return match ? [match] : []
  }
  return ALL_STATIC.filter(l =>
    l.name.includes(trimmed) ||
    l.name.toLowerCase().includes(lower) ||
    l.admin1?.includes(trimmed)
  ).slice(0, 3)
}

interface Props {
  value: string
  onSelect: (timezone: string, label: string) => void
}

export { getOffsetFromTimezone } from '@/utils/ephemeris'
import { getOffsetFromTimezone } from '@/utils/ephemeris'

function formatOffset(offset: number): string {
  const totalMinutes = Math.round(offset * 60)
  const sign = totalMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(totalMinutes)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `UTC${sign}${hh}:${mm}`
}

function ItemRow({ name, sub, offset, onSelect }: {
  name: string; sub: string; offset: string; onSelect: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={-1}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse') e.preventDefault()
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      style={{
        padding: '10px 12px',
        borderBottom: '1px dotted rgba(43,31,20,0.18)',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
          {name}
        </div>
        {sub && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-soft)', marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
        {offset}
      </div>
    </div>
  )
}

type DropPos = { top?: number; bottom?: number; left: number; width: number } | null

export default function LocationPicker({ value, onSelect }: Props) {
  const lang = 'zh'
  const [query, setQuery] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const [results, setResults] = useState<GeoResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [dropPos, setDropPos] = useState<DropPos>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const rafRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  if (prevValue !== value) {
    setPrevValue(value)
    setQuery(value)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      abortRef.current?.abort()
    }
  }, [])

  // Close when clicking/touching outside
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e instanceof TouchEvent ? e.touches[0]?.target : e.target
      const inContainer = containerRef.current?.contains(target as Node) ?? false
      const inDrop = dropRef.current?.contains(target as Node) ?? false
      if (!inContainer && !inDrop) setOpen(false)
    }
    document.addEventListener('mousedown', handler as EventListener)
    document.addEventListener('touchstart', handler as EventListener, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handler as EventListener)
      document.removeEventListener('touchstart', handler as EventListener)
    }
  }, [])

  const reposition = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      if (!inputRef.current) return
      const rect = inputRef.current.getBoundingClientRect()
      const vvHeight = window.visualViewport?.height ?? window.innerHeight
      const vvOffsetTop = window.visualViewport?.offsetTop ?? 0
      const visTop = rect.top - vvOffsetTop
      const visBottom = rect.bottom - vvOffsetTop
      const spaceBelow = vvHeight - visBottom - 4
      const spaceAbove = visTop - 4
      const width = Math.max(260, rect.width)

      if (spaceBelow >= 120 || spaceBelow >= spaceAbove) {
        setDropPos({ top: visBottom + 2, left: rect.left, width })
      } else {
        setDropPos({ bottom: vvHeight - visTop + 4, left: rect.left, width })
      }
    })
  }, [])

  useEffect(() => {
    if (!open) { setDropPos(null); return }
    reposition()
    const vv = window.visualViewport
    if (vv) { vv.addEventListener('resize', reposition); vv.addEventListener('scroll', reposition) }
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, { passive: true })
    return () => {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      if (vv) { vv.removeEventListener('resize', reposition); vv.removeEventListener('scroll', reposition) }
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition)
    }
  }, [open, reposition])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }

    const staticMatches = searchStaticLocations(q)
    if (staticMatches.length > 0) {
      setResults(staticMatches.slice(0, 3)); setOpen(true); setFetchError(null)
      return
    }

    setResults([])

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true); setFetchError(null)
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=3&language=${lang}&format=json`,
        { signal: controller.signal }
      )
      if (controller.signal.aborted) return
      if (!res.ok) { setFetchError(`地點搜尋失敗（狀態 ${res.status}）`); return }
      const json = await res.json()
      if (controller.signal.aborted) return
      const filtered = (json.results ?? []).filter((r: GeoResult) => !!r.timezone).slice(0, 3)
      setResults(filtered); setOpen(true)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setFetchError('地點搜尋網路異常')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [lang])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (q.trim().length < 2) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(() => search(q), 320)
  }

  const handleSelect = (r: GeoResult) => {
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    setQuery(label)
    onSelect(r.timezone, label)
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={containerRef} className="hd-input-group" style={{ position: 'relative', width: 180 }}>
      <label className="hd-input-label">地點</label>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          className="hd-input-field"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="搜尋城市或地點"
          style={{ width: '100%', paddingRight: loading ? 24 : 8 }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
        />
        {loading && (
          <span style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-soft)', pointerEvents: 'none',
          }}>…</span>
        )}
      </div>

      {fetchError && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#d04830', marginTop: 4 }}>
          {fetchError}
        </div>
      )}

      {open && results.length > 0 && dropPos && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: dropPos.top,
            bottom: dropPos.bottom,
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 99998,
            background: 'var(--paper)',
            border: '1px solid var(--ink)',
            boxShadow: '0 8px 24px rgba(43,31,20,0.14)',
          }}
        >
          {results.slice(0, 3).map(r => {
            const offset = getOffsetFromTimezone(r.timezone, new Date())
            const sub = [r.admin1, r.country].filter((v): v is string => !!v && !v.includes('/')).join(' · ')
            return (
              <ItemRow
                key={r.id}
                name={r.name}
                sub={sub}
                offset={formatOffset(offset)}
                onSelect={() => handleSelect(r)}
              />
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}
