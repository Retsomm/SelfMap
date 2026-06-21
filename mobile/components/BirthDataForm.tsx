/**
 * 可重用出生資料表單 — 受控元件，由父層管理狀態。
 */
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { DatePicker, TimePicker } from '@/components/DateTimePicker'
import CitySearchField from '@/components/CitySearchField'

const T = {
  surface: '#1e1e2e', border: '#2a2a3e',
  accent: '#a78bfa', text: '#ffffff', sub: '#8888aa', muted: '#555577',
}

const TODAY = new Date()

export type BirthFormData = {
  name: string
  date: { year: number; month: number; day: number }
  time: { hour: number; minute: number }
  city: string
  timezone: string
}

export function defaultBirthFormData(): BirthFormData {
  return {
    name: '',
    date: { year: TODAY.getFullYear() - 30, month: 1, day: 1 },
    time: { hour: 12, minute: 0 },
    city: '',
    timezone: '',
  }
}

type Props = {
  value: BirthFormData
  onChange: (data: BirthFormData) => void
  namePlaceholder?: string
  fieldError?: string | null
  onClearError?: () => void
}

export default function BirthDataForm({
  value,
  onChange,
  namePlaceholder = '例如：本人',
  fieldError,
  onClearError,
}: Props) {
  const birthDate = `${value.date.year}-${String(value.date.month).padStart(2, '0')}-${String(value.date.day).padStart(2, '0')}`
  const birthTime = `${String(value.time.hour).padStart(2, '0')}:${String(value.time.minute).padStart(2, '0')}`

  return (
    <View style={s.root}>
      <View style={s.section}>
        <Text style={s.label}>名稱（選填）</Text>
        <TextInput
          style={s.textInput}
          value={value.name}
          onChangeText={name => onChange({ ...value, name })}
          placeholder={namePlaceholder}
          placeholderTextColor={T.muted}
        />
      </View>

      <View style={s.section}>
        <Text style={s.label}>出生日期</Text>
        <Text style={s.previewText}>{birthDate}</Text>
        <DatePicker value={value.date} onChange={date => onChange({ ...value, date })} />
      </View>

      <View style={s.section}>
        <Text style={s.label}>出生時間</Text>
        <Text style={s.previewText}>{birthTime}</Text>
        <TimePicker value={value.time} onChange={time => onChange({ ...value, time })} />
      </View>

      <View style={s.section}>
        <Text style={s.label}>出生城市</Text>
        <CitySearchField
          city={value.city}
          timezone={value.timezone}
          onSelect={(city, timezone) => {
            onChange({ ...value, city, timezone })
            onClearError?.()
          }}
        />
        {fieldError ? <Text style={s.errorText}>{fieldError}</Text> : null}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root:        { gap: 16 },
  section:     { gap: 8 },
  label:       { fontSize: 14, color: T.sub, fontWeight: '600' },
  previewText: { fontSize: 16, color: T.accent, fontWeight: '600', textAlign: 'center' },
  textInput:   { backgroundColor: T.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: T.text, fontSize: 15, borderWidth: 1, borderColor: T.border },
  errorText:   { color: '#ff7070', fontSize: 13, marginTop: 4 },
})
