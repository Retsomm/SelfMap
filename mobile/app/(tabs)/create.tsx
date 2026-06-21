import { useAuth } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
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
import TransitView from '@/components/TransitView'
import CompositeView from '@/components/CompositeView'

const T = {
  bg: '#0f0f1a', surface: '#1e1e2e', border: '#2a2a3e',
  accent: '#a78bfa', text: '#ffffff', sub: '#8888aa', muted: '#555577',
}

const TODAY = new Date()
type SubTab = 'personal' | 'composite' | 'transit'
const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'personal',  label: '個人' },
  { id: 'composite', label: '合圖' },
  { id: 'transit',   label: '流日' },
]

// ─── Create personal chart form ───────────────────────────────────────────────

function CreatePersonalView() {
  const { getToken } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [date, setDate] = useState({ year: TODAY.getFullYear() - 30, month: 1, day: 1 })
  const [time, setTime] = useState({ hour: 12, minute: 0 })
  const [city, setCity] = useState('')
  const [timezone, setTimezone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const birthDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  const birthTime = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`

  async function handleSubmit() {
    if (!city || !timezone) {
      setFieldError('請輸入城市名稱並從清單中選擇')
      return
    }
    setFieldError(null)
    setSubmitError(null)
    setSubmitting(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('未登入')
      const payload: CreateChartPayload = { birthDate, birthTime, birthCity: city, timezone, name: name || undefined }
      const { chartId } = await createChart(token, payload)
      router.push(`/chart/${chartId}`)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.inner}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      <Section label="圖表名稱（選填）">
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="例如：我的本命盤"
          placeholderTextColor={T.muted}
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
          onSelect={(c, tz) => { setCity(c); setTimezone(tz); setFieldError(null) }}
        />
        {fieldError ? <Text style={styles.errorText}>{fieldError}</Text> : null}
      </Section>

      {submitError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>建立失敗：{submitError}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? '計算中…' : '建立圖表'}</Text>
      </Pressable>
    </ScrollView>
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CreateScreen() {
  const [subTab, setSubTab] = useState<SubTab>('personal')

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>建立圖表</Text>
      </View>

      {/* Sub-tab bar */}
      <View style={styles.subTabBar}>
        {SUB_TABS.map(tab => (
          <Pressable
            key={tab.id}
            style={[styles.subTabItem, subTab === tab.id && styles.subTabItemActive]}
            onPress={() => setSubTab(tab.id)}
          >
            <Text style={[styles.subTabText, subTab === tab.id && styles.subTabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content — 全部保持掛載只切換 display，避免切 sub-tab 時重新 mount + fetch */}
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, display: subTab === 'personal' ? 'flex' : 'none' }}>
          <CreatePersonalView />
        </View>
        <View style={{ flex: 1, display: subTab === 'transit' ? 'flex' : 'none' }}>
          <TransitView />
        </View>
        <View style={{ flex: 1, display: subTab === 'composite' ? 'flex' : 'none' }}>
          <CompositeView />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  heading: { fontSize: 22, fontWeight: '700', color: T.text },

  subTabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.border },
  subTabItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  subTabItemActive: { borderBottomColor: T.accent },
  subTabText:       { fontSize: 14, fontWeight: '500', color: T.muted },
  subTabTextActive: { color: T.accent, fontWeight: '700' },

  inner:       { padding: 24, gap: 20, paddingBottom: 48 },
  section:     { gap: 8 },
  sectionLabel:{ fontSize: 14, color: T.sub, fontWeight: '600' },
  previewText: { fontSize: 16, color: T.accent, fontWeight: '600', textAlign: 'center' },
  textInput:   { backgroundColor: T.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: T.text, fontSize: 15, borderWidth: 1, borderColor: T.border },
  button:      { backgroundColor: T.accent, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText:  { color: T.bg, fontSize: 16, fontWeight: '600' },
  errorText:   { color: '#ff7070', fontSize: 13, marginTop: 4 },
  errorBox:    { backgroundColor: '#2a1010', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#5a2020' },
})
