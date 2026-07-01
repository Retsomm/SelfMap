'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import TimeSelect from '@/components/humanDesign/TimeSelect'
import DateSelect from '@/components/humanDesign/DateSelect'
import dayjs, { type Dayjs } from 'dayjs'
import LocationPicker from '@/components/humanDesign/LocationPicker'
import type { HdResult } from '@/lib/buildAiPrompt'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useBirthProfiles, type BirthProfile } from '@/lib/useBirthProfiles'

const CompositeView = dynamic(() => import('@/components/humanDesign/CompositeView'), { ssr: false })

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

const profileToInputs = (p: BirthProfile): FormInputs => ({
  birthDate: dayjs(p.date),
  birthTime: dayjs(`${p.date} ${p.time}`),
  timezone: p.timezone,
  locationLabel: p.location,
})

export default function CompositeTab() {
  const router = useRouter()
  const { profiles, isSignedIn } = useBirthProfiles()
  const hasAutoFilledRef = useRef(false)

  const [inputsA, setInputsA] = useState<FormInputs>(() => ({
    ...DEFAULT_INPUTS,
    locationLabel: '台北, 台灣',
  }))
  const [inputsB, setInputsB] = useState<FormInputs>(() => ({
    ...DEFAULT_INPUTS,
    birthDate: dayjs('1995-06-15'),
    birthTime: dayjs('1995-06-15 08:00'),
    locationLabel: '台北, 台灣',
  }))

  // Auto-fill from saved profiles on mount
  useEffect(() => {
    if (hasAutoFilledRef.current) return
    if (!isSignedIn || profiles.length === 0) return
    hasAutoFilledRef.current = true
    setInputsA(profileToInputs(profiles[0]))
    if (profiles.length >= 2) setInputsB(profileToInputs(profiles[1]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, profiles])
  const [compositeResultA, setCompositeResultA] = useState<HdResult | null>(null)
  const [compositeResultB, setCompositeResultB] = useState<HdResult | null>(null)
  const [compositeLoading, setCompositeLoading] = useState(false)
  const [compositeError, setCompositeError] = useState('')

  const calculateComposite = useCallback(async () => {
    setCompositeError('')
    setCompositeLoading(true)
    window.umami?.track('composite-calculate')
    try {
      const { computeHdResult } = await import('@/lib/computeHdResult')
      const dateA = inputsA.birthDate.format('YYYY-MM-DD')
      const timeA = inputsA.birthTime.format('HH:mm')
      const dateB = inputsB.birthDate.format('YYYY-MM-DD')
      const timeB = inputsB.birthTime.format('HH:mm')
      const [rA, rB] = await Promise.all([
        computeHdResult(dateA, timeA, inputsA.timezone),
        computeHdResult(dateB, timeB, inputsB.timezone),
        new Promise(res => setTimeout(res, 800)),
      ]) as [HdResult, HdResult, void]
      setCompositeResultA(rA)
      setCompositeResultB(rB)
    } catch (err) {
      console.error('[calculateComposite]', err)
      setCompositeError('合圖計算失敗，請稍後再試')
    } finally {
      setCompositeLoading(false)
    }
  }, [inputsA, inputsB])

  return (
    <>
      <CompositePersonForm
        label="人物 A — 人物 A"
        accentColor="#c8553d"
        inputs={inputsA}
        onInputsChange={inputs => { setInputsA(inputs); setCompositeResultA(null); setCompositeResultB(null) }}
        profiles={profiles}
        isSignedIn={isSignedIn}
      />

      <CompositePersonForm
        label="人物 B — 人物 B"
        accentColor="var(--ink)"
        inputs={inputsB}
        onInputsChange={inputs => { setInputsB(inputs); setCompositeResultA(null); setCompositeResultB(null) }}
        profiles={profiles}
        isSignedIn={isSignedIn}
      />

      <div className="hd-print-hide flex items-center gap-4 flex-wrap">
        <button
          className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-[var(--paper)] bg-[var(--ink)] border border-[var(--ink)] px-6 py-2.5 cursor-pointer whitespace-nowrap transition-colors duration-[120ms] hover:bg-[var(--crimson)] hover:border-[var(--crimson)] disabled:opacity-45 disabled:cursor-not-allowed"
          onClick={calculateComposite}
          disabled={compositeLoading}
        >
          {compositeLoading ? '合圖計算中…' : '開始合圖'}
        </button>
        {compositeError && (
          <div className="font-mono text-[12px] text-[var(--crimson)] py-1.5 px-2 border border-[var(--crimson)]">
            {compositeError}
          </div>
        )}
      </div>

      {compositeResultA && compositeResultB && (
        <div className="relative">
          {compositeLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-(--paper)/70 backdrop-blur-[2px]">
              <LoadingSpinner />
            </div>
          )}
          <CompositeView
            resultA={compositeResultA}
            resultB={compositeResultB}
            dateA={inputsA.birthDate.format('YYYY-MM-DD')}
            timeA={inputsA.birthTime.format('HH:mm')}
            locationA={inputsA.locationLabel}
            timezoneA={inputsA.timezone}
            dateB={inputsB.birthDate.format('YYYY-MM-DD')}
            timeB={inputsB.birthTime.format('HH:mm')}
            locationB={inputsB.locationLabel}
            timezoneB={inputsB.timezone}
            onSaved={() => router.push('/account?section=humandesign')}
          />
        </div>
      )}
    </>
  )
}

// ── CompositePersonForm ─────────────────────────────────────────────────────

interface CompositePersonFormProps {
  label: string
  accentColor: string
  inputs: FormInputs
  onInputsChange: (inputs: FormInputs) => void
  profiles: BirthProfile[]
  isSignedIn: boolean
}

function CompositePersonForm({ label, accentColor, inputs, onInputsChange, profiles, isSignedIn }: CompositePersonFormProps) {
  const { birthDate, birthTime, locationLabel } = inputs

  const setBirthDate = (d: Dayjs) => onInputsChange({ ...inputs, birthDate: d })
  const setBirthTime = (tt: Dayjs) => onInputsChange({ ...inputs, birthTime: tt })
  const handleLocation = (tz: string, loc: string) => onInputsChange({ ...inputs, timezone: tz, locationLabel: loc })

  const fillFromProfile = (p: BirthProfile) => {
    onInputsChange({
      birthDate: dayjs(p.date),
      birthTime: dayjs(`${p.date} ${p.time}`),
      timezone: p.timezone,
      locationLabel: p.location,
    })
  }

  return (
    <div
      className="hd-print-hide py-3.5 px-5 border border-(--ink) bg-(--paper-deep) border-l-4 flex flex-col gap-3"
      style={{ borderLeftColor: accentColor }}
    >
      {isSignedIn && profiles.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-(--ink-soft)">
            從個人檔案載入:
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
        <h4
          className="font-sans text-[12px] md:text-base font-semibold uppercase tracking-[0.18em] m-0 p-0 border-none whitespace-nowrap self-end pb-1.5"
          style={{ color: accentColor }}
        >
          {label}
        </h4>
        <div className="flex gap-2 flex-wrap items-end flex-1">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[12px] md:text-base tracking-[0.1em] uppercase text-(--ink-soft)">日期</label>
            <DateSelect value={birthDate} onChange={setBirthDate} minDate={dayjs('1900-01-01')} maxDate={dayjs('2040-12-31')} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[12px] md:text-base tracking-[0.1em] uppercase text-(--ink-soft)">時間</label>
            <TimeSelect value={birthTime} onChange={setBirthTime} />
          </div>
          <LocationPicker value={locationLabel} onSelect={handleLocation} />
        </div>
      </div>
    </div>
  )
}
