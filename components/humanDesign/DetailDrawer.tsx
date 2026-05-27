'use client'

import { useEffect } from 'react'
import { HD_GATES, HD_CENTERS_INFO, type ChartChannel } from './hd-chart-data'
import type { SelectionPayload } from './BodyGraph'

interface DetailDrawerProps {
  selection: SelectionPayload | null
  onClose: () => void
  onJumpToGate: (num: number) => void
}

export default function DetailDrawer({ selection, onClose, onJumpToGate }: DetailDrawerProps) {
  const open = !!selection

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  let kicker = ''
  let title = ''
  let sub = ''
  let body: React.ReactNode = null

  if (selection) {
    const { kind, data } = selection

    if (kind === 'center') {
      const d = data as typeof HD_CENTERS_INFO[string]
      kicker = `CENTER · ${d.en.toUpperCase()}`
      title = d.name
      sub = d.type
      body = (
        <>
          <p className="lead">{d.summary}</p>
          <h4>釋義 / Description</h4>
          <p>{d.description}</p>
          <h4>關鍵詞 / Keywords</h4>
          <div className="hd-tag-row">
            {d.keywords.map(k => <span className="hd-tag" key={k}>{k}</span>)}
          </div>
          <h4>所屬閘門 / Gates</h4>
          <div className="hd-gates-list">
            {d.gates.map(g => (
              <button key={g} className="hd-gate-chip" onClick={() => onJumpToGate(g)}>{g}</button>
            ))}
          </div>
        </>
      )
    } else if (kind === 'gate') {
      const d = data as { name: string; en: string; center: string; desc: string; number: number }
      const centerInfo = HD_CENTERS_INFO[d.center]
      kicker = `GATE № ${String(d.number).padStart(2, '0')}`
      title = d.name
      sub = `${d.en} · 屬於 ${centerInfo ? centerInfo.name : d.center}`
      body = (
        <>
          <p className="lead">{d.desc}</p>
          <h4>所在中心 / Located In</h4>
          <p>
            <strong style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18 }}>
              {centerInfo ? centerInfo.name : d.center}
            </strong>
            {centerInfo ? ` · ${centerInfo.type}` : ''}
          </p>
          <h4>編號 / Reference</h4>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            GATE.{String(d.number).padStart(2, '0')} · {d.en}
          </p>
        </>
      )
    } else if (kind === 'channel') {
      const d = data as ChartChannel
      const fromG = HD_GATES[d.from]
      const toG = HD_GATES[d.to]
      kicker = `CHANNEL · ${d.from}–${d.to}`
      title = d.name
      sub = d.en
      body = (
        <>
          <p className="lead">{d.desc}</p>
          <h4>連接 / Connects</h4>
          <p style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            <span
              onClick={() => onJumpToGate(d.from)}
              style={{ cursor: 'pointer', borderBottom: '1px solid #2b1f14' }}
            >
              {fromG ? fromG.name : `Gate ${d.from}`} ({d.from})
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal', color: '#6b5a44' }}>⟷</span>
            <span
              onClick={() => onJumpToGate(d.to)}
              style={{ cursor: 'pointer', borderBottom: '1px solid #2b1f14' }}
            >
              {toG ? toG.name : `Gate ${d.to}`} ({d.to})
            </span>
          </p>
          <h4>編號 / Reference</h4>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            CHANNEL.{String(d.from).padStart(2, '0')}–{String(d.to).padStart(2, '0')} · {d.en.toUpperCase()}
          </p>
        </>
      )
    } else if (kind === 'integration') {
      const integrationList = [
        { a: 34, b: 10, name: '探索通道', en: 'Exploration',   desc: '力量到形式 — 依循信念而行動的能量。', cn2: '力量到形式' },
        { a: 10, b: 20, name: '覺醒通道', en: 'Awakening',     desc: '忠於當下的自我展現。', cn2: '覺醒' },
        { a: 20, b: 57, name: '腦波通道', en: 'The Brainwave', desc: '當下的直覺洞察，瞬間即達。', cn2: '直覺的表達' },
        { a: 34, b: 57, name: '力量通道', en: 'Power',         desc: '原型化的存在；完美的生存直覺。', cn2: '直覺的力量' },
      ]
      kicker = 'INTEGRATION · 整合迴路'
      title = '整合通道'
      sub = '34 — 10 — 20 — 57 · Individuation Loop'
      body = (
        <>
          <p className="lead">
            四個閘門、四條通道組成一個閉合的能量環。這是
            <em style={{ fontStyle: 'italic', background: '#e6c542', padding: '0 4px' }}>純粹個體性</em>
            的迴路——強烈的自我、瞬時的直覺、立即的行動。
          </p>
          <h4>四條通道 / Four Channels</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {integrationList.map(ch => (
              <div key={`${ch.a}-${ch.b}`} className="hd-ch-card">
                <div className="hd-ch-card-head">
                  <span className="hd-ch-card-title">{ch.name}</span>
                  <span className="hd-ch-card-ref">CH.{ch.a}—{ch.b}</span>
                </div>
                <div className="hd-ch-card-en">{ch.en} · {ch.cn2}</div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>{ch.desc}</p>
              </div>
            ))}
          </div>
          <h4>所涉閘門 / Gates Involved</h4>
          <div className="hd-gates-list">
            {[10, 20, 34, 57].map(g => (
              <button key={g} className="hd-gate-chip" onClick={() => onJumpToGate(g)}>{g}</button>
            ))}
          </div>
          <h4>備註 / Note</h4>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#6b5a44', lineHeight: 1.6 }}>
            此迴路在圖中以「主幹（20-57）+ 兩條垂直短線（閘門 10、34）」呈現。
            四條通道共享同一視覺結構，因此點擊任一段都會打開此整合迴路說明。
          </p>
        </>
      )
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
              <button className="hd-drawer-close" onClick={onClose} aria-label="關閉">✕</button>
            </header>
            <div className="hd-drawer-body">{body}</div>
          </>
        )}
      </aside>
    </>
  )
}
