'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useLang, type Lang } from '@/i18n'

const PersonalTab = dynamic(() => import('@/components/humanDesign/PersonalTab'), { ssr: false })
const CompositeTab = dynamic(() => import('@/components/humanDesign/CompositeTab'), { ssr: false })

type Tab = 'personal' | 'composite'

export default function HomeClient({ lang: initialLang }: { lang: Lang }) {
  const { t } = useLang()
  const [tab, setTab] = useState<Tab>('personal')

  return (
    <div className="flex flex-col gap-5">

      {/* Tab switcher */}
      <div className="hd-print-hide flex border-b border-[var(--ink)] mb-1">
        {(['personal', 'composite'] as Tab[]).map(tabKey => (
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
            {tabKey === 'personal' ? t('home.tabPersonal') : t('home.tabComposite')}
          </button>
        ))}
      </div>

      {tab === 'personal' && <PersonalTab initialLang={initialLang} />}
      {tab === 'composite' && <CompositeTab initialLang={initialLang} />}

    </div>
  )
}
