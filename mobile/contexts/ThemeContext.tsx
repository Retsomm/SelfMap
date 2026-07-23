import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { lightColors, darkColors, type ThemeColors } from '@/constants/tokens'

type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'selfmap-theme'

type ThemeCtx = {
  mode: ThemeMode
  colors: ThemeColors
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const [mode, setMode] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light')
  const toggledLocally = useRef(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (!toggledLocally.current && (stored === 'light' || stored === 'dark')) setMode(stored)
    }).catch(() => {})
  }, [])

  const toggleTheme = useCallback(() => {
    toggledLocally.current = true
    setMode(prev => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark'
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {})
      return next
    })
  }, [])

  const colors = mode === 'dark' ? darkColors : lightColors
  const value = useMemo(() => ({ mode, colors, toggleTheme }), [mode, colors, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeColors(): ThemeColors {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeColors 必須在 ThemeProvider 內使用')
  return ctx.colors
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeMode 必須在 ThemeProvider 內使用')
  return { mode: ctx.mode, toggleTheme: ctx.toggleTheme }
}
