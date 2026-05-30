'use client'

import type { Dayjs } from 'dayjs'

type Props = {
  value: Dayjs
  onChange: (updated: Dayjs) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

const pad = (n: number) => String(n).padStart(2, '0')

// Snap minute to nearest 5-min grid; returns adjusted minute and hour carry (0 or 1)
export const normalizeTo5Min = (rawMinute: number): { minute: number; carryHour: number } => {
  const snapped = Math.round(rawMinute / 5) * 5
  return snapped >= 60 ? { minute: 0, carryHour: 1 } : { minute: snapped, carryHour: 0 }
}

export default function TimeSelect({ value, onChange }: Props) {
  const { minute, carryHour } = normalizeTo5Min(value.minute())
  const hour = (value.hour() + carryHour) % 24

  return (
    <div className="flex items-center gap-0.5 h-[28px] border border-[#2b1f14] bg-[#efe5d0] px-1.5">
      <select
        aria-label="Hour"
        value={hour}
        onChange={e => onChange(value.hour(Number(e.target.value)).minute(minute))}
        className="bg-transparent font-mono text-[12.5px] text-[#2b1f14] border-none outline-none appearance-none cursor-pointer"
        style={{ WebkitAppearance: 'none' }}
      >
        {HOURS.map(h => (
          <option key={h} value={h}>{pad(h)}</option>
        ))}
      </select>
      <span className="font-mono text-[12.5px] text-[#2b1f14] select-none">:</span>
      <select
        aria-label="Minute"
        value={minute}
        onChange={e => onChange(value.hour(hour).minute(Number(e.target.value)))}
        className="bg-transparent font-mono text-[12.5px] text-[#2b1f14] border-none outline-none appearance-none cursor-pointer"
        style={{ WebkitAppearance: 'none' }}
      >
        {MINUTES.map(m => (
          <option key={m} value={m}>{pad(m)}</option>
        ))}
      </select>
    </div>
  )
}
