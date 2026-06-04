'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '@/i18n'
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

const ALL_STATIC = [...TW_LOCATIONS, ...JP_LOCATIONS, ...HK_LOCATIONS, ...MO_LOCATIONS, ...SG_LOCATIONS, ...MY_LOCATIONS, ...UK_LOCATIONS, ...US_LOCATIONS, ...AU_LOCATIONS, ...CA_LOCATIONS, ...CN_LOCATIONS]
const ALL_ALIASES: Record<string, number> = { ...TW_ALIASES, ...JP_ALIASES, ...HK_ALIASES, ...MO_ALIASES, ...SG_ALIASES, ...MY_ALIASES, ...UK_ALIASES, ...US_ALIASES, ...AU_ALIASES, ...CA_ALIASES, ...CN_ALIASES }

function searchStaticLocations(q: string): GeoResult[] {
  const trimmed = q.trim()
  const lower = trimmed.toLowerCase()
  if (lower.length < 1) return []

  // 精確比對別名
  const aliasId = ALL_ALIASES[trimmed] ?? ALL_ALIASES[lower]
  if (aliasId) {
    const match = ALL_STATIC.find(l => l.id === aliasId)
    return match ? [match] : []
  }

  // 部分比對 name / admin1
  return ALL_STATIC.filter(l =>
    l.name.includes(trimmed) ||
    l.name.toLowerCase().includes(lower) ||
    l.admin1?.includes(trimmed)
  )
}

interface Props {
  value: string          // display name
  onSelect: (timezone: string, label: string) => void
}

// Derive UTC offset (hours) from IANA timezone at a specific moment.
// Uses Intl to handle DST correctly — e.g. "Asia/Taipei" → 8, "America/New_York" in summer → -4
export function getOffsetFromTimezone(tz: string | undefined | null, at: Date): number {
  if (!tz) return 0
  try {
    // 用 formatToParts 取得目標時區的各時間部件，再與 UTC 比較算出偏移
    // 這比 shortOffset 更可靠，避免舊版 Safari 不支援 shortOffset 導致回退到系統時區
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hourCycle: 'h23',
    }).formatToParts(at)
    const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0')
    const fakeUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'))
    return Math.round((fakeUtc - at.getTime()) / 60000) / 60
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
  const { t, lang } = useLang()
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

    // 台灣/日本地名優先走靜態清單，有結果就直接顯示，不呼叫外部 API
    const twMatches = searchStaticLocations(q)
    if (twMatches.length > 0) {
      setResults(twMatches)
      setOpen(true)
      setFetchError(null)
      return
    }

    // 非台灣地名走 Open-Meteo API
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=${lang}&format=json`,
        { signal: controller.signal }
      )
      if (controller.signal.aborted) return
      if (!res.ok) {
        setFetchError(t('home.locationSearchFailed', { status: res.status }))
        return
      }
      const json = await res.json()
      if (controller.signal.aborted) return
      setResults((json.results ?? []).filter((r: GeoResult) => !!r.timezone))
      setOpen(true)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setFetchError(t('home.locationNetworkError'))
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [t, lang])

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
