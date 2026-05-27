'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import Navbar from '@/components/Navbar'

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
  line: 'LINE',
  github: 'GitHub',
}

export default function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace('/')
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || !isSignedIn) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-[52px]">
          <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-(--ink-soft)">
            Loading…
          </span>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-[52px]">
        <div className="max-w-160 mx-auto px-8 py-12">

          <header className="mb-10 pb-4 border-b border-(--ink) flex items-baseline justify-between">
            <div className="flex items-baseline gap-4">
              <h1 className="font-serif italic font-medium text-[clamp(28px,3vw,42px)] leading-none m-0 text-(--ink)">
                Account
              </h1>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-(--ink-soft)">
                個人資料
              </span>
            </div>
            <button
              onClick={() => signOut(() => router.push('/'))}
              className="font-mono text-[10px] tracking-[0.14em] uppercase text-(--ink-soft) border border-(--ink-soft) px-3.5 py-1.5 bg-transparent cursor-pointer transition-colors duration-120 hover:text-(--crimson) hover:border-(--crimson)"
            >
              登出
            </button>
          </header>

          <div className="flex flex-col gap-8">

            {/* Profile */}
            <section>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-(--ink-soft) mb-4 pb-2 border-b border-(--ink)">
                Profile
              </div>
              <div className="flex items-center gap-4">
                {user.imageUrl && (
                  <Image
                    src={user.imageUrl}
                    alt={user.username ?? ''}
                    width={56}
                    height={56}
                    className="border border-(--ink) object-cover"
                  />
                )}
                <div className="flex flex-col gap-1">
                  <span className="font-serif italic font-medium text-[22px] text-(--ink) leading-none">
                    {user.fullName ?? user.username ?? '—'}
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.06em] text-(--ink-soft)">
                    {user.primaryEmailAddress?.emailAddress ?? '—'}
                  </span>
                </div>
              </div>
            </section>

            {/* Connected accounts */}
            {user.externalAccounts.length > 0 && (
              <section>
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-(--ink-soft) mb-4 pb-2 border-b border-(--ink)">
                  Connected Accounts
                </div>
                <div className="flex flex-col">
                  {user.externalAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between py-3 border-b border-dotted border-[rgba(43,31,20,0.2)] last:border-b-0"
                    >
                      <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-(--ink)">
                        {PROVIDER_LABEL[account.provider] ?? account.provider}
                      </span>
                      <span className="font-mono text-[11px] tracking-[0.04em] text-(--ink-soft)">
                        {account.emailAddress}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
