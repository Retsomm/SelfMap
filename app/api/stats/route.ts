import { NextResponse } from 'next/server'

export const revalidate = 3600 // 快取 1 小時

export async function GET() {
  const websiteId = process.env.UMAMI_WEBSITE_ID
  const token = process.env.UMAMI_API_TOKEN

  if (!websiteId || !token) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://api.umami.is/v1/websites/${websiteId}/stats?startAt=0&endAt=${Date.now()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Umami API error' }, { status: res.status })
    }

    const data = await res.json()
    const views = data?.pageviews ?? 0

    // Shields.io endpoint 格式
    return NextResponse.json({
      schemaVersion: 1,
      label: 'Views',
      message: views.toLocaleString(),
      color: 'blue',
    })
  } catch (err) {
    console.error('[GET /api/stats]', err)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
