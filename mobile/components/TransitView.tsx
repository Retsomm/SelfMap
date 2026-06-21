/**
 * 流日分析 View — 填入出生資料後計算個人圖 + 今日流日合成圖。
 */
import { useAuth } from '@clerk/expo'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { type CreateTransitResult, type ImpactLayer, createTransitChart } from '@/lib/api'
import BirthDataForm, { type BirthFormData, defaultBirthFormData } from '@/components/BirthDataForm'
import { formToBirthDate, formToBirthTime } from '@/lib/birthFormUtils'
import BodyGraph from '@/components/BodyGraph'

const T = {
  bg: '#0f0f1a', surface: '#1e1e2e', border: '#2a2a3e',
  accent: '#a78bfa', accentD: '#2e1e4e',
  text: '#ffffff', sub: '#8888aa', muted: '#555577',
  red: '#ff6b6b', em: '#f59e0b', transit: '#f97316', compro: '#c084fc',
}

const PLANET_SYM: Record<string, string> = {
  '太陽': '☉', '地球': '⊕', '月亮': '☽', '北交點': '☊', '南交點': '☋',
  '水星': '☿', '金星': '♀', '火星': '♂', '木星': '♃', '土星': '♄',
  '天王星': '♅', '海王星': '♆', '冥王星': '♇',
}

const CENTER_ZH: Record<string, string> = {
  head: '頭頂', ajna: '心智', throat: '喉嚨', g: 'G',
  ego: '意志力', sacral: '薦骨', solarPlexus: '情緒',
  spleen: '脾臟', root: '根部',
}

const IMPACT_CFG = {
  'center-activated':   { color: T.em,      icon: '⚡', label: '空白中心被激活' },
  'new-channel':        { color: T.transit,  icon: '🌊', label: '全新流日通道' },
  'completing-channel': { color: T.compro,   icon: '🔗', label: '通道補全' },
} as const

const LIB_TO_CHART: Record<string, string> = { ego: 'heart', solarPlexus: 'solar' }
const normCenter  = (id: string) => LIB_TO_CHART[id] ?? id
const normChannel = (id: string) => id.startsWith('c') ? id : `c${id}`

function buildCombinedBodyGraphProps(data: CreateTransitResult) {
  // 個人閘門：黑 (c) = Personality, 紅 (u) = Design
  const activations: Record<number, { c?: boolean; u?: boolean; t?: boolean }> = {}
  for (const g of data.personalityGates) activations[g] = { ...activations[g], c: true }
  for (const g of data.designGates)      activations[g] = { ...activations[g], u: true }
  // 流日閘門：橙 (t)，僅標記個人圖中沒有的閘門
  for (const g of data.transit.allGates) {
    if (!activations[g]) activations[g] = { t: true }
  }

  // 合成後的中心與通道（server 端已計算）
  const definedCenterIds  = new Set(data.combined.definedCenterIds.map(normCenter))
  const definedChannelIds = new Set(data.combined.definedChannelIds.map(normChannel))

  return { activations, definedCenterIds, definedChannelIds }
}

