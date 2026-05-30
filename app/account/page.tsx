'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, startTransition, useRef } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import ChartView from '@/components/humanDesign/ChartView'
import { computeHdResult } from '@/lib/computeHdResult'
import type { HdResult } from '@/lib/buildAiPrompt'
import { useLang } from '@/i18n'

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
  const { t } = useLang()
  const tRef = useRef(t)
  tRef.current = t

  const [activeSection, setActiveSection] = useState<SidebarSection>('profile')
  const [activeChartId, setActiveChartId] = useState<string | null>(null)
  const [charts, setCharts] = useState<SavedChart[]>([])
  const [chartsLoading, setChartsLoading] = useState(false)
  const [chartsFetched, setChartsFetched] = useState(false)

  const [chartResult, setChartResult] = useState<HdResult | null>(null)
  const [chartComputing, setChartComputing] = useState(false)

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

  const [editingName, setEditingName] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleStartEditName = () => {
    if (!user) return
    setDisplayName(user.fullName?.trim() || user.username || '')
    setEditingName(true)
    window.umami?.track('account-edit-name')
  }

  const handleSaveName = async () => {
    if (nameSaving || !user) return
    setNameSaving(true)
    window.umami?.track('account-save-name')
    try {
      const trimmed = displayName.trim()
      const spaceIdx = trimmed.indexOf(' ')
      const firstName = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)
      const lastName = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1)
      await user.update({ firstName, lastName })
      setEditingName(false)
      toast.success(t('account.nameUpdated'))
    } catch {
      toast.error(t('account.saveFailed'))
    } finally {
      setNameSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('account.imageTooLarge'))
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      return
    }
    setAvatarUploading(true)
    window.umami?.track('account-avatar-upload')
    try {
      await user.setProfileImage({ file })
      toast.success(t('account.avatarUpdated'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      toast.error(msg || t('account.avatarUploadFailed'))
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
    window.umami?.track('account-rename-chart')
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
    window.umami?.track('account-delete-chart')
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

  useEffect(() => {
    if (activeSection === 'humandesign' && !chartsFetched && !chartsLoading) {
      startTransition(() => { fetchCharts() })
    }
  }, [activeSection, chartsFetched, chartsLoading, fetchCharts])

  useEffect(() => {
    if (!activeChartId) return
    const chart = charts.find(c => c.id === activeChartId)
    if (!chart) return

    const tz = chart.timezone ?? 'UTC'
    startTransition(() => {
      setChartResult(null)
      setChartComputing(true)
    })

    computeHdResult(chart.birthDate, chart.birthTime, tz)
      .then(r => setChartResult(r))
      .catch(err => toast.error(err instanceof Error ? err.message : tRef.current('account.calcFailed')))
      .finally(() => setChartComputing(false))
  }, [activeChartId, charts])

  if (!isLoaded || !isSignedIn) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center pt-[52px]">
          <span className="font-mono text-[12px] md:text-base tracking-[0.18em] uppercase text-(--ink-soft)">
            {t('account.loading')}
          </span>
        </div>
      </>
    )
  }

  const activeChart = charts.find(c => c.id === activeChartId) ?? null

  const handleSignOut = async () => {
    window.umami?.track('account-sign-out')
    try {
      await signOut()
      router.push('/')
    } catch {
      toast.error('Sign out failed')
    }
  }

  const handleSectionClick = (section: SidebarSection) => {
    setActiveSection(section)
    window.umami?.track('account-section-click', { section })
  }

  const NAV_ITEMS: { key: SidebarSection; label: string }[] = [
    { key: 'profile', label: t('account.profile') },
    { key: 'humandesign', label: t('account.humanDesign') },
    { key: 'connected', label: t('account.connectedAccounts') },
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
              onClick={handleSignOut}
              className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink-soft) border border-(--ink-soft) px-2.5 py-1 bg-transparent cursor-pointer transition-colors duration-120 hover:text-(--crimson) hover:border-(--crimson)"
            >
              {t('account.signOut')}
            </button>
          </div>
        </div>

        {/* ── Desktop sidebar ── */}
        <nav className="hidden md:flex w-56 shrink-0 border-r border-(--ink) h-[calc(100vh-52px)] sticky top-13 flex-col py-8 px-0 overflow-y-auto">

          <button
            onClick={() => handleSectionClick('profile')}
            className={`w-full text-left font-mono text-[12px] md:text-base tracking-widest uppercase px-5 py-2.5 cursor-pointer border-l-2 transition-colors duration-120 ${activeSection === 'profile' ? 'border-(--ink) text-(--ink) bg-(--paper-deep)' : 'border-transparent text-(--ink-soft) hover:text-(--ink) hover:bg-(--paper-deep)'}`}
          >
            {t('account.profile')}
          </button>

          <div>
            <button
              onClick={() => handleSectionClick('humandesign')}
              className={`w-full text-left font-mono text-[12px] md:text-base tracking-widest uppercase px-5 py-2.5 cursor-pointer border-l-2 transition-colors duration-120 ${activeSection === 'humandesign' ? 'border-(--ink) text-(--ink) bg-(--paper-deep)' : 'border-transparent text-(--ink-soft) hover:text-(--ink) hover:bg-(--paper-deep)'}`}
            >
              {t('account.humanDesign')}
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
                          className="flex-1 min-w-0 font-mono text-base tracking-[0.06em] bg-(--paper) border-b border-(--ink) text-(--ink) outline-none px-1 py-0.5 disabled:opacity-50"
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
                          title={t('account.editChartTitle')}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeleteChart(ch.id)}
                          disabled={deletingId === ch.id}
                          className="opacity-0 group-hover:opacity-100 px-2 text-(--ink-soft) hover:text-(--crimson) text-[12px] md:text-base cursor-pointer transition-all duration-120 disabled:opacity-40 disabled:cursor-not-allowed"
                          title={t('account.deleteChart')}
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
            {t('account.connectedAccounts')}
          </button>

          <div className="mt-auto px-5">
            <button
              onClick={handleSignOut}
              className="font-mono text-[12px] md:text-base tracking-[0.14em] uppercase text-(--ink-soft) border border-(--ink-soft) px-3.5 py-1.5 bg-transparent cursor-pointer transition-colors duration-120 hover:text-(--crimson) hover:border-(--crimson) w-full"
            >
              {t('account.signOut')}
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
                  {t('account.profile')}
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
                    title={t('account.changeAvatar')}
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
                        <span className="font-mono text-[12px] md:text-base text-(--ink-soft)">{t('account.noImage')}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <span className="font-mono text-[12px] md:text-base tracking-widest uppercase text-white">
                        {avatarUploading ? t('account.uploading') : t('account.change')}
                      </span>
                    </div>
                  </button>
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
                        {t('account.edit')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={t('account.displayNamePlaceholder')}
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          className="font-mono text-base tracking-[0.04em] border border-(--ink) bg-(--paper) text-(--ink) px-3 py-1.5 w-52 outline-none placeholder:text-(--ink-soft)"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveName}
                          disabled={nameSaving}
                          className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--paper) bg-(--ink) border border-(--ink) px-3 py-1 cursor-pointer transition-colors duration-120 hover:bg-transparent hover:text-(--ink) disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {nameSaving ? t('account.saving') : t('account.save')}
                        </button>
                        <button
                          onClick={() => setEditingName(false)}
                          disabled={nameSaving}
                          className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--ink-soft) border border-(--ink-soft) px-3 py-1 cursor-pointer transition-colors duration-120 hover:text-(--ink) hover:border-(--ink) disabled:opacity-50"
                        >
                          {t('account.cancel')}
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
                  {t('account.humanDesign')}
                </h1>
              </header>

              {chartsLoading && (
                <div className="font-mono text-[12px] md:text-base tracking-[0.14em] uppercase text-(--ink-soft)">{t('account.loadingCharts')}</div>
              )}

              {!chartsLoading && charts.length === 0 && (
                <div className="border border-dashed border-(--ink) py-10 px-6 text-center max-w-md">
                  <div className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink-soft) mb-3">
                    {t('account.noCharts')}
                  </div>
                  <button
                    onClick={() => router.push('/')}
                    className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--ink) border border-(--ink) px-4 py-2 cursor-pointer transition-colors duration-120 hover:bg-(--ink) hover:text-(--paper)"
                  >
                    {t('account.goCalculate')}
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
                            className="font-mono text-base tracking-[0.06em] bg-(--paper) text-(--ink) outline-none px-3 py-1.5 w-36 disabled:opacity-50"
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
                            title={t('account.editChartTitle')}
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteChart(ch.id)}
                            className="px-2 py-1.5 text-[12px] md:text-base text-(--ink-soft) hover:text-(--crimson) border-l border-(--ink) cursor-pointer transition-colors duration-120"
                            title={t('account.deleteChart')}
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
                    <div className="font-mono text-[12px] md:text-base tracking-[0.14em] uppercase text-(--ink-soft) mb-6">{t('account.computing')}</div>
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
                  {t('account.connectedAccounts')}
                </h1>
              </header>
              {user.externalAccounts.length === 0 ? (
                <div className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--ink-soft)">{t('account.noConnected')}</div>
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
