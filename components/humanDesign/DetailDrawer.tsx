'use client'

import { useEffect, useState } from 'react'
import { fmtGate } from '@/utils/format'
import { HD_GATES, HD_CENTERS_INFO, type ChartChannel } from '@/shared/humanDesign/hd-chart-data'
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
              style={{ cursor: 'pointer', borderBottom: '1px solid #2b1f14' }}
            >
              {fromG ? pick(fromG.name) : `閘門 ${d.from}`} ({d.from})
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal', color: '#6b5a44' }}>⟷</span>
            <span
              onClick={() => jumpToGate(d.to)}
              style={{ cursor: 'pointer', borderBottom: '1px solid #2b1f14' }}
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
      const integrationList = [
        { a: 10, b: 20, name: { zh: '覺醒通道',   en: 'Awakening'     }, desc: { zh: '你對「真不真實」有一種近乎本能的敏感，要求自己活得誠實有原則，這種處世態度讓身邊的人不自覺開始思考「我是不是也可以更做自己一點」。你只在乎「當下」，這種活在當下的能量是你給周圍人最大的禮物之一。', en: 'Awakening to self — authentic expression in the now.' } },
        { a: 10, b: 34, name: { zh: '探索通道',   en: 'Exploration'   }, desc: { zh: '你就是要走自己的路，當你按照自己的感覺和直覺行動，你會感覺對了、有力量。這條通道有個特別能量：當你真的活出自己的樣子，你身邊的人也會被感染，開始有勇氣去做自己。', en: "Acting in accordance with one's own convictions." } },
        { a: 10, b: 57, name: { zh: '生存力通道', en: 'Perfected Form' }, desc: { zh: '你有一種很難用邏輯解釋的化險為夷能力，脾中心有一套超靈敏的生存雷達，在危險靠近之前就悄悄提醒你。你的直覺靠「聽起來對不對」來判斷，前提是你要願意相信它。', en: "Intuition of one's own survival and self-expression." } },
        { a: 20, b: 34, name: { zh: '忙碌通道',   en: 'Charisma'      }, desc: { zh: '當你找到一件真心喜歡的事，你會整個人燃起來，精力充沛停不下來，旁邊的人光看著你就會被帶動。但不是每一件事都值得你去忙——只為你愛的事忙，才是這條通道最美的狀態。', en: 'The present-moment exhibitor. The power of being busy in the now.' } },
        { a: 34, b: 57, name: { zh: '力量通道',   en: 'Power'         }, desc: { zh: '這條通道讓你天生精力充沛，在關鍵時刻反應特別快特別準，在危機處理上特別厲害。你很自然地想替人療傷解決問題，但要先照顧好自己才能照顧好別人，選擇值得你投入力量的人和事。', en: 'Archetypal existence — perfect survival intuition.' } },
      ]
      kicker = '整合'
      title = '整合通道'
      sub = '四條整合通道'
      body = (
        <>
          <p className="lead">這些通道代表你整體的整合力量與表達方式。</p>
          <h4>四條主要通道</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {integrationList.map(ch => (
              <div key={`${ch.a}-${ch.b}`} className="hd-ch-card">
                <div className="hd-ch-card-head">
                  <span className="hd-ch-card-title">{pick(ch.name)}</span>
                  <span className="hd-ch-card-ref">CH.{ch.a}—{ch.b}</span>
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
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#6b5a44', lineHeight: 1.6 }}>
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
                    <div key={h.label} className="hd-center-state">
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
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6b5a44' }}>{gatesLabel}</p>
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
              <p style={{ color: '#6b5a44' }}>沒有找到對應的交叉閘門內容。</p>
            )}
            <h4>閘門組合</h4>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6b5a44' }}>{gatesLabel}</p>
          </>
        )
      } else {
        body = (
          <>
            <p className="lead">沒有找到對應的交叉內容。</p>
            <h4>閘門組合</h4>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6b5a44' }}>{gatesLabel}</p>
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
