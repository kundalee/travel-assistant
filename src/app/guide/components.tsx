import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chips, Empty, Hl, Icon } from '../../components'
import { stars } from '../../lib/orders'
import { avatarFor, memberOf } from './helpers'
import { useMembers } from './queries'
import type { Chat, CompletedTour, OngoingTour, Review, RosterMember, UpcomingTour } from '../../api/types/guide'

/* 畫面容器（沿用原版淡入動畫） */
export function Screen({ children }: { children: ReactNode }) {
  return <section className="screen active">{children}</section>
}

/* 子畫面標題列：返回鍵 + 標題 + 右側動作 */
export function SubHead({ title, back, children }: { title: ReactNode; back: string; children?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="sub-head">
      <button className="back" onClick={() => nav(back)} aria-label="返回"><Icon name="arrow-left" /></button>
      <h2>{title}</h2>
      {children}
    </div>
  )
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <>
      <h2 className="page-title" style={sub ? { marginBottom: 2 } : undefined}>{children}</h2>
      {sub && <p className="page-sub">{sub}</p>}
    </>
  )
}

/* 可點擊的「N 位團員」→ 團員名冊 */
export function MemberPill({ tourId, count, light }: { tourId: string; count: number; light?: boolean }) {
  const nav = useNavigate()
  return (
    <button className={`member-pill ${light ? 'light' : ''}`} onClick={(e) => { e.stopPropagation(); nav(`/guide/roster/${tourId}`) }}>
      <Icon name="users" />{count} 位團員<Icon name="chevron-right" />
    </button>
  )
}

export function OngoingBanner({ tour, onManage, showRoster }: { tour: OngoingTour; onManage?: () => void; showRoster?: boolean }) {
  return (
    <div className="ong-banner">
      <img src={tour.img} alt="" />
      <div className="ong-banner-info">
        <div className="ong-day">{onManage ? `進行中 · ${tour.day}` : tour.day}</div>
        <h3>{tour.title}</h3>
        <span>{tour.dates} · {showRoster ? <MemberPill tourId={tour.tourId} count={tour.members} light /> : `${tour.members} 位團員`}</span>
      </div>
      {onManage && <button className="ong-call" onClick={onManage}><Icon name="map-cog" />管理</button>}
    </div>
  )
}

type TourCardProps =
  | { kind: 'ongoing'; tour: OngoingTour }
  | { kind: 'completed'; tour: CompletedTour; onReviews: () => void }
  | { kind: 'upcoming'; tour: UpcomingTour; onVideo: () => void; onNotes: () => void; onFlight: () => void }

