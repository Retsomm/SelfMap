import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { type Chart, type CreateCompositeResult } from '@/lib/api'
import { getTypeLabel } from '@/lib/hd-type-meta'
import { Colors, Spacing } from '@/constants/tokens'

const LIB_CENTER_ZH: Record<string, string> = {
  head: '頭腦中心', ajna: '邏輯中心', throat: '喉嚨中心', g: 'G 中心',
  ego: '意志力中心', heart: '意志力中心',
  solarPlexus: '情緒中心', solar: '情緒中心',
  spleen: '脾中心', sacral: '薦骨中心', root: '根部中心',
}

const INTEGRATION_THEME: Record<string, { label: string; love: string; work: string }> = {
  '9+0': {
    label: '全滿（9+0）— Nowhere to go',
    love: '極度甜蜜與黏人。能量場完全自給自足，外人很難融入。兩人會深深沉浸在彼此的世界中，但也容易因為缺乏外在刺激而感到窒息或過度封閉。',
    work: '過於封閉。團隊內部可能非常有默契，但極易忽略外部市場的變化或同事、客戶的客觀意見。',
  },
  '8+1': {
    label: '8+1 — Have some fun',
    love: '最舒服的互動模式。彼此有足夠的能量連結，同時留有「空白」作為陽光照進來的窗口。雙方擁有各自呼吸與消化的空間，關係健康且長久。',
    work: '黃金搭檔。既有共同努力的交集，又有一起去體驗、探索外部世界的窗口。',
  },
  '7+2': {
    label: '7+2 — Work to do',
    love: '最舒服的互動模式之一。保有兩個空白中心，彼此連結同時仍有足夠的獨立呼吸空間，長期相處不易窒息。',
    work: '黃金搭檔。既有共同努力的交集，又有兩扇開放的窗口迎接外在刺激與機會。',
  },
  '6+3+': {
    label: '6+3+ — Better to be free',
    love: '連結感較淡。兩人在一起時仍有太多未定因素，容易流於平淡或像朋友。通常需要藉由共同的興趣、小孩或外在媒介來維繫緊密感。',
    work: '適合團隊合作。保持高度的獨立性與自由度，不會對彼此造成過度制約，適合鬆散型的專案合作或大團隊中的平行分工。',
  },
}

const PROFILE_RESONANCE_DESC: Record<number, { title: string; desc: string }> = {
  1: { title: '1 爻共鳴', desc: '兩人都需要足夠的安全感與底層研究，能深深理解彼此打基礎的必要。' },
  2: { title: '2 爻共鳴', desc: '兩人都需要獨處與等待被呼喚的空間，彼此能體諒對方的隱士特質。' },
  3: { title: '3 爻共鳴', desc: '兩人都能理解試錯與碰撞的學習過程，不會因為失敗而互相責備。' },
  4: { title: '4 爻共鳴', desc: '兩人都重視人脈與穩定的社群，能在圈子建設上形成默契。' },
  5: { title: '5 爻共鳴', desc: '兩人都帶有被投射的特質，需要互相留意實際的期待落差。' },
  6: { title: '6 爻共鳴', desc: '兩人都有長遠的人生週期觀，能理解彼此不同階段的冷靜與退後。' },
}

const CONN_CFG: Record<string, { label: string; desc: string; accentColor: string; bgColor: string }> = {
  electromagnetic: {
    label: '電磁關係 (Electromagnetic)',
    desc:  '互補吸引 — 一方有 A 閘門，另一方有 B 閘門，合力激活完整通道。最經典的「致命吸引力」，容易一見鍾情但也容易相愛相殺。',
    accentColor: '#c8553d', bgColor: 'rgba(200,85,61,0.08)',
  },
  companionship: {
    label: '陪伴關係 (Companionship)',
    desc:  '默契安全 — 兩人擁有相同的閘門或通道，相處起來最不費力，如靈魂伴侶或老朋友。',
    accentColor: '#6b9a3c', bgColor: 'rgba(107,154,60,0.10)',
  },
  compromise: {
    label: '妥協關係 (Compromise)',
    desc:  '關係摩擦源 — 一方擁有完整通道，另一方只有其中一個閘門，長期易累積委屈與不平衡感。',
    accentColor: '#c8a820', bgColor: 'rgba(200,168,32,0.10)',
  },
  dominance: {
    label: '支配關係 (Dominance)',
    desc:  '單向引導 — 一方在某條通道有能量，另一方完全開放，空白的那方會單向受到能量制約。',
    accentColor: '#6b7280', bgColor: 'rgba(43,31,20,0.05)',
  },
}

