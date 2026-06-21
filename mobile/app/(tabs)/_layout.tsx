import { Tabs } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import { Colors } from '@/constants/tokens'

// ── 線條型 tab 圖示（24×24 viewBox，strokeWidth 1.8）──────────────────────────

function IconCharts({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* 菱形外框（體圖中心風格）*/}
      <Path d="M12 3L21 12L12 21L3 12Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      {/* 內部格線 */}
      <Path d="M12 3v18M3 12h18" stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.5} />
    </Svg>
  )
}

function IconCreate({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* 圓形外框 */}
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      {/* 加號 */}
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

function IconLearn({ color }: { color: string }) {
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

function IconProfile({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* 頭部 */}
      <Circle cx={12} cy={7.5} r={3.5} stroke={color} strokeWidth={1.8} />
      {/* 身體弧線 */}
      <Path d="M4 20.5c0-4.142 3.582-7.5 8-7.5s8 3.358 8 7.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '我的圖表', tabBarIcon: ({ color }) => <IconCharts color={color} /> }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: '建立圖表', tabBarIcon: ({ color }) => <IconCreate color={color} /> }}
      />
      <Tabs.Screen
        name="learn"
        options={{ title: '學習', tabBarIcon: ({ color }) => <IconLearn color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '帳號', tabBarIcon: ({ color }) => <IconProfile color={color} /> }}
      />
    </Tabs>
  )
}
