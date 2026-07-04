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
  Platform,
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
import { matchCity } from '@/lib/cities'
import { type BirthProfile } from '@/lib/birthProfiles'
import { useBirthProfiles } from '@/hooks/useBirthProfiles'
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight'
import { Colors, Radius, Spacing } from '@/constants/tokens'
import { ScrollLockContext, useScrollLockState } from '@/contexts/ScrollLockContext'

const CONN_CFG = {
  electromagnetic: { label: '電磁關係 (Electromagnetic)', color: Colors.em,    bg: Colors.emDimBg,     desc: '互補吸引 — 一方有 A 閘門，另一方有 B 閘門，合力激活完整通道。最經典的「致命吸引力」，容易一見鍾情但也容易相愛相殺。' },
  companionship:   { label: '陪伴關係 (Companionship)',   color: Colors.comp,  bg: Colors.compDimBg,   desc: '默契安全 — 兩人擁有相同的閘門或通道，相處起來最不費力，如靈魂伴侶或老朋友。' },
  compromise:      { label: '妥協關係 (Compromise)',      color: Colors.compro,bg: Colors.comproDimBg, desc: '關係摩擦源 — 一方擁有完整通道，另一方只有其中一個閘門，長期易累積委屈與不平衡感。' },
  dominance:       { label: '支配關係 (Dominance)',       color: Colors.dom,   bg: Colors.domDimBg,    desc: '單向引導 — 一方在某條通道有能量，另一方完全開放，空白的那方會單向受到能量制約。' },
} as const

type IntegrationKey = 'theme9_0' | 'theme8_1' | 'theme7_2' | 'theme6_3'

const THEME_CFG: Record<string, { key: IntegrationKey; label: string; love: string; work: string }> = {
  '9+0':  { key: 'theme9_0', label: '全滿（9+0）— Nowhere to go',    love: '極度甜蜜與黏人。能量場完全自給自足，外人很難融入。兩人會深深沉浸在彼此的世界中，但也容易因為缺乏外在刺激而感到窒息或過度封閉。',         work: '過於封閉。團隊內部可能非常有默契，但極易忽略外部市場的變化或同事、客戶的客觀意見。' },
  '8+1':  { key: 'theme8_1', label: '8+1 — Have some fun',            love: '最舒服的互動模式。彼此有足夠的能量連結，同時留有「空白」作為陽光照進來的窗口。雙方擁有各自呼吸與消化的空間，關係健康且長久。',             work: '黃金搭檔。既有共同努力的交集，又有一起去體驗、探索外部世界的窗口。' },
  '7+2':  { key: 'theme7_2', label: '7+2 — Work to do',               love: '最舒服的互動模式之一。保有兩個空白中心，彼此連結同時仍有足夠的獨立呼吸空間，長期相處不易窒息。',                                             work: '黃金搭檔。既有共同努力的交集，又有兩扇開放的窗口迎接外在刺激與機會。' },
  '6+3+': { key: 'theme6_3', label: '6+3+ — Better to be free',       love: '連結感較淡。兩人在一起時仍有太多未定因素，容易流於平淡或像朋友。通常需要藉由共同的興趣、小孩或外在媒介來維繫緊密感。',                     work: '適合團隊合作。保持高度的獨立性與自由度，不會對彼此造成過度制約，適合鬆散型的專案合作或大團隊中的平行分工。' },
}

const LINE_RESONANCE: { line: number; label: string; desc: string }[] = [
  { line: 1, label: '1 爻共鳴', desc: '兩人都需要足夠的安全感與底層研究，能深深理解彼此打基礎的必要。' },
  { line: 2, label: '2 爻共鳴', desc: '兩人都需要獨處與等待被呼喚的空間，彼此能體諒對方的隱士特質。' },
  { line: 3, label: '3 爻共鳴', desc: '兩人都能理解試錯與碰撞的學習過程，不會因為失敗而互相責備。' },
  { line: 4, label: '4 爻共鳴', desc: '兩人都重視人脈與穩定的社群，能在圈子建設上形成默契。' },
  { line: 5, label: '5 爻共鳴', desc: '兩人都帶有被投射的特質，需要互相留意實際的期待落差。' },
  { line: 6, label: '6 爻共鳴', desc: '兩人都有長遠的人生週期觀，能理解彼此不同階段的冷靜與退後。' },
]




