'use client'

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'

export type Lang = 'zh' | 'en'
export type LangDict = Record<string, unknown>

const STORAGE_KEY = 'selfmap_lang'

const LOADERS: Record<Lang, () => Promise<LangDict>> = {
  zh: () => import('./chinese.json').then(m => m.default as unknown as LangDict),
  en: () => import('./english.json').then(m => m.default as unknown as LangDict),
}

const get = (obj: LangDict, path: string): string => {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return path
    cur = (cur as LangDict)[p]
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
  initialDict,
}: {
  children: ReactNode
  initialLang?: Lang
  initialDict: LangDict
}) => {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const dicts = useRef<Partial<Record<Lang, LangDict>>>({ [initialLang]: initialDict })
  const latestLangRequest = useRef<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en'
  }, [lang])

  const persist = (l: Lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {}
    document.cookie = `${STORAGE_KEY}=${l};path=/;max-age=31536000;SameSite=Lax`
  }

  const setLang = (l: Lang) => {
    latestLangRequest.current = l
    if (!dicts.current[l]) {
      LOADERS[l]()
        .then(dict => {
          if (latestLangRequest.current !== l) return
          dicts.current[l] = dict
          setLangState(l)
          persist(l)
        })
        .catch(err => {
          console.error(`[i18n] 語言包載入失敗 "${l}":`, err)
        })
    } else {
      setLangState(l)
      persist(l)
    }
  }

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const dict = dicts.current[lang] ?? initialDict
    let str = get(dict, key)
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
