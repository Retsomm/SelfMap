/**
 * 流日分析 View — 填入出生資料後計算個人圖 + 今日流日合成圖。
 */
import { useAuth } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { useMemo, useRef, useState } from 'react'
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
import { type CreateTransitResult, previewTransitChart, createTransitChart } from '@/lib/api'
import { ScrollLockContext, useScrollLockState } from '@/contexts/ScrollLockContext'
import { downloadTransitPdf, generateTransitAiPrompt } from '@/lib/chartPdf'
import { buildTransitBodyGraphProps } from '@/lib/hd-bodygraph-utils'
import { useBirthProfiles } from '@/hooks/useBirthProfiles'
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight'
import BirthDataForm, { type BirthFormData, defaultBirthFormData } from '@/components/BirthDataForm'
import { BirthProfilePickerModal } from '@/components/BirthProfilePickerModal'
import { AppliedProfileCard } from '@/components/AppliedProfileCard'
import { formToBirthDate, formToBirthTime } from '@/lib/birthFormUtils'
import { matchCity } from '@/lib/cities'
import BodyGraph from '@/components/BodyGraph'
import { type BirthProfile } from '@/lib/birthProfiles'
import { Radius, Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors, useThemeMode } from '@/contexts/ThemeContext'
import { GateChip } from '@/components/transit/GateChip'
import { ImpactCard } from '@/components/transit/ImpactCard'

const PLANET_SYM: Record<string, string> = {
  '太陽': '☉', '地球': '⊕', '月亮': '☽', '北交點': '☊', '南交點': '☋',
  '水星': '☿', '金星': '♀', '火星': '♂', '木星': '♃', '土星': '♄',
  '天王星': '♅', '海王星': '♆', '冥王星': '♇',
}


