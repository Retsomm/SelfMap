'use client'

import { useState, useEffect, useCallback, useRef, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import TimeSelect from '@/components/humanDesign/TimeSelect'
import DateSelect from '@/components/humanDesign/DateSelect'
import dayjs, { type Dayjs } from 'dayjs'
import LocationPicker from '@/components/humanDesign/LocationPicker'
import type { HdResult } from '@/lib/buildAiPrompt'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useBirthProfiles, type BirthProfile } from '@/lib/useBirthProfiles'

const ChartView = dynamic(() => import('@/components/humanDesign/ChartView'), { ssr: false })

const serializeHdResult = (r: HdResult): string =>
  JSON.stringify({ ...r, definedCenterIds: [...r.definedCenterIds], allGates: [...r.allGates] })

const deserializeHdResult = (s: string): HdResult => {
  const d = JSON.parse(s)
  return { ...d, definedCenterIds: new Set(d.definedCenterIds), allGates: new Set(d.allGates) }
}

type StoredData = {
  inputs: { date: string; time: string; tz: string; loc: string }
  hadResult: boolean
  cached: string | null
} | null

const readStoredData = (): StoredData => {
  if (typeof window === 'undefined') return null
  try {
    const saved = sessionStorage.getItem('hd_inputs')
    if (!saved) return null
    const parsed = JSON.parse(saved)
    if (
      typeof parsed !== 'object' || parsed === null ||
      typeof parsed.date !== 'string' ||
      typeof parsed.time !== 'string' ||
      typeof parsed.tz !== 'string' ||
      typeof parsed.loc !== 'string'
    ) {
      sessionStorage.removeItem('hd_inputs')
      return null
    }
    return {
      inputs: parsed as { date: string; time: string; tz: string; loc: string },
      hadResult: sessionStorage.getItem('hd_had_result') === 'true',
      cached: sessionStorage.getItem('hd_result'),
    }
  } catch {
    return null
  }
}

type FormInputs = {
  birthDate: Dayjs
  birthTime: Dayjs
  timezone: string
  locationLabel: string
}

const DEFAULT_INPUTS = {
  birthDate: dayjs('2000-01-01'),
  birthTime: dayjs('2000-01-01 12:00'),
  timezone: 'Asia/Taipei',
}

