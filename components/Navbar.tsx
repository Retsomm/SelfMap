'use client'

import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'


export default function Navbar() {
  const { isSignedIn } = useAuth()

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'var(--paper)',
      borderBottom: '1px solid var(--ink)',
    }}>
      <div style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '0 56px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 22,
          color: 'var(--ink)',
          textDecoration: 'none',
          letterSpacing: '-0.01em',
        }}>
          SelfMap
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
          }}>
          </span>
          {isSignedIn ? (
            <UserButton />
          ) : (
            <Link
              href="/sign-in"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--paper)',
                background: 'var(--ink)',
                border: '1px solid var(--ink)',
                padding: '5px 14px',
                textDecoration: 'none',
                transition: 'background 120ms ease',
              }}
            >
              登入
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
