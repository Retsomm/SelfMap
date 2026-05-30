'use client'

import type { Dayjs } from 'dayjs'

type Props = {
  value: Dayjs
  onChange: (updated: Dayjs) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

const pad = (n: number) => String(n).padStart(2, '0')

export default function TimeSelect({ value, onChange }: Props) {
  const hour = value.hour()
  const minute = Math.round(value.minute() / 5) * 5 % 60

  return (
    <div className="flex items-center gap-0.5 h-[28px] border border-[#2b1f14] bg-[#efe5d0] px-1.5">
      <select
        value={hour}
        onChange={e => onChange(value.hour(Number(e.target.value)))}
        className="bg-transparent font-mono text-[12.5px] text-[#2b1f14] border-none outline-none appearance-none cursor-pointer"
        style={{ WebkitAppearance: 'none' }}
      >
        {HOURS.map(h => (
          <option key={h} value={h}>{pad(h)}</option>
        ))}
      </select>
      <span className="font-mono text-[12.5px] text-[#2b1f14] select-none">:</span>
      <select
        value={minute}
        onChange={e => onChange(value.minute(Number(e.target.value)))}
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
