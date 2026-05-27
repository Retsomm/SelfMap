'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, startTransition, useRef } from 'react'
import Image from 'next/image'
import ChartView from '@/components/humanDesign/ChartView'
import { computeHdResult } from '@/lib/computeHdResult'
import type { HdResult } from '@/lib/buildAiPrompt'

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
  line: 'LINE',
  github: 'GitHub',
}

interface SavedChart {
  id: string
  name: string | null
  birthDate: string
  birthTime: string
  birthCity: string
  timezone: string | null
  type: string
  authority: string
  profile: string
  definition: string
  createdAt: string
}

type SidebarSection = 'profile' | 'humandesign' | 'connected'

export default function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const [activeSection, setActiveSection] = useState<SidebarSection>('profile')
  const [activeChartId, setActiveChartId] = useState<string | null>(null)
  const [charts, setCharts] = useState<SavedChart[]>([])
  const [chartsLoading, setChartsLoading] = useState(false)
  const [chartsFetched, setChartsFetched] = useState(false)

  // computed HdResult for the active chart
  const [chartResult, setChartResult] = useState<HdResult | null>(null)
  const [chartComputing, setChartComputing] = useState(false)
  const [chartError, setChartError] = useState('')

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace('/')
  }, [isLoaded, isSignedIn, router])

  const fetchCharts = useCallback(async () => {
    setChartsLoading(true)
    try {
      const res = await fetch('/api/charts')
      const json = await res.json()
      const list: SavedChart[] = json.charts ?? []
      setCharts(list)
      if (list.length > 0) setActiveChartId(prev => prev ?? list[0].id)
    } catch {}
    finally {
      setChartsLoading(false)
      setChartsFetched(true)
    }
  }, [])

  // Profile editing
  const [editingName, setEditingName] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleStartEditName = () => {
    if (!user) return
    setDisplayName(user.fullName?.trim() || user.username || '')
    setNameError('')
    setEditingName(true)
  }

  const handleSaveName = async () => {
    if (nameSaving || !user) return
    setNameSaving(true)
    setNameError('')
    try {
      const trimmed = displayName.trim()
      const spaceIdx = trimmed.indexOf(' ')
      const firstName = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)
      const lastName = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1)
      await user.update({ firstName, lastName })
      setEditingName(false)
    } catch {
      setNameError('儲存失敗，請稍後再試')
    } finally {
      setNameSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 10 * 1024 * 1024) {
      setAvatarError('圖片不能超過 10MB')
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      return
    }
    setAvatarUploading(true)
    setAvatarError('')
    try {
      await user.setProfileImage({ file })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setAvatarError(msg || '上傳失敗，請確認 Clerk 已開啟大頭貼上傳功能')
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const [editingChartId, setEditingChartId] = useState<string | null>(null)
  const [editingChartName, setEditingChartName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const chartNameInputRef = useRef<HTMLInputElement>(null)

  const handleStartRenameChart = (ch: SavedChart) => {
    setEditingChartId(ch.id)
    setEditingChartName(ch.name ?? `${ch.birthCity} · ${ch.birthDate}`)
    setTimeout(() => chartNameInputRef.current?.select(), 0)
  }

  const handleSaveChartName = async (id: string) => {
    if (renamingId) return
    setRenamingId(id)
    try {
      const res = await fetch(`/api/charts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingChartName }),
      })
      if (!res.ok) return
      setCharts(prev => prev.map(c => c.id === id ? { ...c, name: editingChartName.trim() || null } : c))
      setEditingChartId(null)
    } catch {}
    finally { setRenamingId(null) }
  }

  const handleCancelRenameChart = () => setEditingChartId(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteChart = useCallback(async (id: string) => {
    if (deletingId) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/charts/${id}`, { method: 'DELETE' })
      if (!res.ok) return
      setCharts(prev => {
        const next = prev.filter(c => c.id !== id)
        setActiveChartId(cur => cur === id ? (next[0]?.id ?? null) : cur)
        return next
      })
    } catch {}
    finally { setDeletingId(null) }
  }, [deletingId])

  // Load charts when entering Human Design section (only once)
  useEffect(() => {
    if (activeSection === 'humandesign' && !chartsFetched && !chartsLoading) {
      startTransition(() => { fetchCharts() })
    }
  }, [activeSection, chartsFetched, chartsLoading, fetchCharts])

  // Re-compute HdResult whenever active chart changes
  useEffect(() => {
    if (!activeChartId) return
    const chart = charts.find(c => c.id === activeChartId)
    if (!chart) return

    const tz = chart.timezone ?? 'UTC'
    startTransition(() => {
      setChartResult(null)
      setChartError('')
      setChartComputing(true)
    })

    computeHdResult(chart.birthDate, chart.birthTime, tz)
      .then(r => setChartResult(r))
      .catch(err => setChartError(err instanceof Error ? err.message : '計算失敗'))
      .finally(() => setChartComputing(false))
  }, [activeChartId, charts])

  if (!isLoaded || !isSignedIn) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center pt-[52px]">
          <span className="font-mono text-[12px] md:text-base tracking-[0.18em] uppercase text-(--ink-soft)">
            Loading…
          </span>
        </div>
      </>
    )
  }

  const activeChart = charts.find(c => c.id === activeChartId) ?? null

  const handleSectionClick = (section: SidebarSection) => {
    setActiveSection(section)
  }

  const NAV_ITEMS: { key: SidebarSection; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'humandesign', label: 'Human Design' },
    { key: 'connected', label: 'Connected Accounts' },
  ]

  return (
    <>
      <div className="min-h-screen pt-[52px] flex flex-col md:flex-row">

        {/* ── Mobile top tab bar ── */}
        <div className="md:hidden border-b border-(--ink) bg-(--paper-deep) flex overflow-x-auto shrink-0">
          {NAV_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSectionClick(key)}
              className={`font-mono text-[12px] md:text-base tracking-[0.12em] uppercase whitespace-nowrap px-4 py-3 border-b-2 transition-colors duration-120 shrink-0 cursor-pointer ${activeSection === key ? 'border-(--ink) text-(--ink)' : 'border-transparent text-(--ink-soft)'}`}
            >
              {label}
            </button>
          ))}
          <div className="ml-auto shrink-0 flex items-center pr-4">
            <button
              onClick={() => signOut(() => router.push('/'))}
              className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink-soft) border border-(--ink-soft) px-2.5 py-1 bg-transparent cursor-pointer transition-colors duration-120 hover:text-(--crimson) hover:border-(--crimson)"
            >
              登出
            </button>
          </div>
        </div>

        {/* ── Desktop sidebar ── */}
        <nav className="hidden md:flex w-56 shrink-0 border-r border-(--ink) min-h-[calc(100vh-52px)] flex-col py-8 px-0">

          <button
            onClick={() => handleSectionClick('profile')}
            className={`w-full text-left font-mono text-[12px] md:text-base tracking-widest uppercase px-5 py-2.5 cursor-pointer border-l-2 transition-colors duration-120 ${activeSection === 'profile' ? 'border-(--ink) text-(--ink) bg-(--paper-deep)' : 'border-transparent text-(--ink-soft) hover:text-(--ink) hover:bg-(--paper-deep)'}`}
          >
            Profile
          </button>

          <div>
            <button
              onClick={() => handleSectionClick('humandesign')}
              className={`w-full text-left font-mono text-[12px] md:text-base tracking-widest uppercase px-5 py-2.5 cursor-pointer border-l-2 transition-colors duration-120 ${activeSection === 'humandesign' ? 'border-(--ink) text-(--ink) bg-(--paper-deep)' : 'border-transparent text-(--ink-soft) hover:text-(--ink) hover:bg-(--paper-deep)'}`}
            >
              Human Design
            </button>

            {activeSection === 'humandesign' && charts.length >= 1 && (
              <div className="border-l border-dotted border-[rgba(43,31,20,0.3)] ml-5">
                {charts.map(ch => (
                  <div
                    key={ch.id}
                    className={`flex items-center group ${activeChartId === ch.id ? 'bg-(--paper-deep)' : ''}`}
                  >
                    {editingChartId === ch.id ? (
                      <form
                        className="flex-1 flex items-center gap-1 px-2 py-1"
                        onSubmit={e => { e.preventDefault(); handleSaveChartName(ch.id) }}
                      >
                        <input
                          ref={chartNameInputRef}
                          type="text"
                          value={editingChartName}
                          onChange={e => setEditingChartName(e.target.value)}
                          onBlur={() => handleSaveChartName(ch.id)}
                          onKeyDown={e => e.key === 'Escape' && handleCancelRenameChart()}
                          disabled={renamingId === ch.id}
                          className="flex-1 min-w-0 font-mono text-[12px] md:text-base tracking-[0.06em] bg-(--paper) border-b border-(--ink) text-(--ink) outline-none px-1 py-0.5 disabled:opacity-50"
                          autoFocus
                        />
                      </form>
                    ) : (
                      <>
                        <button
                          onClick={() => setActiveChartId(ch.id)}
                          className={`flex-1 text-left font-mono text-[12px] md:text-base tracking-[0.06em] px-4 py-2 cursor-pointer truncate transition-colors duration-120 ${activeChartId === ch.id ? 'text-(--ink) font-semibold' : 'text-(--ink-soft) hover:text-(--ink)'}`}
                        >
                          {ch.name ?? `${ch.birthCity} · ${ch.birthDate}`}
                        </button>
                        <button
                          onClick={() => handleStartRenameChart(ch)}
                          className="opacity-0 group-hover:opacity-100 pl-1 text-(--ink-soft) hover:text-(--ink) text-[12px] md:text-base cursor-pointer transition-all duration-120"
                          title="編輯名稱"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeleteChart(ch.id)}
                          disabled={deletingId === ch.id}
                          className="opacity-0 group-hover:opacity-100 px-2 text-(--ink-soft) hover:text-(--crimson) text-[12px] md:text-base cursor-pointer transition-all duration-120 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="刪除"
                        >
                          {deletingId === ch.id ? '…' : '✕'}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleSectionClick('connected')}
            className={`w-full text-left font-mono text-[12px] md:text-base tracking-widest uppercase px-5 py-2.5 cursor-pointer border-l-2 transition-colors duration-120 ${activeSection === 'connected' ? 'border-(--ink) text-(--ink) bg-(--paper-deep)' : 'border-transparent text-(--ink-soft) hover:text-(--ink) hover:bg-(--paper-deep)'}`}
          >
            Connected Accounts
          </button>

          <div className="mt-auto px-5">
            <button
              onClick={() => signOut(() => router.push('/'))}
              className="font-mono text-[12px] md:text-base tracking-[0.14em] uppercase text-(--ink-soft) border border-(--ink-soft) px-3.5 py-1.5 bg-transparent cursor-pointer transition-colors duration-120 hover:text-(--crimson) hover:border-(--crimson) w-full"
            >
              登出
            </button>
          </div>
        </nav>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 overflow-x-auto">

          {/* Profile */}
          {activeSection === 'profile' && (
            <div className="px-5 py-8 md:px-10 md:py-10 max-w-3xl">
              <header className="mb-8 pb-3 border-b border-(--ink)">
                <h1 className="font-serif italic font-medium text-[clamp(24px,3vw,36px)] leading-none m-0 text-(--ink)">
                  Profile
                </h1>
              </header>

              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="shrink-0 relative group">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="relative w-20 h-20 block cursor-pointer border border-(--ink) overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                    title="更換大頭貼"
                  >
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={user.username ?? ''}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-(--paper-deep) flex items-center justify-center">
                        <span className="font-mono text-[12px] md:text-base text-(--ink-soft)">No img</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <span className="font-mono text-[12px] md:text-base tracking-widest uppercase text-white">
                        {avatarUploading ? '上傳中…' : '更換'}
                      </span>
                    </div>
                  </button>
                  {avatarError && (
                    <p className="font-mono text-[12px] md:text-base text-(--crimson) mt-1 w-20 wrap-break-word">{avatarError}</p>
                  )}
                </div>

                {/* Name & email */}
                <div className="flex flex-col gap-4 flex-1 min-w-0">
                  {!editingName ? (
                    <div className="flex items-center gap-3">
                      <span className="font-serif italic font-medium text-[24px] text-(--ink) leading-none">
                        {user.fullName?.trim() || user.username || '—'}
                      </span>
                      <button
                        onClick={handleStartEditName}
                        className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--ink-soft) border border-(--ink-soft) px-2 py-0.5 cursor-pointer transition-colors duration-120 hover:text-(--ink) hover:border-(--ink) shrink-0"
                      >
                        編輯
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="顯示名稱"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          className="font-mono text-[12px] md:text-base tracking-[0.04em] border border-(--ink) bg-(--paper) text-(--ink) px-3 py-1.5 w-52 outline-none placeholder:text-(--ink-soft)"
                        />
                      </div>
                      {nameError && (
                        <span className="font-mono text-[12px] md:text-base text-(--crimson)">{nameError}</span>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveName}
                          disabled={nameSaving}
                          className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--paper) bg-(--ink) border border-(--ink) px-3 py-1 cursor-pointer transition-colors duration-120 hover:bg-transparent hover:text-(--ink) disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {nameSaving ? '儲存中…' : '儲存'}
                        </button>
                        <button
                          onClick={() => setEditingName(false)}
                          disabled={nameSaving}
                          className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--ink-soft) border border-(--ink-soft) px-3 py-1 cursor-pointer transition-colors duration-120 hover:text-(--ink) hover:border-(--ink) disabled:opacity-50"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  <span className="font-mono text-[12px] md:text-base tracking-[0.06em] text-(--ink-soft)">
                    {user.primaryEmailAddress?.emailAddress ?? '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Human Design */}
          {activeSection === 'humandesign' && (
            <div className="px-5 py-8 md:px-10 md:py-10">
              <header className="mb-6 pb-3 border-b border-(--ink)">
                <h1 className="font-serif italic font-medium text-[clamp(24px,3vw,36px)] leading-none m-0 text-(--ink)">
                  Human Design
                </h1>
              </header>

              {chartsLoading && (
                <div className="font-mono text-[12px] md:text-base tracking-[0.14em] uppercase text-(--ink-soft)">載入中…</div>
              )}

              {!chartsLoading && charts.length === 0 && (
                <div className="border border-dashed border-(--ink) py-10 px-6 text-center max-w-md">
                  <div className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink-soft) mb-3">
                    尚無儲存的人類圖
                  </div>
                  <button
                    onClick={() => router.push('/')}
                    className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--ink) border border-(--ink) px-4 py-2 cursor-pointer transition-colors duration-120 hover:bg-(--ink) hover:text-(--paper)"
                  >
                    前往計算
                  </button>
                </div>
              )}

              {/* Mobile-only horizontal chart selector */}
              {!chartsLoading && charts.length >= 1 && (
                <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-4 -mx-5 px-5">
                  {charts.map(ch => (
                    <div key={ch.id} className="flex items-center shrink-0 border border-(--ink) overflow-hidden">
                      {editingChartId === ch.id ? (
                        <form
                          className="flex items-center"
                          onSubmit={e => { e.preventDefault(); handleSaveChartName(ch.id) }}
                        >
                          <input
                            type="text"
                            value={editingChartName}
                            onChange={e => setEditingChartName(e.target.value)}
                            onBlur={() => handleSaveChartName(ch.id)}
                            onKeyDown={e => e.key === 'Escape' && handleCancelRenameChart()}
                            disabled={renamingId === ch.id}
                            className="font-mono text-[12px] md:text-base tracking-[0.06em] bg-(--paper) text-(--ink) outline-none px-3 py-1.5 w-36 disabled:opacity-50"
                            autoFocus
                          />
                        </form>
                      ) : (
                        <>
                          <button
                            onClick={() => setActiveChartId(ch.id)}
                            className={`font-mono text-[12px] md:text-base tracking-[0.06em] uppercase whitespace-nowrap px-3 py-1.5 cursor-pointer transition-colors duration-120 ${activeChartId === ch.id ? 'bg-(--ink) text-(--paper)' : 'text-(--ink)'}`}
                          >
                            {ch.name ?? `${ch.birthCity} · ${ch.birthDate}`}
                          </button>
                          <button
                            onClick={() => handleStartRenameChart(ch)}
                            className="px-1.5 py-1.5 text-[12px] md:text-base text-(--ink-soft) hover:text-(--ink) border-l border-(--ink) cursor-pointer transition-colors duration-120"
                            title="編輯名稱"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteChart(ch.id)}
                            className="px-2 py-1.5 text-[12px] md:text-base text-(--ink-soft) hover:text-(--crimson) border-l border-(--ink) cursor-pointer transition-colors duration-120"
                            title="刪除"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!chartsLoading && activeChart && (
                <>
                  {chartComputing && (
                    <div className="font-mono text-[12px] md:text-base tracking-[0.14em] uppercase text-(--ink-soft) mb-6">計算中…</div>
                  )}
                  {chartError && (
                    <div className="font-mono text-[12px] md:text-base text-(--crimson) mb-6">{chartError}</div>
                  )}
                  {chartResult && (
                    <ChartView
                      result={chartResult}
                      date={activeChart.birthDate}
                      time={activeChart.birthTime}
                      locationLabel={activeChart.birthCity}
                      timezone={activeChart.timezone ?? 'UTC'}
                      hideSaveButton
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Connected Accounts */}
          {activeSection === 'connected' && (
            <div className="px-5 py-8 md:px-10 md:py-10 max-w-3xl">
              <header className="mb-8 pb-3 border-b border-(--ink)">
                <h1 className="font-serif italic font-medium text-[clamp(24px,3vw,36px)] leading-none m-0 text-(--ink)">
                  Connected Accounts
                </h1>
              </header>
              {user.externalAccounts.length === 0 ? (
                <div className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--ink-soft)">尚無連結帳號</div>
              ) : (
                <div className="flex flex-col border border-(--ink)">
                  {user.externalAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between py-3.5 px-5 border-b border-dotted border-[rgba(43,31,20,0.2)] last:border-b-0"
                    >
                      <span className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--ink)">
                        {PROVIDER_LABEL[account.provider] ?? account.provider}
                      </span>
                      <span className="font-mono text-[12px] md:text-base tracking-[0.04em] text-(--ink-soft)">
                        {account.emailAddress}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </>
  )
}
