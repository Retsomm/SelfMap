'use client'

import type { Dayjs } from 'dayjs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  value: Dayjs
  onChange: (updated: Dayjs) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Returns a new Dayjs with the hour changed, preserving the existing minute.
 * Dayjs `.hour()` already preserves other fields, but this makes the intent explicit.
 */
const setHourPreserveMinute = (valueObj: Dayjs, newHour: number): Dayjs =>
  valueObj.hour(newHour)

/**
 * Returns a new Dayjs with the minute changed, preserving the existing hour.
 * Re-applies the current hour to guard against any implicit DST shift from `.minute()`.
 */
const setMinutePreserveHour = (valueObj: Dayjs, newMinute: number): Dayjs =>
  valueObj.hour(valueObj.hour()).minute(newMinute)

export default function TimeSelect({ value, onChange }: Props) {
  if (!value?.isValid?.()) {
    return (
      <div className="flex items-center gap-0.5 h-8 opacity-40 pointer-events-none">
        <span className="font-mono text-[16px] text-(--ink)">--:--</span>
      </div>
    )
  }

  const hour = value.hour()
  const minute = value.minute()

  return (
    <div className="flex items-center gap-0.5 h-8">
      <Select
        value={String(hour)}
        onValueChange={(v: string) => onChange(setHourPreserveMinute(value, Number(v)))}
      >
        <SelectTrigger className="h-8 w-16" aria-label="Hour">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map(h => (
            <SelectItem key={h} value={String(h)}>{pad(h)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="font-mono text-[16px] text-(--ink) select-none">:</span>

      <Select
        value={String(minute)}
        onValueChange={(v: string) => onChange(setMinutePreserveHour(value, Number(v)))}
      >
        <SelectTrigger className="h-8 w-16" aria-label="Minute">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map(m => (
            <SelectItem key={m} value={String(m)}>{pad(m)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
