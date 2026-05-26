'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface GeoResult {
  id: number
  name: string
  country: string
  admin1?: string
  timezone: string
  latitude: number
  longitude: number
}

interface Props {
  value: string          // display name
  onSelect: (timezone: string, label: string) => void
}

// Derive UTC offset (hours) from IANA timezone at a specific moment.
// Uses Intl to handle DST correctly — e.g. "Asia/Taipei" → 8, "America/New_York" in summer → -4
export function getOffsetFromTimezone(tz: string, at: Date): number {
  try {
    const tzPart = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(at).find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0'
    const m = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/)
    if (!m) return 0
    const sign = m[1] === '+' ? 1 : -1
    return sign * (parseInt(m[2]) + parseInt(m[3] ?? '0') / 60)
  } catch {
    return 0
  }
}

export default function LocationPicker({ value, onSelect }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<GeoResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external value changes (e.g. initial value)
  useEffect(() => { setQuery(value) }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=zh&format=json`
      )
      const json = await res.json()
      setResults(json.results ?? [])
      setOpen(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(q), 320)
  }

  const handleSelect = (r: GeoResult) => {
    const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    setQuery(label)
    setOpen(false)
    setResults([])
    onSelect(r.timezone, label)
  }

  return (
    <div ref={containerRef} className="hd-input-group" style={{ position: 'relative', width: 180 }}>
      <label className="hd-input-label">出生地點</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="hd-input-field"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="城市名稱…"
          style={{ width: '100%', paddingRight: loading ? 24 : 8 }}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
        />
        {loading && (
          <span style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--ink-soft)', pointerEvents: 'none',
          }}>…</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 200,
          background: 'var(--paper)',
          border: '1px solid var(--ink)',
          minWidth: 260,
          maxHeight: 220,
          overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(43,31,20,0.14)',
        }}>
          {results.map(r => {
            const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
            const offset = getOffsetFromTimezone(r.timezone, new Date())
            const sign = offset >= 0 ? '+' : ''
            return (
              <div
                key={r.id}
                onClick={() => handleSelect(r)}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px dotted rgba(43,31,20,0.18)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-deep)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
                    {r.name}
                  </div>
                  {(r.admin1 || r.country) && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-soft)', marginTop: 2 }}>
                      {[r.admin1, r.country].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                  UTC{sign}{offset % 1 === 0 ? offset : offset.toFixed(1)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
