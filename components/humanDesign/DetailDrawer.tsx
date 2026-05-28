'use client'

import { useEffect } from 'react'
import { fmtGate } from '@/utils/format'
import { HD_GATES, HD_CENTERS_INFO, type ChartChannel } from './hd-chart-data'
import type { SelectionPayload } from './BodyGraph'
import { useLang } from '@/i18n'

interface DetailDrawerProps {
  selection: SelectionPayload | null
  onClose: () => void
  onJumpToGate: (num: number) => void
}

export default function DetailDrawer({ selection, onClose, onJumpToGate }: DetailDrawerProps) {
  const open = !!selection
  const { t, pick } = useLang()

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
      kicker = `${t('drawer.centerKicker')} · ${pick(d.name).toUpperCase()}`
      title = pick(d.name)
      sub = pick(d.type)
      body = (
        <>
          <p className="lead">{pick(d.summary)}</p>
          <h4>{t('drawer.description')}</h4>
          <p>{pick(d.description)}</p>
          <h4>{t('drawer.keywords')}</h4>
          <div className="hd-tag-row">
            {pick(d.keywords).map(k => <span className="hd-tag" key={k}>{k}</span>)}
          </div>
          <h4>{t('drawer.gates')}</h4>
          <div className="hd-gates-list">
            {d.gates.map(g => (
              <button key={g} className="hd-gate-chip" onClick={() => onJumpToGate(g)}>{g}</button>
            ))}
          </div>
        </>
      )
    } else if (kind === 'gate') {
      const d = data as typeof HD_GATES[number] & { number: number }
      const centerInfo = HD_CENTERS_INFO[d.center]
      kicker = `${t('drawer.gateKicker')} № ${fmtGate(d.number)}`
      title = pick(d.name)
      sub = `${pick(d.name)} · ${t('drawer.in')} ${centerInfo ? pick(centerInfo.name) : d.center}`
      body = (
        <>
          <p className="lead">{pick(d.desc)}</p>
          <h4>{t('drawer.locatedIn')}</h4>
          <p>
            <strong style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18 }}>
              {centerInfo ? pick(centerInfo.name) : d.center}
            </strong>
            {centerInfo ? ` · ${pick(centerInfo.type)}` : ''}
          </p>
          <h4>{t('drawer.reference')}</h4>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            GATE.{fmtGate(d.number)} · {d.name.en}
          </p>
        </>
      )
    } else if (kind === 'channel') {
      const d = data as ChartChannel
      const fromG = HD_GATES[d.from]
      const toG = HD_GATES[d.to]
      kicker = `${t('drawer.channelKicker')} · ${d.from}–${d.to}`
      title = pick(d.name)
      sub = pick(d.name)
      body = (
        <>
          <p className="lead">{pick(d.desc)}</p>
          <h4>{t('drawer.connects')}</h4>
          <p style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            <span
              onClick={() => onJumpToGate(d.from)}
              style={{ cursor: 'pointer', borderBottom: '1px solid #2b1f14' }}
            >
              {fromG ? pick(fromG.name) : `${t('drawer.gateKicker')} ${d.from}`} ({d.from})
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal', color: '#6b5a44' }}>⟷</span>
            <span
              onClick={() => onJumpToGate(d.to)}
              style={{ cursor: 'pointer', borderBottom: '1px solid #2b1f14' }}
            >
              {toG ? pick(toG.name) : `${t('drawer.gateKicker')} ${d.to}`} ({d.to})
            </span>
          </p>
          <h4>{t('drawer.reference')}</h4>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            CHANNEL.{fmtGate(d.from)}–{fmtGate(d.to)} · {d.name.en.toUpperCase()}
          </p>
        </>
      )
    } else if (kind === 'integration') {
      const integrationList = [
        { a: 34, b: 10, name: { zh: '探索通道',   en: 'Exploration'   }, desc: { zh: '力量到形式 — 依循信念而行動的能量。', en: "Force to Form — energy to act on one's convictions." } },
        { a: 10, b: 20, name: { zh: '覺醒通道',   en: 'Awakening'     }, desc: { zh: '忠於當下的自我展現。', en: 'Awakening to self — authentic expression in the now.' } },
        { a: 20, b: 57, name: { zh: '腦波通道',   en: 'The Brainwave' }, desc: { zh: '當下的直覺洞察，瞬間即達。', en: 'Intuitive insight in the present moment — instantaneous.' } },
        { a: 34, b: 57, name: { zh: '力量通道',   en: 'Power'         }, desc: { zh: '原型化的存在；完美的生存直覺。', en: 'Archetypal existence — perfect survival intuition.' } },
      ]
      kicker = t('drawer.integrationKicker')
      title = t('drawer.integrationTitle')
      sub = t('drawer.integrationSub')
      body = (
        <>
          <p className="lead">{t('drawer.integrationLead')}</p>
          <h4>{t('drawer.fourChannels')}</h4>
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
          <h4>{t('drawer.gatesInvolved')}</h4>
          <div className="hd-gates-list">
            {[10, 20, 34, 57].map(g => (
              <button key={g} className="hd-gate-chip" onClick={() => onJumpToGate(g)}>{g}</button>
            ))}
          </div>
          <h4>{t('drawer.note')}</h4>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#6b5a44', lineHeight: 1.6 }}>
            {t('drawer.integrationNote')}
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
              <button className="hd-drawer-close" onClick={onClose} aria-label={t('drawer.close')}>✕</button>
            </header>
            <div className="hd-drawer-body">{body}</div>
          </>
        )}
      </aside>
    </>
  )
}
