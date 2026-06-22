import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { previewChart, type CreateChartPayload } from '@/lib/api'
import { setPendingChart } from '@/lib/pendingChart'
import { DatePicker, TimePicker } from '@/components/DateTimePicker'
import CitySearchField from '@/components/CitySearchField'
import TransitView from '@/components/TransitView'
import CompositeView from '@/components/CompositeView'
import { ScreenHeader } from '@/components/ScreenHeader'
import { SubTabBar } from '@/components/SubTabBar'
import { BirthProfilePickerModal } from '@/components/BirthProfilePickerModal'
import { AppliedProfileCard } from '@/components/AppliedProfileCard'
import { Colors, Radius, Spacing } from '@/constants/tokens'
import { type BirthProfile } from '@/lib/birthProfiles'
import { useBirthProfiles } from '@/hooks/useBirthProfiles'

const TODAY = new Date()
type SubTab = 'personal' | 'composite' | 'transit'
const SUB_TABS = [
  { id: 'personal',  label: '個人' },
  { id: 'composite', label: '合圖' },
  { id: 'transit',   label: '流日' },
] as const satisfies readonly { id: SubTab; label: string }[]

// ─── Create personal chart form ───────────────────────────────────────────────

function CreatePersonalView() {
  const router = useRouter()
  const scrollRef = useRef<ScrollView>(null)

  const [name, setName] = useState('')
  const [date, setDate] = useState({ year: TODAY.getFullYear() - 30, month: 1, day: 1 })
  const [time, setTime] = useState({ hour: 12, minute: 0 })
  const [city, setCity] = useState('')
  const [timezone, setTimezone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [appliedProfile, setAppliedProfile] = useState<BirthProfile | null>(null)
  const [pickerVisible, setPickerVisible] = useState(false)
  const { profiles: savedProfiles, refresh: refreshProfiles } = useBirthProfiles()

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
      const payload: CreateChartPayload = { birthDate, birthTime, birthCity: city, timezone, name: name || undefined }
      const result = await previewChart(payload)
      setPendingChart({
        name: name || '',
        birthDate,
        birthTime,
        birthCity: city,
        timezone,
        type:             result.type,
        authority:        result.authority,
        profile:          result.profile,
        definition:       result.definition,
        centers:          result.centers,
        channels:         result.channels,
        gates:            result.gates,
        planets:          result.planets,
        personalityGates: result.personalityGates,
        designGates:      result.designGates,
        incarnationCross: result.incarnationCross,
        variables:        result.variables,
        arrows:           result.arrows,
      })
      router.push('/chart/preview')
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  function applyProfile(p: BirthProfile) {
    const [year, month, day] = p.date.split('-').map(Number)
    const [hour, minute] = p.time.split(':').map(Number)
    setDate({ year, month, day })
    setTime({ hour, minute })
    setCity(p.location)
    setTimezone(p.timezone)
    if (!name) setName(p.label)
    setFieldError(null)
    setAppliedProfile(p)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
  }

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.inner}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {savedProfiles.length > 0 && !appliedProfile && (
        <Pressable style={styles.quickApplyBtn} onPress={async () => { await refreshProfiles(); setPickerVisible(true) }}>
          <Text style={styles.quickApplyText}>⚡ 快速套用出生資料</Text>
        </Pressable>
      )}

      <Section label="圖表名稱（選填）">
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="例如：我的本命盤"
          placeholderTextColor={Colors.muted}
        />
      </Section>

      {appliedProfile ? (
        <AppliedProfileCard profile={appliedProfile} onClear={() => setAppliedProfile(null)} />
      ) : (
        <>
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
        </>
      )}

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

      <BirthProfilePickerModal
        visible={pickerVisible}
        profiles={savedProfiles}
        onSelect={applyProfile}
        onClose={() => setPickerVisible(false)}
      />
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
      <ScreenHeader title="建立圖表" />

      <SubTabBar tabs={SUB_TABS} active={subTab} onSelect={setSubTab} />

      {/* 全部保持掛載只切換 display，避免切 sub-tab 時重新 mount + fetch */}
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
  container: { flex: 1, backgroundColor: Colors.bg },

  inner:        { padding: Spacing.xl, gap: 20, paddingBottom: 48 },
  section:      { gap: Spacing.sm },
  sectionLabel: { fontSize: 14, color: Colors.sub, fontWeight: '600' },
  previewText:  { fontSize: 16, color: Colors.accent, fontWeight: '600', textAlign: 'center' },
  textInput:    { backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: Spacing.md, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  button:         { backgroundColor: Colors.accent, paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.sm },
  buttonDisabled: { opacity: 0.5 },
  buttonText:     { color: Colors.bg, fontSize: 16, fontWeight: '600' },
  errorText:      { color: Colors.red, fontSize: 13, marginTop: Spacing.xs },
  errorBox:       { backgroundColor: Colors.errorBg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.errorBorder },
  quickApplyBtn:  { borderWidth: 1, borderColor: Colors.accent, borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center', backgroundColor: Colors.accentD },
  quickApplyText: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
})