export default function PersonalTab() {
  const router = useRouter()
  const { profiles, isSignedIn } = useBirthProfiles()

  const [inputs, setInputs] = useState<FormInputs>(() => ({
    ...DEFAULT_INPUTS,
    locationLabel: '台北, 台灣',
  }))
  const { birthDate, birthTime, timezone, locationLabel } = inputs
  const date = birthDate.format('YYYY-MM-DD')
  const time = birthTime.format('HH:mm')
  const setBirthDate = (d: Dayjs) => setInputs(prev => ({ ...prev, birthDate: d }))
  const setBirthTime = (tt: Dayjs) => setInputs(prev => ({ ...prev, birthTime: tt }))
  const setTimezone = (tz: string) => setInputs(prev => ({ ...prev, timezone: tz }))
  const setLocationLabel = (loc: string) => setInputs(prev => ({ ...prev, locationLabel: loc }))
  const [result, setResult] = useState<HdResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const triggerCalcRef = useRef(false)
  const hasAutoFilledRef = useRef(false)
  const requestIdRef = useRef(0)

  const fillFromProfile = (p: BirthProfile) => {
    setInputs({
      birthDate: dayjs(p.date),
      birthTime: dayjs(`${p.date} ${p.time}`),
      timezone: p.timezone,
      locationLabel: p.location,
    })
    setResult(null)
    setError('')
    sessionStorage.removeItem('hd_inputs')
    sessionStorage.removeItem('hd_had_result')
    sessionStorage.removeItem('hd_result')
  }

  useEffect(() => {
    const stored = readStoredData()
    if (!stored) return
    startTransition(() => {
      setInputs({
        birthDate: dayjs(stored.inputs.date),
        birthTime: dayjs(`${stored.inputs.date} ${stored.inputs.time}`),
        timezone: stored.inputs.tz,
        locationLabel: stored.inputs.loc,
      })
      if (stored.hadResult && stored.cached) {
        try {
          setResult(deserializeHdResult(stored.cached))
        } catch {
          sessionStorage.removeItem('hd_result')
        }
      } else if (stored.hadResult && !stored.cached) {
        setIsRestoring(true)
        triggerCalcRef.current = true
      }
    })
  }, [])

  // Auto-fill from first profile if no session data
  useEffect(() => {
    if (hasAutoFilledRef.current) return
    if (!isSignedIn || profiles.length === 0) return
    const stored = readStoredData()
    if (stored) return
    hasAutoFilledRef.current = true
    fillFromProfile(profiles[0])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, profiles])

  const calculate = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setError('')
    setLoading(true)
    window.umami?.track('chart-calculate')
    try {
      const { computeHdResult } = await import('@/lib/computeHdResult')
      const [r] = await Promise.all([
        computeHdResult(date, time, timezone),
        new Promise(res => setTimeout(res, 1000)),
      ])
      if (requestId !== requestIdRef.current) return
      setResult(r as HdResult)
      sessionStorage.setItem('hd_inputs', JSON.stringify({ date, time, tz: timezone, loc: locationLabel }))
      sessionStorage.setItem('hd_had_result', 'true')
      sessionStorage.setItem('hd_result', serializeHdResult(r as HdResult))
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      console.error('[calculate]', err)
      setError('計算失敗，請稍後再試')
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
        setIsRestoring(false)
      }
    }
  }, [date, time, timezone, locationLabel])

  useEffect(() => {
    if (!triggerCalcRef.current) return
    triggerCalcRef.current = false
    calculate()
  }, [calculate])

  return (
    <>
      <div className="hd-print-hide py-3.5 px-5 border border-(--ink) bg-(--paper-deep) flex flex-col gap-3">
        {isSignedIn && profiles.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-(--ink-soft)">
              從個人檔案載入:
            </span>
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => fillFromProfile(p)}
                disabled={loading}
                className="font-mono text-[11px] tracking-[0.08em] border border-(--ink-soft) px-2 py-0.5 text-(--ink-soft) hover:text-(--ink) hover:border-(--ink) transition-colors duration-120 cursor-pointer bg-transparent disabled:opacity-45 disabled:cursor-not-allowed"
              >
                {(!p.label || p.label === '未命名') ? `${p.location} · ${p.date}` : p.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-5 flex-wrap max-[640px]:flex-col max-[640px]:items-stretch">
          <h4 className="font-sans text-[12px] md:text-base font-semibold uppercase tracking-[0.18em] text-(--ink) m-0 p-0 border-none whitespace-nowrap self-end pb-1.5">
            輸入資料
          </h4>
          <div className="flex gap-2 flex-wrap items-end flex-1">
          <div className="flex flex-col gap-1">
            <label htmlFor="birth-date" className="font-mono text-[12px] md:text-base tracking-[0.1em] uppercase text-[var(--ink-soft)]">日期</label>
            <DateSelect id="birth-date" value={birthDate} onChange={setBirthDate} minDate={dayjs('1900-01-01')} maxDate={dayjs('2040-12-31')} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[12px] md:text-base tracking-[0.1em] uppercase text-[var(--ink-soft)]">時間</label>
            <TimeSelect value={birthTime} onChange={setBirthTime} />
          </div>
          <LocationPicker
            value={locationLabel}
            onSelect={(tz, label) => { setTimezone(tz); setLocationLabel(label) }}
          />
          <button
            className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-[var(--paper)] bg-[var(--ink)] border border-[var(--ink)] px-4 py-1.5 cursor-pointer whitespace-nowrap transition-colors duration-[120ms] hover:bg-[var(--crimson)] hover:border-[var(--crimson)] disabled:opacity-45 disabled:cursor-not-allowed"
            onClick={calculate}
            disabled={loading}
          >
            {loading ? (isRestoring ? '載入中…' : '計算中…') : '生成人類圖'}
          </button>
          {error && (
            <div className="font-mono text-[12px] md:text-base text-[var(--crimson)] mt-2 py-1.5 px-2 border border-[var(--crimson)] tracking-[0.02em]">
              {error}
            </div>
          )}
          </div>
        </div>
      </div>

      {result && (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-(--paper)/70 backdrop-blur-[2px]">
              <LoadingSpinner />
            </div>
          )}
          <ChartView
            result={result}
            date={date}
            time={time}
            locationLabel={locationLabel}
            timezone={timezone}
            onSaved={() => router.push('/account?section=humandesign')}
          />
        </div>
      )}
    </>
  )
}