export default function CompositeView() {
  const { getToken } = useAuth()
  const router = useRouter()
  const scrollRef = useRef<ScrollView>(null)
  const { ctx: scrollLockCtx, scrollEnabled } = useScrollLockState()
  const keyboardHeight = useKeyboardHeight()

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
    const matchedA = matchCity(formA.city)
    const matchedB = matchCity(formB.city)
    let valid = true
    if (!matchedA) { setErrorA('找不到這個地點，請確認拼字或改用資料庫中的地名'); setFormA(f => ({ ...f, timezone: '' })); valid = false }
    if (!matchedB) { setErrorB('找不到這個地點，請確認拼字或改用資料庫中的地名'); setFormB(f => ({ ...f, timezone: '' })); valid = false }
    if (!valid || !matchedA || !matchedB) return
    setErrorA(null)
    setErrorB(null)
    setFormA(f => ({ ...f, city: matchedA.name, timezone: matchedA.timezone }))
    setFormB(f => ({ ...f, city: matchedB.name, timezone: matchedB.timezone }))

    const payload: CreateCompositePayload = {
      personA: {
        name:      formA.name || undefined,
        birthDate: formToBirthDate(formA),
        birthTime: formToBirthTime(formA),
        birthCity: matchedA.name,
        timezone:  matchedA.timezone,
      },
      personB: {
        name:      formB.name || undefined,
        birthDate: formToBirthDate(formB),
        birthTime: formToBirthTime(formB),
        birthCity: matchedB.name,
        timezone:  matchedB.timezone,
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

  function handleCityFocus() {
    if (Platform.OS === 'android') {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 350)
    }
  }

  return (
    <ScrollLockContext.Provider value={scrollLockCtx}>
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[
        s.inner,
        Platform.OS === 'android' && keyboardHeight > 0 ? { paddingBottom: keyboardHeight + 48 } : null,
      ]}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={scrollEnabled}
      nestedScrollEnabled
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
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
                onCityFocus={handleCityFocus}
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
                onCityFocus={handleCityFocus}
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
          {/* 人物資訊 header */}
          {(() => {
            const nameA = result.personA.name ?? 'A'
            const nameB = result.personB.name ?? 'B'
            return (
              <View style={s.personHeader}>
                <View style={s.personHeaderCol}>
                  <Text style={[s.personHeaderName, { color: Colors.accent }]}>{nameA}</Text>
                  <Text style={s.personHeaderDate}>{result.personA.birthDate} · {result.personA.birthTime}</Text>
                  <Text style={s.personHeaderCity}>{result.personA.birthCity}</Text>
                </View>
                <View style={[s.personHeaderCol, { alignItems: 'flex-end' }]}>
                  <Text style={s.personHeaderName}>{nameB}</Text>
                  <Text style={s.personHeaderDate}>{result.personB.birthDate} · {result.personB.birthTime}</Text>
                  <Text style={s.personHeaderCity}>{result.personB.birthCity}</Text>
                </View>
              </View>
            )
          })()}

          {/* 合圖 Body Graph */}
          {(() => {
            const { definedCenterIds, definedChannelIds, activations } = buildCompositeBodyGraphProps(result)
            return (
              <View style={s.graphCard}>
                <View style={s.graphCardHeader}>
                  <Text style={s.sectionLabel}>合圖 Body Graph</Text>
                  <Text style={s.muted}>
                    黑色 = {result.personA.name ?? 'A'}　紅色 = {result.personB.name ?? 'B'}
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

          {/* 行星閘門對照 */}
          {(result.personA.planets?.length ?? 0) > 0 && (
            <View style={s.card}>
              <Text style={[s.sectionLabel, { marginBottom: Spacing.md }]}>行星閘門對照</Text>
              {/* Person group header */}
              <View style={s.planetGroupRow}>
                <View style={s.planetPlanetCol} />
                <Text style={[s.planetGroupLabel, { color: Colors.accent }]}>{result.personA.name ?? 'A'}</Text>
                <Text style={[s.planetGroupLabel, { color: Colors.text }]}>{result.personB.name ?? 'B'}</Text>
              </View>
              {/* Header */}
              <View style={[s.planetRow, { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 6 }]}>
                <Text style={[s.planetPlanetCol, s.planetHeaderText]}>行星</Text>
                <Text style={[s.planetGateColSm, s.planetHeaderText, { color: Colors.text }]}>意識</Text>
                <Text style={[s.planetGateColSm, s.planetHeaderText, { color: Colors.designRed }]}>潛意識</Text>
                <Text style={[s.planetGateColSm, s.planetHeaderText, { color: Colors.text }]}>意識</Text>
                <Text style={[s.planetGateColSm, s.planetHeaderText, { color: Colors.designRed }]}>潛意識</Text>
              </View>
              {(result.personA.planets ?? []).map((p, i) => {
                const pb = result.personB.planets?.[i]
                return (
                  <View key={p.name} style={[s.planetRow, i % 2 === 1 && s.planetRowAlt]}>
                    <Text style={s.planetPlanetCol}>{p.name}</Text>
                    <Text style={[s.planetGateColSm, { color: Colors.text }]}>{p.blackGate}.{p.blackLine}</Text>
                    <Text style={[s.planetGateColSm, { color: Colors.designRed }]}>{p.redGate}.{p.redLine}</Text>
                    <Text style={[s.planetGateColSm, { color: Colors.text }]}>{pb?.blackGate}.{pb?.blackLine}</Text>
                    <Text style={[s.planetGateColSm, { color: Colors.designRed }]}>{pb?.redGate}.{pb?.redLine}</Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* 能量場整合主題 */}
          {(() => {
            const theme = THEME_CFG[result.integrationTheme] ?? THEME_CFG['6+3+']
            return (
              <View style={s.card}>
                <Text style={s.sectionLabel}>能量場整合主題</Text>
                <View style={s.statRow}>
                  <View style={s.statBox}>
                    <Text style={s.statNum}>{result.integrationTheme}</Text>
                    <Text style={s.muted}>整合主題</Text>
                  </View>
                  <View style={s.statBox}>
                    <Text style={s.statNum}>{result.compositeDefinedCount}</Text>
                    <Text style={s.muted}>已定義中心</Text>
                  </View>
                  <View style={s.statBox}>
                    <Text style={[s.statNum, { color: Colors.muted }]}>{result.compositeOpenCount}</Text>
                    <Text style={s.muted}>開放中心</Text>
                  </View>
                </View>
                <Text style={[s.themeLabel, { marginTop: Spacing.md }]}>{theme.label}</Text>
                <View style={s.themeSplit}>
                  <View style={s.themeBlock}>
                    <Text style={s.themeBlockTitle}>戀愛關係</Text>
                    <Text style={s.themeBlockText}>{theme.love}</Text>
                  </View>
                  <View style={s.themeBlock}>
                    <Text style={s.themeBlockTitle}>工作夥伴</Text>
                    <Text style={s.themeBlockText}>{theme.work}</Text>
                  </View>
                </View>
              </View>
            )
          })()}

          {/* 四種核心連結動力 */}
          <View style={s.card}>
            <Text style={[s.sectionLabel, { marginBottom: Spacing.md }]}>四種核心連結動力</Text>
            {(['electromagnetic', 'companionship', 'compromise', 'dominance'] as const).map(type => {
              const items = result[type] ?? []
              const cfg = CONN_CFG[type]
              return (
                <View key={type} style={[s.connGroup, { borderColor: cfg.color + '55' }]}>
                  <View style={[s.connGroupHeader, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.connLabel, { color: cfg.color }]}>{cfg.label}（{items.length}）</Text>
                    <Text style={s.connDesc}>{cfg.desc}</Text>
                  </View>
                  {items.length === 0 ? (
                    <Text style={[s.muted, { padding: Spacing.sm, fontSize: 12 }]}>無相關通道</Text>
                  ) : (
                    items.map((conn, i) => (
                      <View key={conn.channelId} style={[s.connRow, i % 2 === 1 && { backgroundColor: Colors.altRowBg }]}>
                        <Text style={[s.connId, { color: cfg.color, minWidth: 70 }]}>{conn.channelId}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.muted}>
                            {result.personA.name ?? 'A'}：{conn.aGates.length > 0 ? conn.aGates.join(', ') : '—'}
                          </Text>
                          <Text style={s.muted}>
                            {result.personB.name ?? 'B'}：{conn.bGates.length > 0 ? conn.bGates.join(', ') : '—'}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )
            })}
          </View>

          {/* 人生角色共鳴 */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>人生角色共鳴</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginVertical: Spacing.sm }}>
              <Text style={[s.profileLabel, { color: Colors.accent }]}>
                {result.personA.name ?? 'A'} {result.personA.profile}
              </Text>
              <Text style={s.profileLabel}>
                {result.personB.name ?? 'B'} {result.personB.profile}
              </Text>
            </View>
            {(result.profileResonance?.length ?? 0) === 0 ? (
              <Text style={[s.muted, { lineHeight: 20 }]}>兩人人生角色沒有共同爻線，各自的觀點框架較為不同。</Text>
            ) : (
              LINE_RESONANCE.filter(lr => result.profileResonance?.includes(lr.line)).map(lr => (
                <View key={lr.line} style={s.resonanceRow}>
                  <Text style={s.resonanceLabel}>{lr.label}</Text>
                  <Text style={[s.muted, { lineHeight: 20 }]}>{lr.desc}</Text>
                </View>
              ))
            )}
          </View>

          {/* 策略與內在權威 */}
          <View style={s.card}>
            <Text style={[s.sectionLabel, { marginBottom: Spacing.md }]}>策略與內在權威</Text>
            {([
              { label: `${result.personA.name ?? 'A'} 的權威`, meta: result.personA, color: Colors.accent },
              { label: `${result.personB.name ?? 'B'} 的權威`, meta: result.personB, color: Colors.text },
            ] as const).map(({ label, meta, color }, idx) => (
              <View key={idx} style={[s.authorityCard, { borderLeftColor: color }]}>
                <Text style={s.authorityLabel}>{label}</Text>
                <Text style={[s.authorityName, { color }]}>{meta.authority ?? ''}</Text>
                {meta.authorityTip ? (
                  <Text style={[s.muted, { lineHeight: 20 }]}>{meta.authorityTip}</Text>
                ) : null}
              </View>
            ))}
          </View>

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
    </ScrollLockContext.Provider>
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
  statRow:        { flexDirection: 'row', gap: Spacing.sm },
  statBox:        { flex: 1, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  statNum:        { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  // Person header
  personHeader:     { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  personHeaderCol:  { flex: 1 },
  personHeaderName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  personHeaderDate: { fontSize: 11, color: Colors.sub },
  personHeaderCity: { fontSize: 11, color: Colors.muted },
  // Planet table
  planetRow:        { flexDirection: 'row', paddingVertical: 5 },
  planetRowAlt:     { backgroundColor: Colors.altRowBg },
  planetPlanetCol:  { flex: 1.2, fontSize: 12, color: Colors.sub },
  planetGateCol:    { flex: 1, fontSize: 13, fontWeight: '700' },
  planetGateColSm:  { flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  planetGroupRow:   { flexDirection: 'row', marginBottom: 2 },
  planetGroupLabel: { flex: 2, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  planetHeaderText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  // Theme
  themeLabel:    { fontSize: 15, fontWeight: '700', color: Colors.accent, marginBottom: Spacing.sm },
  themeSplit:    { gap: Spacing.sm },
  themeBlock:    { backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md },
  themeBlockTitle: { fontSize: 10, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 4 },
  themeBlockText:  { fontSize: 13, color: Colors.sub, lineHeight: 20 },
  // Connections
  connGroup:       { borderWidth: 1, borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing.sm },
  connGroupHeader: { padding: Spacing.md },
  connLabel:       { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  connDesc:        { fontSize: 12, color: Colors.sub, lineHeight: 18 },
  connRow:         { flexDirection: 'row', padding: 10, gap: Spacing.sm },
  connId:          { fontSize: 13, fontWeight: '700' },
  // Profile resonance
  profileLabel:   { fontSize: 15, fontWeight: '700', color: Colors.text },
  resonanceRow:   { marginTop: Spacing.sm, gap: 2 },
  resonanceLabel: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  // Authority
  authorityCard:  { borderLeftWidth: 3, paddingLeft: Spacing.md, marginBottom: Spacing.md, gap: 4 },
  authorityLabel: { fontSize: 10, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  authorityName:  { fontSize: 17, fontWeight: '700' },
  // Buttons
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
