'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import zh from './chinese.json'
import en from './english.json'

export type Lang = 'zh' | 'en'

const STORAGE_KEY = 'selfmap_lang'

const get = (obj: Record<string, unknown>, path: string): string => {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return path
    cur = (cur as Record<string, unknown>)[p]
  }
  return typeof cur === 'string' ? cur : path
}

export type LangObj<T> = { zh: T; en: T }

const LangContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  pick: <T>(obj: LangObj<T>) => T
}>({
  lang: 'zh',
  setLang: () => {},
  t: (key) => key,
  pick: (obj) => obj.zh,
})

export const LanguageProvider = ({
  children,
  initialLang = 'zh',
}: {
  children: ReactNode
  initialLang?: Lang
}) => {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en'
  }, [lang])

  const setLang = (l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {}
    document.cookie = `${STORAGE_KEY}=${l};path=/;max-age=31536000;SameSite=Lax`
  }

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const dict = lang === 'zh' ? zh : en
    let str = get(dict as unknown as Record<string, unknown>, key)
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v))
      }
    }
    return str
  }

  const pick = <T,>(obj: LangObj<T>): T => obj[lang]

  return (
    <LangContext.Provider value={{ lang, setLang, t, pick }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
