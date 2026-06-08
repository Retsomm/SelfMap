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
          className="h-8 w-32.5 border border-(--ink) bg-(--paper-deep) px-2 font-mono text-[16px] text-(--ink) text-left cursor-pointer outline-none focus:ring-1 focus:ring-(--ink)"
        >
          {safeValue.format('YYYY/MM/DD')}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          captionLayout="dropdown"
          startMonth={new Date((minDate ?? dayjs().subtract(120, 'year')).year(), 0)}
          endMonth={new Date((maxDate ?? dayjs()).year(), 11)}
          onSelect={date => { if (date) onChange(dayjs(date)) }}
          disabled={date => {
            if (minDate && dayjs(date).isBefore(minDate, 'day')) return true
            if (maxDate && dayjs(date).isAfter(maxDate, 'day')) return true
            return false
          }}
          classNames={{
            month_caption: 'flex justify-center items-center h-7 px-1',
            caption_label: 'hidden',
            nav: 'hidden',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
