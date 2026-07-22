import { useAuth } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Clipboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getPendingChart, clearPendingChart, type PendingChart } from '@/lib/pendingChart'
import { createChart } from '@/lib/api'
import { downloadChartAsPdf, generateAiPrompt } from '@/lib/chartPdf'
import { HD_CENTERS_INFO, ACT_CONSCIOUS, ACT_UNCONSCIOUS } from '@shared/humanDesign/hd-chart-data'
import { normalizeCenterId, normalizeChannelId, findChannelById } from '@/lib/hd-normalizers'
import { getTypeMeta, getTypeLabel } from '@/lib/hd-type-meta'
import BodyGraph from '@/components/BodyGraph'
import DetailBottomSheet, { type SheetTarget } from '@/components/DetailBottomSheet'
import { SectionCard, Row, Tag } from '@/components/chart/ChartPrimitives'
import { NavBackHeader } from '@/components/NavBackHeader'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Radius, Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors, useThemeMode } from '@/contexts/ThemeContext'

// ─── Action buttons ───────────────────────────────────────────────────────────

type ActionState = 'idle' | 'loading'

function ActionButton({
  label,
  notLoggedInLabel,
  isLoggedIn,
  onPress,
  state,
  variant,
}: {
  label: string
  notLoggedInLabel: string
  isLoggedIn: boolean
  onPress: () => void
  state?: ActionState
  variant?: 'primary' | 'outline'
}) {
  const isPrimary = variant === 'primary'
  const Colors = useThemeColors()
  const styles = useMemo(() => createStyles(Colors), [Colors])
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionBtn,
        isPrimary ? styles.actionBtnPrimary : styles.actionBtnOutline,
        (state === 'loading' || pressed) && styles.actionBtnDisabled,
      ]}
      onPress={onPress}
      disabled={state === 'loading'}
    >
      <Text style={[styles.actionBtnText, isPrimary ? styles.actionBtnTextPrimary : styles.actionBtnTextOutline]}>
        {state === 'loading' ? '處理中…' : isLoggedIn ? label : `登入後開始${label}`}
      </Text>
    </Pressable>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

