import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
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
    <ClerkProvider>
      <html lang="zh-TW" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
        <body className="min-h-full bg-white text-zinc-900">{children}</body>
      </html>
    </ClerkProvider>
  )
}
