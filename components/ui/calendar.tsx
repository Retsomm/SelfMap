'use client'

import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type CalendarProps = React.ComponentProps<typeof DayPicker>

const Calendar = ({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) => (
  <DayPicker
    showOutsideDays={showOutsideDays}
    className={cn('p-3', className)}
    classNames={{
      months: 'flex flex-col',
      month: 'space-y-2',
      month_caption: 'flex justify-center items-center relative h-7',
      caption_label: 'font-mono text-[12.5px] font-medium text-[var(--ink)]',
      nav: 'flex items-center gap-1 absolute inset-x-0 top-0 justify-between',
      button_previous: 'h-7 w-7 flex items-center justify-center opacity-60 hover:opacity-100 cursor-pointer',
      button_next: 'h-7 w-7 flex items-center justify-center opacity-60 hover:opacity-100 cursor-pointer',
      month_grid: 'w-full border-collapse',
      weekdays: 'flex',
      weekday: 'w-8 font-mono text-[11px] text-[var(--ink-soft)] text-center',
      week: 'flex w-full mt-1',
      day: 'h-8 w-8 text-center font-mono text-[12.5px] p-0 relative',
      day_button: cn(
        'h-8 w-8 flex items-center justify-center font-mono text-[12.5px] text-[var(--ink)] cursor-pointer hover:bg-[var(--tan-2)] transition-colors duration-100 w-full h-full'
      ),
      selected: '[&>button]:bg-[var(--ink)] [&>button]:text-[var(--paper)] [&>button]:hover:bg-[var(--ink)]',
      today: '[&>button]:border [&>button]:border-[var(--ink)]',
      outside: 'opacity-30',
      disabled: 'opacity-20 pointer-events-none',
      range_middle: '[&>button]:bg-[var(--tan-2)] [&>button]:rounded-none',
      hidden: 'invisible',
      ...classNames,
    }}
    components={{
      Chevron: ({ orientation }) =>
        orientation === 'left'
          ? <ChevronLeft className="h-4 w-4" />
          : <ChevronRight className="h-4 w-4" />,
    }}
    {...props}
  />
)
Calendar.displayName = 'Calendar'

export { Calendar }
