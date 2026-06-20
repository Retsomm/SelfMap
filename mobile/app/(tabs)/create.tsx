import { useAuth } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { createChart, type CreateChartPayload } from '@/lib/api'
import { DatePicker, TimePicker } from '@/components/DateTimePicker'
import CitySearchField from '@/components/CitySearchField'

const TODAY = new Date()

export default function CreateScreen() {
  const { getToken } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [date, setDate] = useState({
    year: TODAY.getFullYear() - 30,
    month: 1,
    day: 1,
  })
  const [time, setTime] = useState({ hour: 12, minute: 0 })
  const [city, setCity] = useState('')
  const [timezone, setTimezone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const birthDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  const birthTime = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`

  async function handleSubmit() {
    if (!city || !timezone) {
      Alert.alert('請選擇出生城市', '輸入城市名稱後從清單中選擇')
      return
    }
    setSubmitting(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('未登入')

      const payload: CreateChartPayload = {
        birthDate,
        birthTime,
        birthCity: city,
        timezone,
        name: name || undefined,
      }

      const { chartId } = await createChart(token, payload)
      router.replace(`/chart/${chartId}`)
    } catch (err: unknown) {
      Alert.alert('建立失敗', err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <Text style={styles.heading}>建立圖表</Text>

        <Section label="圖表名稱（選填）">
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="例如：我的本命盤"
            placeholderTextColor="#555577"
          />
        </Section>

        <Section label="出生日期">
          <Text style={styles.previewText}>{birthDate}</Text>
          <DatePicker value={date} onChange={setDate} />
        </Section>

        <Section label="出生時間">
          <Text style={styles.previewText}>{birthTime}</Text>
          <TimePicker value={time} onChange={setTime} />
        </Section>

        <Section label="出生城市">
          <CitySearchField
            city={city}
            timezone={timezone}
            onSelect={(c, tz) => { setCity(c); setTimezone(tz) }}
          />
        </Section>

        <Pressable
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? '計算中…' : '建立圖表'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  inner: { padding: 24, gap: 20, paddingBottom: 48 },
  heading: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 14, color: '#8888aa', fontWeight: '600' },
  previewText: { fontSize: 16, color: '#a78bfa', fontWeight: '600', textAlign: 'center' },
  textInput: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2e2e4e',
  },
  button: {
    backgroundColor: '#a78bfa',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