function ChartPreviewScreenContent() {
  const { isSignedIn, getToken } = useAuth()
  const router = useRouter()
  const Colors = useThemeColors()
  const { mode } = useThemeMode()
  const styles = useMemo(() => createStyles(Colors), [Colors])
  const [chart, setChart] = useState<PendingChart | null>(null)
  const [sheetTarget, setSheetTarget] = useState<SheetTarget | null>(null)
  const [saveState, setSaveState] = useState<ActionState>('idle')
  const [pdfState, setPdfState] = useState<ActionState>('idle')

  useEffect(() => {
    const pending = getPendingChart()
    if (!pending) {
      router.replace('/(tabs)/create')
      return
    }
    setChart(pending)
  }, [router])

  if (!chart) return null

  const typeMeta = getTypeMeta(chart.type)

  const definedCenterIds  = new Set(chart.centers.map(normalizeCenterId))
  const definedChannelIds = new Set(chart.channels.map(normalizeChannelId))

  const activations: Record<number, { c?: boolean; u?: boolean }> = {}
  if (chart.planets && chart.planets.length > 0) {
    for (const p of chart.planets) {
      activations[p.blackGate] = { ...activations[p.blackGate], c: true }
      activations[p.redGate]   = { ...activations[p.redGate],   u: true }
    }
  } else {
    const pg = chart.personalityGates ?? []
    const dg = chart.designGates ?? []
    if (pg.length > 0 || dg.length > 0) {
      for (const g of pg) activations[g] = { ...activations[g], c: true }
      for (const g of dg) activations[g] = { ...activations[g], u: true }
    } else {
      for (const g of chart.gates) activations[g] = { c: true }
    }
  }

  const open = (target: SheetTarget) => setSheetTarget(target)

  function requireLogin() {
    router.push('/(auth)/sign-in')
  }

  async function handleDownload() {
    if (!isSignedIn) { requireLogin(); return }
    setPdfState('loading')
    try {
      await downloadChartAsPdf(chart!, mode)
    } catch (err) {
      Alert.alert('下載失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setPdfState('idle')
    }
  }

  function handleCopyPrompt() {
    if (!isSignedIn) { requireLogin(); return }
    Clipboard.setString(generateAiPrompt(chart!))
    Alert.alert('已複製', '提示詞已複製到剪貼簿，可貼到 ChatGPT 或其他 AI 工具使用。')
  }

  async function handleSave() {
    if (!isSignedIn) { requireLogin(); return }
    setSaveState('loading')
    try {
      const token = await getToken()
      if (!token) throw new Error('取得 token 失敗')
      await createChart(token, {
        birthDate:  chart!.birthDate,
        birthTime:  chart!.birthTime,
        birthCity:  chart!.birthCity,
        timezone:   chart!.timezone,
        name:       chart!.name || undefined,
        chartKind:  'personal',
      })
      clearPendingChart()
      router.replace('/(tabs)/profile?chartTab=personal')
    } catch (err) {
      Alert.alert('儲存失敗', err instanceof Error ? err.message : '請稍後再試')
      setSaveState('idle')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <NavBackHeader title="圖表預覽" />
      <ScrollView contentContainerStyle={styles.inner}>

        {/* Body Graph */}
        <View style={styles.graphCard}>
          <View style={styles.graphCardHeader}>
            <Text style={styles.graphTitle}>Body Graph</Text>
          </View>
          <View style={styles.graphContainer}>
            <BodyGraph
              definedCenterIds={definedCenterIds}
              definedChannelIds={definedChannelIds}
              activations={activations}
              showGates
            />
          </View>
        </View>

        {/* 出生資訊 */}
        <SectionCard title="出生資訊">
          {chart.name ? <Row label="名稱" value={chart.name} /> : null}
          <Row label="出生日期" value={chart.birthDate} />
          <Row label="出生時間" value={chart.birthTime} />
          <Row label="出生城市" value={chart.birthCity} />
          {chart.timezone ? <Row label="時區" value={chart.timezone} /> : null}
        </SectionCard>

        {/* 類型 */}
        <SectionCard title="類型">
          <Row label="能量類型" value={getTypeLabel(chart.type)} accent tappable onPress={() => open({ kind: 'type', typeKey: chart.type })} />
          <Row label="策略" value={typeMeta.strategy} />
          <Row label="簽名（成功徵兆）" value={typeMeta.signature} accent />
          <Row label="非自我主題" value={typeMeta.notSelf} dim />
        </SectionCard>

        {/* 設計 */}
        <SectionCard title="設計">
          <Row label="內在權威" value={chart.authority} accent tappable onPress={() => open({ kind: 'authority', authorityKey: chart.authority })} />
          <Row label="人生角色（Profile）" value={chart.profile} tappable onPress={() => open({ kind: 'profile', profile: chart.profile })} />
          <Row label="定義" value={chart.definition} tappable onPress={() => open({ kind: 'definition', definitionKey: chart.definition })} />
        </SectionCard>

        {/* 九大中心 */}
        <SectionCard title="九大中心">
          <View style={styles.tagRow}>
            {Object.keys(HD_CENTERS_INFO).map((chartKey) => {
              const info    = HD_CENTERS_INFO[chartKey]
              const defined = definedCenterIds.has(chartKey)
              return (
                <Tag
                  key={chartKey}
                  label={info.name.zh}
                  active={defined}
                  onPress={() => open({ kind: 'center', id: chartKey, defined })}
                />
              )
            })}
          </View>
        </SectionCard>

        {/* 定義通道 */}
        {chart.channels.length > 0 && (
          <SectionCard title={`定義通道（${chart.channels.length}）`}>
            <View style={styles.tagRow}>
              {chart.channels.map((rawCh) => {
                const ch    = findChannelById(rawCh)
                const label = ch ? `${ch.from}–${ch.to}` : rawCh
                return (
                  <Tag key={rawCh} label={label} active onPress={ch ? () => open({ kind: 'channel', channel: ch }) : undefined} />
                )
              })}
            </View>
          </SectionCard>
        )}

        {/* 行星閘門對照 */}
        {chart.planets && chart.planets.length > 0 && (
          <SectionCard title="行星閘門對照">
            <View style={styles.planetHeader}>
              <Text style={[styles.planetCol, styles.planetHeaderText]}>行星</Text>
              <Text style={[styles.planetGateCol, styles.planetHeaderText, { color: Colors.muted }]}>● 意識（黑）</Text>
              <Text style={[styles.planetGateCol, styles.planetHeaderText, { color: Colors.designRed }]}>● 潛意識（紅）</Text>
            </View>
            {chart.planets.map((p, i) => (
              <View key={i} style={[styles.planetRow, i % 2 === 1 && styles.planetRowAlt]}>
                <Text style={styles.planetCol}>{p.name}</Text>
                <Text style={[styles.planetGateCol, styles.planetBlack]}>{p.blackGate}.{p.blackLine}</Text>
                <Text style={[styles.planetGateCol, styles.planetRed]}>{p.redGate}.{p.redLine}</Text>
              </View>
            ))}
          </SectionCard>
        )}

        {/* 激活閘門 */}
        <SectionCard title={`激活閘門（${chart.gates.length}）`}>
          <View style={styles.gateGrid}>
            {[...chart.gates].sort((a, b) => a - b).map((g) => {
              const state = activations[g]
              const isDual = !!(state?.c && state?.u)
              const soloFill = isDual ? null : state?.c ? ACT_CONSCIOUS : state?.u ? ACT_UNCONSCIOUS : null
              const isActive = isDual || !!soloFill
              return (
                <Pressable
                  key={g}
                  style={[
                    styles.gate,
                    isDual && { backgroundColor: ACT_CONSCIOUS, borderColor: ACT_CONSCIOUS },
                    soloFill && { backgroundColor: soloFill, borderColor: soloFill },
                  ]}
                  onPress={() => open({ kind: 'gate', num: g })}
                >
                  {({ pressed }) => (
                    <>
                      {isDual && <View style={styles.gateDualOverlay} />}
                      <Text style={[styles.gateText, isActive && styles.gateTextActive, pressed && styles.gateTextPressed]}>
                        {g}
                      </Text>
                    </>
                  )}
                </Pressable>
              )
            })}
          </View>
        </SectionCard>

        {/* 輪迴交叉 */}
        {chart.incarnationCross && (() => {
          const ic = chart.incarnationCross!
          const sheetTarget = {
            kind: 'incarnationCross' as const,
            crossType:      ic.crossType,
            crossTypeLabel: ic.crossTypeLabel,
            crossBaseName:  ic.crossBaseName,
            variant:        ic.variant,
            gatesLabel:     ic.gatesLabel,
            sunGate:        ic.sunGate,
          }
          return (
            <Pressable onPress={() => open(sheetTarget)} style={({ pressed }) => [styles.crossCard, pressed && styles.crossCardPressed]}>
              <Text style={styles.crossCardTitle}>輪迴交叉</Text>
              <Text style={styles.crossFullName}>
                {ic.crossTypeLabel}之{ic.crossBaseName}{ic.variant}
              </Text>
              <Text style={styles.crossGates}>閘門組合：{ic.gatesLabel}</Text>
              <Text style={styles.crossHint}>點擊查看說明 ›</Text>
            </Pressable>
          )
        })()}

        {/* 四箭頭（Variables） */}
        {chart.variables && chart.arrows && (
          <SectionCard title="四箭頭（Variables）">
            <View style={styles.arrowsGrid}>
              {/* 左側：Design（紅）*/}
              <View style={styles.arrowsCol}>
                <Text style={styles.arrowsSide}>← Design（紅）</Text>
                <View style={styles.arrowItem}>
                  <Text style={styles.arrowDir}>{chart.arrows.topLeft ? '←' : '→'}</Text>
                  <View style={styles.arrowInfo}>
                    <Text style={styles.arrowCategory}>飲食（Digestion）</Text>
                    <Text style={styles.arrowLabel}>{chart.variables.digestion.label}</Text>
                    <Text style={styles.arrowDesc}>{chart.variables.digestion.description}</Text>
                  </View>
                </View>
                <View style={styles.arrowItem}>
                  <Text style={styles.arrowDir}>{chart.arrows.bottomLeft ? '←' : '→'}</Text>
                  <View style={styles.arrowInfo}>
                    <Text style={styles.arrowCategory}>環境（Environment）</Text>
                    <Text style={styles.arrowLabel}>{chart.variables.environment.label}</Text>
                    <Text style={styles.arrowDesc}>{chart.variables.environment.description}</Text>
                  </View>
                </View>
              </View>
              {/* 右側：Personality（黑）*/}
              <View style={styles.arrowsCol}>
                <Text style={styles.arrowsSide}>Personality（黑）→</Text>
                <View style={styles.arrowItem}>
                  <Text style={styles.arrowDir}>{chart.arrows.topRight ? '←' : '→'}</Text>
                  <View style={styles.arrowInfo}>
                    <Text style={styles.arrowCategory}>動機（Motivation）</Text>
                    <Text style={styles.arrowLabel}>{chart.variables.motivation.label}</Text>
                    <Text style={styles.arrowDesc}>{chart.variables.motivation.description}</Text>
                  </View>
                </View>
                <View style={styles.arrowItem}>
                  <Text style={styles.arrowDir}>{chart.arrows.bottomRight ? '←' : '→'}</Text>
                  <View style={styles.arrowInfo}>
                    <Text style={styles.arrowCategory}>觀點（Perspective）</Text>
                    <Text style={styles.arrowLabel}>{chart.variables.perspective.label}</Text>
                    <Text style={styles.arrowDesc}>{chart.variables.perspective.description}</Text>
                  </View>
                </View>
              </View>
            </View>
          </SectionCard>
        )}

        {/* ─── 三個行動按鈕 ─── */}
        <View style={styles.actionSection}>
          <ActionButton
            label="下載 PDF"
            notLoggedInLabel="下載 PDF"
            isLoggedIn={!!isSignedIn}
            onPress={handleDownload}
            state={pdfState}
            variant="outline"
          />
          <ActionButton
            label="複製提示詞"
            notLoggedInLabel="複製提示詞"
            isLoggedIn={!!isSignedIn}
            onPress={handleCopyPrompt}
            variant="outline"
          />
          <ActionButton
            label="儲存圖表"
            notLoggedInLabel="儲存圖表"
            isLoggedIn={!!isSignedIn}
            onPress={handleSave}
            state={saveState}
            variant="primary"
          />
        </View>

        {!isSignedIn && (
          <Text style={styles.loginHint}>登入後即可下載、複製提示詞及儲存圖表</Text>
        )}

      </ScrollView>

      <DetailBottomSheet
        target={sheetTarget}
        onClose={() => setSheetTarget(null)}
      />
    </SafeAreaView>
  )
}

export default function ChartPreviewScreen() {
  return (
    <ErrorBoundary fallbackTitle="圖表預覽失敗">
      <ChartPreviewScreenContent />
    </ErrorBoundary>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner:     { padding: Spacing.lg, paddingBottom: Spacing.xxl, rowGap: Spacing.md },

  graphCard:       { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  graphCardHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  graphTitle:      { color: Colors.sub, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  graphContainer:  { width: '100%', aspectRatio: 590 / 1030 },

  tagRow:   { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 6 },
  gateGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.sm, rowGap: Spacing.sm },
  gate:            { backgroundColor: Colors.gateBg, borderRadius: Radius.sm, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.gateBorder, overflow: 'hidden' },
  gateDualOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', backgroundColor: Colors.designRed },
  gateText:        { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  gateTextActive:  { color: '#ffffff' },
  gateTextPressed: { fontSize: 17, fontWeight: '800' },

  planetHeader:     { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.xs },
  planetHeaderText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: Colors.sub },
  planetRow:        { flexDirection: 'row', paddingVertical: 5 },
  planetRowAlt:     { backgroundColor: Colors.altRowBg, marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg, borderRadius: 6 },
  planetCol:        { flex: 1.2, fontSize: 13, color: Colors.sub },
  planetGateCol:    { flex: 1, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  planetBlack:      { color: Colors.text },
  planetRed:        { color: Colors.planetRedText },

  arrowsGrid:    { flexDirection: 'column', gap: Spacing.lg, padding: Spacing.md },
  arrowsCol:     { gap: Spacing.md },
  arrowsSide:    { fontSize: 14, color: Colors.muted, fontWeight: '600', marginBottom: 2 },
  arrowItem:     { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  arrowDir:      { fontSize: 22, color: Colors.accent, fontWeight: '700', width: 24, lineHeight: 26 },
  arrowInfo:     { flex: 1, gap: 3 },
  arrowCategory: { fontSize: 12, color: Colors.sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  arrowLabel:    { fontSize: 17, color: Colors.text, fontWeight: '700' },
  arrowDesc:     { fontSize: 13, color: Colors.sub, lineHeight: 18 },

  actionSection: { gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn:         { paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center' },
  actionBtnPrimary:  { backgroundColor: Colors.accent },
  actionBtnOutline:  { borderWidth: 1.5, borderColor: Colors.accent, backgroundColor: Colors.accentD },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText:        { fontSize: 15, fontWeight: '600' },
  actionBtnTextPrimary: { color: Colors.bg },
  actionBtnTextOutline: { color: Colors.accent },

  loginHint: { textAlign: 'center', fontSize: 12, color: Colors.muted, marginTop: Spacing.xs },

  crossCard:        { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  crossCardPressed: { borderColor: Colors.accent, backgroundColor: Colors.accentD },
  crossCardTitle:   { color: Colors.sub, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  crossFullName:    { color: Colors.accent, fontSize: 16, fontWeight: '700' },
  crossGates:       { color: Colors.sub, fontSize: 13 },
  crossHint:        { color: Colors.muted, fontSize: 12, alignSelf: 'flex-end' } as const,
})
