import type { Metadata } from 'next'
import HomeClient from './HomeClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://selfmap.app'

export const metadata: Metadata = {
  alternates: {
    canonical: SITE_URL,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'SelfMap 人類圖計算器',
  url: SITE_URL,
  description: '免費線上人類圖計算器。輸入出生日期、時間與地點，即時生成完整人類圖（Body Graph），包含類型、人生角色、內在權威、九大中心、通道與閘門的完整分析。',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'TWD',
  },
  inLanguage: ['zh-TW', 'en'],
  author: {
    '@type': 'Organization',
    name: 'SelfMap',
    url: SITE_URL,
  },
}

export default async function HomePage() {
  const title = '計算你的人類圖'

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-360 mx-auto px-4 sm:px-8 md:px-14 pb-20 pt-18">
        <header className="flex justify-center mb-6 gap-6">
          <h1 className="font-serif font-medium italic text-[clamp(36px,4vw,56px)] leading-[0.95] tracking-[-0.01em] text-center m-0">
            {title}
          </h1>
        </header>
        <HomeClient />
      </div>
    </>
  )
}
