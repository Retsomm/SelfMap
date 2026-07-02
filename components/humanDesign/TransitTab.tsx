'use client'

import { useState, useEffect, useCallback, useRef, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import TimeSelect from '@/components/humanDesign/TimeSelect'
import DateSelect from '@/components/humanDesign/DateSelect'
import dayjs, { type Dayjs } from 'dayjs'
import LocationPicker from '@/components/humanDesign/LocationPicker'
import type { HdResult } from '@/lib/buildAiPrompt'
import type { TransitResult } from '@/lib/computeTransit'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useBirthProfiles, type BirthProfile } from '@/lib/useBirthProfiles'

const TransitView = dynamic(() => import('@/components/humanDesign/TransitView'), { ssr: false })

const serializeHdResult = (r: HdResult): string =>
  JSON.stringify({ ...r, definedCenterIds: [...r.definedCenterIds], allGates: [...r.allGates] })

const deserializeHdResult = (s: string): HdResult => {
  const d = JSON.parse(s)
  return { ...d, definedCenterIds: new Set(d.definedCenterIds), allGates: new Set(d.allGates) }
}

const DEFAULT_INPUTS = {
  birthDate: dayjs('2000-01-01'),
  birthTime: dayjs('2000-01-01 12:00'),
  timezone: 'Asia/Taipei',
}

interface FormInputs {
  birthDate: Dayjs
  birthTime: Dayjs
  timezone: string
  locationLabel: string
}

