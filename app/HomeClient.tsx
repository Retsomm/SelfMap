'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useLang, type Lang } from '@/i18n'

const PersonalTab = dynamic(() => import('@/components/humanDesign/PersonalTab'), { ssr: false })
const CompositeTab = dynamic(() => import('@/components/humanDesign/CompositeTab'), { ssr: false })
const TransitTab = dynamic(() => import('@/components/humanDesign/TransitTab'), { ssr: false })

type Tab = 'personal' | 'composite' | 'transit'

const TAB_LABELS: Record<Tab, { zh: string; en: string }> = {
  personal:  { zh: '個人圖', en: 'Personal' },
  composite: { zh: '合圖',   en: 'Composite' },
  transit:   { zh: '流日圖', en: 'Transit' },
}

export default function HomeClient({ lang: initialLang }: { lang: Lang }) {
  const { lang } = useLang()
  const [tab, setTab] = useState<Tab>('personal')

  return (
    <div className="flex flex-col gap-5">

      {/* Tab switcher */}
      <div className="hd-print-hide flex border-b border-[var(--ink)] mb-1">
        {(['personal', 'composite', 'transit'] as Tab[]).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={[
              'font-mono text-[12px] md:text-base tracking-[0.14em] uppercase px-5 py-2.5 border-b-2 transition-colors duration-[120ms] cursor-pointer bg-transparent',
              tab === tabKey
                ? 'border-b-[var(--ink)] text-[var(--ink)] font-semibold'
                : 'border-b-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]',
            ].join(' ')}
          >
            {lang === 'en' ? TAB_LABELS[tabKey].en : TAB_LABELS[tabKey].zh}
          </button>
        ))}
      </div>

      {tab === 'personal' && <PersonalTab initialLang={initialLang} />}
      {tab === 'composite' && <CompositeTab initialLang={initialLang} />}
      {tab === 'transit' && <TransitTab initialLang={initialLang} />}

    </div>
  )
}
