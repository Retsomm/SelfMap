// 這個路由不會被實際導覽進來 —— tabs layout 裡對應的 Tabs.Screen 用
// listeners.tabPress 攔截了點擊，改成純粹切換主題，不做畫面跳轉。
// 檔案仍須存在，Expo Router 才能對應到 (tabs)/_layout.tsx 裡宣告的 Tabs.Screen。
export default function ThemeToggleRouteStub() {
  return null
}
