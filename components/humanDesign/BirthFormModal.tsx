'use client'

import { useState, useEffect, useRef } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import DateSelect from '@/components/humanDesign/DateSelect'
import TimeSelect from '@/components/humanDesign/TimeSelect'
import LocationPicker from '@/components/humanDesign/LocationPicker'

export type BirthFormState = {
  label: string
  date: Dayjs
  time: Dayjs
  timezone: string
  location: string
}

export const DEFAULT_BIRTH_FORM: BirthFormState = {
  label: '',
  date: dayjs('1990-01-01'),
  time: dayjs('1990-01-01 12:00'),
  timezone: 'Asia/Taipei',
  location: '台北, 台灣',
}

interface BirthFormModalProps {
  title: string
  initial: BirthFormState
  saving: boolean
  saveLabel?: string
  onSave: (form: BirthFormState) => void
  onCancel: () => void
}

export function BirthFormModal({
  title,
  initial,
  saving,
  saveLabel = '儲存',
  onSave,
  onCancel,
}: BirthFormModalProps) {
  const [form, setForm] = useState<BirthFormState>(initial)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="birthFormModalTitle"
        tabIndex={-1}
        className="bg-(--paper) border border-(--ink) px-7 py-6 w-full max-w-md mx-4 shadow-xl outline-none flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="birthFormModalTitle" className="font-mono text-[13px] tracking-widest uppercase text-(--ink)">
          {title}
        </h2>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-[11px] tracking-widest uppercase text-(--ink-soft)">
            為此檔案命名
          </label>
          <input
            type="text"
            value={form.label}
            onChange={e => setForm(prev => ({ ...prev, label: e.target.value }))}
            placeholder="為此檔案命名"
            className="font-mono text-[16px] tracking-[0.04em] border border-(--ink) bg-(--paper) text-(--ink) px-3 py-1.5 w-full outline-none placeholder:text-(--ink-soft)"
            autoFocus
          />
        </div>

        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] tracking-widest uppercase text-(--ink-soft)">
              日期
            </label>
            <DateSelect
              value={form.date}
              onChange={d => setForm(prev => ({ ...prev, date: d }))}
              minDate={dayjs('1900-01-01')}
              maxDate={dayjs('2040-12-31')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] tracking-widest uppercase text-(--ink-soft)">
              時間
            </label>
            <TimeSelect
              value={form.time}
              onChange={tt => setForm(prev => ({ ...prev, time: tt }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-[11px] tracking-widest uppercase text-(--ink-soft)">
            地點
          </label>
          <LocationPicker
            value={form.location}
            onSelect={(tz, label) => setForm(prev => ({ ...prev, timezone: tz, location: label }))}
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onCancel}
            disabled={saving}
            className="font-mono text-[12px] tracking-widest uppercase text-(--ink-soft) border border-(--ink-soft) px-4 py-1.5 cursor-pointer transition-colors duration-120 hover:text-(--ink) hover:border-(--ink) disabled:opacity-40"
          >
            取消
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.label.trim()}
            className="font-mono text-[12px] tracking-widest uppercase text-(--paper) bg-(--ink) border border-(--ink) px-4 py-1.5 cursor-pointer transition-colors duration-120 hover:bg-transparent hover:text-(--ink) disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? '儲存中…' : saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
