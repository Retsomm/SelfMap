import type { Metadata } from 'next'
import Script from 'next/script'
import { Cormorant_Garamond, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { zhTW, enUS } from '@clerk/localizations'
import { Toaster } from 'react-hot-toast'
import { cookies } from 'next/headers'
import { clerkAppearance } from '@/lib/clerkAppearance'
import Navbar from '@/components/Navbar'
import { LanguageProvider, type Lang, type LangDict } from '@/i18n'
import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://selfmap.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SelfMap — 免費人類圖計算器',
    template: '%s | SelfMap 人類圖',
  },
  description: '免費線上人類圖計算器。輸入出生日期、時間與地點，即時生成完整人類圖（Body Graph），包含類型、人生角色、內在權威、九大中心、通道與閘門的完整分析。',
  keywords: ['人類圖', '人類圖計算器', '免費人類圖', 'Human Design', 'BodyGraph', '身體圖', '人生角色', '五大類型', '內在權威', '九大中心', '通道', '閘門', '輪迴交叉'],
  authors: [{ name: 'SelfMap', url: SITE_URL }],
  creator: 'SelfMap',
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    alternateLocale: ['en_US'],
    siteName: 'SelfMap',
    title: 'SelfMap — 免費人類圖計算器',
    description: '輸入出生日期、時間與地點，即時生成完整人類圖，包含類型、人生角色、內在權威等深度分析。',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SelfMap — 免費人類圖計算器',
    description: '輸入出生日期、時間與地點，即時生成完整人類圖，包含類型、人生角色、內在權威等深度分析。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon-figure-rounded-60.png', sizes: '60x60', type: 'image/png' },
      { url: '/icon-figure-rounded-80.png', sizes: '80x80', type: 'image/png' },
    ],
    apple: [{ url: '/icon-figure-rounded-180.png', sizes: '180x180', type: 'image/png' }],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'zh-TW': SITE_URL,
      'en': `${SITE_URL}`,
    },
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const rawLang = cookieStore.get('selfmap_lang')?.value
  const initialLang: Lang = rawLang === 'en' ? 'en' : 'zh'

  const initialDict: LangDict = initialLang === 'en'
    ? (await import('@/i18n/english.json')).default as unknown as LangDict
    : (await import('@/i18n/chinese.json')).default as unknown as LangDict

  return (
    <html lang={initialLang === 'en' ? 'en' : 'zh-TW'} className={`${cormorant.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>
        <Script defer src="https://cloud.umami.is/script.js" data-website-id="757127df-87af-47d5-a73b-9feb455d6867" />
        <ClerkProvider appearance={clerkAppearance} localization={initialLang === 'zh' ? zhTW : enUS}>
          <LanguageProvider initialLang={initialLang} initialDict={initialDict}>
            <Navbar />
            {children}
            <Toaster position="bottom-center" toastOptions={{ duration: 3500 }} />
          </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
