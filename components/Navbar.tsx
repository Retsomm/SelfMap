'use client'

import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'

export default function Navbar() {
  const { isSignedIn } = useAuth()

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-base font-semibold tracking-tight text-white">
          SelfMap
        </Link>
        <nav className="flex items-center gap-3">
          {isSignedIn ? (
            <UserButton />
          ) : (
            <Link
              href="/sign-in"
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-full transition-colors"
            >
              登入
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