const C = Colors

type SyncCompositeData = {
  personA: { name: null; birthDate: string; birthCity: string; type: string; profile: string; authority: string; authorityTip?: string }
  personB: { name: null; birthDate: string; birthCity: string; type: string; profile: string; authority: string; authorityTip?: string }
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

  return (
    <View style={c.root}>

      {/* 人物資訊 */}
      <View style={c.personRow}>
        {[
          { label: nameA, p: personA, color: '#c8553d' },
          { label: nameB, p: personB, color: C.text },
        ].map(({ label, p, color }, idx) => (
          <View key={idx} style={c.personCard}>
            <Text style={[c.personName, { color }]}>{label}</Text>
            <Text style={c.personSub}>{p?.birthDate ?? '—'}</Text>
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
              const cfg   = CONN_CFG[type]
              return (
                <View key={type} style={[c.connGroup, { borderColor: cfg.accentColor + '55' }]}>
                  <View style={[c.connHeader, { backgroundColor: cfg.bgColor }]}>
                    <Text style={[c.connTitle, { color: cfg.accentColor }]}>{cfg.label}</Text>
                    <Text style={c.connDesc}>{cfg.desc}</Text>
                  </View>
                  {items.length === 0 ? (
                    <Text style={c.connEmpty}>無相關通道</Text>
                  ) : items.map(conn => (
                    <View key={conn.channelId} style={c.connRow}>
                      <View style={c.connIdCol}>
                        <Text style={c.connId}>{conn.channelId}</Text>
                        <Text style={c.connCenters}>
                          {LIB_CENTER_ZH[conn.centerA] ?? conn.centerA}—{LIB_CENTER_ZH[conn.centerB] ?? conn.centerB}
                        </Text>
                      </View>
                      <View style={c.connGateCol}>
                        <Text style={[c.connPersonLabel, { color: '#c8553d' }]}>{nameA}</Text>
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
                <Text style={[c.profileLabel, { color: '#c8553d' }]}>{nameA} {personA?.profile}</Text>
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
              { label: `${nameA} 的權威`, p: personA, color: '#c8553d' },
              { label: `${nameB} 的權威`, p: personB, color: C.text },
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

const c = StyleSheet.create({
  root:        { gap: 16 },
  section:     { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase' },

  personRow:  { flexDirection: 'row', gap: 10 },
  personCard: { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  personName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  personSub:  { fontSize: 12, color: C.sub },
  personMeta: { fontSize: 12, color: C.muted, marginTop: 6 },

  card: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },

  themeHeader:     { padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  themeLabel:      { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 4 },
  themeSub:        { fontSize: 12, color: C.sub },
  themePair:       { padding: 14 },
  themeBlockLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  themeBlockBody:  { fontSize: 13, color: C.text, lineHeight: 20 },

  connGroup:       { borderWidth: 1, borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  connHeader:      { padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  connTitle:       { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  connDesc:        { fontSize: 12, color: C.sub, lineHeight: 18 },
  connEmpty:       { padding: 12, fontSize: 12, color: C.muted },
  connRow:         { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  connIdCol:       { width: 80 },
  connId:          { fontSize: 13, fontWeight: '700', color: C.text },
  connCenters:     { fontSize: 10, color: C.muted, lineHeight: 14, marginTop: 2 },
  connGateCol:     { flex: 1 },
  connPersonLabel: { fontSize: 11, fontWeight: '600', color: C.sub, marginBottom: 1 },
  connGates:       { fontSize: 13, color: C.text },

  profileRow:    { flexDirection: 'row', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  profileLabel:  { fontSize: 14, fontWeight: '600', color: C.text },
  resonanceNone: { fontSize: 13, color: C.sub, lineHeight: 20, padding: 12 },
  resonanceRow:  { paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border },
  resonanceTitle:{ fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3 },
  resonanceDesc: { fontSize: 13, color: C.sub, lineHeight: 19 },

  authorityCard:  { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, borderLeftWidth: 4, padding: 14, marginBottom: 8 },
  authorityLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  authorityName:  { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  authorityTip:   { fontSize: 13, color: C.sub, lineHeight: 19 },
})
