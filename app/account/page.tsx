'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, startTransition, useRef, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import toast from 'react-hot-toast'
import ChartView from '@/components/humanDesign/ChartView'
import BirthProfileManager from '@/components/humanDesign/BirthProfileManager'
import { computeHdResult } from '@/lib/computeHdResult'
import type { HdResult } from '@/lib/buildAiPrompt'
import type { TransitResult, TransitPlanetRow } from '@/lib/computeTransit'
import { CHANNEL_DEFS, type CenterName } from '@/lib/humanDesign'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ConfirmModal } from '@/components/ConfirmModal'

const CompositeView = dynamic(() => import('@/components/humanDesign/CompositeView'), { ssr: false })
const TransitView = dynamic(() => import('@/components/humanDesign/TransitView'), { ssr: false })

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
  line: 'LINE',
  github: 'GitHub',
}

interface PersonMeta {
  name: string | null
  birthDate: string
  birthTime: string
  birthCity: string
  timezone: string
  type: string
  profile: string
}

interface TransitMeta {
  personalBirthDate: string
  personalBirthTime: string
  personalBirthCity: string
  personalTimezone: string
  transitComputedAt: string
  transitPlanets: TransitPlanetRow[]
}

interface ChartMeta {
  personA?: PersonMeta
  personB?: PersonMeta
  transitMeta?: TransitMeta
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
  chartKind: string | null
  meta: ChartMeta | null
  centers: CenterName[]
  channels: string[]
  gates: number[]
}

type SidebarSection = 'profile' | 'humandesign' | 'connected'

const CHART_TABS = [
  { id: 'personal', label: '個人' },
  { id: 'composite', label: '合圖' },
  { id: 'transit', label: '流日' },
] as const
type ChartTab = typeof CHART_TABS[number]['id']

function kindOf(chart: Pick<SavedChart, 'chartKind' | 'type' | 'birthDate'>): ChartTab {
  if (chart.chartKind === 'composite' || chart.chartKind === 'transit') return chart.chartKind
  // 舊格式合圖：網頁端存 type='合圖' 但沒有設 chartKind
  if (chart.type === '合圖' || chart.birthDate?.includes('|')) return 'composite'
  return 'personal'
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  )
}

