'use client'

import Link from 'next/link'
import { useUser, useClerk } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import SelfMapLogo from './SelfMapLogo'

const NAV_LINKS = [
  { href: '/', label: '首頁' },
  { href: '/human-design', label: '人類圖介紹' },
  { href: '/about', label: '關於網站' },
]

export default function Navbar() {
  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-(--paper) border-b border-(--ink)">
        <div className="max-w-360 mx-auto px-3 md:px-14 h-13 flex items-center justify-between relative">
          {/* 手機：漢堡選單（左側） */}
          <button
            className="md:hidden flex flex-col justify-center gap-1.5 w-7 h-7 cursor-pointer shrink-0"
            onClick={() => setDrawerOpen(true)}
            aria-label="開啟選單"
          >
            <span className="block w-5 h-px bg-(--ink)" />
            <span className="block w-5 h-px bg-(--ink)" />
            <span className="block w-5 h-px bg-(--ink)" />
          </button>

          {/* Logo */}
          <span className="font-serif italic font-medium text-[22px] text-(--ink) tracking-[-0.01em] md:mr-auto absolute left-1/2 -translate-x-1/2 md:static md:left-auto md:translate-x-0">
            <SelfMapLogo size={20} />
          </span>

          {/* 桌機：導覽連結 */}
          <nav className="hidden md:flex items-center gap-6 mx-6">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-mono text-[12px] md:text-base tracking-[0.14em] uppercase text-(--ink-soft) hover:text-(--ink) transition-colors duration-120 no-underline"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* 桌機：帳號區塊 */}
          <nav className="hidden md:flex items-center">
            {isSignedIn ? (
              <Link
                href="/account"
                className="font-mono text-[12px] md:text-base tracking-[0.14em] uppercase text-(--ink-soft) hover:text-(--ink) transition-colors duration-120 no-underline"
              >
                個人頁面
              </Link>
            ) : (
              <button
                onClick={() => openSignIn()}
                className="font-mono text-[12px] md:text-base tracking-[0.14em] uppercase text-(--paper) bg-(--ink) border border-(--ink) px-3.5 py-1.25 cursor-pointer transition-colors duration-120 hover:bg-(--crimson) hover:border-(--crimson)"
              >
                登入
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* 手機：滑出抽屜遮罩 */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-60 bg-(--ink)/30 md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 手機：左側抽屜 */}
      <aside
        className={`fixed top-0 left-0 z-70 h-full w-64 bg-(--paper) border-r border-(--ink) flex flex-col transition-transform duration-200 md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="導覽選單"
      >
        {/* 抽屜標題列 */}
        <div className="h-13 flex items-center justify-between px-6 border-b border-(--ink)">
          <span className="font-serif italic font-medium text-[18px] text-(--ink) tracking-[-0.01em]">
            <SelfMapLogo size={16} />
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-7 h-7 flex items-center justify-center cursor-pointer text-(--ink-soft) hover:text-(--ink)"
            aria-label="關閉選單"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" />
              <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {/* 抽屜連結清單（含帳號） */}
        <nav className="flex flex-col px-6 pt-6 gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-mono text-[12px] md:text-base tracking-[0.16em] uppercase text-(--ink-soft) hover:text-(--ink) transition-colors duration-120 no-underline py-2.5 border-b border-(--ink)/20"
            >
              {label}
            </Link>
          ))}
          {isSignedIn ? (
            <Link
              href="/account"
              className="font-mono text-[12px] md:text-base tracking-[0.16em] uppercase text-(--ink-soft) hover:text-(--ink) transition-colors duration-120 no-underline py-2.5 border-b border-(--ink)/20"
            >
              個人頁面
            </Link>
          ) : (
            <button
              onClick={() => { setDrawerOpen(false); openSignIn() }}
              className="text-left font-mono text-[12px] md:text-base tracking-[0.16em] uppercase text-(--ink-soft) hover:text-(--ink) transition-colors duration-120 py-2.5 border-b border-(--ink)/20 cursor-pointer bg-transparent border-x-0 border-t-0"
            >
              登入
            </button>
          )}
        </nav>
      </aside>
    </>
  )
}
