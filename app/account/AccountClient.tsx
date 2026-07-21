'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, startTransition, useRef, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import toast from 'react-hot-toast'
import ChartView from '@/components/humanDesign/ChartView'
import BirthProfileManager from '@/components/humanDesign/BirthProfileManager'
import { computeHdResult } from '@/lib/computeHdResult'
import type { HdResult } from '@/lib/buildAiPrompt'
import { computeTransit, type TransitResult } from '@/lib/computeTransit'
import { CHANNEL_DEFS, calculateCentersAndChannels } from '@/lib/humanDesign'
import { toUtcDate, getOffsetFromTimezone } from '@/utils/ephemeris'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useCharts, type PersonMeta, type ChartMeta, type SavedChart } from '@/lib/useCharts'
import { useNotifications, type NotificationType } from '@/lib/useNotifications'

const CompositeView = dynamic(() => import('@/components/humanDesign/CompositeView'), { ssr: false })
const TransitView = dynamic(() => import('@/components/humanDesign/TransitView'), { ssr: false })

type SidebarSection = 'profile' | 'humandesign' | 'notifications'

const NOTIFICATION_TYPE_CFG: Record<NotificationType, { label: string; color: string }> = {
  feature:      { label: '新功能',  color: 'var(--olive)' },
  bugfix:       { label: '問題修正', color: 'var(--crimson)' },
  announcement: { label: '公告',    color: 'var(--tan)' },
}

function formatNotificationDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

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