export default function TransitView() {
  const { getToken } = useAuth()
  const router = useRouter()
  const scrollRef = useRef<ScrollView>(null)
  const { ctx: scrollLockCtx, scrollEnabled } = useScrollLockState()
  const keyboardHeight = useKeyboardHeight()
  const Colors = useThemeColors()
  const { mode } = useThemeMode()
  const s = useMemo(() => createStyles(Colors), [Colors])

  const [form, setForm]               = useState<BirthFormData>(defaultBirthFormData)
  const [fieldError, setFieldError]   = useState<string | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult]           = useState<CreateTransitResult | null>(null)
  const [lastPayload, setLastPayload] = useState<{ birthDate: string; birthTime: string; birthCity: string; timezone: string; name?: string } | null>(null)
  const [appliedProfile, setAppliedProfile] = useState<BirthProfile | null>(null)
  const [pickerVisible, setPickerVisible] = useState(false)
  const { profiles: savedProfiles, refresh: refreshProfiles } = useBirthProfiles()
  const [pdfLoading, setPdfLoading] = useState(false)
  const [copied, setCopied]         = useState(false)
  const [saveState, setSaveState]   = useState<'idle' | 'loading' | 'saved'>('idle')

  function applyProfile(p: BirthProfile) {
    const [year, month, day] = p.date.split('-').map(Number)
    const [hour, minute] = p.time.split(':').map(Number)
    setForm(f => ({ ...f, date: { year, month, day }, time: { hour, minute }, city: p.location, timezone: p.timezone, name: p.label }))
    setFieldError(null)
    setAppliedProfile(p)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
  }

  const handleSubmit = async () => {
    // 已套用儲存的出生資料時，form.city/timezone 已經是可信值（來自後端存檔），
    // 不能再拿去比對 mobile 本地的城市清單——存檔當初可能是用網頁端的地點選擇器，
    // 格式跟 mobile 這份清單對不上，會導致 matchCity 找不到、誤判成「地點錯誤」
    let finalCity = form.city
    let finalTimezone = form.timezone
    if (!appliedProfile) {
      const matched = matchCity(form.city)
      if (!matched) {
        setFieldError('找不到這個地點，請確認拼字或改用資料庫中的地名')
        setForm(f => ({ ...f, timezone: '' }))
        return
      }
      setForm(f => ({ ...f, city: matched.name, timezone: matched.timezone }))
      finalCity = matched.name
      finalTimezone = matched.timezone
    }
    const payload = {
      birthDate: formToBirthDate(form),
      birthTime: formToBirthTime(form),
      birthCity: finalCity,
      timezone:  finalTimezone,
      name:      form.name || undefined,
    }
    setFieldError(null)
    setSubmitError(null)
    setSubmitting(true)
    setResult(null)
    setSaveState('idle')
    try {
      const data = await previewTransitChart(payload)
      setResult(data)
      setLastPayload(payload)
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
    try { await downloadTransitPdf(result, mode, lastPayload?.name) }
    catch { Alert.alert('錯誤', '下載失敗，請稍後再試') }
    finally { setPdfLoading(false) }
  }

  const handleCopyPrompt = () => {
    if (!result) return
    Clipboard.setString(generateTransitAiPrompt(result))
    setCopied(true)
    Alert.alert('已複製', '流日提示詞已複製到剪貼簿，可貼到 ChatGPT 或其他 AI 工具使用。')
    setTimeout(() => setCopied(false), 3000)
  }

  const handleSave = async () => {
    if (!lastPayload || saveState !== 'idle') return
    setSaveState('loading')
    const token = await getToken()
    if (!token) { setSaveState('idle'); Alert.alert('請先登入', '登入後才能儲存圖表'); return }
    try {
      const saved = await createTransitChart(token, lastPayload)
      setResult(saved)
      setSaveState('saved')
      router.push({ pathname: '/(tabs)/profile', params: { chartTab: 'transit' } } as never)
    } catch (e: unknown) {
      setSaveState('idle')
      Alert.alert('儲存失敗', e instanceof Error ? e.message : '請稍後再試')
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('zh-TW', { hour12: false, timeZone: 'Asia/Taipei' })

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
          {savedProfiles.length > 0 && !appliedProfile && (
            <Pressable style={s.quickApplyBtn} onPress={async () => { await refreshProfiles(); setPickerVisible(true) }}>
              <Text style={s.quickApplyText}>⚡ 快速套用出生資料</Text>
            </Pressable>
          )}
          <Text style={s.sectionLabel}>你的出生資料</Text>
          {appliedProfile ? (
            <AppliedProfileCard profile={appliedProfile} onClear={() => setAppliedProfile(null)} />
          ) : (
            <BirthDataForm
              value={form}
              onChange={setForm}
              namePlaceholder="例如：本人"
              fieldError={fieldError}
              onClearError={() => setFieldError(null)}
              onCityFocus={() => { if (Platform.OS === 'android') setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 350) }}
            />
          )}

          {submitError ? (
            <View style={[s.errorBox, { marginTop: Spacing.md }]}>
              <Text style={s.errorText}>計算失敗：{submitError}</Text>
            </View>
          ) : null}

          <Pressable
            style={[s.primaryBtn, { marginTop: Spacing.lg }, submitting && s.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color={Colors.bg} />
              : <Text style={s.primaryBtnText}>計算流日</Text>
            }
          </Pressable>
        </View>

        <BirthProfilePickerModal
          visible={pickerVisible}
          profiles={savedProfiles}
          onSelect={applyProfile}
          onClose={() => setPickerVisible(false)}
        />
        </>
      ) : (
        <>
          <Text style={[s.muted, { textAlign: 'right' }]}>
            {formatTime(result.transit.computedAt)} 更新
          </Text>

          {/* 合成 Body Graph：個人（黑）+ 流日（紅） */}
          {(() => {
            const { activations, definedCenterIds, definedChannelIds } = buildTransitBodyGraphProps(result)
            return (
              <View style={s.graphCard}>
                <View style={s.graphCardHeader}>
                  <Text style={s.sectionLabel}>個人 + 流日 Body Graph</Text>
                  <View style={s.legend}>
                    <View style={[s.legendDot, { backgroundColor: Colors.text }]} />
                    <Text style={s.legendText}>個人</Text>
                    <View style={[s.legendDot, { backgroundColor: Colors.designRed }]} />
                    <Text style={s.legendText}>今日流日</Text>
                  </View>
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

          {/* 今日行星閘門：個人（潛意識／意識）+ 流日（意識）並排 */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>今日行星閘門</Text>
            <View style={s.planetHeaderRow}>
              <Text style={[s.planetHeaderCell, s.sym]}> </Text>
              <Text style={[s.planetHeaderCell, s.planetName]}>行星</Text>
              <Text style={[s.planetHeaderCell, s.gateChipHeader]}>潛意識</Text>
              <Text style={[s.planetHeaderCell, s.gateChipHeader]}>意識</Text>
              <Text style={[s.planetHeaderCell, s.gateChipHeader]}>流日</Text>
            </View>
            {result.transit.planets.map(tp => {
              const pp = result.personalPlanets?.find(p => p.planetName === tp.planetName)
              return (
                <View key={tp.planetName} style={s.planetRow}>
                  <Text style={s.sym}>{PLANET_SYM[tp.planetName] ?? '·'}</Text>
                  <Text style={s.planetName}>{tp.planetName}</Text>
                  <View style={[s.gateChip, s.gateChipDesign]}>
                    <Text style={[s.gateChipText, s.gateChipTextDesign]}>
                      {pp ? `${pp.design.gate}.${pp.design.line}` : '—'}
                    </Text>
                  </View>
                  <View style={s.gateChip}>
                    <Text style={s.gateChipText}>
                      {pp ? `${pp.personality.gate}.${pp.personality.line}` : '—'}
                    </Text>
                  </View>
                  <View style={[s.gateChip, s.gateChipTransit]}>
                    <Text style={[s.gateChipText, s.gateChipTextTransit]}>{tp.gate}.{tp.line}</Text>
                  </View>
                </View>
              )
            })}
          </View>

          {/* 閘門摘要：共有 / 流日 */}
          {(() => {
            const personalSet = new Set(result.personalGates)
            const transitSet  = new Set(result.transit.allGates)
            const shared       = result.personalGates.filter(g => transitSet.has(g)).sort((a, b) => a - b)
            const transitOnly  = result.transit.allGates.filter(g => !personalSet.has(g)).sort((a, b) => a - b)
            return (
              <View style={s.card}>
                <Text style={s.sectionLabel}>閘門摘要</Text>

                {shared.length > 0 && (
                  <>
                    <Text style={s.gateGroupLabel}>個人 + 流日共有</Text>
                    <View style={s.chipRow}>
                      {shared.map(g => <GateChip key={g} g={g} color={Colors.successText} bg={Colors.successBg} />)}
                    </View>
                  </>
                )}

                <Text style={[s.gateGroupLabel, { marginTop: Spacing.sm }]}>流日影響</Text>
                <View style={s.chipRow}>
                  {transitOnly.map(g => <GateChip key={g} g={g} color={Colors.designRed} bg={Colors.accentD} />)}
                </View>
              </View>
            )
          })()}

          {/* 流日影響 */}
          {result.impact.layers.length === 0 ? (
            <View style={s.card}>
              <Text style={s.muted}>今日流日對此圖表影響不顯著</Text>
            </View>
          ) : (
            (['center-activated', 'new-channel', 'completing-channel'] as const)
              .map(kind => {
                const layers = result.impact.layers.filter(l => l.kind === kind)
                return <ImpactCard key={kind} kind={kind} items={layers.map(l => l.label)} />
              })
          )}

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

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  inner:          { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 48 },
  card:           { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  sectionLabel:   { fontSize: 11, fontWeight: '600', color: Colors.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  muted:          { fontSize: 13, color: Colors.sub },
  graphCard:       { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  graphCardHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  legend:          { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  legendDot:       { width: 10, height: 10, borderRadius: 5 },
  legendText:      { fontSize: 11, color: Colors.sub, marginRight: Spacing.sm },
  graphContainer:  { width: '100%', aspectRatio: 590 / 1030 },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  planetRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 6 },
  sym:            { fontSize: 15, width: 24, textAlign: 'center', color: Colors.sub },
  planetName:     { flex: 1, fontSize: 14, color: Colors.text, marginLeft: Spacing.sm },
  planetHeaderRow:    { flexDirection: 'row', alignItems: 'center', paddingBottom: 6, gap: 6 },
  planetHeaderCell:   { fontSize: 10, fontWeight: '600', color: Colors.muted, letterSpacing: 0.6, textTransform: 'uppercase' },
  gateChipHeader:     { width: 44, textAlign: 'center' },
  gateChip:       { backgroundColor: Colors.gateBg, borderRadius: 6, paddingHorizontal: Spacing.sm, paddingVertical: 3, width: 44, alignItems: 'center' },
  gateChipText:   { fontSize: 12, fontWeight: '600', color: Colors.text },
  gateChipDesign:      { backgroundColor: Colors.accentD },
  gateChipTextDesign:  { color: Colors.designRed },
  gateChipTransit:     { backgroundColor: Colors.transitChipBg },
  gateChipTextTransit: { color: Colors.transitWarmText },
  quickApplyBtn:  { borderWidth: 1, borderColor: Colors.accent, borderRadius: Radius.lg, paddingVertical: Spacing.md, alignItems: 'center', backgroundColor: Colors.accentD, marginBottom: Spacing.md },
  quickApplyText: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  primaryBtn:     { backgroundColor: Colors.accent, borderRadius: Radius.lg, padding: 14, alignItems: 'center' },
  primaryBtnText: { color: Colors.bg, fontWeight: '700', fontSize: 15 },
  outlineBtn:     { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center' },
  outlineBtnText: { color: Colors.sub, fontSize: 13 },
  disabled:       { opacity: 0.5 },
  errorBox:       { backgroundColor: Colors.errorBg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.errorBorder },
  errorText:      { color: Colors.red, fontSize: 13 },
  gateGroupLabel: { fontSize: 10, fontWeight: '600', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.xs },
  actionSection:        { gap: Spacing.sm },
  actionBtn:            { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: 13, alignItems: 'center' },
  actionBtnPrimary:     { backgroundColor: Colors.accent, borderColor: Colors.accent },
  actionBtnText:        { fontSize: 14, fontWeight: '600', color: Colors.text },
  actionBtnTextPrimary: { color: Colors.bg },
})