export default function TransitTab() {
  const router = useRouter()
  const { profiles, isSignedIn } = useBirthProfiles()
  const [inputs, setInputs] = useState<FormInputs>(() => ({
    ...DEFAULT_INPUTS,
    locationLabel: '台北, 台灣',
  }))
  const { birthDate, birthTime, timezone, locationLabel } = inputs
  const date = birthDate.format('YYYY-MM-DD')
  const time = birthTime.format('HH:mm')

  const [personal, setPersonal] = useState<HdResult | null>(null)
  const [transit, setTransit] = useState<TransitResult | null>(null)
  const [loadingPersonal, setLoadingPersonal] = useState(false)
  const [loadingTransit, setLoadingTransit] = useState(false)
  const [error, setError] = useState('')
  const hasAutoFilledRef = useRef(false)

  const fillFromProfile = (p: BirthProfile) => {
    setInputs({
      birthDate: dayjs(p.date),
      birthTime: dayjs(`${p.date} ${p.time}`),
      timezone: p.timezone,
      locationLabel: p.location,
    })
    setPersonal(null)
    setTransit(null)
  }

  // 嘗試從 sessionStorage 恢復個人圖
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('hd_inputs')
      const cached = sessionStorage.getItem('hd_result')
      if (saved && cached) {
        const parsed = JSON.parse(saved)
        startTransition(() => {
          setInputs({
            birthDate: dayjs(parsed.date),
            birthTime: dayjs(`${parsed.date} ${parsed.time}`),
            timezone: parsed.tz,
            locationLabel: parsed.loc,
          })
          try {
            setPersonal(deserializeHdResult(cached))
          } catch {
            sessionStorage.removeItem('hd_result')
          }
        })
      }
    } catch { /* ignore */ }
  }, [])

  // Auto-fill from first profile if no session data
  useEffect(() => {
    if (hasAutoFilledRef.current) return
    if (!isSignedIn || profiles.length === 0) return
    const saved = sessionStorage.getItem('hd_inputs')
    const cached = sessionStorage.getItem('hd_result')
    if (saved && cached) return
    hasAutoFilledRef.current = true
    startTransition(() => fillFromProfile(profiles[0]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, profiles])

  const calculatePersonal = useCallback(async () => {
    setError('')
    setLoadingPersonal(true)
    try {
      const { computeHdResult } = await import('@/lib/computeHdResult')
      const [r] = await Promise.all([
        computeHdResult(date, time, timezone),
        new Promise(res => setTimeout(res, 800)),
      ])
      setPersonal(r as HdResult)
      sessionStorage.setItem('hd_inputs', JSON.stringify({ date, time, tz: timezone, loc: locationLabel }))
      sessionStorage.setItem('hd_had_result', 'true')
      sessionStorage.setItem('hd_result', serializeHdResult(r as HdResult))
    } catch (err) {
      console.error('[transit personal calculate]', err)
      setError('計算個人圖失敗，請稍後再試')
    } finally {
      setLoadingPersonal(false)
    }
  }, [date, time, timezone, locationLabel])

  const fetchTransit = useCallback(async () => {
    setError('')
    setLoadingTransit(true)
    try {
      const { computeTransit } = await import('@/lib/computeTransit')
      const t = await computeTransit()
      setTransit(t)
      setError('')
    } catch (err) {
      console.error('[transit compute]', err)
      setError('流日計算失敗，請稍後再試')
    } finally {
      setLoadingTransit(false)
    }
  }, [])

  // 個人圖就緒後自動計算流日
  useEffect(() => {
    if (personal && !transit) {
      startTransition(() => { void fetchTransit() })
    }
  }, [personal, transit, fetchTransit])

  const isLoading = loadingPersonal || loadingTransit

  return (
    <div className="flex flex-col gap-5">

      {/* 個人圖輸入區 */}
      <div className="hd-print-hide py-3.5 px-5 border border-(--ink) bg-(--paper-deep) flex flex-col gap-3">
        {isSignedIn && profiles.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-(--ink-soft)">
              快速填入:
            </span>
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => fillFromProfile(p)}
                className="font-mono text-[11px] tracking-[0.08em] border border-(--ink-soft) px-2 py-0.5 text-(--ink-soft) hover:text-(--ink) hover:border-(--ink) transition-colors duration-120 cursor-pointer bg-transparent"
              >
                {(!p.label || p.label === '未命名') ? `${p.location} · ${p.date}` : p.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-5 flex-wrap max-[640px]:flex-col max-[640px]:items-stretch">
          <h4 className="font-sans text-[12px] md:text-base font-semibold uppercase tracking-[0.18em] text-(--ink) m-0 p-0 border-none whitespace-nowrap self-end pb-1.5">
            輸入出生資料
          </h4>
          <div className="flex gap-2 flex-wrap items-end flex-1">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[12px] md:text-base tracking-[0.1em] uppercase text-(--ink-soft)">生日</label>
              <DateSelect
                value={birthDate}
                onChange={d => setInputs(prev => ({ ...prev, birthDate: d }))}
                minDate={dayjs('1900-01-01')}
                maxDate={dayjs('2040-12-31')}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[12px] md:text-base tracking-[0.1em] uppercase text-(--ink-soft)">時間</label>
              <TimeSelect
                value={birthTime}
                onChange={tt => setInputs(prev => ({ ...prev, birthTime: tt }))}
              />
            </div>
            <LocationPicker
              value={locationLabel}
              onSelect={(tz, label) => setInputs(prev => ({ ...prev, timezone: tz, locationLabel: label }))}
            />
            <button
              className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--paper) bg-(--ink) border border-(--ink) px-4 py-1.5 cursor-pointer whitespace-nowrap transition-colors duration-120 hover:bg-(--crimson) hover:border-(--crimson) disabled:opacity-45 disabled:cursor-not-allowed"
              onClick={calculatePersonal}
              disabled={isLoading}
            >
              {loadingPersonal ? '計算中…' : '生成流日'}
            </button>
          </div>
          {error && (
            <div className="w-full font-mono text-[12px] md:text-base text-(--crimson) py-1.5 px-2 border border-(--crimson) tracking-[0.02em]">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 載入中 */}
      {isLoading && (
        <div className="flex flex-col items-center gap-4 py-12">
          <LoadingSpinner />
          <p className="font-mono text-[12px] md:text-sm text-[var(--ink-soft)] tracking-[0.08em]">
            {loadingPersonal ? '計算個人圖中…' : '計算流日中…'}
          </p>
        </div>
      )}

      {/* 主視圖 */}
      {personal && transit && !isLoading && (
        <TransitView
          personal={personal}
          transit={transit}
          onRefresh={fetchTransit}
          refreshing={loadingTransit}
          onSaved={() => router.push('/account?section=humandesign&tab=transit')}
          personalBirth={{ date, time, city: locationLabel, timezone }}
        />
      )}

    </div>
  )
}
