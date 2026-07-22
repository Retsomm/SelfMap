import { useMemo } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { DatePicker, TimePicker } from '@/components/DateTimePicker'
import CitySearchField from '@/components/CitySearchField'
import { Radius, Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'

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
  onCityFocus?: () => void
}

export default function BirthDataForm({
  value,
  onChange,
  namePlaceholder = '例如：本人',
  fieldError,
  onClearError,
  onCityFocus,
}: Props) {
  const Colors = useThemeColors()
  const s = useMemo(() => createStyles(Colors), [Colors])
  const birthDate = `${value.date.year}-${String(value.date.month).padStart(2, '0')}-${String(value.date.day).padStart(2, '0')}`
  const birthTime = `${String(value.time.hour).padStart(2, '0')}:${String(value.time.minute).padStart(2, '0')}`

  // 手動選時區彈窗確定後：帶入 city/timezone 並清掉舊的欄位錯誤，跳過送出時的 matchCity。
  const handleSelectTimezone = (city: string, timezone: string) => {
    onChange({ ...value, city, timezone })
    onClearError?.()
  }

  return (
    <View style={s.root}>
      <View style={s.section}>
        <Text style={s.label}>名稱（選填）</Text>
        <TextInput
          style={s.textInput}
          value={value.name}
          onChangeText={name => onChange({ ...value, name })}
          placeholder={namePlaceholder}
          placeholderTextColor={Colors.muted}
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
          onChangeCity={(city) => {
            onChange({ ...value, city, timezone: '' })
            onClearError?.()
          }}
          onSelectTimezone={handleSelectTimezone}
          onFocus={onCityFocus}
        />
        {fieldError ? <Text style={s.errorText}>{fieldError}</Text> : null}
      </View>
    </View>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  root:        { gap: Spacing.lg },
  section:     { gap: Spacing.sm },
  label:       { fontSize: 14, color: Colors.sub, fontWeight: '600' },
  previewText: { fontSize: 16, color: Colors.accent, fontWeight: '600', textAlign: 'center' },
  textInput:   { backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: Spacing.md, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  errorText:   { color: Colors.red, fontSize: 13, marginTop: Spacing.xs },
})
