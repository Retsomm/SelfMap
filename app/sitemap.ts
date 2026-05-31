import { MetadataRoute } from 'next'
import { HD_TOPICS } from '@/lib/humanDesign/hd-topics'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://selfmap.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const hdTopicUrls: MetadataRoute.Sitemap = HD_TOPICS.map(topic => ({
    url: `${SITE_URL}/human-design?topic=${topic.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/human-design`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...hdTopicUrls,
  ]
}
