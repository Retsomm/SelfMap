'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const PersonalTab = dynamic(() => import('@/components/humanDesign/PersonalTab'), { ssr: false })
const CompositeTab = dynamic(() => import('@/components/humanDesign/CompositeTab'), { ssr: false })
const TransitTab = dynamic(() => import('@/components/humanDesign/TransitTab'), { ssr: false })

type Tab = 'personal' | 'composite' | 'transit'

const TAB_LABELS: Record<Tab, string> = {
  personal:  '個人圖',
  composite: '合圖',
  transit:   '流日圖',
}

export default function HomeClient() {
  const [tab, setTab] = useState<Tab>('personal')

  return (
    <div className="flex flex-col gap-5">

      {/* Tab switcher */}
      <div className="hd-print-hide flex border-b border-[var(--ink)] mb-1">
        {(['personal', 'composite', 'transit'] as Tab[]).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => {
              window.umami?.track('home-tab-click', { tab: tabKey })
              setTab(tabKey)
            }}
            className={[
              'font-mono text-[12px] md:text-base tracking-[0.14em] uppercase px-5 py-2.5 border-b-2 transition-colors duration-[120ms] cursor-pointer bg-transparent',
              tab === tabKey
                ? 'border-b-[var(--ink)] text-[var(--ink)] font-semibold'
                : 'border-b-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]',
            ].join(' ')}
          >
            {TAB_LABELS[tabKey]}
          </button>
        ))}
      </div>

      {tab === 'personal' && <PersonalTab />}
      {tab === 'composite' && <CompositeTab />}
      {tab === 'transit' && <TransitTab />}

    </div>
  )
}
