import { Suspense } from 'react'
import fs from 'fs'
import path from 'path'
import HdSubNav from '@/components/humanDesign/HdSubNav'
import { HD_TOPICS } from '@/lib/humanDesign/hd-topics'
import HdMarkdown from '@/components/humanDesign/HdMarkdown'
import HdContentFilter from '@/components/humanDesign/HdContentFilter'

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
