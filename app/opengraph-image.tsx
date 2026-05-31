import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'
export const alt = 'SelfMap — Free Human Design Calculator'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage() {
  let logoSrc = ''
  try {
    const logoBuffer = await readFile(join(process.cwd(), 'public/logo-figure-color.png'))
    logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`
  } catch {
    // logo missing; render without image
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          background: '#FAF8F3',
        }}
      >
        {/* Left panel */}
        <div
          style={{
            width: 420,
            height: 630,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F0EBE3',
            flexShrink: 0,
          }}
        >
          <img src={logoSrc} width={180} height={504} style={{ objectFit: 'contain' }} alt="" />
        </div>

        {/* Right panel */}
        <div
          style={{
            flex: 1,
            height: 630,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 72px',
          }}
        >
          <div
            style={{
              fontSize: 15,
              letterSpacing: '0.22em',
              color: '#9B9080',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            Free Human Design Calculator
          </div>
          <div
            style={{
              fontSize: 100,
              fontWeight: 700,
              color: '#1C1915',
              lineHeight: 1,
              marginBottom: 28,
              letterSpacing: '-3px',
            }}
          >
            SelfMap
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              marginBottom: 48,
            }}
          >
            <div style={{ fontSize: 28, color: '#6A6055', lineHeight: 1.5 }}>
              Enter your birth date, time &amp; place.
            </div>
            <div style={{ fontSize: 28, color: '#6A6055', lineHeight: 1.5 }}>
              Get your full Body Graph instantly.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {['Type', 'Profile', 'Authority', 'Centers'].map(tag => (
              <div
                key={tag}
                style={{
                  padding: '10px 24px',
                  border: '1px solid #C8BCA8',
                  borderRadius: 4,
                  fontSize: 18,
                  color: '#7A7060',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
