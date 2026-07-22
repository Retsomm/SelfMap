import { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Radius, Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors, useThemeMode } from '@/contexts/ThemeContext'

// 四種連結動力的強調色，另立一份深色變體（不完全對應 Colors 既有色票，屬於獨立分類色）
const CONNECTION_TYPES_LIGHT = [
  {
    label: '電磁關係 (Electromagnetic)',
    desc:  '互補吸引 — 一方有 A 閘門，另一方有 B 閘門，合力激活完整通道。最經典的「致命吸引力」，容易一見鍾情但也容易相愛相殺。',
    accentColor: '#c8553d',
    bgColor: 'rgba(200,85,61,0.08)',
  },
  {
    label: '陪伴關係 (Companionship)',
    desc:  '默契安全 — 兩人擁有相同的閘門或通道，相處起來最不費力，如靈魂伴侶或老朋友。',
    accentColor: '#6b9a3c',
    bgColor: 'rgba(107,154,60,0.10)',
  },
  {
    label: '妥協關係 (Compromise)',
    desc:  '關係摩擦源 — 一方擁有完整通道，另一方只有其中一個閘門，長期易累積委屈與不平衡感。',
    accentColor: '#c8a820',
    bgColor: 'rgba(200,168,32,0.10)',
  },
  {
    label: '支配關係 (Dominance)',
    desc:  '單向引導 — 一方在某條通道有能量，另一方完全開放，空白的那方會單向受到能量制約。',
    accentColor: '#6b7280',
    bgColor: 'rgba(43,31,20,0.05)',
  },
] as const

const CONNECTION_TYPES_DARK = [
  { ...CONNECTION_TYPES_LIGHT[0], accentColor: '#e17761', bgColor: 'rgba(225,119,97,0.18)' },
  { ...CONNECTION_TYPES_LIGHT[1], accentColor: '#8fc26a', bgColor: 'rgba(143,194,106,0.18)' },
  { ...CONNECTION_TYPES_LIGHT[2], accentColor: '#dcc04a', bgColor: 'rgba(220,192,74,0.18)' },
  { ...CONNECTION_TYPES_LIGHT[3], accentColor: '#9aa4b0', bgColor: 'rgba(154,164,176,0.16)' },
] as const

const INTEGRATION_THEMES = [
  {
    theme: '9+0',
    label: '全滿（9+0）— Nowhere to go',
    love:  '極度甜蜜與黏人。能量場完全自給自足，外人很難融入。兩人會深深沉浸在彼此世界中，但也容易因缺乏外在刺激而感到窒息或過度封閉。',
    work:  '過於封閉。內部默契極高，但容易忽略外部市場的變化或客觀意見。',
  },
  {
    theme: '8+1',
    label: '8+1 — Have some fun',
    love:  '最舒服的互動模式。彼此有足夠的能量連結，同時留有一個「空白」作為陽光照進來的窗口，關係健康且長久。',
    work:  '黃金搭檔。既有共同努力的交集，又有一起探索外部世界的窗口。',
  },
  {
    theme: '7+2',
    label: '7+2 — Work to do',
    love:  '最舒服的互動模式之一。保有兩個空白中心，彼此連結同時仍有足夠的獨立呼吸空間，長期相處不易窒息。',
    work:  '黃金搭檔。有共同努力的交集，也有兩扇開放的窗口迎接外在刺激。',
  },
  {
    theme: '6+3+',
    label: '6+3+ — Better to be free',
    love:  '連結感較淡。兩人在一起時仍有太多未定因素，容易流於平淡，通常需要藉由共同興趣或外在媒介維繫緊密感。',
    work:  '適合大團隊平行分工，保持獨立性與自由度，不會對彼此造成過度制約。',
  },
] as const

export function CompositeLearn() {
  const Colors = useThemeColors()
  const { mode } = useThemeMode()
  const s = useMemo(() => createStyles(Colors), [Colors])
  const CONNECTION_TYPES = mode === 'dark' ? CONNECTION_TYPES_DARK : CONNECTION_TYPES_LIGHT

  return (
    <ScrollView contentContainerStyle={s.inner}>
      <Text style={s.intro}>
        合圖分析將兩個人的人類圖疊加在一起，呈現雙方能量場如何互動、共振，以及在哪些地方形成連結或摩擦——是認識一段關係動力的地圖。
      </Text>

      {/* 四種核心連結動力 */}
      <Text style={s.sectionLabel}>四種核心連結動力</Text>
      {CONNECTION_TYPES.map(ct => (
        <View key={ct.label} style={[s.connCard, { borderLeftColor: ct.accentColor }]}>
          <View style={[s.connHeader, { backgroundColor: ct.bgColor }]}>
            <Text style={[s.connTitle, { color: ct.accentColor }]}>{ct.label}</Text>
          </View>
          <Text style={s.connDesc}>{ct.desc}</Text>
        </View>
      ))}

      {/* 能量場整合主題 */}
      <Text style={[s.sectionLabel, { marginTop: 8 }]}>能量場整合主題</Text>
      <Text style={s.sectionNote}>
        合圖中定義的中心數量決定了雙方相處的基本氛圍。中心定義愈多，能量場愈封閉；留有空白中心，則是關係呼吸的窗口。
      </Text>
      {INTEGRATION_THEMES.map(it => (
        <View key={it.theme} style={s.themeCard}>
          <Text style={s.themeLabel}>{it.label}</Text>
          <View style={s.themePair}>
            <View style={s.themeBlock}>
              <Text style={s.themeBlockTag}>戀愛關係</Text>
              <Text style={s.themeBlockBody}>{it.love}</Text>
            </View>
            <View style={[s.themeBlock, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border }]}>
              <Text style={s.themeBlockTag}>工作夥伴</Text>
              <Text style={s.themeBlockBody}>{it.work}</Text>
            </View>
          </View>
        </View>
      ))}

      {/* 使用提醒 */}
      <View style={s.tipCard}>
        <Text style={s.tipTitle}>如何解讀合圖？</Text>
        <Text style={s.tipBody}>
          合圖不是在判斷「這段關係好不好」，而是在說明「雙方能量如何互動」。電磁關係帶來激情，陪伴關係帶來安全感，妥協與支配則是需要刻意溝通的地方。每種關係動力都有其價值，重要的是雙方都能看見這些模式，並有意識地應對。
        </Text>
      </View>
    </ScrollView>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  inner: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 48 },

  intro: { fontSize: 14, color: Colors.sub, lineHeight: 22, marginBottom: 4 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 2,
  },
  sectionNote: { fontSize: 13, color: Colors.sub, lineHeight: 20, marginBottom: 4 },

  connCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  connHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  connTitle: { fontSize: 13, fontWeight: '700' },
  connDesc:  { fontSize: 13, color: Colors.sub, lineHeight: 20, padding: Spacing.lg, paddingTop: 10 },

  themeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  themeLabel:    { fontSize: 14, fontWeight: '700', color: Colors.text, padding: Spacing.lg, paddingBottom: 0 },
  themePair:     { padding: Spacing.lg },
  themeBlock:    {},
  themeBlockTag: { fontSize: 10, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  themeBlockBody:{ fontSize: 13, color: Colors.sub, lineHeight: 20 },

  tipCard: {
    backgroundColor: Colors.accentD,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accent,
    padding: Spacing.lg,
    gap: 8,
    marginTop: 4,
  },
  tipTitle: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  tipBody:  { fontSize: 13, color: Colors.text, lineHeight: 21 },
})
