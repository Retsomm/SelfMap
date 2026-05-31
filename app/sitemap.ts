import { MetadataRoute } from 'next'
import { HD_TOPICS } from '@/lib/humanDesign/hd-topics'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://selfmap.app').replace(/\/+$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  const hdTopicUrls: MetadataRoute.Sitemap = HD_TOPICS.map(topic => ({
    url: `${SITE_URL}/human-design?topic=${encodeURIComponent(topic.slug)}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    {
      url: SITE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/human-design`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...hdTopicUrls,
  ]
}
