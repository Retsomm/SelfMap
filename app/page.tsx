import { cookies } from 'next/headers'
import type { Lang } from '@/i18n'
import HomeClient from './HomeClient'
import zh from '@/i18n/chinese.json'
import en from '@/i18n/english.json'

export default async function HomePage() {
  const cookieStore = await cookies()
  const rawLang = cookieStore.get('selfmap_lang')?.value
  const lang: Lang = rawLang === 'en' ? 'en' : 'zh'
  const title = lang === 'zh' ? zh.home.title : en.home.title

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-14 pb-20 pt-[72px]">
      <header className="flex justify-center mb-6 gap-6">
        <h1 className="font-serif font-medium italic text-[clamp(36px,4vw,56px)] leading-[0.95] tracking-[-0.01em] text-center m-0">
          {title}
        </h1>
      </header>
      <HomeClient lang={lang} />
    </div>
  )
}
