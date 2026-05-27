import type { Metadata } from 'next'
import { Cormorant_Garamond, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
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

export const metadata: Metadata = {
  title: 'SelfMap — 探索你的內在地圖',
  description: '用互動式地圖，探索你的人類圖內在結構',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" className={`${cormorant.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <ClerkProvider appearance={clerkAppearance}>
          <Navbar />
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
