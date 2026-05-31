import type { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: '關於 SelfMap',
  description: 'SelfMap 是一個免費的人類圖計算器，使用瑞士星曆（Swiss Ephemeris）在瀏覽器端精準計算身體圖。了解我們的技術架構與隱私政策。',
  openGraph: {
    title: '關於 SelfMap — 免費人類圖計算器',
    description: 'SelfMap 使用瑞士星曆在瀏覽器端精準計算人類圖，保護你的隱私，完全免費。',
  },
  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  return <AboutClient />
}
