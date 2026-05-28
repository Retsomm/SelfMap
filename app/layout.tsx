import type { Metadata } from 'next'
import { Cormorant_Garamond, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { zhTW, enUS } from '@clerk/localizations'
import { Toaster } from 'react-hot-toast'
import { cookies } from 'next/headers'
import { clerkAppearance } from '@/lib/clerkAppearance'
import Navbar from '@/components/Navbar'
import { LanguageProvider, type Lang } from '@/i18n'
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

export const metadata: Metadata = {
  title: 'SelfMap — 探索你的內在地圖',
  description: '用互動式地圖，探索你的人類圖內在結構',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const rawLang = cookieStore.get('selfmap_lang')?.value
  const initialLang: Lang = rawLang === 'en' ? 'en' : 'zh'

  return (
    <html lang="zh-TW" className={`${cormorant.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <ClerkProvider appearance={clerkAppearance} localization={initialLang === 'zh' ? zhTW : enUS}>
          <LanguageProvider initialLang={initialLang}>
            <Navbar />
            {children}
            <Toaster position="bottom-center" toastOptions={{ duration: 3500 }} />
          </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
