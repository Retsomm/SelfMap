'use client'

import { useMemo, useState, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import BodyGraph from '@/components/humanDesign/BodyGraph'
import PlanetIcon from '@/components/humanDesign/PlanetIcon'
import { CENTER_INFO, CHANNEL_DEFS, calculateCentersAndChannels } from '@/lib/humanDesign'
import type { HdResult } from '@/lib/buildAiPrompt'
import { buildTransitAiPrompt } from '@/lib/buildAiPrompt'
import {
  buildCombinedActivations,
  type TransitResult,
} from '@/lib/computeTransit'
import { toActivations } from '@/lib/humanDesign'
import type { CenterName, Activations, ChannelDef } from '@/lib/humanDesign/types'
import { downloadChart } from '@/lib/downloadChart'
import { saveTransitChart } from '@/lib/saveChart'
import toast from 'react-hot-toast'

type ViewMode = 'separate' | 'combined'

const CENTER_ORDER: CenterName[] = [
  'head', 'ajna', 'throat', 'g', 'ego', 'sacral', 'solarPlexus', 'spleen', 'root',
]

const CENTER_ZH: Record<CenterName, string> = {
  head:        '頭腦',
  ajna:        '邏輯',
  throat:      '喉嚨',
  g:           'G',
  ego:         '意志力',
  sacral:      '薦骨',
  solarPlexus: '情緒',
  spleen:      '脾',
  root:        '根部',
}

const PLANET_ROLES: Record<string, string> = {
  太陽:   '整體能量主題',
  地球:   '穩定扎根',
  月亮:   '情緒底色',
  北交點: '環境氛圍',
  南交點: '環境氛圍',
  水星:   '溝通與思考',
  金星:   '關注與價值',
  火星:   '行動與衝突',
  木星:   '擴張背景',
  土星:   '結構背景',
  天王星: '變革背景',
  海王星: '靈感背景',
  冥王星: '蛻變背景',
}

const buildTransitActivations = (transit: TransitResult): Activations => {
  const out: Activations = {}
  for (const g of transit.allGates) {
    out[g] = { c: true, u: false }
  }
  return out
}

const formatTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ── Shared UI ───────────────────────────────────────────────────────────────

const SectionHeader = ({ children }: { children: ReactNode }) => (
  <h3 className="font-mono text-[12px] md:text-base tracking-[0.18em] uppercase text-(--ink-soft) mb-3 pb-1.5 border-b border-dotted border-(--ink)/20">
    {children}
  </h3>
)

// ── 大螢幕合併圖兩側閘門面板（寬度足夠時才顯示，見 .composite-person-panel 的 RWD 規則）──

const PersonalGatePanel = ({ personal }: { personal: HdResult }) => (
  <div className="composite-person-panel transit-gate-panel--personal">
    <div className="composite-person-label">個人圖</div>
    <div className="composite-planet-rows">
      {personal.planets.map(p => (
        <div key={p.planetName} className="transit-planet-row">
          <span className="transit-gate transit-gate--design">{p.red.full}</span>
          <PlanetIcon name={p.planetName} className="composite-planet-icon" />
          <span className="transit-gate transit-gate--personality">{p.black.full}</span>
        </div>
      ))}
    </div>
  </div>
)

const TransitGatePanel = ({ transit }: { transit: TransitResult }) => (
  <div className="composite-person-panel transit-gate-panel--transit">
    <div className="composite-person-label">流日</div>
    <div className="composite-planet-rows">
      {transit.planets.map(p => (
        <div key={p.planetName} className="transit-planet-row">
          <PlanetIcon name={p.planetName} className="composite-planet-icon" />
          <span className="transit-gate transit-gate--transit">{p.full}</span>
        </div>
      ))}
    </div>
  </div>
)

// ── 中心 ────────────────────────────────────────────────────────────────────

const CentersSection = ({ personal, transit, combinedCenterIds }: { personal: HdResult; transit: TransitResult; combinedCenterIds: Set<CenterName> }) => {
  const openActivatedCenters = CENTER_ORDER.filter(
    cId => !personal.definedCenterIds.has(cId) && combinedCenterIds.has(cId),
  )

  return (
    <section>
      <SectionHeader>中心</SectionHeader>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {CENTER_ORDER.map(cId => {
          const inPersonal = personal.definedCenterIds.has(cId)
          const openActivated = !inPersonal && combinedCenterIds.has(cId)

          return (
            <div
              key={cId}
              className={[
                'flex flex-col gap-1.5 px-3 py-2.5 border',
                openActivated
                  ? 'border-(--transit)/50 bg-(--transit)/5'
                  : inPersonal
                  ? 'border-(--ink)/40 bg-(--ink)/5'
                  : 'border-(--ink)/15',
              ].join(' ')}
            >
              <span className="font-mono text-[14px] md:text-base tracking-[0.08em] text-(--ink)">
                {CENTER_ZH[cId]}
              </span>
              <div className="flex gap-1 flex-wrap">
                {inPersonal && (
                  <span className="font-mono text-[12px] md:text-sm tracking-[0.05em] uppercase bg-(--ink) text-(--paper) px-1.5 py-0.5">
                    個人
                  </span>
                )}
                {!inPersonal && combinedCenterIds.has(cId) && (
                  <span className="font-mono text-[12px] md:text-sm tracking-[0.05em] uppercase bg-(--transit) text-white px-1.5 py-0.5">
                    流日
                  </span>
                )}
                {!inPersonal && !combinedCenterIds.has(cId) && (
                  <span className="font-mono text-[12px] md:text-sm tracking-[0.05em] uppercase text-(--ink)/40">
                    開放
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {openActivatedCenters.length > 0 && (
        <div className="px-4 py-3 border border-(--transit)/30 bg-(--transit)/4 mt-3">
          <p className="font-mono text-[12px] md:text-base font-semibold text-(--transit) tracking-[0.06em] mb-1">
            今日被流日暫時啟動：{openActivatedCenters.map(cId => CENTER_INFO[cId].name).join('、')}
          </p>
          <p className="font-mono text-[12px] md:text-base leading-relaxed text-(--ink-soft)">
            這些原本開放的中心今天借到了「限定體驗卡」。可以善用這股暫時的能量去執行、創作或衝刺，但不建議在這些地方做出長期承諾——能量退去後，條件會不同。
          </p>
        </div>
      )}
    </section>
  )
}

// ── 閘門 ────────────────────────────────────────────────────────────────────

const GateRow = ({ gate, planets, shared }: { gate: number; planets: string[]; shared: boolean }) => (
  <div className={[
    'flex items-start gap-2 px-3 py-2 border',
    shared ? 'border-(--ink)/25 bg-(--ink)/3' : 'border-(--ink)/10',
  ].join(' ')}>
    <span className={`font-mono text-[14px] md:text-base font-semibold w-8 shrink-0 mt-0.5 ${shared ? 'text-(--ink)' : 'text-(--transit)'}`}>
      {gate}
    </span>
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      {planets.map(p => (
        <div key={p} className="flex items-center gap-1.5">
          <span className="font-mono text-[13px] md:text-sm tracking-[0.06em] text-(--ink-soft) border border-(--ink)/15 px-1.5 py-0.5 whitespace-nowrap">
            {p}
          </span>
          {PLANET_ROLES[p] && (
            <span className="font-mono text-[13px] md:text-sm text-(--ink-soft)/70 tracking-[0.04em]">
              {PLANET_ROLES[p]}
            </span>
          )}
        </div>
      ))}
    </div>
    {shared && (
      <span className="font-mono text-[12px] md:text-sm tracking-[0.04em] text-(--ink)/50 shrink-0 mt-0.5">共有</span>
    )}
  </div>
)

const GatesSection = ({ personal, transit }: { personal: HdResult; transit: TransitResult }) => {
  const gatePlanets = useMemo(() => {
    const map = new Map<number, string[]>()
    for (const p of transit.planets) {
      const arr = map.get(p.gate) ?? []
      arr.push(p.planetName)
      map.set(p.gate, arr)
    }
    return map
  }, [transit])

  const sharedGates = useMemo(
    () => [...transit.allGates].filter(g => personal.allGates.has(g)).sort((a, b) => a - b),
    [personal, transit],
  )
  const transitOnlyGates = useMemo(
    () => [...transit.allGates].filter(g => !personal.allGates.has(g)).sort((a, b) => a - b),
    [personal, transit],
  )

  return (
    <section>
      <SectionHeader>閘門</SectionHeader>
      <div className="flex flex-col gap-4">
        {sharedGates.length > 0 && (
          <div>
            <p className="font-mono text-[11px] md:text-sm tracking-[0.12em] uppercase text-(--ink-soft) mb-2">
              個人圖 & 流日共有
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {sharedGates.map(g => (
                <GateRow key={g} gate={g} planets={gatePlanets.get(g) ?? []} shared />
              ))}
            </div>
          </div>
        )}
        {transitOnlyGates.length > 0 && (
          <div>
            <p className="font-mono text-[11px] md:text-sm tracking-[0.12em] uppercase text-(--ink-soft) mb-2">
              今日流日閘門
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {transitOnlyGates.map(g => (
                <GateRow key={g} gate={g} planets={gatePlanets.get(g) ?? []} shared={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ── 通道 ────────────────────────────────────────────────────────────────────

const ChannelsSection = ({ personal, transit }: { personal: HdResult; transit: TransitResult }) => {
  const newChannels = useMemo(
    () => transit.definedChannels.filter(ch =>
      !personal.allGates.has(ch.gateA) &&
      !personal.allGates.has(ch.gateB) &&
      !personal.definedChannels.some(pc => pc.id === ch.id)
    ),
    [personal, transit],
  )

  const completingChannels = useMemo(() => {
    const results: Array<{ ch: ChannelDef; personalGate: number; transitGate: number }> = []
    for (const ch of CHANNEL_DEFS) {
      if (personal.definedChannels.some(pc => pc.id === ch.id)) continue
      const aInPersonal = personal.allGates.has(ch.gateA)
      const bInPersonal = personal.allGates.has(ch.gateB)
      const aInTransit = transit.allGates.has(ch.gateA)
      const bInTransit = transit.allGates.has(ch.gateB)
      if (aInPersonal && !bInPersonal && bInTransit) {
        results.push({ ch, personalGate: ch.gateA, transitGate: ch.gateB })
      } else if (bInPersonal && !aInPersonal && aInTransit) {
        results.push({ ch, personalGate: ch.gateB, transitGate: ch.gateA })
      }
    }
    return results
  }, [personal, transit])

  const hasAny = newChannels.length > 0 || completingChannels.length > 0

  return (
    <section>
      <SectionHeader>通道</SectionHeader>
      {!hasAny ? (
        <p className="font-mono text-[12px] md:text-base tracking-[0.06em] text-(--ink-soft) py-2">
          今日流日未形成額外通道
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {newChannels.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[11px] md:text-sm tracking-[0.12em] uppercase text-(--ink-soft)">
                全新通道（流日帶來）
              </p>
              <div className="flex flex-col gap-1.5">
                {newChannels.map(ch => (
                  <div
                    key={ch.id}
                    className="flex items-center gap-3 px-4 py-2.5 border border-(--transit)/30 bg-(--transit)/4"
                  >
                    <span className="font-mono text-[14px] md:text-base font-semibold text-(--transit)">{ch.id}</span>
                    <span className="font-mono text-[12px] md:text-sm text-(--ink-soft)">閘門 {ch.gateA} · {ch.gateB}</span>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[12px] md:text-base leading-relaxed text-(--ink-soft)">
                這些是今日流日帶給你的限定天賦，可以借來執行任務、享受那股靈感或動力。只是記得，這件衣服明天會換掉，不要在它還穿著的時候做需要長久負責的承諾。
              </p>
            </div>
          )}
          {completingChannels.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[11px] md:text-sm tracking-[0.12em] uppercase text-(--ink-soft)">
                補完通道（個人 + 流日）
              </p>
              <div className="flex flex-col gap-1.5">
                {completingChannels.map(({ ch, personalGate, transitGate }) => (
                  <div
                    key={ch.id}
                    className="flex items-center gap-3 px-4 py-2.5 border border-(--ink)/20"
                  >
                    <span className="font-mono text-[14px] md:text-base font-semibold text-(--ink)">{ch.id}</span>
                    <span className="font-mono text-[12px] md:text-sm text-(--ink-soft)">
                      <span className="text-(--ink) font-semibold">{personalGate}</span>（個人）
                      {' + '}
                      <span className="text-(--transit) font-semibold">{transitGate}</span>（流日）
                    </span>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[12px] md:text-base leading-relaxed text-(--ink-soft)">
                你本身擁有一半，今天流日借你補齊了另一半，讓你短暫體驗完整通道的感覺。這股能量來了可以好好享用，能量退潮後回到原本的節奏就好。
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────

interface TransitViewProps {
  personal: HdResult
  transit: TransitResult
  onRefresh: () => void
  refreshing: boolean
  onSaved?: () => void
  /** 個人出生資料，儲存流日圖時需要一併保留，之後才能正確重新顯示（而非誤讀為個人圖）。 */
  personalBirth?: { date: string; time: string; city: string; timezone: string }
  /** 檢視已儲存的歷史流日圖快照時使用：隱藏「更新流日」與「儲存流日圖」按鈕。 */
  readOnly?: boolean
}

export default function TransitView({ personal, transit, onRefresh, refreshing, onSaved, personalBirth, readOnly = false }: TransitViewProps) {
  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()
  const printAreaRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('combined')
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const personalActivations = useMemo(() => toActivations(personal.planets), [personal])
  const transitActivations = useMemo(() => buildTransitActivations(transit), [transit])
  const combinedActivations = useMemo(() => buildCombinedActivations(personal, transit), [personal, transit])
  const combinedCenterIds = useMemo(() => {
    const mergedGates = new Set([...personal.allGates, ...transit.allGates])
    return calculateCentersAndChannels(mergedGates).definedCenterIds
  }, [personal.allGates, transit.allGates])

  const handleDownload = useCallback(async () => {
    const el = printAreaRef.current
    if (!el) return
    setDownloading(true)
    window.umami?.track('transit-download')
    try {
      await downloadChart(el)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '下載失敗，請稍後再試')
    } finally {
      setDownloading(false)
    }
  }, [])

  const handleCopyPrompt = useCallback(() => {
    window.umami?.track('transit-copy-prompt')
    navigator.clipboard.writeText(buildTransitAiPrompt(personal, transit)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => toast.error('複製失敗，請稍後再試'))
  }, [personal, transit])

  const handleSave = useCallback(async () => {
    if (!personalBirth) {
      toast.error('缺少個人出生資料，無法儲存流日圖')
      return
    }
    setSaving(true)
    window.umami?.track('transit-save')
    try {
      await saveTransitChart({
        personal,
        personalBirthDate: personalBirth.date,
        personalBirthTime: personalBirth.time,
        personalBirthCity: personalBirth.city,
        personalTimezone:  personalBirth.timezone,
        transitComputedAt: transit.computedAt,
        transitAllGates: transit.allGates,
        transitDefinedCenterIds: transit.definedCenterIds,
        transitDefinedChannels: transit.definedChannels,
        transitPlanets: transit.planets,
      })
      toast.success('流日圖已儲存')
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '儲存失敗，請稍後再試')
    } finally {
      setSaving(false)
    }
  }, [personal, personalBirth, transit, onSaved])

  return (
    <div ref={printAreaRef} className="flex flex-col gap-6">

      {/* Header: time + refresh */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="font-mono text-[12px] md:text-base tracking-[0.1em] text-(--ink-soft)">
          流日時間：{formatTime(transit.computedAt)}（台北時間）
        </p>
        {!readOnly && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink) border border-(--ink) px-3 py-1 cursor-pointer transition-colors duration-[120ms] hover:bg-(--ink) hover:text-(--paper) disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {refreshing ? '更新中…' : '↻ 更新流日'}
          </button>
        )}
      </div>

      {/* View mode toggle */}
      <div className="flex border-b border-(--ink)">
        {(['separate', 'combined'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={[
              'font-mono text-[12px] md:text-base tracking-[0.14em] uppercase px-5 py-2 border-b-2 transition-colors duration-[120ms] cursor-pointer bg-transparent',
              viewMode === mode
                ? 'border-b-(--ink) text-(--ink) font-semibold'
                : 'border-b-transparent text-(--ink-soft) hover:text-(--ink)',
            ].join(' ')}
          >
            {mode === 'separate' ? '分開顯示' : '合併顯示'}
          </button>
        ))}
      </div>

      {/* Legend */}
      {viewMode === 'combined' && (
        <div className="flex flex-wrap gap-4 items-center px-1">
          <span className="font-mono text-[12px] md:text-base text-(--ink-soft) uppercase tracking-[0.1em]">圖例</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-(--ink)" />
            <span className="font-mono text-[12px] md:text-base text-(--ink)">個人圖</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-(--transit)" />
            <span className="font-mono text-[12px] md:text-base text-(--ink)">流日</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: 'repeating-linear-gradient(45deg, var(--ink) 0 3px, var(--transit) 3px 6px)' }}
            />
            <span className="font-mono text-[12px] md:text-base text-(--ink)">共同激活</span>
          </div>
        </div>
      )}

      {/* Charts area */}
      {viewMode === 'separate' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[12px] md:text-base tracking-[0.14em] uppercase text-(--ink-soft) text-center">
              個人圖
            </p>
            <div className="hd-chart-frame">
              <span className="hd-chart-corner tl" />
              <span className="hd-chart-corner tr" />
              <span className="hd-chart-corner bl" />
              <span className="hd-chart-corner br" />
              <BodyGraph
                onSelect={() => {}}
                showGates
                showAnnotations={false}
                showFace
                showSilhouette
                activations={personalActivations}
                definedCenterIds={personal.definedCenterIds}
                gateScale={0.85}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[12px] md:text-base tracking-[0.14em] uppercase text-(--ink-soft) text-center">
              今日流日圖
            </p>
            <div className="hd-chart-frame">
              <span className="hd-chart-corner tl" />
              <span className="hd-chart-corner tr" />
              <span className="hd-chart-corner bl" />
              <span className="hd-chart-corner br" />
              <BodyGraph
                onSelect={() => {}}
                showGates
                showAnnotations={false}
                showFace
                showSilhouette
                activations={transitActivations}
                definedCenterIds={transit.definedCenterIds}
                gateScale={0.85}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="composite-chart-row">
          <PersonalGatePanel personal={personal} />

          <div className="hd-col-mid max-w-2xl mx-auto w-full">
            <div className="hd-chart-frame">
              <span className="hd-chart-corner tl" />
              <span className="hd-chart-corner tr" />
              <span className="hd-chart-corner bl" />
              <span className="hd-chart-corner br" />
              <BodyGraph
                onSelect={() => {}}
                showGates
                showAnnotations
                showFace
                showSilhouette
                activations={combinedActivations}
                definedCenterIds={combinedCenterIds}
              />
            </div>
          </div>

          <TransitGatePanel transit={transit} />
        </div>
      )}

      {/* Three result sections */}
      <CentersSection personal={personal} transit={transit} combinedCenterIds={combinedCenterIds} />
      <GatesSection personal={personal} transit={transit} />
      <ChannelsSection personal={personal} transit={transit} />

      {/* Educational note */}
      <div className="border border-(--ink)/20 bg-(--paper-deep) px-5 py-4">
        <p className="font-mono text-[12px] md:text-base leading-relaxed text-(--ink-soft)">
          <span className="font-semibold text-(--ink)">關於流日的提醒：</span>
          把流日想像成宇宙每天發給你的「限定體驗卡」。被激活的能量雖然不是你本來的配備，卻是可以借來用的暫時天賦——拿來執行、創作、或體驗平時沒有的敏銳度都很好。只要掌握一個原則：盡情享受過程，但不要在被流日定義的地方做重大的長期承諾。始終以自己的內在權威做最終決定。
        </p>
      </div>

      {/* Action buttons */}
      <div className="hd-print-hide flex gap-3 flex-wrap items-center">
        <button
          onClick={isSignedIn ? handleDownload : () => openSignIn()}
          disabled={isSignedIn ? downloading : false}
          className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--paper) bg-(--ink) border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--crimson) hover:border-(--crimson) disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSignedIn ? (downloading ? '下載中…' : '↓ 下載流日分析') : '↓ 登入後下載'}
        </button>
        <button
          onClick={isSignedIn ? handleCopyPrompt : () => openSignIn()}
          className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink) bg-transparent border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--ink) hover:text-(--paper)"
        >
          {isSignedIn ? (copied ? '✓ 已複製！' : '⎘ 複製流日提示詞') : '⎘ 登入後複製提示詞'}
        </button>
        {!readOnly && (
          <button
            onClick={isSignedIn ? handleSave : () => openSignIn()}
            disabled={isSignedIn ? saving : false}
            className="font-mono text-[12px] md:text-base tracking-[0.12em] uppercase text-(--ink) bg-transparent border border-(--ink) px-5 py-2.5 cursor-pointer transition-colors duration-120 hover:bg-(--ink) hover:text-(--paper) disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSignedIn ? (saving ? '儲存中…' : '⊕ 儲存流日圖') : '⊕ 登入後儲存'}
          </button>
        )}
      </div>

    </div>
  )
}
