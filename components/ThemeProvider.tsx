'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { THEME_COOKIE_KEY, type Theme } from '@/lib/theme'

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
} | null>(null)

export function ThemeProvider({ children, initialTheme }: { children: React.ReactNode; initialTheme: Theme }) {
  // initialTheme 是 layout.tsx 在伺服器端讀 cookie 算出來的值，跟 SSR 吐出的
  // <html data-theme="..."> 完全一致，所以這裡當 client 第一次 render 用，
  // 不會有 hydration mismatch，也不需要事後用 useEffect 校正、不會閃爍。
  const [theme, setTheme] = useState<Theme>(initialTheme)

  // 切換 light/dark、同步寫入 <html data-theme>（給 CSS 選擇器讀）與 cookie（一年後過期，
  // 讓 layout.tsx 下次 SSR 能讀到上次選的主題，避免每次重整都跳回預設值）。
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      document.cookie = `${THEME_COOKIE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 必須在 ThemeProvider 內使用')
  return ctx
}
