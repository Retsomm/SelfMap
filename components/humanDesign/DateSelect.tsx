'use client'

import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Props = {
  value: Dayjs
  onChange: (d: Dayjs) => void
  minDate?: Dayjs
  maxDate?: Dayjs
}

export default function DateSelect({ value, onChange, minDate, maxDate }: Props) {
  const selected = value.toDate()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-[28px] w-[130px] border border-[var(--ink)] bg-[var(--paper-deep)] px-2 font-mono text-[12.5px] text-[var(--ink)] text-left cursor-pointer outline-none focus:ring-1 focus:ring-[var(--ink)]"
        >
          {value.format('YYYY/MM/DD')}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={date => { if (date) onChange(dayjs(date)) }}
          disabled={date => {
            if (minDate && dayjs(date).isBefore(minDate, 'day')) return true
            if (maxDate && dayjs(date).isAfter(maxDate, 'day')) return true
            return false
          }}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  )
}
