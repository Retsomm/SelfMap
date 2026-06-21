/**
 * 合圖分析 View — 兩個出生資料表單，計算後存一筆並顯示合圖 Body Graph 與結果。
 */
import { useAuth } from '@clerk/expo'
import { useRef, useState } from 'react'
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
import BodyGraph from '@/components/BodyGraph'

const T = {
  bg: '#0f0f1a', surface: '#1e1e2e', border: '#2a2a3e',
  accent: '#a78bfa', accentD: '#2e1e4e',
  text: '#ffffff', sub: '#8888aa', muted: '#555577', red: '#ff6b6b',
  em: '#f59e0b', comp: '#60a5fa', compro: '#c084fc', dom: '#6b7280',
}

const CONN_CFG = {
  electromagnetic: { label: '電磁連結', color: T.em,    bg: '#1a1500', icon: '⚡', desc: '兩人各有通道一半，在一起時被完整激活，帶來強烈吸引力。' },
  companionship:   { label: '陪伴連結', color: T.comp,  bg: '#0a1525', icon: '🤝', desc: '兩人同時擁有完整通道，帶來穩定陪伴感。' },
  compromise:      { label: '妥協連結', color: T.compro,bg: '#15102a', icon: '⚖️', desc: '一方有完整通道，另一方只有一端，容易出現調整需求。' },
  dominance:       { label: '支配連結', color: T.dom,   bg: '#111111', icon: '🎯', desc: '能量可能出現主導或覆蓋的動態。' },
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

function formToBirthDate(f: BirthFormData) {
  return `${f.date.year}-${String(f.date.month).padStart(2, '0')}-${String(f.date.day).padStart(2, '0')}`
}
function formToBirthTime(f: BirthFormData) {
  return `${String(f.time.hour).padStart(2, '0')}:${String(f.time.minute).padStart(2, '0')}`
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
    } catch (e: any) {
      setSubmitError(e.message)
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
            <Text style={s.cardTitle}>人物 A</Text>
            <BirthDataForm
              value={formA}
              onChange={setFormA}
              namePlaceholder="例如：自己"
              fieldError={errorA}
              onClearError={() => setErrorA(null)}
            />
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>人物 B</Text>
            <BirthDataForm
              value={formB}
              onChange={setFormB}
              namePlaceholder="例如：對方"
              fieldError={errorB}
              onClearError={() => setErrorB(null)}
            />
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
              ? <ActivityIndicator color={T.bg} />
              : <Text style={s.primaryBtnText}>計算合圖</Text>
            }
          </Pressable>
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
                <Text style={[s.statNum, { color: T.muted }]}>{result.compositeOpenCount}</Text>
                <Text style={s.muted}>開放中心</Text>
              </View>
              {result.profileResonance.length > 0 && (
                <View style={s.statBox}>
                  <Text style={[s.statNum, { color: T.em, fontSize: 16 }]}>
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
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.connLabel, { color: cfg.color }]}>
                      {cfg.label}（{items.length}）
                    </Text>
                    <Text style={s.muted}>{cfg.desc}</Text>
                  </View>
                </View>
                <View style={{ borderTopWidth: 1, borderColor: cfg.color + '33', marginBottom: 8 }} />
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
  inner:          { padding: 16, gap: 12, paddingBottom: 48 },
  card:           { backgroundColor: T.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: T.border },
  cardTitle:      { fontSize: 13, fontWeight: '700', color: T.accent, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14 },
  sectionLabel:   { fontSize: 11, fontWeight: '600', color: T.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  muted:          { fontSize: 13, color: T.sub },
  graphContainer: { width: '100%', aspectRatio: 700 / 1030 },
  bigNum:         { fontSize: 36, fontWeight: '800', color: T.accent, marginBottom: 6 },
  statRow:        { flexDirection: 'row', gap: 8 },
  statBox:        { flex: 1, backgroundColor: T.bg, borderRadius: 10, padding: 12, alignItems: 'center' },
  statNum:        { fontSize: 22, fontWeight: '700', color: T.text, marginBottom: 2 },
  connLabel:      { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  connRow:        { borderRadius: 8, padding: 10, marginBottom: 6 },
  connId:         { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  primaryBtn:     { backgroundColor: T.accent, borderRadius: 12, padding: 14, alignItems: 'center' },
  primaryBtnText: { color: T.bg, fontWeight: '700', fontSize: 15 },
  outlineBtn:     { borderWidth: 1, borderColor: T.border, borderRadius: 8, padding: 12, alignItems: 'center' },
  outlineBtnText: { color: T.sub, fontSize: 13 },
  disabled:       { opacity: 0.5 },
  errorBox:       { backgroundColor: '#2a1010', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#5a2020' },
  errorText:      { color: '#ff7070', fontSize: 13 },
})
