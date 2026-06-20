import { Tabs } from 'expo-router'
import { Text } from 'react-native'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0f0f1a', borderTopColor: '#1e1e2e' },
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: '#555577',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '我的圖表', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>◈</Text> }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: '建立圖表', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>✦</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '帳號', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>◉</Text> }}
      />
    </Tabs>
  )
}
