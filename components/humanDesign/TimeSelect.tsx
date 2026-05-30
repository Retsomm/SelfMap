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

export default function TimeSelect({ value, onChange }: Props) {
  if (!value?.isValid?.()) {
    return (
      <div className="flex items-center gap-0.5 h-[28px] opacity-40 pointer-events-none">
        <span className="font-mono text-[12.5px] text-[var(--ink)]">--:--</span>
      </div>
    )
  }

  const hour = value.hour()
  const minute = value.minute()

  return (
    <div className="flex items-center gap-0.5 h-[28px]">
      <Select
        value={String(hour)}
        onValueChange={(v: string) => onChange(value.hour(Number(v)))}
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
