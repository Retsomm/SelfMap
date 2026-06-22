import { useAuth } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
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
import { HD_CENTERS_INFO } from '@/lib/hd-chart-data'
import { normalizeCenterId, normalizeChannelId, findChannelById } from '@/lib/hd-normalizers'
import { getTypeMeta } from '@/lib/hd-type-meta'
import BodyGraph from '@/components/BodyGraph'
import DetailBottomSheet, { type SheetTarget } from '@/components/DetailBottomSheet'
import { SectionCard, Row, Tag } from '@/components/chart/ChartPrimitives'
import { Colors, Radius, Spacing } from '@/constants/tokens'

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

export default function ChartPreviewScreen() {
  const { isSignedIn, getToken } = useAuth()
  const router = useRouter()
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
      await downloadChartAsPdf(chart!)
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
      router.replace('/(tabs)/profile')
    } catch (err) {
      Alert.alert('儲存失敗', err instanceof Error ? err.message : '請稍後再試')
      setSaveState('idle')
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
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
          <Row label="能量類型" value={chart.type} accent tappable onPress={() => open({ kind: 'type', typeKey: chart.type })} />
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

        {/* 已定義中心 */}
        <SectionCard title="九大中心（已定義）">
          <View style={styles.tagRow}>
            {chart.centers.map((c) => {
              const chartKey = normalizeCenterId(c)
              const info     = HD_CENTERS_INFO[chartKey]
              const label    = info?.name.zh ?? c
              return (
                <Tag key={c} label={label} active onPress={() => open({ kind: 'center', id: chartKey })} />
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
                  <Tag key={rawCh} label={label} onPress={ch ? () => open({ kind: 'channel', channel: ch }) : undefined} />
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
            {[...chart.gates].sort((a, b) => a - b).map((g) => (
              <Pressable
                key={g}
                style={({ pressed }) => [styles.gate, pressed && styles.gatePressed]}
                onPress={() => open({ kind: 'gate', num: g })}
              >
                <Text style={styles.gateText}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        {/* 輪迴交叉 */}
        {chart.incarnationCross && (
          <SectionCard title="輪迴交叉">
            <Row label="交叉類型" value={chart.incarnationCross.crossTypeLabel} accent />
            <Row label="交叉名稱" value={`${chart.incarnationCross.crossBaseName}${chart.incarnationCross.variant}`} />
            <Row label="完整名稱" value={`${chart.incarnationCross.crossTypeLabel}之${chart.incarnationCross.crossBaseName}${chart.incarnationCross.variant}`} />
            <Row label="閘門組合" value={chart.incarnationCross.gatesLabel} />
          </SectionCard>
        )}

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner:     { padding: Spacing.lg, paddingBottom: Spacing.xxl, rowGap: Spacing.md },

  graphCard:       { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  graphCardHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  graphTitle:      { color: Colors.sub, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  graphContainer:  { width: '100%', aspectRatio: 590 / 1030 },

  tagRow:   { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 6 },
  gateGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.sm, rowGap: Spacing.sm },
  gate:        { backgroundColor: Colors.gateBg, borderRadius: Radius.sm, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.gateBorder },
  gatePressed: { backgroundColor: Colors.accentD, borderColor: Colors.accent },
  gateText:    { color: Colors.accent, fontSize: 13, fontWeight: '600' },

  planetHeader:     { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.xs },
  planetHeaderText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: Colors.sub },
  planetRow:        { flexDirection: 'row', paddingVertical: 5 },
  planetRowAlt:     { backgroundColor: Colors.altRowBg, marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg, borderRadius: 6 },
  planetCol:        { flex: 1.2, fontSize: 13, color: Colors.sub },
  planetGateCol:    { flex: 1, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  planetBlack:      { color: Colors.text },
  planetRed:        { color: Colors.planetRedText },

  arrowsGrid:    { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md },
  arrowsCol:     { flex: 1, gap: Spacing.sm },
  arrowsSide:    { fontSize: 11, color: Colors.muted, fontWeight: '600', marginBottom: 2 },
  arrowItem:     { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  arrowDir:      { fontSize: 18, color: Colors.accent, fontWeight: '700', width: 20, lineHeight: 22 },
  arrowInfo:     { flex: 1, gap: 2 },
  arrowCategory: { fontSize: 10, color: Colors.sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  arrowLabel:    { fontSize: 13, color: Colors.text, fontWeight: '700' },
  arrowDesc:     { fontSize: 11, color: Colors.sub, lineHeight: 15 },

  actionSection: { gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn:         { paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center' },
  actionBtnPrimary:  { backgroundColor: Colors.accent },
  actionBtnOutline:  { borderWidth: 1.5, borderColor: Colors.accent, backgroundColor: Colors.accentD },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText:        { fontSize: 15, fontWeight: '600' },
  actionBtnTextPrimary: { color: Colors.bg },
  actionBtnTextOutline: { color: Colors.accent },

  loginHint: { textAlign: 'center', fontSize: 12, color: Colors.muted, marginTop: Spacing.xs },
})
