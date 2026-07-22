import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Radius, Spacing, type ThemeColors } from '@/constants/tokens'
import { useThemeColors } from '@/contexts/ThemeContext'

const TOPICS = [
  { id: 'type',       label: '五大類型',  icon: '◉', sub: '你的能量類型決定你如何行動與等待', count: '5 種類型' },
  { id: 'authority',  label: '內在權威',  icon: '⟁', sub: '你天生做決定的方式，比腦袋更可靠',  count: '7 種權威' },
  { id: 'profile',    label: '人生角色',  icon: '◈', sub: '你在人生舞台上扮演的角色與課題',    count: '12 種組合' },
  { id: 'definition', label: '五大定義',  icon: '◌', sub: '你的能量中心連接方式與決策速度',    count: '5 種定義' },
  { id: 'center',     label: '九大中心',  icon: '❖', sub: '九個能量處理中心，已定義與開放的意義', count: '9 個中心' },
  { id: 'channel',    label: '通道',      icon: '⟷', sub: '36 條通道定義你的核心特質',         count: '36 條通道' },
  { id: 'gate',       label: '閘門',      icon: '⬡', sub: '64 個閘門，你的能量節點與天賦',     count: '64 個閘門' },
  { id: 'transit',    label: '流日',      icon: '☽', sub: '宇宙每天發給你的限定體驗卡',        count: '今日星象' },
  { id: 'composite',  label: '合圖分析',  icon: '⊕', sub: '兩人能量場交會，解讀關係的動力地圖', count: '4 種連結' },
] as const

export default function LearnScreen() {
  const router = useRouter()
  const Colors = useThemeColors()
  const styles = useMemo(() => createStyles(Colors), [Colors])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.intro}>探索人類圖的核心概念，了解自己的設計藍圖</Text>

        {TOPICS.map((topic) => (
          <Pressable
            key={topic.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(`/learn/${topic.id}` as never)}
            accessibilityLabel={topic.label}
          >
            <Text style={styles.icon}>{topic.icon}</Text>
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{topic.label}</Text>
                <Text style={styles.cardCount}>{topic.count}</Text>
              </View>
              <Text style={styles.cardSub}>{topic.sub}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}

      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner:     { padding: Spacing.xl, gap: Spacing.md, paddingBottom: 48 },

  intro: { fontSize: 14, color: Colors.sub, lineHeight: 21, marginBottom: Spacing.xs },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardPressed: { backgroundColor: Colors.accentD, borderColor: Colors.accent },
  icon: { fontSize: 22, width: 32, textAlign: 'center' },
  cardBody: { flex: 1, gap: 4 },
  cardTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardCount: { fontSize: 11, color: Colors.muted, fontWeight: '600' },
  cardSub:   { fontSize: 13, color: Colors.sub, lineHeight: 18 },
  arrow:     { fontSize: 22, color: Colors.muted },

})
