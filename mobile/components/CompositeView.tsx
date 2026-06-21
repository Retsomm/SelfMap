/**
 * 合圖分析 View — 兩個出生資料表單，計算後存一筆並顯示合圖 Body Graph 與結果。
 */
import { useAuth } from '@clerk/expo'
import { useCallback, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  type CreateCompositeResult,
  createCompositeChart,
} from '@/lib/api'
import BirthDataForm, { type BirthFormData, defaultBirthFormData } from '@/components/BirthDataForm'
import { BirthProfilePickerModal } from '@/components/BirthProfilePickerModal'
import { AppliedProfileCard } from '@/components/AppliedProfileCard'
import BodyGraph from '@/components/BodyGraph'
import { formToBirthDate, formToBirthTime } from '@/lib/birthFormUtils'
import { type BirthProfile, loadProfiles } from '@/lib/birthProfiles'
import { Colors, Radius, Spacing } from '@/constants/tokens'

const CONN_CFG = {
  electromagnetic: { label: '電磁連結', color: Colors.em,    bg: Colors.emDimBg,     icon: '⚡', desc: '兩人各有通道一半，在一起時被完整激活，帶來強烈吸引力。' },
  companionship:   { label: '陪伴連結', color: Colors.comp,  bg: Colors.compDimBg,   icon: '🤝', desc: '兩人同時擁有完整通道，帶來穩定陪伴感。' },
  compromise:      { label: '妥協連結', color: Colors.compro,bg: Colors.comproDimBg, icon: '⚖️', desc: '一方有完整通道，另一方只有一端，容易出現調整需求。' },
  dominance:       { label: '支配連結', color: Colors.dom,   bg: Colors.domDimBg,    icon: '🎯', desc: '能量可能出現主導或覆蓋的動態。' },
} as const

const THEME_DESC: Record<string, string> = {
  '9+0':  '你們合圖激活了全部 9 個中心，幾乎不需要外部補全。',
  '8+1':  '你們合圖激活了 8 個中心，對外界保有一份彈性。',
  '7+2':  '你們合圖激活了 7 個中心，對特定議題保有學習空間。',
  '6+3+': '你們合圖激活了 6 個或更少中心，容易被第三方影響。',
}

const LIB_TO_CHART: Record<string, string> = { ego: 'heart', solarPlexus: 'solar' }
const normCenter  = (id: string) => LIB_TO_CHART[id] ?? id
const normChannel = (id: string) => id.startsWith('c') ? id : `c${id}`

function buildBodyGraphProps(result: CreateCompositeResult) {
  const definedCenterIds  = new Set(result.compositeDefinedCenterIds.map(normCenter))
  const definedChannelIds = new Set<string>([
    ...result.electromagnetic.map(c => normChannel(c.channelId)),
    ...result.companionship.map(c => normChannel(c.channelId)),
    ...result.compromise.map(c => normChannel(c.channelId)),
    ...result.dominance.map(c => normChannel(c.channelId)),
  ])
  const activations: Record<number, { c?: boolean; u?: boolean }> = {}
  for (const type of ['electromagnetic', 'companionship', 'compromise', 'dominance'] as const) {
    for (const conn of result[type]) {
      for (const g of conn.aGates) activations[g] = { ...activations[g], c: true }
      for (const g of conn.bGates) activations[g] = { ...activations[g], u: true }
    }
  }
  return { definedCenterIds, definedChannelIds, activations }
}


