'use client'

import { useEffect, useState } from 'react'
import { fmtGate } from '@/utils/format'
import { HD_GATES, HD_CENTERS_INFO, HD_CHANNELS, INTEGRATION_PAIRS, type ChartChannel } from '@/shared/humanDesign/hd-chart-data'
import type { SelectionPayload } from './BodyGraph'
import { HD_TYPE_CONTENT, HD_PROFILE_CONTENT, HD_AUTHORITY_CONTENT, HD_DEFINITION_CONTENT } from '@/shared/humanDesign/hd-summary-data'
import type { GateCrossData } from '@/shared/humanDesign/hd-cross-data'

interface DetailDrawerProps {
  selection: SelectionPayload | null
  onClose: () => void
  onJumpToGate: (num: number) => void
}

export default function DetailDrawer({ selection, onClose, onJumpToGate }: DetailDrawerProps) {
  const open = !!selection
  const [crossContent, setCrossContent] = useState<Record<number, GateCrossData> | null>(null)

  useEffect(() => {
    if (selection?.kind !== 'cross' || crossContent) return
    let cancelled = false
    import('@/shared/humanDesign/hd-cross-data').then(m => {
      if (!cancelled) setCrossContent(m.HD_CROSS_CONTENT)
    })
    return () => { cancelled = true }
  }, [selection, crossContent])

  const jumpToGate = (num: number) => {
    window.umami?.track('detail-drawer-gate-jump', { gate: num })
    onJumpToGate(num)
  }
  const pick = <T,>(obj: { zh: T } | T): T => {
    if (typeof obj === 'object' && obj !== null && 'zh' in obj) return (obj as { zh: T }).zh
    return obj as T
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  let kicker = ''
  let title = ''
  let sub = ''
  let body: React.ReactNode = null

  if (selection) {
    const { kind, data } = selection

    if (kind === 'center') {
      const { center: d, isDefined } = data as { center: typeof HD_CENTERS_INFO[string]; isDefined: boolean }
      kicker = `中心 · ${pick(d.name).toUpperCase()}`
      title = pick(d.name)
      sub = pick(d.type)
      body = (
        <>
          <p className="lead">{pick(d.summary)}</p>
          <h4>說明</h4>
          <p>{pick(d.description)}</p>
          <div className="hd-center-states">
            <div className={`hd-center-state${isDefined === true ? ' hd-center-state--active' : ''}`}>
              <div className="hd-center-state-label">已定義中心</div>
              <p>{pick(d.definedContent)}</p>
            </div>
            <div className={`hd-center-state${isDefined === false ? ' hd-center-state--active' : ''}`}>
              <div className="hd-center-state-label">開放中心</div>
              <p>{pick(d.openContent)}</p>
            </div>
          </div>
          <h4>關鍵字</h4>
          <div className="hd-tag-row">
            {pick(d.keywords).map(k => <span className="hd-tag" key={k}>{k}</span>)}
          </div>
          <h4>閘門</h4>
          <div className="hd-gates-list">
            {d.gates.map(g => (
              <button key={g} className="hd-gate-chip" onClick={() => jumpToGate(g)}>{g}</button>
            ))}
          </div>
        </>
      )
    } else if (kind === 'gate') {
      const d = data as typeof HD_GATES[number] & { number: number }
      const centerInfo = HD_CENTERS_INFO[d.center]
      kicker = `閘門 № ${fmtGate(d.number)}`
      title = pick(d.name)
      sub = `${pick(d.name)} · 位於 ${centerInfo ? pick(centerInfo.name) : d.center}`
      body = (
        <>
          <p className="lead">{pick(d.desc)}</p>
          <h4>位於</h4>
          <p>
            <strong style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18 }}>
              {centerInfo ? pick(centerInfo.name) : d.center}
            </strong>
            {centerInfo ? ` · ${pick(centerInfo.type)}` : ''}
          </p>
          <h4>參考</h4>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            GATE.{fmtGate(d.number)} · {d.name.en}
          </p>
        </>
      )
    } else if (kind === 'channel') {
      const d = data as ChartChannel
      const fromG = HD_GATES[d.from]
      const toG = HD_GATES[d.to]
      kicker = `通道 · ${d.from}–${d.to}`
      title = pick(d.name)
      sub = pick(d.name)
      body = (
        <>
          <p className="lead">{pick(d.desc)}</p>
          <h4>連接</h4>
          <p style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            <span
              onClick={() => jumpToGate(d.from)}
              style={{ cursor: 'pointer', borderBottom: '1px solid var(--ink)' }}
            >
              {fromG ? pick(fromG.name) : `閘門 ${d.from}`} ({d.from})
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal', color: 'var(--ink-soft)' }}>⟷</span>
            <span
              onClick={() => jumpToGate(d.to)}
              style={{ cursor: 'pointer', borderBottom: '1px solid var(--ink)' }}
            >
              {toG ? pick(toG.name) : `閘門 ${d.to}`} ({d.to})
            </span>
          </p>
          <h4>參考</h4>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            CHANNEL.{fmtGate(d.from)}–{fmtGate(d.to)} · {d.name.en.toUpperCase()}
          </p>
        </>
      )
    } else if (kind === 'integration') {
      // 六條整合通道皆已存在於 HD_CHANNELS，直接依 INTEGRATION_PAIRS 篩選，
      // 不重複維護一份名稱/說明；20-57 是複合圖形的主幹（trunk），與其餘四條
      // 支線（10-20/10-34/10-57/20-34/34-57）並列顯示，不特別區分。
      const integrationChannels = Array.from(INTEGRATION_PAIRS)
        .map(pairId => HD_CHANNELS.find(ch => `${ch.from}-${ch.to}` === pairId))
        .filter((ch): ch is ChartChannel => !!ch)
      kicker = '整合'
      title = '整合通道'
      sub = `${integrationChannels.length} 條整合通道`
      body = (
        <>
          <p className="lead">這些通道代表你整體的整合力量與表達方式。</p>
          <h4>{integrationChannels.length} 條主要通道</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {integrationChannels.map(ch => (
              <div key={ch.id} className="hd-ch-card">
                <div className="hd-ch-card-head">
                  <span className="hd-ch-card-title">{pick(ch.name)}</span>
                  <span className="hd-ch-card-ref">CH.{ch.from}—{ch.to}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>{pick(ch.desc)}</p>
              </div>
            ))}
          </div>
          <h4>涉及閘門</h4>
          <div className="hd-gates-list">
            {[10, 20, 34, 57].map(g => (
              <button key={g} className="hd-gate-chip" onClick={() => jumpToGate(g)}>{g}</button>
            ))}
          </div>
          <h4>備註</h4>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            這些整合通道會影響你的整體節奏與表達方式。
          </p>
        </>
      )
    } else if (kind === 'type') {
      const { typeKey } = data as { typeKey: string }
      const d = HD_TYPE_CONTENT[typeKey]
      if (d) {
        kicker = '類型'
        title = d.title
        sub = d.subtitle ?? ''
        body = (
          <>
            <p className="lead">{d.intro}</p>
            {d.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            {d.highlights && (
              <>
                <h4>關鍵特質</h4>
                <div className="hd-center-states">
                  {d.highlights.map(h => (
                    <div key={h.label} className="hd-center-state hd-center-state--active">
                      <div className="hd-center-state-label">{h.label}</div>
                      <p>{h.text}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )
      }
    } else if (kind === 'profile') {
      const { profile } = data as { profile: string }
      const d = HD_PROFILE_CONTENT[profile]
      if (d) {
        kicker = '配置'
        title = d.title
        sub = d.subtitle ?? ''
        body = (
          <>
            <p className="lead">{d.intro}</p>
            {d.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            {d.highlights && d.highlights.map(h => (
              <div key={h.label} className="hd-center-state hd-center-state--active" style={{ marginTop: 12 }}>
                <div className="hd-center-state-label">{h.label}</div>
                <p>{h.text}</p>
              </div>
            ))}
          </>
        )
      }
    } else if (kind === 'authority') {
      const { authorityKey } = data as { authorityKey: string }
      const d = HD_AUTHORITY_CONTENT[authorityKey]
      if (d) {
        kicker = '權威'
        title = d.title
        sub = d.subtitle ?? ''
        body = (
          <>
            <p className="lead">{d.intro}</p>
            {d.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            {d.highlights && d.highlights.map(h => (
              <div key={h.label} className="hd-center-state hd-center-state--active" style={{ marginTop: 12 }}>
                <div className="hd-center-state-label">{h.label}</div>
                <p>{h.text}</p>
              </div>
            ))}
          </>
        )
      }
    } else if (kind === 'definition') {
      const { definitionRaw } = data as { definitionRaw: string }
      const d = HD_DEFINITION_CONTENT[definitionRaw]
      if (d) {
        kicker = '定義'
        title = d.title
        sub = d.subtitle ?? ''
        body = (
          <>
            <p className="lead">{d.intro}</p>
            {d.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            {d.highlights && d.highlights.map(h => (
              <div key={h.label} className="hd-center-state hd-center-state--active" style={{ marginTop: 12 }}>
                <div className="hd-center-state-label">{h.label}</div>
                <p>{h.text}</p>
              </div>
            ))}
          </>
        )
      }
    } else if (kind === 'cross') {
      const { crossType, sunGate, crossBaseName, variant, gatesLabel } = data as {
        crossType: string
        sunGate: number
        crossBaseName: string
        variant: number
        gatesLabel: string
      }
      const gateContent = crossContent?.[sunGate]
      const crossTypeMap: Record<string, { label: string; key: 'RAC' | 'JC' | 'LAC' }> = {
        RAC: { label: '右角度交叉', key: 'RAC' },
        JC:  { label: '並列交叉',   key: 'JC'  },
        LAC: { label: '左角度交叉', key: 'LAC' },
      }
      const ctInfo = crossTypeMap[crossType] ?? { label: crossType, key: 'RAC' as const }
      kicker = '交叉'
      title = `${ctInfo.label}之${crossBaseName}${variant}`
      sub = gatesLabel

      if (!crossContent) {
        body = (
          <>
            <p className="lead">載入中…</p>
            <h4>閘門組合</h4>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-soft)' }}>{gatesLabel}</p>
          </>
        )
      } else if (gateContent) {
        const entry = gateContent[ctInfo.key]
        body = (
          <>
            {gateContent.intro && <p className="lead">{gateContent.intro}</p>}
            {entry ? (
              <>
                <h4>{ctInfo.label}・{entry.title}</h4>
                {entry.body.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
              </>
            ) : (
              <p style={{ color: 'var(--ink-soft)' }}>沒有找到對應的交叉閘門內容。</p>
            )}
            <h4>閘門組合</h4>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-soft)' }}>{gatesLabel}</p>
          </>
        )
      } else {
        body = (
          <>
            <p className="lead">沒有找到對應的交叉內容。</p>
            <h4>閘門組合</h4>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-soft)' }}>{gatesLabel}</p>
          </>
        )
      }
    }
  }

  return (
    <>
      <div
        className={`hd-drawer-scrim${open ? ' open' : ''}`}
        onClick={onClose}
      />
      <aside className={`hd-drawer${open ? ' open' : ''}`} role="dialog" aria-modal="true">
        {selection && (
          <>
            <header className="hd-drawer-head">
              <div>
                <div className="hd-drawer-kicker">{kicker}</div>
                <h2 className="hd-drawer-title">{title}</h2>
                <div className="hd-drawer-sub">{sub}</div>
              </div>
              <button
                className="hd-drawer-close"
                onClick={() => {
                  window.umami?.track('detail-drawer-close')
                  onClose()
                }}
                aria-label="關閉"
              >✕</button>
            </header>
            <div className="hd-drawer-body">{body}</div>
          </>
        )}
      </aside>
    </>
  )
}
