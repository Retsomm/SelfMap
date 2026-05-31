import { Suspense } from 'react'
import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import HdSubNav from '@/components/humanDesign/HdSubNav'
import { HD_TOPICS } from '@/lib/humanDesign/hd-topics'
import HdMarkdown from '@/components/humanDesign/HdMarkdown'
import HdContentFilter from '@/components/humanDesign/HdContentFilter'

const TOPIC_DESCRIPTIONS: Record<string, string> = {
  intro: '什麼是人類圖？了解人類圖的起源、原理，以及如何透過出生資料揭示你的內在設計藍圖。',
  types: '人類圖五大類型：生產者、顯示生產者、顯示者、投射者、反映者。了解你的能量策略與人生策略。',
  centers: '人類圖九大能量中心詳解：頭頂、邏輯、喉嚨、G 中心、意志、情緒、薦骨、直覺、根部。',
  authority: '內在權威是你做決定的正確方式，包含情緒權威、薦骨權威、直覺權威、自我投射等。',
  role: '人生角色由 Profile 決定，共六條爻線組合出十二種人生角色，揭示你在世界上扮演的角色。',
  definition: '人類圖五大定義：單一定義、分裂定義、三分裂、四分裂、無定義，描述你的能量穩定性。',
  channel: '人類圖 36 條通道連結九大中心，只有兩端閘門都激活才形成通道並定義對應中心。',
  gate: '人類圖 64 個閘門對應易經 64 卦，每個閘門代表一種特定的能量特質與潛能。',
  composite: '人類圖合盤分析：了解兩人之間的能量連結、電磁關係、陪伴關係與支配關係。',
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>
}): Promise<Metadata> {
  const { topic } = await searchParams
  const activeTopic = topic ?? 'intro'
  const topicMeta = HD_TOPICS.find(t => t.slug === activeTopic) ?? HD_TOPICS[0]
  const description = TOPIC_DESCRIPTIONS[activeTopic] ?? `深入了解人類圖中的${topicMeta.label}。`

  return {
    title: `人類圖介紹：${topicMeta.label}`,
    description,
    openGraph: {
      title: `人類圖介紹：${topicMeta.label} | SelfMap`,
      description,
      type: 'article',
    },
    alternates: {
      canonical: `/human-design${activeTopic !== 'intro' ? `?topic=${activeTopic}` : ''}`,
    },
  }
}

const FILTERED_TOPICS = new Set(['gate', 'channel'])

function getTopicContent(slug: string): string {
  const topic = HD_TOPICS.find(t => t.slug === slug) ?? HD_TOPICS[0]
  const filePath = path.join(process.cwd(), 'data', topic.file)
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return '# 找不到內容\n\n此主題的內容尚未建立。'
  }
}

export default async function HumanDesignPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>
}) {
  const { topic } = await searchParams
  const activeTopic = topic ?? 'intro'
  const content = getTopicContent(activeTopic)
  const topicMeta = HD_TOPICS.find(t => t.slug === activeTopic) ?? HD_TOPICS[0]

  return (
    <main className="pt-13 min-h-screen">
      <Suspense fallback={null}>
        <HdSubNav />
      </Suspense>

      <div className="max-w-360 mx-auto px-3 md:px-14 py-12 md:py-16">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] md:text-[13px] tracking-[0.18em] uppercase text-(--ink-soft) mb-4">
            人類圖介紹 · {topicMeta.label}
          </p>
          {FILTERED_TOPICS.has(activeTopic)
            ? <HdContentFilter content={content} topic={activeTopic} />
            : <HdMarkdown content={content} />
          }
        </div>
      </div>
    </main>
  )
}
