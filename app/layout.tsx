import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Cormorant_Garamond, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { zhTW } from '@clerk/localizations'
import { Toaster } from 'react-hot-toast'
import { clerkAppearance } from '@/lib/clerkAppearance'
import Navbar from '@/components/Navbar'
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

let parsedSiteUrl: URL
try {
  parsedSiteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://selfmap.app')
} catch {
  parsedSiteUrl = new URL('https://selfmap.app')
}
const SITE_URL = parsedSiteUrl.origin

export const viewport: Viewport = {
  viewportFit: 'cover',
}

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
    images: [
      {
        url: `${SITE_URL}/og.png`,
        width: 1200,
        height: 630,
        alt: 'SelfMap — 免費人類圖計算器',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SelfMap — 免費人類圖計算器',
    description: '輸入出生日期、時間與地點，即時生成完整人類圖，包含類型、人生角色、內在權威等深度分析。',
    images: [`${SITE_URL}/og.png`],
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
      { url: '/favicon.ico', sizes: '16x16 32x32', type: 'image/x-icon' },
      { url: '/icon-figure-rounded-60.png', sizes: '60x60', type: 'image/png' },
      { url: '/icon-figure-rounded-80.png', sizes: '80x80', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/icon-figure-rounded-180.png', sizes: '180x180', type: 'image/png' }],
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" className={`${cormorant.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>
        <Script defer src="https://cloud.umami.is/script.js" data-website-id="757127df-87af-47d5-a73b-9feb455d6867" />
        <ClerkProvider appearance={clerkAppearance} localization={zhTW}>
          <Navbar />
          {children}
          <Toaster position="bottom-center" toastOptions={{ duration: 3500 }} />
        </ClerkProvider>
      </body>
    </html>
  )
}
