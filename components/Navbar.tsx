'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

interface NavbarProps {
  isSignedIn: boolean
  showCreate?: boolean
}

export default function Navbar({ isSignedIn, showCreate }: NavbarProps) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
          SelfMap
        </Link>
        <nav className="flex items-center gap-4">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                我的圖表
              </Link>
              {showCreate && (
                <Link
                  href="/create"
                  className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-700 transition-colors"
                >
                  + 新圖表
                </Link>
              )}
              <UserButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                登入
              </Link>
              <Link
                href="/sign-up"
                className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-700 transition-colors"
              >
                免費開始
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
