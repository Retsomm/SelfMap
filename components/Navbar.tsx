'use client'

import Link from 'next/link'
import { useUser, useClerk } from '@clerk/nextjs'
import Image from 'next/image'

export default function Navbar() {
  const { isSignedIn, user } = useUser()
  const { openSignIn } = useClerk()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-(--paper) border-b border-(--ink)">
      <div className="max-w-360 mx-auto px-14 h-13 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif italic font-medium text-[22px] text-(--ink) no-underline tracking-[-0.01em]"
        >
          SelfMap
        </Link>
        <nav className="flex items-center gap-4">
          {isSignedIn ? (
            <Link href="/account" className="flex items-center gap-2 no-underline group">
              {user?.imageUrl && (
                <Image
                  src={user.imageUrl}
                  alt={user.username ?? ''}
                  width={28}
                  height={28}
                  className="border border-(--ink) object-cover"
                />
              )}
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-(--ink-soft) group-hover:text-(--ink) transition-colors duration-120">
                {user?.username ?? user?.firstName ?? '帳號'}
              </span>
            </Link>
          ) : (
            <button
              onClick={() => openSignIn()}
              className="font-mono text-[10px] tracking-[0.14em] uppercase text-(--paper) bg-(--ink) border border-(--ink) px-3.5 py-1.25 cursor-pointer transition-colors duration-120 hover:bg-(--crimson) hover:border-(--crimson)"
            >
              登入
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
