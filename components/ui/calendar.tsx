'use client'

import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import type { DropdownProps } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function CalendarDropdown({ value, onChange, options = [] }: DropdownProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)
  const selected = options.find(o => o.value === value)

  React.useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector('[data-selected="true"]') as HTMLElement | null
    el?.scrollIntoView({ block: 'center' })
  }, [open])

  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleSelect = (val: number) => {
    onChange?.({ target: { value: String(val) } } as React.ChangeEvent<HTMLSelectElement>)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="font-mono text-[12.5px] font-medium text-(--ink) bg-(--paper-deep) border border-(--ink) px-1 py-0.5 cursor-pointer outline-none focus:ring-1 focus:ring-(--ink) min-w-14"
      >
        {selected?.label ?? value}
      </button>
      {open && (
        <ul
          ref={listRef}
          className="absolute z-50 top-full left-0 mt-0.5 bg-(--paper-deep) border border-(--ink) overflow-y-auto max-h-[33vh] min-w-full shadow-md"
        >
          {options.map(opt => (
            <li
              key={opt.value}
              data-selected={opt.value === value}
              onClick={() => !opt.disabled && handleSelect(opt.value)}
              className={cn(
                'font-mono text-[12.5px] px-2 py-1 cursor-pointer',
                opt.value === value
                  ? 'bg-(--ink) text-(--paper)'
                  : 'text-(--ink) hover:bg-(--tan-2)',
                opt.disabled && 'opacity-30 pointer-events-none',
              )}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

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
      dropdowns: 'flex items-center gap-1',
      dropdown: 'font-mono text-[12.5px] font-medium text-[var(--ink)] bg-[var(--paper-deep)] border border-[var(--ink)] px-1 py-0.5 cursor-pointer outline-none focus:ring-1 focus:ring-[var(--ink)] appearance-none',
      nav: 'flex items-center gap-1 absolute inset-x-0 top-0 justify-between',
      button_previous: 'h-7 w-7 flex items-center justify-center opacity-60 hover:opacity-100 cursor-pointer',
      button_next: 'h-7 w-7 flex items-center justify-center opacity-60 hover:opacity-100 cursor-pointer',
      month_grid: 'w-full border-collapse',
      weekdays: 'flex',
      weekday: 'w-8 font-mono text-[11px] text-[var(--ink-soft)] text-center',
      week: 'flex w-full mt-1',
      day: 'h-8 w-8 text-center font-mono text-[12.5px] p-0 relative',
      day_button: 'h-8 w-8 flex items-center justify-center font-mono text-[12.5px] text-[var(--ink)] cursor-pointer hover:bg-[var(--tan-2)] transition-colors duration-100 w-full h-full',
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
      Dropdown: CalendarDropdown,
    }}
    {...props}
  />
)
Calendar.displayName = 'Calendar'

export { Calendar }