export default function CompositeView() {
  const { getToken } = useAuth()
  const scrollRef = useRef<ScrollView>(null)

  const [formA, setFormA] = useState<BirthFormData>(defaultBirthFormData)
  const [formB, setFormB] = useState<BirthFormData>(defaultBirthFormData)
  const [errorA, setErrorA] = useState<string | null>(null)
  const [errorB, setErrorB] = useState<string | null>(null)
  const [result, setResult]       = useState<CreateCompositeResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [savedProfiles, setSavedProfiles] = useState<BirthProfile[]>([])
  const [pickerTarget, setPickerTarget] = useState<'A' | 'B' | null>(null)
  const [appliedA, setAppliedA] = useState<BirthProfile | null>(null)
  const [appliedB, setAppliedB] = useState<BirthProfile | null>(null)

  const refreshProfiles = useCallback(async () => {
    setSavedProfiles(await loadProfiles())
  }, [])

  useFocusEffect(useCallback(() => { void refreshProfiles() }, [refreshProfiles]))

  function applyProfile(p: BirthProfile) {
    const patch = { date: p.date, time: p.time, city: p.city, timezone: p.timezone }
    if (pickerTarget === 'A') {
      setFormA(f => ({ ...f, ...patch, name: f.name || p.label }))
      setErrorA(null)
      setAppliedA(p)
    } else if (pickerTarget === 'B') {
      setFormB(f => ({ ...f, ...patch, name: f.name || p.label }))
      setErrorB(null)
      setAppliedB(p)
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
  }

  const calculate = async () => {
    let valid = true
    if (!formA.city || !formA.timezone) { setErrorA('請輸入城市名稱並從清單中選擇'); valid = false }
    if (!formB.city || !formB.timezone) { setErrorB('請輸入城市名稱並從清單中選擇'); valid = false }
    if (!valid) return

    setSubmitting(true)
    setSubmitError(null)
    setResult(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('未登入')

      const data = await createCompositeChart(token, {
        personA: {
          name:      formA.name || undefined,
          birthDate: formToBirthDate(formA),
          birthTime: formToBirthTime(formA),
          birthCity: formA.city,
          timezone:  formA.timezone,
        },
        personB: {
          name:      formB.name || undefined,
          birthDate: formToBirthDate(formB),
          birthTime: formToBirthTime(formB),
          birthCity: formB.city,
          timezone:  formB.timezone,
        },
      })

      setResult(data)
      scrollRef.current?.scrollTo({ y: 0, animated: true })
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : '發生未知錯誤，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => { setResult(null); setSubmitError(null) }

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={s.inner}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {!result ? (
        <>
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>人物 A</Text>
              {savedProfiles.length > 0 && !appliedA && (
                <Pressable style={s.quickApplyBtn} onPress={() => setPickerTarget('A')}>
                  <Text style={s.quickApplyText}>⚡ 套用</Text>
                </Pressable>
              )}
            </View>
            {appliedA ? (
              <AppliedProfileCard profile={appliedA} onClear={() => setAppliedA(null)} />
            ) : (
              <BirthDataForm
                value={formA}
                onChange={setFormA}
                namePlaceholder="例如：自己"
                fieldError={errorA}
                onClearError={() => setErrorA(null)}
              />
            )}
          </View>

          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>人物 B</Text>
              {savedProfiles.length > 0 && !appliedB && (
                <Pressable style={s.quickApplyBtn} onPress={() => setPickerTarget('B')}>
                  <Text style={s.quickApplyText}>⚡ 套用</Text>
                </Pressable>
              )}
            </View>
            {appliedB ? (
              <AppliedProfileCard profile={appliedB} onClear={() => setAppliedB(null)} />
            ) : (
              <BirthDataForm
                value={formB}
                onChange={setFormB}
                namePlaceholder="例如：對方"
                fieldError={errorB}
                onClearError={() => setErrorB(null)}
              />
            )}
          </View>

          {submitError ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>計算失敗：{submitError}</Text>
            </View>
          ) : null}

          <Pressable
            style={[s.primaryBtn, submitting && s.disabled]}
            onPress={calculate}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color={Colors.bg} />
              : <Text style={s.primaryBtnText}>計算合圖</Text>
            }
          </Pressable>

          <BirthProfilePickerModal
            visible={pickerTarget !== null}
            profiles={savedProfiles}
            onSelect={applyProfile}
            onClose={() => setPickerTarget(null)}
          />
        </>
      ) : (
        <>
          {/* 合圖 Body Graph */}
          {(() => {
            const { definedCenterIds, definedChannelIds, activations } = buildBodyGraphProps(result)
            return (
              <View style={s.card}>
                <Text style={s.sectionLabel}>合圖 Body Graph</Text>
                <Text style={[s.muted, { marginBottom: 10 }]}>
                  黑色 = {result.personA.name ?? '人物 A'}　紅色 = {result.personB.name ?? '人物 B'}
                </Text>
                <View style={s.graphContainer}>
                  <BodyGraph
                    definedCenterIds={definedCenterIds}
                    definedChannelIds={definedChannelIds}
                    activations={activations}
                    showGates
                  />
                </View>
              </View>
            )
          })()}

          {/* 合圖整合主題 */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>合圖整合主題</Text>
            <Text style={s.bigNum}>{result.integrationTheme}</Text>
            <Text style={[s.muted, { lineHeight: 20, marginBottom: 14 }]}>
              {THEME_DESC[result.integrationTheme] ?? ''}
            </Text>
            <View style={s.statRow}>
              <View style={s.statBox}>
                <Text style={s.statNum}>{result.compositeDefinedCount}</Text>
                <Text style={s.muted}>已定義中心</Text>
              </View>
              <View style={s.statBox}>
                <Text style={[s.statNum, { color: Colors.muted }]}>{result.compositeOpenCount}</Text>
                <Text style={s.muted}>開放中心</Text>
              </View>
              {result.profileResonance.length > 0 && (
                <View style={s.statBox}>
                  <Text style={[s.statNum, { color: Colors.em, fontSize: 16 }]}>
                    {result.profileResonance.join('、')} 爻
                  </Text>
                  <Text style={s.muted}>共鳴角色</Text>
                </View>
              )}
            </View>
          </View>

          {/* 連結動態 */}
          {(['electromagnetic', 'companionship', 'compromise', 'dominance'] as const).map(type => {
            const items = result[type]
            if (items.length === 0) return null
            const cfg = CONN_CFG[type]
            return (
              <View key={type} style={s.card}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                  <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.connLabel, { color: cfg.color }]}>
                      {cfg.label}（{items.length}）
                    </Text>
                    <Text style={s.muted}>{cfg.desc}</Text>
                  </View>
                </View>
                <View style={{ borderTopWidth: 1, borderColor: cfg.color + '33', marginBottom: Spacing.sm }} />
                {items.map(conn => (
                  <View key={conn.channelId} style={[s.connRow, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.connId, { color: cfg.color }]}>{conn.channelId}</Text>
                    <Text style={s.muted}>
                      {result.personA.name ?? 'A'}：{conn.aGates.join('+')} ／{' '}
                      {result.personB.name ?? 'B'}：{conn.bGates.join('+') || '—'}
                    </Text>
                  </View>
                ))}
              </View>
            )
          })}

          <Pressable style={s.outlineBtn} onPress={reset}>
            <Text style={s.outlineBtnText}>重新輸入</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  inner:          { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 48 },
  card:           { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle:      { fontSize: 13, fontWeight: '700', color: Colors.accent, letterSpacing: 0.5, textTransform: 'uppercase' },
  quickApplyBtn:  { borderWidth: 1, borderColor: Colors.accent, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, backgroundColor: Colors.accentD },
  quickApplyText: { color: Colors.accent, fontSize: 12, fontWeight: '600' },
  sectionLabel:   { fontSize: 11, fontWeight: '600', color: Colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  muted:          { fontSize: 13, color: Colors.sub },
  graphContainer: { width: '100%', aspectRatio: 700 / 1030 },
  bigNum:         { fontSize: 36, fontWeight: '800', color: Colors.accent, marginBottom: 6 },
  statRow:        { flexDirection: 'row', gap: Spacing.sm },
  statBox:        { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  statNum:        { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  connLabel:      { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  connRow:        { borderRadius: Radius.sm, padding: 10, marginBottom: 6 },
  connId:         { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  primaryBtn:     { backgroundColor: Colors.accent, borderRadius: Radius.lg, padding: 14, alignItems: 'center' },
  primaryBtnText: { color: Colors.bg, fontWeight: '700', fontSize: 15 },
  outlineBtn:     { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center' },
  outlineBtnText: { color: Colors.sub, fontSize: 13 },
  disabled:       { opacity: 0.5 },
  errorBox:       { backgroundColor: Colors.errorBg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.errorBorder },
  errorText:      { color: Colors.red, fontSize: 13 },
})
