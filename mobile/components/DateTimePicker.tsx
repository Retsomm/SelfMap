import { View, Text, StyleSheet } from 'react-native'
import WheelPicker from './WheelPicker'
import { Colors, Radius } from '@/constants/tokens'

// ── 日期 ──────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 120 }, (_, i) => String(CURRENT_YEAR - i))
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

type DateValue = { year: number; month: number; day: number }

type DatePickerProps = {
  value: DateValue
  onChange: (v: DateValue) => void
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const days = Array.from(
    { length: daysInMonth(value.year, value.month) },
    (_, i) => String(i + 1).padStart(2, '0'),
  )

  function setYear(idx: number) {
    const year = CURRENT_YEAR - idx
    const maxDay = daysInMonth(year, value.month)
    onChange({ year, month: value.month, day: Math.min(value.day, maxDay) })
  }

  function setMonth(idx: number) {
    const month = idx + 1
    const maxDay = daysInMonth(value.year, month)
    onChange({ year: value.year, month, day: Math.min(value.day, maxDay) })
  }

  function setDay(idx: number) {
    onChange({ ...value, day: idx + 1 })
  }

  return (
    <View style={styles.row}>
      <View style={styles.col}>
        <Text style={styles.label}>年</Text>
        <WheelPicker items={YEARS} selectedIndex={CURRENT_YEAR - value.year} onSelect={setYear} width={88} />
      </View>
      <View style={styles.col}>
        <Text style={styles.label}>月</Text>
        <WheelPicker items={MONTHS} selectedIndex={value.month - 1} onSelect={setMonth} width={64} />
      </View>
      <View style={styles.col}>
        <Text style={styles.label}>日</Text>
        <WheelPicker items={days} selectedIndex={value.day - 1} onSelect={setDay} width={64} />
      </View>
    </View>
  )
}

// ── 時間 ──────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

type TimeValue = { hour: number; minute: number }

type TimePickerProps = {
  value: TimeValue
  onChange: (v: TimeValue) => void
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  return (
    <View style={styles.row}>
      <View style={styles.col}>
        <Text style={styles.label}>時</Text>
        <WheelPicker items={HOURS} selectedIndex={value.hour} onSelect={(i) => onChange({ ...value, hour: i })} width={80} />
      </View>
      <Text style={styles.colon}>:</Text>
      <View style={styles.col}>
        <Text style={styles.label}>分</Text>
        <WheelPicker items={MINUTES} selectedIndex={value.minute} onSelect={(i) => onChange({ ...value, minute: i })} width={80} />
      </View>
    </View>
  )
}

// ── styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  col:   { alignItems: 'center', gap: 4 },
  label: { fontSize: 12, color: Colors.muted, fontWeight: '600' },
  colon: { fontSize: 24, color: Colors.muted, marginTop: 20 },
})