function AccountContent() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawSection = searchParams.get('section') as SidebarSection | null
  const activeSection: SidebarSection =
    rawSection && ['profile', 'humandesign', 'connected'].includes(rawSection) ? rawSection : 'profile'

  const [activeChartId, setActiveChartId] = useState<string | null>(null)
  const [charts, setCharts] = useState<SavedChart[]>([])
  const [chartsLoading, setChartsLoading] = useState(false)
  const [chartsFetched, setChartsFetched] = useState(false)
  const [chartTab, setChartTab] = useState<ChartTab>(() => {
    const t = searchParams.get('tab')
    return t === 'composite' || t === 'transit' || t === 'personal' ? t : 'personal'
  })

  const [chartResult, setChartResult] = useState<HdResult | null>(null)
  const [chartComputing, setChartComputing] = useState(false)
  const [compositeResults, setCompositeResults] = useState<{ a: HdResult; b: HdResult } | null>(null)
  const [transitSnapshot, setTransitSnapshot] = useState<TransitResult | null>(null)

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace('/')
  }, [isLoaded, isSignedIn, router])

  const fetchCharts = useCallback(async () => {
    setChartsLoading(true)
    try {
      const res = await fetch('/api/charts')
      if (!res.ok) return
      const json = await res.json()
      const list: SavedChart[] = json.charts ?? []
      setCharts(list)
      setActiveChartId(prev => {
        const filtered = list.filter(ch => kindOf(ch) === chartTab)
        return (prev && filtered.some(c => c.id === prev)) ? prev : (filtered[0]?.id ?? null)
      })
      setChartsFetched(true)
    } catch (err) {
      console.error('[account] fetchCharts error:', err)
    } finally {
      setChartsLoading(false)
    }
  }, [isSignedIn, isLoaded, chartTab])

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
      toast.success('名稱已更新')
    } catch {
      toast.error('儲存失敗')
    } finally {
      setNameSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('圖片大小不能超過 10MB')
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      return
    }
    setAvatarUploading(true)
    window.umami?.track('account-avatar-upload')
    try {
      await user.setProfileImage({ file })
      toast.success('頭像已更新')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      toast.error(msg || '頭像上傳失敗')
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const isDeletingRef = useRef(false)
  const chartRequestIdRef = useRef(0)

  const handleDeleteChart = async (id: string) => {
    if (isDeletingRef.current) return
    isDeletingRef.current = true
    setDeletingId(id)
    setConfirmDeleteId(null)
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
    finally {
      setDeletingId(null)
      isDeletingRef.current = false
    }
  }

  useEffect(() => {
    if (activeSection === 'humandesign') setChartsFetched(false)
    const t = searchParams.get('tab')
    if (t === 'composite' || t === 'transit' || t === 'personal') setChartTab(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (activeSection === 'humandesign' && !chartsFetched && !chartsLoading && isSignedIn) {
      startTransition(() => { fetchCharts() })
    }
  }, [activeSection, chartsFetched, chartsLoading, fetchCharts, isSignedIn])

  const filteredCharts = charts.filter(ch => kindOf(ch) === chartTab)

  const handleChartTabClick = (tab: ChartTab) => {
    setChartTab(tab)
    const filtered = charts.filter(ch => kindOf(ch) === tab)
    setActiveChartId(filtered[0]?.id ?? null)
  }

  useEffect(() => {
    if (!activeChartId) return
    const chart = charts.find(c => c.id === activeChartId)
    if (!chart) return

    startTransition(() => {
      setChartResult(null)
      setCompositeResults(null)
      setTransitSnapshot(null)
      setChartComputing(true)
    })

    const requestId = ++chartRequestIdRef.current

    const isComposite = chart.chartKind === 'composite' || chart.type === 'composite'
    const isTransit = chart.chartKind === 'transit'

    if (isTransit) {
      const transitMeta = chart.meta?.transitMeta
      if (!transitMeta) {
        // 舊資料缺少個人出生資料與流日行星閘門，無法正確重建流日圖
        startTransition(() => setChartComputing(false))
        toast.error('這份流日圖是舊格式儲存，缺少完整資料，無法重新顯示')
        return
      }
      computeHdResult(transitMeta.personalBirthDate, transitMeta.personalBirthTime, transitMeta.personalTimezone)
        .then(personalResult => {
          if (chartRequestIdRef.current !== requestId) return
          const definedChannels = chart.channels
            .map(id => CHANNEL_DEFS.find(ch => ch.id === id))
            .filter((ch): ch is typeof CHANNEL_DEFS[number] => !!ch)
          setChartResult(personalResult)
          setTransitSnapshot({
            planets: transitMeta.transitPlanets,
            allGates: new Set(chart.gates),
            definedCenterIds: new Set(chart.centers),
            definedChannels,
            computedAt: transitMeta.transitComputedAt,
          })
        })
        .catch(err => { if (chartRequestIdRef.current === requestId) { console.error(err); toast.error('計算失敗') } })
        .finally(() => { if (chartRequestIdRef.current === requestId) setChartComputing(false) })
    } else if (isComposite) {
      let dateA: string, timeA: string, tzA: string
      let dateB: string, timeB: string, tzB: string

      if (chart.meta?.personA && chart.meta?.personB) {
        // New format: individual fields in meta
        const { personA, personB } = chart.meta as Required<ChartMeta>
        dateA = personA.birthDate; timeA = personA.birthTime; tzA = personA.timezone
        dateB = personB.birthDate; timeB = personB.birthTime; tzB = personB.timezone
      } else {
        // Old format: pipe-separated fields
        ;[dateA, dateB] = chart.birthDate.split('|')
        ;[timeA, timeB] = chart.birthTime.split('|')
        ;[tzA, tzB] = (chart.timezone ?? 'UTC|UTC').split('|')
      }

      Promise.all([
        computeHdResult(dateA, timeA, tzA),
        computeHdResult(dateB, timeB, tzB),
      ])
        .then(([a, b]) => { if (chartRequestIdRef.current === requestId) setCompositeResults({ a, b }) })
        .catch(err => { if (chartRequestIdRef.current === requestId) { console.error(err); toast.error('計算失敗') } })
        .finally(() => { if (chartRequestIdRef.current === requestId) setChartComputing(false) })
    } else {
      const tz = chart.timezone ?? 'UTC'
      computeHdResult(chart.birthDate, chart.birthTime, tz)
        .then(r => { if (chartRequestIdRef.current === requestId) setChartResult(r) })
        .catch(err => { if (chartRequestIdRef.current === requestId) { console.error(err); toast.error('計算失敗') } })
        .finally(() => { if (chartRequestIdRef.current === requestId) setChartComputing(false) })
    }
  }, [activeChartId, charts])

  if (!isLoaded || !isSignedIn) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center pt-[52px]">
          <LoadingSpinner />
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
    router.replace(`/account?section=${section}`, { scroll: false })
    window.umami?.track('account-section-click', { section })
  }

  const NAV_ITEMS: { key: SidebarSection; label: string }[] = [
    { key: 'profile', label: '個人資料' },
    { key: 'humandesign', label: '我的圖表' },
    { key: 'connected', label: '連結帳號' },
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
              登出
            </button>
          </div>
        </div>

        {/* ── Desktop sidebar ── */}
        <nav className="hidden md:flex w-56 shrink-0 border-r border-(--ink) h-[calc(100vh-52px)] sticky top-13 flex-col py-8 px-0 overflow-y-auto">

          <button
            onClick={() => handleSectionClick('profile')}
            className={`w-full text-left font-mono text-[12px] md:text-base tracking-widest uppercase px-5 py-2.5 cursor-pointer border-l-2 transition-colors duration-120 ${activeSection === 'profile' ? 'border-(--ink) text-(--ink) bg-(--paper-deep)' : 'border-transparent text-(--ink-soft) hover:text-(--ink) hover:bg-(--paper-deep)'}`}
          >
            個人資料
          </button>

          <div>
            <button
              onClick={() => handleSectionClick('humandesign')}
              className={`w-full text-left font-mono text-[12px] md:text-base tracking-widest uppercase px-5 py-2.5 cursor-pointer border-l-2 transition-colors duration-120 ${activeSection === 'humandesign' ? 'border-(--ink) text-(--ink) bg-(--paper-deep)' : 'border-transparent text-(--ink-soft) hover:text-(--ink) hover:bg-(--paper-deep)'}`}
            >
              我的圖表
            </button>

            {activeSection === 'humandesign' && (
              <div className="border-l border-dotted border-[rgba(43,31,20,0.3)] ml-5">
                {CHART_TABS.map(t => (
                  <div key={t.id}>
                    <button
                      onClick={() => handleChartTabClick(t.id)}
                      className={`w-full text-left font-mono text-[11px] md:text-sm tracking-widest uppercase px-4 py-2 cursor-pointer transition-colors duration-120 ${chartTab === t.id ? 'text-(--ink) font-semibold' : 'text-(--ink-soft) hover:text-(--ink)'}`}
                    >
                      {t.label}
                    </button>
                    {chartTab === t.id && charts.filter(ch => kindOf(ch) === t.id).map(ch => (
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
                              className={`flex-1 text-left font-mono text-[12px] md:text-base tracking-[0.06em] pl-8 pr-4 py-2 cursor-pointer truncate transition-colors duration-120 ${activeChartId === ch.id ? 'text-(--ink) font-semibold' : 'text-(--ink-soft) hover:text-(--ink)'}`}
                            >
                              {ch.name ?? `${ch.birthCity} · ${ch.birthDate}`}
                            </button>
                            <button
                              onClick={() => handleStartRenameChart(ch)}
                              className="opacity-0 group-hover:opacity-100 pl-1 text-(--ink-soft) hover:text-(--ink) text-[12px] md:text-base cursor-pointer transition-all duration-120"
                              title="編輯圖表名稱"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(ch.id)}
                              disabled={deletingId === ch.id}
                              className="opacity-0 group-hover:opacity-100 px-2 text-(--ink-soft) hover:text-(--crimson) text-[12px] md:text-base cursor-pointer transition-all duration-120 disabled:opacity-40 disabled:cursor-not-allowed"
                              title="刪除圖表"
                            >
                              {deletingId === ch.id ? '…' : '✕'}
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleSectionClick('connected')}
            className={`w-full text-left font-mono text-[12px] md:text-base tracking-widest uppercase px-5 py-2.5 cursor-pointer border-l-2 transition-colors duration-120 ${activeSection === 'connected' ? 'border-(--ink) text-(--ink) bg-(--paper-deep)' : 'border-transparent text-(--ink-soft) hover:text-(--ink) hover:bg-(--paper-deep)'}`}
          >
            連結帳號
          </button>

          <div className="mt-auto px-5">
            <button
              onClick={handleSignOut}
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
                  個人資料
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
                    title="更換頭像"
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
                        <span className="font-mono text-[12px] md:text-base text-(--ink-soft)">無頭像</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <span className="font-mono text-[12px] md:text-base tracking-widest uppercase text-white">
                        {avatarUploading ? '上傳中…' : '更換'}
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
                        編輯
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="輸入顯示名稱"
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

              <BirthProfileManager />
            </div>
          )}

          {/* Human Design */}
          {activeSection === 'humandesign' && (
            <div className="px-5 py-8 md:px-10 md:py-10">
              <header className="mb-6 pb-3 border-b border-(--ink)">
                <h1 className="font-serif italic font-medium text-[clamp(24px,3vw,36px)] leading-none m-0 text-(--ink)">
                  我的圖表
                </h1>
              </header>

              {chartsLoading && (
                <div className="flex items-center justify-center py-10">
                  <LoadingSpinner />
                </div>
              )}

              {!chartsLoading && filteredCharts.length === 0 && (
                <div className="border border-dashed border-(--ink) py-10 px-6 text-center max-w-md">
                  <div className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink-soft) mb-3">
                    目前沒有已儲存的{CHART_TABS.find(t => t.id === chartTab)?.label}圖表
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
              {!chartsLoading && filteredCharts.length >= 1 && (
                <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-4 -mx-5 px-5">
                  {filteredCharts.map(ch => (
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
                            title="編輯圖表名稱"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(ch.id)}
                            disabled={deletingId === ch.id}
                            className="px-2 py-1.5 text-[12px] md:text-base text-(--ink-soft) hover:text-(--crimson) border-l border-(--ink) cursor-pointer transition-colors duration-120 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="刪除圖表"
                          >
                            {deletingId === ch.id ? '…' : '✕'}
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
                    <div className="font-mono text-[12px] md:text-base tracking-[0.14em] uppercase text-(--ink-soft) mb-6">正在計算…</div>
                  )}
                  {(activeChart.chartKind === 'composite' || activeChart.type === 'composite') ? (
                    compositeResults && (() => {
                      let cityA: string, cityB: string
                      let dateA: string, dateB: string
                      let timeA: string, timeB: string
                      let tzA: string, tzB: string

                      if (activeChart.meta?.personA && activeChart.meta?.personB) {
                        const pA = activeChart.meta.personA as PersonMeta
                        const pB = activeChart.meta.personB as PersonMeta
                        cityA = pA.birthCity; cityB = pB.birthCity
                        dateA = pA.birthDate; dateB = pB.birthDate
                        timeA = pA.birthTime; timeB = pB.birthTime
                        tzA   = pA.timezone;  tzB   = pB.timezone
                      } else {
                        ;[cityA, cityB] = activeChart.birthCity.split('|')
                        ;[dateA, dateB] = activeChart.birthDate.split('|')
                        ;[timeA, timeB] = activeChart.birthTime.split('|')
                        ;[tzA, tzB]     = (activeChart.timezone ?? 'UTC|UTC').split('|')
                      }

                      return (
                        <CompositeView
                          resultA={compositeResults.a}
                          resultB={compositeResults.b}
                          dateA={dateA} timeA={timeA} locationA={cityA} timezoneA={tzA}
                          dateB={dateB} timeB={timeB} locationB={cityB} timezoneB={tzB}
                          hideSaveButton
                        />
                      )
                    })()
                  ) : activeChart.chartKind === 'transit' ? (
                    chartResult && transitSnapshot && (
                      <TransitView
                        personal={chartResult}
                        transit={transitSnapshot}
                        onRefresh={() => {}}
                        refreshing={false}
                        readOnly
                      />
                    )
                  ) : (
                    chartResult && (
                      <ChartView
                        result={chartResult}
                        date={activeChart.birthDate}
                        time={activeChart.birthTime}
                        locationLabel={activeChart.birthCity}
                        timezone={activeChart.timezone ?? 'UTC'}
                        hideSaveButton
                      />
                    )
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
                  連結帳號
                </h1>
              </header>
              {user.externalAccounts.length === 0 ? (
                <div className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--ink-soft)">尚未連結任何第三方帳號</div>
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

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="確認刪除"
        message="確定要刪除此圖表嗎？"
        confirmLabel="刪除"
        cancelLabel="取消"
        onConfirm={() => handleDeleteChart(confirmDeleteId!)}
        onCancel={() => setConfirmDeleteId(null)}
        isLoading={!!deletingId}
      />
    </>
  )
}
