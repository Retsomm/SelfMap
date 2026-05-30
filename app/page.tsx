'use client'

import { useState, useEffect, useCallback, useRef, startTransition } from 'react'
import { DatePicker, TimePicker, ConfigProvider } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import LocationPicker from '@/components/humanDesign/LocationPicker'
import ChartView from '@/components/humanDesign/ChartView'
import { computeHdResult } from '@/lib/computeHdResult'
import type { HdResult } from '@/lib/buildAiPrompt'
import { useLang, type Lang } from '@/i18n'

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

// Returns the locale-appropriate label for the default birth location (Taipei, Taiwan)
const getDefaultLocationLabel = (lang: Lang): string =>
  lang === 'en' ? 'Taipei, Taiwan' : '台北, 台灣'

export default function HomePage() {
  const { t, lang } = useLang()

  const [inputs, setInputs] = useState<FormInputs>(() => ({
    ...DEFAULT_INPUTS,
    locationLabel: getDefaultLocationLabel(lang),
  }))
  const { birthDate, birthTime, timezone, locationLabel } = inputs
  const date = birthDate.format('YYYY-MM-DD')
  const time = birthTime.format('HH:mm')
  const setBirthDate = (d: Dayjs) => setInputs(prev => ({ ...prev, birthDate: d }))
  const setBirthTime = (t: Dayjs) => setInputs(prev => ({ ...prev, birthTime: t }))
  const setTimezone = (tz: string) => setInputs(prev => ({ ...prev, timezone: tz }))
  const setLocationLabel = (loc: string) => setInputs(prev => ({ ...prev, locationLabel: loc }))
  const [result, setResult] = useState<HdResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const triggerCalcRef = useRef(false)

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

  const calculate = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [r] = await Promise.all([
        computeHdResult(date, time, timezone),
        new Promise(res => setTimeout(res, 1000)),
      ])
      setResult(r as HdResult)
      sessionStorage.setItem('hd_inputs', JSON.stringify({ date, time, tz: timezone, loc: locationLabel }))
      sessionStorage.setItem('hd_had_result', 'true')
      sessionStorage.setItem('hd_result', serializeHdResult(r as HdResult))
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
      setIsRestoring(false)
    }
  }, [date, time, timezone, locationLabel])

  useEffect(() => {
    if (!triggerCalcRef.current) return
    triggerCalcRef.current = false
    calculate()
  }, [calculate])

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-14 pb-20 pt-[72px]">

        <header className="flex justify-center mb-6 gap-6">
          <h1 className="font-serif font-medium italic text-[clamp(36px,4vw,56px)] leading-[0.95] tracking-[-0.01em] text-center m-0">
            {t('home.title')}
          </h1>
        </header>

        <div className="flex flex-col gap-5">

          {/* Input row */}
          <div className="hd-print-hide py-3.5 px-5 border border-[var(--ink)] bg-[var(--paper-deep)] flex items-end gap-5 flex-wrap max-[640px]:flex-col max-[640px]:items-stretch">
            <h4 className="font-sans text-[12px] md:text-base font-semibold uppercase tracking-[0.18em] text-[var(--ink)] m-0 p-0 border-none whitespace-nowrap self-end pb-1.5">
              {t('home.inputLabel')}
            </h4>
            <div className="flex gap-2 flex-wrap items-end flex-1">
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: '#2b1f14',
                    colorBgContainer: '#efe5d0',
                    colorText: '#2b1f14',
                    colorBorder: '#2b1f14',
                    colorBgElevated: '#efe5d0',
                    colorTextLightSolid: '#efe5d0',
                    controlItemBgActive: '#c9aa78',
                    controlItemBgActiveHover: '#b89968',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12.5,
                    controlHeight: 28,
                  },
                }}
              >
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[12px] md:text-base tracking-[0.1em] uppercase text-[var(--ink-soft)]">{t('home.dateLabel')}</label>
                  <DatePicker
                    value={birthDate}
                    onChange={(d) => { if (d) setBirthDate(d) }}
                    format="YYYY/MM/DD"
                    minDate={dayjs('1900-01-01')}
                    maxDate={dayjs('2040-12-31')}
                    allowClear={false}
                    style={{ width: 130 }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[12px] md:text-base tracking-[0.1em] uppercase text-[var(--ink-soft)]">{t('home.timeLabel')}</label>
                  <TimePicker
                    value={birthTime}
                    onChange={(t) => { if (t) setBirthTime(t) }}
                    format="HH:mm"
                    minuteStep={5}
                    allowClear={false}
                    style={{ width: 90 }}
                  />
                </div>
              </ConfigProvider>
              <LocationPicker
                value={locationLabel}
                onSelect={(tz, label) => {
                  setTimezone(tz)
                  setLocationLabel(label)
                }}
              />
              <button
                className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-[var(--paper)] bg-[var(--ink)] border border-[var(--ink)] px-4 py-1.5 cursor-pointer whitespace-nowrap transition-colors duration-[120ms] hover:bg-[var(--crimson)] hover:border-[var(--crimson)] disabled:opacity-45 disabled:cursor-not-allowed"
                onClick={calculate}
                disabled={loading}
              >
                {loading ? (isRestoring ? t('home.loading') : t('home.calculating')) : t('home.generate')}
              </button>
              {error && (
                <div className="font-mono text-[12px] md:text-base text-[var(--crimson)] mt-2 py-1.5 px-2 border border-[var(--crimson)] tracking-[0.02em]">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Chart view */}
          {result && (
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-20 bg-(--paper)/70 backdrop-blur-[2px]">
                  <span className="font-mono text-[12px] md:text-base tracking-[0.18em] uppercase text-(--ink-soft)">
                    {isRestoring ? t('home.loading') : t('home.calculating')}
                  </span>
                </div>
              )}
              <ChartView
                result={result}
                date={date}
                time={time}
                locationLabel={locationLabel}
                timezone={timezone}
              />
            </div>
          )}

        </div>
      </div>
    </>
  )
}