export default function TransitView() {
  const { getToken } = useAuth()

  const [form, setForm]               = useState<BirthFormData>(defaultBirthFormData)
  const [fieldError, setFieldError]   = useState<string | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult]           = useState<CreateTransitResult | null>(null)

  const handleSubmit = async () => {
    if (!form.city || !form.timezone) {
      setFieldError('請輸入城市名稱並從清單中選擇')
      return
    }
    setFieldError(null)
    setSubmitError(null)
    setSubmitting(true)
    setResult(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('未登入')
      const data = await createTransitChart(token, {
        birthDate: formToBirthDate(form),
        birthTime: formToBirthTime(form),
        birthCity: form.city,
        timezone:  form.timezone,
        name:      form.name || undefined,
      })
      setResult(data)
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : '發生未知錯誤，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => { setResult(null); setSubmitError(null) }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('zh-TW', { hour12: false, timeZone: 'Asia/Taipei' })

  return (
    <ScrollView
      contentContainerStyle={s.inner}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {!result ? (
        <View style={s.card}>
          <Text style={s.sectionLabel}>你的出生資料</Text>
          <BirthDataForm
            value={form}
            onChange={setForm}
            namePlaceholder="例如：本人"
            fieldError={fieldError}
            onClearError={() => setFieldError(null)}
          />

          {submitError ? (
            <View style={[s.errorBox, { marginTop: 12 }]}>
              <Text style={s.errorText}>計算失敗：{submitError}</Text>
            </View>
          ) : null}

          <Pressable
            style={[s.primaryBtn, { marginTop: 16 }, submitting && s.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color={T.bg} />
              : <Text style={s.primaryBtnText}>計算流日</Text>
            }
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={[s.muted, { textAlign: 'right' }]}>
            {formatTime(result.transit.computedAt)} 更新
          </Text>

          {/* 合成 Body Graph：個人（黑/紅）+ 流日（橙） */}
          {(() => {
            const { activations, definedCenterIds, definedChannelIds } = buildCombinedBodyGraphProps(result)
            return (
              <View style={s.card}>
                <Text style={s.sectionLabel}>個人 + 流日 Body Graph</Text>
                <View style={s.legend}>
                  <View style={[s.legendDot, { backgroundColor: '#1a1a1a' }]} />
                  <Text style={s.legendText}>個人意識</Text>
                  <View style={[s.legendDot, { backgroundColor: '#c04020' }]} />
                  <Text style={s.legendText}>個人潛意識</Text>
                  <View style={[s.legendDot, { backgroundColor: T.transit }]} />
                  <Text style={s.legendText}>今日流日</Text>
                </View>
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

          {/* 今日行星閘門 */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>今日行星閘門</Text>
            {result.transit.planets.map(p => (
              <View key={p.planetName} style={s.planetRow}>
                <Text style={s.sym}>{PLANET_SYM[p.planetName] ?? '·'}</Text>
                <Text style={s.planetName}>{p.planetName}</Text>
                <View style={s.gateChip}>
                  <Text style={s.gateChipText}>{p.gate}.{p.line}</Text>
                </View>
              </View>
            ))}
          </View>

          {result.transit.definedCenterIds.length > 0 && (
            <View style={s.card}>
              <Text style={s.sectionLabel}>今日流日定義中心（{result.transit.definedCenterIds.length}）</Text>
              <View style={s.chipRow}>
                {result.transit.definedCenterIds.map(c => (
                  <View key={c} style={[s.chip, { backgroundColor: '#2a1a0e' }]}>
                    <Text style={[s.chipText, { color: T.transit }]}>{CENTER_ZH[c] ?? c}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 流日影響 */}
          {result.impact.layers.length === 0 ? (
            <View style={s.card}>
              <Text style={s.muted}>今日流日對此圖表影響不顯著</Text>
            </View>
          ) : (
            result.impact.layers.map((layer, i) => {
              const cfg = IMPACT_CFG[layer.kind]
              return (
                <View key={i} style={[s.card, { borderLeftWidth: 3, borderLeftColor: cfg.color }]}>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                    <Text style={{ fontSize: 18 }}>{cfg.icon}</Text>
                    <View>
                      <Text style={[s.impactKind, { color: cfg.color }]}>{cfg.label}</Text>
                      <Text style={s.impactLabel}>{layer.label}</Text>
                    </View>
                  </View>
                  <Text style={s.muted}>{layer.detail}</Text>
                </View>
              )
            })
          )}

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
  sectionLabel:   { fontSize: 11, fontWeight: '600', color: T.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  muted:          { fontSize: 13, color: T.sub },
  legend:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  legendDot:      { width: 10, height: 10, borderRadius: 5 },
  legendText:     { fontSize: 11, color: T.sub, marginRight: 8 },
  graphContainer: { width: '100%', aspectRatio: 700 / 1030 },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:           { backgroundColor: T.accentD, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  chipText:       { fontSize: 12, fontWeight: '500', color: T.accent },
  planetRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: T.border },
  sym:            { fontSize: 15, width: 24, textAlign: 'center', color: T.sub },
  planetName:     { flex: 1, fontSize: 14, color: T.text, marginLeft: 8 },
  gateChip:       { backgroundColor: T.accentD, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  gateChipText:   { fontSize: 12, fontWeight: '600', color: T.accent },
  primaryBtn:     { backgroundColor: T.accent, borderRadius: 12, padding: 14, alignItems: 'center' },
  primaryBtnText: { color: T.bg, fontWeight: '700', fontSize: 15 },
  outlineBtn:     { borderWidth: 1, borderColor: T.border, borderRadius: 8, padding: 12, alignItems: 'center' },
  outlineBtnText: { color: T.sub, fontSize: 13 },
  disabled:       { opacity: 0.5 },
  errorBox:       { backgroundColor: '#2a1010', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#5a2020' },
  errorText:      { color: '#ff7070', fontSize: 13 },
  impactKind:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  impactLabel:    { fontSize: 15, fontWeight: '700', color: T.text, marginTop: 2 },
})
