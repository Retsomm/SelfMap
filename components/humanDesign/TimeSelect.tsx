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
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Snaps a raw minute value to the nearest 5-minute increment.
 * When the snapped value reaches 60 it wraps to 0 and signals an hour carry.
 *
 * @param rawMinute - raw minute (0–59)
 * @returns `{ minute, carryHour }` where carryHour is 1 when the snap rolls over
 * @example normalizeTo5Min(58) // → { minute: 0, carryHour: 1 }
 * @example normalizeTo5Min(2)  // → { minute: 0, carryHour: 0 }
 */
export const normalizeTo5Min = (rawMinute: number): { minute: number; carryHour: number } => {
  const snapped = Math.round(rawMinute / 5) * 5
  return snapped >= 60 ? { minute: 0, carryHour: 1 } : { minute: snapped, carryHour: 0 }
}

export default function TimeSelect({ value, onChange }: Props) {
  if (!value?.isValid?.()) {
    console.error('[TimeSelect] received invalid dayjs value; rendering disabled fallback')
    return (
      <div className="flex items-center gap-0.5 h-[28px] opacity-40 pointer-events-none">
        <span className="font-mono text-[12.5px] text-[var(--ink)]">--:--</span>
      </div>
    )
  }

  // normalizeTo5Min returns the snapped minute and a carry flag when rounding
  // pushes past 59; carryHour rolls the hour forward by 1 (mod 24)
  const { minute, carryHour } = normalizeTo5Min(value.minute())
  const hour = (value.hour() + carryHour) % 24

  return (
    <div className="flex items-center gap-0.5 h-[28px]">
      <Select
        value={String(hour)}
        onValueChange={(v: string) => onChange(value.hour(Number(v)).minute(minute))}
      >
        <SelectTrigger className="h-[28px] w-[52px]" aria-label="Hour">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map(h => (
            <SelectItem key={h} value={String(h)}>{pad(h)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="font-mono text-[12.5px] text-[var(--ink)] select-none">:</span>

      <Select
        value={String(minute)}
        onValueChange={(v: string) => onChange(value.hour(hour).minute(Number(v)))}
      >
        <SelectTrigger className="h-[28px] w-[52px]" aria-label="Minute">
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
