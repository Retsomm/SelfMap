import { Tabs } from 'expo-router'
import { Platform, Pressable, Text } from 'react-native'
import Svg, { Path, Circle, Line } from 'react-native-svg'
import type { ColorValue } from 'react-native'
import { useThemeColors, useThemeMode } from '@/contexts/ThemeContext'

// ── 線條型 tab 圖示（24×24 viewBox，strokeWidth 1.8）──────────────────────────

function IconAbout({ color }: { color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      <Path d="M12 11v5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={12} cy={8} r={0.8} fill={color} />
    </Svg>
  )
}

function IconCreate({ color }: { color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* 圓形外框 */}
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      {/* 加號 */}
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

function IconLearn({ color }: { color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* 書本 */}
      <Path
        d="M4 5.5A1.5 1.5 0 015.5 4H18a1 1 0 011 1v13a1 1 0 01-1 1H5.5A1.5 1.5 0 014 17.5v-12z"
        stroke={color} strokeWidth={1.8} strokeLinejoin="round"
      />
      {/* 書脊線 */}
      <Path d="M8 4v15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* 文字線 */}
      <Path d="M11 9h5M11 12h5M11 15h3" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  )
}

function IconProfile({ color }: { color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* 頭部 */}
      <Circle cx={12} cy={7.5} r={3.5} stroke={color} strokeWidth={1.8} />
      {/* 身體弧線 */}
      <Path d="M4 20.5c0-4.142 3.582-7.5 8-7.5s8 3.358 8 7.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

function IconSun({ color }: { color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={4.2} stroke={color} strokeWidth={1.8} />
      <Line x1={12} y1={2.5} x2={12} y2={4.9} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={12} y1={19.1} x2={12} y2={21.5} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={4.9} y1={4.9} x2={6.6} y2={6.6} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={17.4} y1={17.4} x2={19.1} y2={19.1} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={2.5} y1={12} x2={4.9} y2={12} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={19.1} y1={12} x2={21.5} y2={12} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={4.9} y1={19.1} x2={6.6} y2={17.4} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={17.4} y1={6.6} x2={19.1} y2={4.9} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

function IconMoon({ color }: { color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.2 14.4A8.6 8.6 0 019.6 3.8a8.6 8.6 0 1010.6 10.6z"
        stroke={color} strokeWidth={1.8} strokeLinejoin="round"
      />
    </Svg>
  )
}

// ── 主題切換按鈕：放在 tabs 最右側，不導覽、只切換主題 ──────────────────────────

function ThemeToggleButton() {
  const colors = useThemeColors()
  const { mode, toggleTheme } = useThemeMode()
  const isDark = mode === 'dark'

  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="button"
      accessibilityLabel={isDark ? '切換為亮色主題' : '切換為暗色主題'}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: Platform.OS === 'android' ? 10 : 5,
        gap: 3,
      }}
    >
      {isDark ? <IconSun color={colors.text} /> : <IconMoon color={colors.sub} />}
      <Text style={{ fontSize: 10, color: isDark ? colors.text : colors.muted }}>主題</Text>
    </Pressable>
  )
}

export default function TabsLayout() {
  const colors = useThemeColors()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="create"
        options={{ title: '建立圖表', tabBarIcon: ({ color }) => <IconCreate color={color} /> }}
      />
      <Tabs.Screen
        name="index"
        options={{ title: '關於', tabBarIcon: ({ color }) => <IconAbout color={color} /> }}
      />
      <Tabs.Screen
        name="learn"
        options={{ title: '學習', tabBarIcon: ({ color }) => <IconLearn color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '帳號', tabBarIcon: ({ color }) => <IconProfile color={color} /> }}
      />
      <Tabs.Screen
        name="theme-toggle"
        options={{ tabBarButton: () => <ThemeToggleButton /> }}
        listeners={{ tabPress: e => e.preventDefault() }}
      />
    </Tabs>
  )
}
