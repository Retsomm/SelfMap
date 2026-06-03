import { MetadataRoute } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://selfmap.tw').replace(/\/+$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/account', '/map/', '/create', '/sign-in'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
