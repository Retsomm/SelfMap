/**
 * 合圖分析 View — 兩個出生資料表單，計算後存一筆並顯示合圖 Body Graph 與結果。
 */
import { useAuth } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  type CreateCompositeResult,
  type CreateCompositePayload,
  previewCompositeChart,
  createCompositeChart,
} from '@/lib/api'
import { downloadCompositePdf, generateCompositeAiPrompt } from '@/lib/chartPdf'
import { buildCompositeBodyGraphProps } from '@/lib/hd-bodygraph-utils'
import BirthDataForm, { type BirthFormData, defaultBirthFormData } from '@/components/BirthDataForm'
import { BirthProfilePickerModal } from '@/components/BirthProfilePickerModal'
import { AppliedProfileCard } from '@/components/AppliedProfileCard'
import BodyGraph from '@/components/BodyGraph'
import { formToBirthDate, formToBirthTime } from '@/lib/birthFormUtils'
import { type BirthProfile } from '@/lib/birthProfiles'
import { useBirthProfiles } from '@/hooks/useBirthProfiles'
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




export default function CompositeView() {
  const { getToken } = useAuth()
  const router = useRouter()
  const scrollRef = useRef<ScrollView>(null)

  const [formA, setFormA] = useState<BirthFormData>(defaultBirthFormData)
  const [formB, setFormB] = useState<BirthFormData>(defaultBirthFormData)
  const [errorA, setErrorA] = useState<string | null>(null)
  const [errorB, setErrorB] = useState<string | null>(null)
  const [result, setResult]         = useState<CreateCompositeResult | null>(null)
  const [lastPayload, setLastPayload] = useState<CreateCompositePayload | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [copied, setCopied]         = useState(false)
  const [saveState, setSaveState]   = useState<'idle' | 'loading' | 'saved'>('idle')

  const [pickerTarget, setPickerTarget] = useState<'A' | 'B' | null>(null)
  const [appliedA, setAppliedA] = useState<BirthProfile | null>(null)
  const [appliedB, setAppliedB] = useState<BirthProfile | null>(null)
  const { profiles: savedProfiles, refresh: refreshProfiles } = useBirthProfiles()

  function applyProfile(p: BirthProfile) {
    const [year, month, day] = p.date.split('-').map(Number)
    const [hour, minute] = p.time.split(':').map(Number)
    const patch = { date: { year, month, day }, time: { hour, minute }, city: p.location, timezone: p.timezone }
    if (pickerTarget === 'A') {
      setFormA(f => ({ ...f, ...patch, name: f.name || p.label }))
      setErrorA(null)
      setAppliedA(p)
    } else if (pickerTarget === 'B') {
      setFormB(f => ({ ...f, ...patch, name: f.name || p.label }))
      setErrorB(null)
      setAppliedB(p)
    }
  }

  const calculate = async () => {
    let valid = true
    if (!formA.city || !formA.timezone) { setErrorA('請輸入城市名稱並從清單中選擇'); valid = false }
    if (!formB.city || !formB.timezone) { setErrorB('請輸入城市名稱並從清單中選擇'); valid = false }
    if (!valid) return

    const payload: CreateCompositePayload = {
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
    }

    setSubmitting(true)
    setSubmitError(null)
    setResult(null)
    setSaveState('idle')
    try {
      const data = await previewCompositeChart(payload)
      setResult(data)
      setLastPayload(payload)
      scrollRef.current?.scrollTo({ y: 0, animated: true })
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : '發生未知錯誤，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => { setResult(null); setLastPayload(null); setSubmitError(null); setSaveState('idle') }

  const handleDownload = async () => {
    if (!result) return
    setPdfLoading(true)
    try { await downloadCompositePdf(result) }
    catch { Alert.alert('錯誤', '下載失敗，請稍後再試') }
    finally { setPdfLoading(false) }
  }

  const handleCopyPrompt = () => {
    if (!result) return
    Clipboard.setString(generateCompositeAiPrompt(result))
    setCopied(true)
    Alert.alert('已複製', '合圖提示詞已複製到剪貼簿，可貼到 ChatGPT 或其他 AI 工具使用。')
    setTimeout(() => setCopied(false), 3000)
  }

  const handleSave = async () => {
    if (!lastPayload || saveState !== 'idle') return
    setSaveState('loading')
    const token = await getToken()
    if (!token) { setSaveState('idle'); Alert.alert('請先登入', '登入後才能儲存圖表'); return }
    try {
      const saved = await createCompositeChart(token, lastPayload)
      setResult(saved)
      setSaveState('saved')
      router.push({ pathname: '/(tabs)/profile', params: { chartTab: 'composite' } } as never)
    } catch (e: unknown) {
      setSaveState('idle')
      Alert.alert('儲存失敗', e instanceof Error ? e.message : '請稍後再試')
    }
  }

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
                <Pressable style={s.quickApplyBtn} onPress={async () => { await refreshProfiles(); setPickerTarget('A') }}>
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
                <Pressable style={s.quickApplyBtn} onPress={async () => { await refreshProfiles(); setPickerTarget('B') }}>
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
            const { definedCenterIds, definedChannelIds, activations } = buildCompositeBodyGraphProps(result)
            return (
              <View style={s.graphCard}>
                <View style={s.graphCardHeader}>
                  <Text style={s.sectionLabel}>合圖 Body Graph</Text>
                  <Text style={s.muted}>
                    黑色 = {result.personA.name ?? '人物 A'}　紅色 = {result.personB.name ?? '人物 B'}
                  </Text>
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

          {/* 三個行動按鈕 */}
          <View style={s.actionSection}>
            <Pressable
              style={[s.actionBtn, pdfLoading && s.disabled]}
              onPress={handleDownload}
              disabled={pdfLoading}
            >
              <Text style={s.actionBtnText}>{pdfLoading ? '處理中…' : '下載 PDF'}</Text>
            </Pressable>
            <Pressable style={s.actionBtn} onPress={handleCopyPrompt}>
              <Text style={s.actionBtnText}>{copied ? '已複製！' : '複製提示詞'}</Text>
            </Pressable>
            <Pressable
              style={[s.actionBtn, s.actionBtnPrimary, saveState === 'loading' && s.disabled]}
              onPress={handleSave}
              disabled={saveState !== 'idle'}
            >
              <Text style={[s.actionBtnText, s.actionBtnTextPrimary]}>
                {saveState === 'loading' ? '儲存中…' : saveState === 'saved' ? '已儲存' : '儲存圖表'}
              </Text>
            </Pressable>
          </View>

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
  graphCard:       { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  graphCardHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  graphContainer:  { width: '100%', aspectRatio: 590 / 1030 },
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
  actionSection:        { gap: Spacing.sm },
  actionBtn:            { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: 13, alignItems: 'center' },
  actionBtnPrimary:     { backgroundColor: Colors.accent, borderColor: Colors.accent },
  actionBtnText:        { fontSize: 14, fontWeight: '600', color: Colors.text },
  actionBtnTextPrimary: { color: Colors.bg },
})
