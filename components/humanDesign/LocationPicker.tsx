'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '@/i18n'

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

// Format numeric offset (hours) to ±HH:MM string
function formatOffset(offset: number): string {
  const totalMinutes = Math.round(offset * 60)
  const sign = totalMinutes >= 0 ? '+' : '-'
  const abs = Math.abs(totalMinutes)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `UTC${sign}${hh}:${mm}`
}

export default function LocationPicker({ value, onSelect }: Props) {
  const { t } = useLang()
  const [query, setQuery] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const [results, setResults] = useState<GeoResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external value changes during render (React-recommended pattern for derived state)
  if (prevValue !== value) {
    setPrevValue(value)
    setQuery(value)
  }

  // Cleanup pending debounce timer and in-flight fetch on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      abortRef.current?.abort()
    }
  }, [])

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

    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=zh&format=json`,
        { signal: controller.signal }
      )
      if (controller.signal.aborted) return
      if (!res.ok) {
        setFetchError(t('home.locationSearchFailed', { status: res.status }))
        return
      }
      const json = await res.json()
      if (controller.signal.aborted) return
      setResults(json.results ?? [])
      setOpen(true)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setFetchError(t('home.locationNetworkError'))
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [t])

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
      <label className="hd-input-label">{t('home.locationLabel')}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="hd-input-field"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t('home.locationPlaceholder')}
          style={{ width: '100%', paddingRight: loading ? 24 : 8 }}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          data-testid="location-input"
        />
        {loading && (
          <span style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--ink-soft)', pointerEvents: 'none',
          }}>…</span>
        )}
      </div>

      {fetchError && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#d04830', marginTop: 4 }}>
          {fetchError}
        </div>
      )}

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
            const offset = getOffsetFromTimezone(r.timezone, new Date())
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
                  {formatOffset(offset)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
