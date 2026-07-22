import { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { type Chart, type CreateCompositeResult } from '@/lib/api'
import { getTypeLabel } from '@/lib/hd-type-meta'
import { CENTER_NAME } from '@/lib/hd-constants'
import { CONN_LABEL, CONN_DESC, connColors, INTEGRATION_THEME, PROFILE_RESONANCE_DESC } from '@/components/composite/compositeText'
import { Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'

type SyncCompositeData = {
  personA: { name: null; birthDate: string; birthTime?: string; birthCity: string; type: string; profile: string; authority: string; authorityTip?: string }
  personB: { name: null; birthDate: string; birthTime?: string; birthCity: string; type: string; profile: string; authority: string; authorityTip?: string }
  integrationTheme: string
  compositeDefinedCount: number
  compositeOpenCount: number
}

export default function CompositeInfo({
  chart,
  fetchedResult,
  syncData,
  fetchLoading,
}: {
  chart: Chart
  fetchedResult?: CreateCompositeResult | null
  syncData?: SyncCompositeData | null
  fetchLoading?: boolean
}) {
  const Colors = useThemeColors()
  const c = useMemo(() => createStyles(Colors), [Colors])
  const CONN_COLORS = useMemo(() => connColors(Colors), [Colors])

  const meta = chart.meta

  // 人物資料優先順序：DB meta > async fetchedResult > 同步解析的 syncData
  const personA = meta?.personA ?? fetchedResult?.personA ?? syncData?.personA
  const personB = meta?.personB ?? fetchedResult?.personB ?? syncData?.personB

  // 連結分析資料：DB meta > async fetchedResult
  // （syncData 沒有電磁/陪伴等資料，需要 async fetch）
  const result = meta?.compositeResult ?? (fetchedResult ? {
    integrationTheme:      fetchedResult.integrationTheme,
    compositeDefinedCount: fetchedResult.compositeDefinedCount,
    compositeOpenCount:    fetchedResult.compositeOpenCount,
    profileResonance:      fetchedResult.profileResonance,
    electromagnetic:       fetchedResult.electromagnetic,
    companionship:         fetchedResult.companionship,
    compromise:            fetchedResult.compromise,
    dominance:             fetchedResult.dominance,
  } : null)

  // integrationTheme 可從 syncData 直接取得（無需 async）
  const integrationTheme = result?.integrationTheme ?? syncData?.integrationTheme
  const compositeDefinedCount = result?.compositeDefinedCount ?? syncData?.compositeDefinedCount
  const compositeOpenCount    = result?.compositeOpenCount    ?? syncData?.compositeOpenCount
  const theme = integrationTheme ? (INTEGRATION_THEME[integrationTheme] ?? INTEGRATION_THEME['6+3+']) : null

  const nameA = (personA as { name?: string | null } | undefined)?.name || 'A'
  const nameB = (personB as { name?: string | null } | undefined)?.name || 'B'

  // 行星閘門對照：只有 DB 沒存這份逐行星資料，只能靠 async 重算的 fetchedResult 取得
  // （跟儲存前的預覽 CompositeView.tsx 用同一組欄位），DB 直存的合圖暫時無法離線顯示這張表
  const planetsA = fetchedResult?.personA.planets ?? []
  const planetsB = fetchedResult?.personB.planets ?? []

  return (
    <View style={c.root}>

      {/* 人物資訊 */}
      <View style={c.personRow}>
        {[
          { label: nameA, p: personA, color: Colors.accent },
          { label: nameB, p: personB, color: Colors.text },
        ].map(({ label, p, color }, idx) => (
          <View key={idx} style={c.personCard}>
            <Text style={[c.personName, { color }]}>{label}</Text>
            <Text style={c.personSub}>
              {p?.birthDate ?? '—'}{p?.birthTime ? ` · ${p.birthTime}` : ''}
            </Text>
            <Text style={c.personSub}>{p?.birthCity ?? '—'}</Text>
            <Text style={c.personMeta}>{p?.type ? getTypeLabel(p.type) : '—'} · {p?.profile ?? '—'}</Text>
          </View>
        ))}
      </View>

      {theme && (
        <>
          {/* 整合主題 */}
          <View style={c.section}>
            <Text style={c.sectionLabel}>能量場整合主題</Text>
            <View style={c.card}>
              <View style={c.themeHeader}>
                <Text style={c.themeLabel}>{theme.label}</Text>
                <Text style={c.themeSub}>
                  合圖定義 {compositeDefinedCount ?? '—'} / 9 中心 · 開放 {compositeOpenCount ?? '—'} 中心
                </Text>
              </View>
              <View style={c.themePair}>
                <View>
                  <Text style={c.themeBlockLabel}>戀愛關係</Text>
                  <Text style={c.themeBlockBody}>{theme.love}</Text>
                </View>
                <View style={{ marginTop: 12 }}>
                  <Text style={c.themeBlockLabel}>工作夥伴</Text>
                  <Text style={c.themeBlockBody}>{theme.work}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 行星閘門對照 */}
          {planetsA.length > 0 && (
            <View style={c.section}>
              <Text style={c.sectionLabel}>行星閘門對照</Text>
              <View style={c.card}>
                <View style={c.planetGroupRow}>
                  <View style={c.planetPlanetCol} />
                  <Text style={[c.planetGroupLabel, { color: Colors.accent }]}>{nameA}</Text>
                  <Text style={[c.planetGroupLabel, { color: Colors.text }]}>{nameB}</Text>
                </View>
                <View style={[c.planetRow, c.planetHeaderRow]}>
                  <Text style={[c.planetPlanetCol, c.planetHeaderText]}>行星</Text>
                  <Text style={[c.planetGateColSm, c.planetHeaderText, { color: Colors.text }]}>意識</Text>
                  <Text style={[c.planetGateColSm, c.planetHeaderText, { color: Colors.designRed }]}>潛意識</Text>
                  <Text style={[c.planetGateColSm, c.planetHeaderText, { color: Colors.text }]}>意識</Text>
                  <Text style={[c.planetGateColSm, c.planetHeaderText, { color: Colors.designRed }]}>潛意識</Text>
                </View>
                {planetsA.map((p, i) => {
                  const pb = planetsB[i]
                  return (
                    <View key={p.name} style={[c.planetRow, i % 2 === 1 && c.planetRowAlt]}>
                      <Text style={c.planetPlanetCol}>{p.name}</Text>
                      <Text style={[c.planetGateColSm, { color: Colors.text }]}>{p.blackGate}.{p.blackLine}</Text>
                      <Text style={[c.planetGateColSm, { color: Colors.designRed }]}>{p.redGate}.{p.redLine}</Text>
                      <Text style={[c.planetGateColSm, { color: Colors.text }]}>{pb?.blackGate}.{pb?.blackLine}</Text>
                      <Text style={[c.planetGateColSm, { color: Colors.designRed }]}>{pb?.redGate}.{pb?.redLine}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {/* 四種核心連結動力 */}
          <View style={c.section}>
            <Text style={c.sectionLabel}>四種核心連結動力</Text>
            {!result ? (
              <View style={c.card}>
                {fetchLoading
                  ? <ActivityIndicator color={Colors.sub} style={{ padding: Spacing.lg }} />
                  : <Text style={c.connEmpty}>正在載入連結分析…</Text>}
              </View>
            ) : (['electromagnetic', 'companionship', 'compromise', 'dominance'] as const).map(type => {
              const items = result[type] ?? []
              const cfg   = CONN_COLORS[type]
              return (
                <View key={type} style={[c.connGroup, { borderColor: cfg.color + '55' }]}>
                  <View style={[c.connHeader, { backgroundColor: cfg.bg }]}>
                    <Text style={[c.connTitle, { color: cfg.color }]}>{CONN_LABEL[type]}</Text>
                    <Text style={c.connDesc}>{CONN_DESC[type]}</Text>
                  </View>
                  {items.length === 0 ? (
                    <Text style={c.connEmpty}>無相關通道</Text>
                  ) : items.map(conn => (
                    <View key={conn.channelId} style={c.connRow}>
                      <View style={c.connIdCol}>
                        <Text style={c.connId}>{conn.channelId}</Text>
                        <Text style={c.connCenters}>
                          {CENTER_NAME[conn.centerA] ?? conn.centerA}—{CENTER_NAME[conn.centerB] ?? conn.centerB}
                        </Text>
                      </View>
                      <View style={c.connGateCol}>
                        <Text style={[c.connPersonLabel, { color: Colors.accent }]}>{nameA}</Text>
                        <Text style={c.connGates}>{conn.aGates.length > 0 ? conn.aGates.join(', ') : '—'}</Text>
                      </View>
                      <View style={c.connGateCol}>
                        <Text style={c.connPersonLabel}>{nameB}</Text>
                        <Text style={c.connGates}>{conn.bGates.length > 0 ? conn.bGates.join(', ') : '—'}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )
            })}
          </View>

          {/* 人生角色共鳴 */}
          <View style={c.section}>
            <Text style={c.sectionLabel}>人生角色共鳴</Text>
            <View style={c.card}>
              <View style={c.profileRow}>
                <Text style={[c.profileLabel, { color: Colors.accent }]}>{nameA} {personA?.profile}</Text>
                <Text style={c.profileLabel}>{nameB} {personB?.profile}</Text>
              </View>
              {!result ? (
                <Text style={c.resonanceNone}>—</Text>
              ) : result.profileResonance.length === 0 ? (
                <Text style={c.resonanceNone}>兩人人生角色沒有共同爻線，各自的觀點框架較為不同。</Text>
              ) : result.profileResonance.map(line => {
                const info = PROFILE_RESONANCE_DESC[line]
                if (!info) return null
                return (
                  <View key={line} style={c.resonanceRow}>
                    <Text style={c.resonanceTitle}>{info.title}</Text>
                    <Text style={c.resonanceDesc}>{info.desc}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* 策略與內在權威 */}
          <View style={c.section}>
            <Text style={c.sectionLabel}>策略與內在權威</Text>
            {[
              { label: `${nameA} 的權威`, p: personA, color: Colors.accent },
              { label: `${nameB} 的權威`, p: personB, color: Colors.text },
            ].map(({ label, p, color }, idx) => (
              <View key={idx} style={[c.authorityCard, { borderLeftColor: color }]}>
                <Text style={c.authorityLabel}>{label}</Text>
                <Text style={[c.authorityName, { color }]}>{p?.authority ?? '—'}</Text>
                {p?.authorityTip ? <Text style={c.authorityTip}>{p.authorityTip}</Text> : null}
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  root:        { gap: 16 },
  section:     { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: Colors.muted, letterSpacing: 1.2, textTransform: 'uppercase' },

  personRow:  { flexDirection: 'row', gap: 10 },
  personCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  personName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  personSub:  { fontSize: 12, color: Colors.sub },
  personMeta: { fontSize: 12, color: Colors.muted, marginTop: 6 },

  card: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },

  themeHeader:     { padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  themeLabel:      { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  themeSub:        { fontSize: 12, color: Colors.sub },
  themePair:       { padding: 14 },
  themeBlockLabel: { fontSize: 10, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  themeBlockBody:  { fontSize: 13, color: Colors.text, lineHeight: 20 },

  planetGroupRow:   { flexDirection: 'row', padding: 14, paddingBottom: 2 },
  planetPlanetCol:  { flex: 1.2, fontSize: 12, color: Colors.sub },
  planetGroupLabel: { flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  planetHeaderRow:  { paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 2 },
  planetHeaderText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: Colors.sub },
  planetRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 5 },
  planetRowAlt:     { backgroundColor: Colors.altRowBg },
  planetGateColSm:  { flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'center' },

  connGroup:       { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  connHeader:      { padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  connTitle:       { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  connDesc:        { fontSize: 12, color: Colors.sub, lineHeight: 18 },
  connEmpty:       { padding: 12, fontSize: 12, color: Colors.muted },
  connRow:         { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  connIdCol:       { width: 80 },
  connId:          { fontSize: 13, fontWeight: '700', color: Colors.text },
  connCenters:     { fontSize: 10, color: Colors.muted, lineHeight: 14, marginTop: 2 },
  connGateCol:     { flex: 1 },
  connPersonLabel: { fontSize: 11, fontWeight: '600', color: Colors.sub, marginBottom: 1 },
  connGates:       { fontSize: 13, color: Colors.text },

  profileRow:    { flexDirection: 'row', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  profileLabel:  { fontSize: 14, fontWeight: '600', color: Colors.text },
  resonanceNone: { fontSize: 13, color: Colors.sub, lineHeight: 20, padding: 12 },
  resonanceRow:  { paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  resonanceTitle:{ fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  resonanceDesc: { fontSize: 13, color: Colors.sub, lineHeight: 19 },

  authorityCard:  { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4, padding: 14, marginBottom: 8 },
  authorityLabel: { fontSize: 10, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  authorityName:  { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  authorityTip:   { fontSize: 13, color: Colors.sub, lineHeight: 19 },
})
