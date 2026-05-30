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
  id?: string
}

export default function DateSelect({ value, onChange, minDate, maxDate, id }: Props) {
  // Guard against invalid dayjs instances passed by the caller
  const safeValue = value?.isValid?.() ? value : dayjs()
  // Convert to native Date for DayPicker's selected / defaultMonth props
  const selected = safeValue.toDate()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-label={`Open date picker, selected date ${safeValue.format('YYYY/MM/DD')}`}
          className="h-[28px] w-[130px] border border-[var(--ink)] bg-[var(--paper-deep)] px-2 font-mono text-[12.5px] text-[var(--ink)] text-left cursor-pointer outline-none focus:ring-1 focus:ring-[var(--ink)]"
        >
          {safeValue.format('YYYY/MM/DD')}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          // defaultMonth keeps the calendar view centred on the current value
          defaultMonth={selected}
          onSelect={date => { if (date) onChange(dayjs(date)) }}
          disabled={date => {
            // Boundary checks use 'day' granularity to ignore time components
            if (minDate && dayjs(date).isBefore(minDate, 'day')) return true
            if (maxDate && dayjs(date).isAfter(maxDate, 'day')) return true
            return false
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
