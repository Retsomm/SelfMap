import { MetadataRoute } from 'next'
import { HD_TOPICS } from '@/lib/humanDesign/hd-topics'

const _rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
let _validatedOrigin = 'https://selfmap.app'
if (_rawSiteUrl) {
  try {
    const parsed = new URL(_rawSiteUrl)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      _validatedOrigin = parsed.origin
    }
  } catch {
    // malformed URL — fall back to default
  }
}
const SITE_URL = _validatedOrigin.replace(/\/+$/, '')

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