export function TourCard(props: TourCardProps) {
  const nav = useNavigate()
  const { kind, tour } = props
  const manage = (tab?: string) => nav(`/guide/tours/${tour.tourId}/manage${tab ? `?tab=${tab}` : ''}`)
  const badge = {
    completed: <span className="status completed"><Icon name="circle-check" />已完成</span>,
    ongoing: <span className="status ongoing"><Icon name="plane" />進行中</span>,
    upcoming: <span className="status upcoming"><Icon name="plane-departure" />即將出發</span>,
  }[kind]

  return (
    <div className="card tour-card">
      <div className="thumb" style={{ height: 150 }}>
        <img src={tour.img} alt={tour.title} loading="lazy" />
        <span className="thumb-badge">{badge}</span>
      </div>
      <div className="body">
        <h3>{tour.title}</h3>
        <div className="meta-row"><Icon name="calendar" />{tour.dates}</div>
        <div className="meta-row"><Icon name="map-pin" />{tour.dest}</div>

        {props.kind === 'ongoing' && (
          <>
            <div className="meta-row"><MemberPill tourId={tour.tourId} count={props.tour.members} /><span className="muted" style={{ marginLeft: 8 }}>{props.tour.day}</span></div>
            <button className="btn btn-primary btn-block" style={{ margin: '12px 0 8px' }} onClick={() => manage()}><Icon name="map-cog" />進入行程管理</button>
            <div className="action-2">
              <button className="btn btn-ghost btn-sm" onClick={() => manage('call')}><Icon name="phone-call" />呼叫團員</button>
              <button className="btn btn-ghost btn-sm" onClick={() => manage('review')}><Icon name="star" />查看評價</button>
            </div>
          </>
        )}
        {props.kind === 'completed' && (
          <>
            <div className="rating-row">
              <span className="gold">{stars(props.tour.avg)}</span>
              <span className="muted">{props.tour.avg}/5.0 · {props.tour.count} 則評價</span>
            </div>
            <button className="btn btn-ghost btn-sm btn-block" onClick={props.onReviews}><Icon name="star-half" />審視評價</button>
          </>
        )}
        {props.kind === 'upcoming' && (
          <>
            <div className="meta-row"><Icon name="users" />{props.tour.members} 位團員</div>
            <div className="tri-btn" style={{ marginTop: 12 }}>
              <button className="mini-btn" onClick={props.onVideo}><Icon name="player-play" />說明影片</button>
              <button className="mini-btn" onClick={props.onNotes}><Icon name="clipboard-list" />相關說明</button>
              <button className="mini-btn" onClick={props.onFlight}><Icon name="plane-inflight" />航班資訊</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function ReviewCard({ review }: { review: Review }) {
  const members = useMembers()
  const m = members.data && memberOf(members.data, review.mid)
  return (
    <div className="rev-card">
      <div className="rev-top">
        <img src={m?.av} alt="" />
        <div style={{ flex: 1 }}><div className="rev-name">{m?.name || review.mid}</div><div className="rev-stars">{stars(review.rating)}</div></div>
      </div>
      <div className="rev-text">{review.text}</div>
    </div>
  )
}

/* 團員名冊列（團編號 / 姓名 / email / 暱稱） */
export function MemberRow({ m, q }: { m: RosterMember; q?: string }) {
  return (
    <div className="mem-row">
      <img className="mav" src={avatarFor(m.nick || m.name, 'F1EBFE', '7C3AED')} alt="" loading="lazy" />
      <div className="mmain">
        <div className="mcode"><Hl text={m.code} q={q} /></div>
        <div className="mname"><Hl text={m.name} q={q} /></div>
        <div className="mmeta"><Icon name="mail" /> <Hl text={m.email} q={q} /></div>
        <div className="mnick"><Icon name="user" /> 暱稱：<Hl text={m.nick} q={q} /></div>
      </div>
    </div>
  )
}

/* 對話畫面：分頁 chips + 訊息 + 輸入列 */
export function ChatView({ tabs, current, chat, onSelect, onSend, emptyHint }: {
  tabs: [key: string, label: string][]
  current: string
  chat: Chat | undefined
  onSelect: (key: string) => void
  /** 回傳 true 表示送出成功（清空輸入）；失敗時保留文字 */
  onSend: (text: string) => Promise<boolean>
  emptyHint: string
}) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const msgs = chat?.msgs || []

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs.length, current])

  async function send() {
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    const ok = await onSend(t)
    setSending(false)
    if (ok) setText('')
  }

  return (
    <>
      <Chips className="chips chat-tabs" value={current} onChange={onSelect} items={tabs.map(([k, l]) => [k, l])} />
      <div className="chat-body">
        {msgs.length ? msgs.map((m, i) => (
          <div key={i} className={`bubble-row ${m.self ? 'self' : ''}`}>
            {!m.self && <img src={m.av || avatarFor(m.name)} alt="" />}
            <div className="bubble-col">
              <div className="bubble-meta">{m.name} · {m.time}</div>
              <div className="bubble-text">{m.text}</div>
            </div>
          </div>
        )) : <Empty icon="message-2" text="尚無對話紀錄" hint={emptyHint} />}
        <div ref={endRef} />
      </div>
      <div className="chat-bar">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="輸入訊息…" />
        <button className="btn btn-primary" onClick={send} disabled={sending} aria-busy={sending || undefined} aria-label="送出"><Icon name="send" /></button>
      </div>
    </>
  )
}
