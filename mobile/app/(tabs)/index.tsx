import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Colors, Radius, Spacing } from '@/constants/tokens'

const FEATURES = [
  { icon: '◉', title: '本命盤計算', desc: '輸入出生資料，自動計算你的完整人類圖，包含類型、權威、人生角色與所有中心。' },
  { icon: '⟷', title: '流日分析',  desc: '即時行星位置與你的個人盤對照，了解當下能量如何影響你的每一天。' },
  { icon: '◈', title: '合圖解讀',  desc: '與另一個人的能量場互動分析，電磁、陪伴、妥協與支配連結一目了然。' },
  { icon: '❖', title: 'Body Graph', desc: '視覺化體圖，清楚呈現所有已定義中心、激活閘門與通道。' },
]

const HD_INTRO = [
  { label: '占星學',   desc: '行星位置決定閘門激活' },
  { label: '易經',     desc: '64 卦對應 64 個閘門' },
  { label: '卡巴拉',   desc: '生命之樹映射能量中心' },
  { label: '印度脈輪', desc: '七脈輪延伸為九大中心' },
]

export default function AboutScreen() {
  return (
    <SafeAreaView style={s.container}>
      <ScreenHeader title="關於" />
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.heroTitle}>SelfMap</Text>
          <Text style={s.heroSub}>人類圖探索工具</Text>
          <Text style={s.heroDesc}>
            幫助你了解自己獨特的能量設計藍圖，活出最真實的自己。
          </Text>
        </View>

        {/* 功能 */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>核心功能</Text>
          <View style={s.card}>
            {FEATURES.map((f, i) => (
              <View key={f.title} style={[s.featureRow, i > 0 && s.separator]}>
                <Text style={s.featureIcon}>{f.icon}</Text>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.featureTitle}>{f.title}</Text>
                  <Text style={s.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 人類圖是什麼 */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>什麼是人類圖？</Text>
          <View style={s.card}>
            <Text style={s.bodyText}>
              人類圖（Human Design）是 1987 年由 Ra Uru Hu 整合四大古老系統所創建的自我認識工具，透過出生時間精確計算你獨一無二的能量藍圖。
            </Text>
            <View style={s.tagRow}>
              {HD_INTRO.map(item => (
                <View key={item.label} style={s.tagCard}>
                  <Text style={s.tagLabel}>{item.label}</Text>
                  <Text style={s.tagDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 如何使用 */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>如何開始？</Text>
          <View style={s.card}>
            {[
              { step: '1', text: '點擊「建立圖表」，輸入你的出生日期、時間與城市。' },
              { step: '2', text: '系統自動計算完整本命盤，進入圖表詳情查看你的設計。' },
              { step: '3', text: '在「帳號」頁儲存常用出生資料，快速建立家人或朋友的圖表。' },
              { step: '4', text: '切換到「學習」頁，深入了解每個概念的意義。' },
            ].map(item => (
              <View key={item.step} style={[s.stepRow, item.step !== '1' && s.separator]}>
                <View style={s.stepBadge}>
                  <Text style={s.stepNum}>{item.step}</Text>
                </View>
                <Text style={s.stepText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={s.footer}>
          計算結果僅供參考與自我探索，不構成任何專業建議。
        </Text>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner:     { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 48 },

  hero:      { gap: Spacing.xs, paddingBottom: Spacing.sm },
  heroTitle: { fontSize: 32, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  heroSub:   { fontSize: 14, color: Colors.accent, fontWeight: '600', letterSpacing: 0.5 },
  heroDesc:  { fontSize: 15, color: Colors.sub, lineHeight: 23, marginTop: Spacing.sm },

  section:      { gap: Spacing.sm },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  card:         { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  separator:    { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md, marginTop: 0 },

  featureRow:   { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  featureIcon:  { fontSize: 20, width: 28, textAlign: 'center', marginTop: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  featureDesc:  { fontSize: 13, color: Colors.sub, lineHeight: 19 },

  bodyText: { fontSize: 14, color: Colors.sub, lineHeight: 22 },
  tagRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  tagCard:  { flex: 1, minWidth: '45%', backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, gap: 3 },
  tagLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  tagDesc:  { fontSize: 12, color: Colors.sub },

  stepRow:   { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  stepBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accentD, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepNum:   { fontSize: 12, fontWeight: '800', color: Colors.accent },
  stepText:  { flex: 1, fontSize: 14, color: Colors.sub, lineHeight: 21 },

  footer: { fontSize: 12, color: Colors.muted, textAlign: 'center', lineHeight: 18 },
})