export default function AccountClient() {
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
    rawSection && ['profile', 'humandesign', 'notifications'].includes(rawSection) ? rawSection : 'profile'

  const [activeChartId, setActiveChartId] = useState<string | null>(null)
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

  const {
    charts, loading: chartsLoading, refetch: refetchCharts,
    renameChart, renamingId, deleteChart, deletingId,
  } = useCharts(activeSection === 'humandesign' && !!isSignedIn)

  // 每次帶著 query string 導向 humandesign 分頁時強制重新整理（例如從 /create 存完圖表跳轉回來）
  useEffect(() => {
    startTransition(() => {
      const t = searchParams.get('tab')
      if (t === 'composite' || t === 'transit' || t === 'personal') setChartTab(t)
      if (activeSection === 'humandesign') refetchCharts()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // 圖表清單變動後，確保目前選取的圖表仍屬於目前分頁，否則改選分頁下第一筆
  useEffect(() => {
    startTransition(() => {
      setActiveChartId(prev => {
        const filtered = charts.filter(ch => kindOf(ch) === chartTab)
        return (prev && filtered.some(c => c.id === prev)) ? prev : (filtered[0]?.id ?? null)
      })
    })
  }, [charts, chartTab])

  const {
    notifications, isAdmin: isNotificationsAdmin, loading: notificationsLoading,
    createNotification, creating: creatingNotif,
    deleteNotification, deletingId: deletingNotifId,
  } = useNotifications(activeSection === 'notifications')

  const [newNotifTitle, setNewNotifTitle] = useState('')
  const [newNotifBody, setNewNotifBody] = useState('')
  const [newNotifType, setNewNotifType] = useState<NotificationType>('announcement')

  const handleCreateNotification = async () => {
    if (creatingNotif) return
    if (!newNotifTitle.trim() || !newNotifBody.trim()) {
      toast.error('標題與內容為必填')
      return
    }
    try {
      await createNotification({ title: newNotifTitle.trim(), body: newNotifBody.trim(), type: newNotifType })
      setNewNotifTitle('')
      setNewNotifBody('')
      setNewNotifType('announcement')
      toast.success('已新增通知')
    } catch (err) {
      console.error('[account] handleCreateNotification error:', err)
      toast.error(err instanceof Error ? err.message : '新增失敗')
    }
  }

  const handleDeleteNotification = async (id: string) => {
    if (deletingNotifId) return
    try {
      await deleteNotification(id)
    } catch (err) {
      console.error('[account] handleDeleteNotification error:', err)
      toast.error('刪除失敗')
    }
  }

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
  const chartNameInputRef = useRef<HTMLInputElement>(null)

  const handleStartRenameChart = (ch: SavedChart) => {
    setEditingChartId(ch.id)
    setEditingChartName(ch.name ?? `${ch.birthCity} · ${ch.birthDate}`)
    setTimeout(() => chartNameInputRef.current?.select(), 0)
    window.umami?.track('account-rename-chart')
  }

  const handleSaveChartName = async (id: string) => {
    if (renamingId) return
    try {
      await renameChart({ id, name: editingChartName })
      setEditingChartId(null)
    } catch {
      toast.error('圖表重新命名失敗')
    }
  }

  const handleCancelRenameChart = () => setEditingChartId(null)

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const isDeletingRef = useRef(false)
  const chartRequestIdRef = useRef(0)

  const [deletingAccount, setDeletingAccount] = useState(false)
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)

  const handleDeleteChart = async (id: string) => {
    if (isDeletingRef.current) return
    isDeletingRef.current = true
    setConfirmDeleteId(null)
    window.umami?.track('account-delete-chart')
    try {
      await deleteChart(id)
      setActiveChartId(cur => cur === id ? null : cur)
    } catch {
      toast.error('圖表刪除失敗')
    }
    finally {
      isDeletingRef.current = false
    }
  }

  const filteredCharts = charts.filter(ch => kindOf(ch) === chartTab)

  const handleChartTabClick = (tab: ChartTab) => {
    window.umami?.track('account-chart-tab-click', { tab })
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

    const isComposite = kindOf(chart) === 'composite'
    const isTransit = kindOf(chart) === 'transit'

    if (isTransit) {
      const transitMeta = chart.meta?.transitMeta
      if (transitMeta) {
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
      } else if (chart.planets && chart.personalityGates && chart.designGates && chart.timezone) {
        // 舊格式流日圖：缺少 meta.transitMeta，但本命閘門與流日計算當下的時刻都還在，
        // 可用來精準重建（閘門/通道/中心/流日行星皆可重算，僅箭頭方向與變數顏色因 tone 遺失而無法還原）。
        const legacyPersonalAllGates = new Set<number>([...chart.personalityGates, ...chart.designGates])
        const { definedCenterIds, definedChannels } = calculateCentersAndChannels(legacyPersonalAllGates)
        const dummyGate = { gate: 0, line: 0, color: 1, tone: 1, base: 1, full: '' }
        const legacyPersonal: HdResult = {
          jd: 0,
          designJd: 0,
          utcTime: '',
          designUtcTime: '',
          planets: chart.planets.map(p => ({
            planetName: p.name,
            black: { gate: p.blackGate, line: p.blackLine, color: 1, tone: 1, base: 1, full: `${p.blackGate}.${p.blackLine}` },
            red: { gate: p.redGate, line: p.redLine, color: 1, tone: 1, base: 1, full: `${p.redGate}.${p.redLine}` },
            display: '',
            persLon: 0,
            desLon: 0,
          })),
          profile: {
            profile: chart.profile,
            personalitySunLine: 0,
            designSunLine: 0,
            personalitySun: dummyGate,
            designSun: dummyGate,
          },
          type: chart.type as HdResult['type'],
          authority: { name: chart.authority, tip: '' },
          definedCenterIds,
          definedChannels,
          allGates: legacyPersonalAllGates,
          incarnationCross: {
            crossType: 'RAC', crossBaseName: '', crossName: '', variant: 1,
            conscious: '', unconscious: '', gatesLabel: '', persSunGate: 0, persSunLine: 0,
          },
          variables: {
            digestion: { label: '', description: '' },
            environment: { label: '', description: '' },
            perspective: { label: '', description: '' },
            motivation: { label: '', description: '' },
          },
          definition: { raw: chart.definition, label: chart.definition },
        }

        const legacyMoment = toUtcDate(
          chart.birthDate,
          chart.birthTime,
          getOffsetFromTimezone(chart.timezone, new Date(`${chart.birthDate}T${chart.birthTime}:00`)),
        )

        computeTransit(legacyMoment)
          .then(transit => {
            if (chartRequestIdRef.current !== requestId) return
            setChartResult(legacyPersonal)
            setTransitSnapshot(transit)
          })
          .catch(err => { if (chartRequestIdRef.current === requestId) { console.error(err); toast.error('計算失敗') } })
          .finally(() => { if (chartRequestIdRef.current === requestId) setChartComputing(false) })
      } else {
        startTransition(() => setChartComputing(false))
        toast.error('這份流日圖是舊格式儲存，缺少完整資料，無法重新顯示')
      }
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

  const handleDeleteAccount = async () => {
    if (deletingAccount) return
    setDeletingAccount(true)
    window.umami?.track('account-delete-account')
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!res.ok) {
        toast.error('刪除失敗，請稍後再試')
        return
      }
      await signOut()
      router.push('/')
    } catch {
      toast.error('刪除失敗，請稍後再試')
    } finally {
      setDeletingAccount(false)
      setConfirmDeleteAccount(false)
    }
  }

  const handleSectionClick = (section: SidebarSection) => {
    router.replace(`/account?section=${section}`, { scroll: false })
    window.umami?.track('account-section-click', { section })
  }

  const NAV_ITEMS: { key: SidebarSection; label: string }[] = [
    { key: 'profile', label: '個人資料' },
    { key: 'humandesign', label: '我的圖表' },
    { key: 'notifications', label: '通知' },
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
                    {chartTab === t.id && filteredCharts.map(ch => (
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
            onClick={() => handleSectionClick('notifications')}
            className={`w-full text-left font-mono text-[12px] md:text-base tracking-widest uppercase px-5 py-2.5 cursor-pointer border-l-2 transition-colors duration-120 ${activeSection === 'notifications' ? 'border-(--ink) text-(--ink) bg-(--paper-deep)' : 'border-transparent text-(--ink-soft) hover:text-(--ink) hover:bg-(--paper-deep)'}`}
          >
            通知
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

              <div className="mt-10 pt-6 border-t border-dashed border-(--ink-soft)">
                <button
                  onClick={() => setConfirmDeleteAccount(true)}
                  className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--ink-soft) border border-(--ink-soft) px-3.5 py-1.5 bg-transparent cursor-pointer transition-colors duration-120 hover:text-(--crimson) hover:border-(--crimson)"
                >
                  刪除帳號
                </button>
              </div>
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
                  {kindOf(activeChart) === 'composite' ? (
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

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="px-5 py-8 md:px-10 md:py-10 max-w-3xl">
              <header className="mb-8 pb-3 border-b border-(--ink)">
                <h1 className="font-serif italic font-medium text-[clamp(24px,3vw,36px)] leading-none m-0 text-(--ink)">
                  通知
                </h1>
              </header>

              {isNotificationsAdmin && (
                <div className="border border-(--ink) px-5 py-4 mb-6 flex flex-col gap-3">
                  <div className="font-mono text-[11px] tracking-widest uppercase text-(--ink-soft)">
                    新增通知
                  </div>
                  <input
                    type="text"
                    placeholder="標題"
                    value={newNotifTitle}
                    onChange={e => setNewNotifTitle(e.target.value)}
                    disabled={creatingNotif}
                    className="font-mono text-base tracking-[0.04em] border border-(--ink) bg-(--paper) text-(--ink) px-3 py-1.5 outline-none placeholder:text-(--ink-soft) disabled:opacity-50"
                  />
                  <textarea
                    placeholder="內容"
                    value={newNotifBody}
                    onChange={e => setNewNotifBody(e.target.value)}
                    disabled={creatingNotif}
                    rows={3}
                    className="font-mono text-[13px] leading-relaxed border border-(--ink) bg-(--paper) text-(--ink) px-3 py-1.5 outline-none placeholder:text-(--ink-soft) disabled:opacity-50 resize-y"
                  />
                  <div className="flex items-center gap-3 flex-wrap">
                    <select
                      value={newNotifType}
                      onChange={e => setNewNotifType(e.target.value as NotificationType)}
                      disabled={creatingNotif}
                      className="font-mono text-[12px] tracking-widest uppercase border border-(--ink) bg-(--paper) text-(--ink) px-2 py-1.5 outline-none disabled:opacity-50"
                    >
                      {(Object.keys(NOTIFICATION_TYPE_CFG) as NotificationType[]).map(t => (
                        <option key={t} value={t}>{NOTIFICATION_TYPE_CFG[t].label}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleCreateNotification}
                      disabled={creatingNotif}
                      className="font-mono text-[12px] md:text-base tracking-widest uppercase text-(--paper) bg-(--ink) border border-(--ink) px-4 py-1.5 cursor-pointer transition-colors duration-120 hover:bg-transparent hover:text-(--ink) disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingNotif ? '新增中…' : '發布通知'}
                    </button>
                  </div>
                </div>
              )}

              {notificationsLoading && (
                <div className="flex items-center justify-center py-10">
                  <LoadingSpinner />
                </div>
              )}

              {!notificationsLoading && notifications.length === 0 && (
                <div className="border border-dashed border-(--ink) py-10 px-6 text-center max-w-md">
                  <div className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink-soft)">
                    目前沒有通知
                  </div>
                </div>
              )}

              {!notificationsLoading && notifications.length > 0 && (
                <div className="flex flex-col gap-4">
                  {notifications.map(n => {
                    const cfg = NOTIFICATION_TYPE_CFG[n.type] ?? NOTIFICATION_TYPE_CFG.announcement
                    return (
                      <div key={n.id} className="border border-(--ink) px-5 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="font-mono text-[11px] tracking-widest uppercase px-2 py-0.5 border"
                            style={{ color: cfg.color, borderColor: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[11px] text-(--ink-soft)">
                              {formatNotificationDate(n.publishedAt)}
                            </span>
                            {isNotificationsAdmin && (
                              <button
                                onClick={() => handleDeleteNotification(n.id)}
                                disabled={deletingNotifId === n.id}
                                className="font-mono text-[12px] text-(--ink-soft) hover:text-(--crimson) cursor-pointer transition-colors duration-120 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="刪除通知"
                              >
                                {deletingNotifId === n.id ? '…' : '✕'}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="font-serif text-[17px] font-medium text-(--ink) mb-1">
                          {n.title}
                        </div>
                        <div className="font-mono text-[13px] leading-relaxed text-(--ink-soft) whitespace-pre-wrap">
                          {n.body}
                        </div>
                      </div>
                    )
                  })}
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

      <ConfirmModal
        isOpen={confirmDeleteAccount}
        title="刪除帳號"
        message="此操作將永久刪除您的帳號與所有資料（出生資料、圖表紀錄），且無法復原。確定要繼續嗎？"
        confirmLabel="刪除帳號"
        cancelLabel="取消"
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDeleteAccount(false)}
        isLoading={deletingAccount}
      />
    </>
  )
}
