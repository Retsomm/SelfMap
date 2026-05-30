'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { HD_TOPICS } from '@/lib/humanDesign/hd-topics'

export default function HdSubNav() {
  const searchParams = useSearchParams()
  const rawTopic = searchParams.get('topic')
  const validSlugs: string[] = HD_TOPICS.map(({ slug }) => slug)
  const activeTopic = rawTopic && validSlugs.includes(rawTopic) ? rawTopic : 'intro'

  return (
    <nav className="border-b border-(--ink)/30 bg-(--paper)" aria-label="人類圖主題導覽">
      <div className="max-w-360 mx-auto px-3 md:px-14">
        <ul className="flex gap-0 overflow-x-auto scrollbar-none">
          {HD_TOPICS.map(({ slug, label }) => {
            const isActive = slug === activeTopic
            return (
              <li key={slug} className="shrink-0">
                <Link
                  href={`/human-design?topic=${slug}`}
                  onClick={() => window.umami?.track('hd-topic-click', { topic: slug })}
                  className={`
                    block font-mono text-[11px] md:text-[13px] tracking-[0.14em] uppercase
                    px-4 md:px-5 py-3 md:py-3.5 no-underline transition-colors duration-120
                    border-b-2
                    ${isActive
                      ? 'text-(--ink) border-(--ink)'
                      : 'text-(--ink-soft) border-transparent hover:text-(--ink) hover:border-(--ink)/40'
                    }
                  `}
                  scroll={false}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
