import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Empty, FlightModal, Icon, NotesModal, toast, VideoModal } from '../../../components'
import { MapModal, MemoryModal, PageTitle, QrModal, ReviewModal, Screen } from '../components'
import { useTraveler } from '../store'
import type { CompletedTrip, OngoingTrip, UpcomingTrip } from '../../../api/types/traveler'

type TripTab = 'upcoming' | 'ongoing' | 'completed'
const TAB_LABEL: Record<TripTab, string> = { upcoming: '即將出發', ongoing: '進行中', completed: '已完成' }

type Dialog = 'video' | 'notes' | 'flight' | 'map' | 'qr' | 'review' | 'memory' | null

type CardProps =
  | { kind: 'upcoming'; trip: UpcomingTrip }
  | { kind: 'ongoing'; trip: OngoingTrip }
  | { kind: 'completed'; trip: CompletedTrip }

/* 我的行程卡片（依狀態顯示不同動作），附帶各自的對話框 */
export function MyTourCard(props: CardProps) {
  const nav = useNavigate()
  const [dialog, setDialog] = useState<Dialog>(null)
  const { kind, trip } = props
  const close = () => setDialog(null)
  const callLeader = (chatKey: string) => { nav(`/traveler/chat?c=${chatKey}`); toast('已為您接通領隊聊天室', 'phone-call') }

  const badge = {
    completed: <span className="status completed"><Icon name="circle-check" />已完成</span>,
    ongoing: <span className="status ongoing"><Icon name="plane" />進行中</span>,
    upcoming: <span className="status upcoming"><Icon name="plane-departure" />即將出發</span>,
  }[kind]

  return (
    <div className="card tour-card">
      <div className="thumb" style={{ height: 150 }}>
        <img src={trip.img} alt={trip.title} loading="lazy" />
        <span className="thumb-badge">{badge}</span>
      </div>
      <div className="body">
        <h3>{trip.title}</h3>
        <div className="meta-row"><Icon name="calendar" />{trip.dates}</div>
        <div className="meta-row"><Icon name="map-pin" />{trip.dest}</div>

        {props.kind === 'upcoming' && (
          <>
            <div className="info-grid" style={{ margin: '12px 0' }}>
              <div className="info-cell"><div className="k"><Icon name="clock" />集合時間</div><div className="v">{props.trip.meetTime}</div></div>
              <div className="info-cell"><div className="k"><Icon name="map-pin" />集合地點</div><div className="v">{props.trip.meetPlace}</div></div>
            </div>
            <div className="guide-strip">
              <img src={props.trip.guideImg} alt={trip.guide} />
              <div style={{ flex: 1 }}><div className="g-name">{trip.guide}</div><div className="g-role">{props.trip.guideRole} · {props.trip.phone}</div></div>
              <a className="icon-btn accent" href={`tel:${props.trip.phone.replace(/-/g, '')}`} aria-label="撥打電話"><Icon name="phone" /></a>
              <button className="icon-btn accent" onClick={() => nav('/traveler/chat')} aria-label="聊天"><Icon name="message" /></button>
            </div>
            <div className="tri-btn" style={{ marginTop: 12 }}>
              <button className="mini-btn" onClick={() => setDialog('video')} disabled={!props.trip.video}><Icon name="player-play" />說明影片</button>
              <button className="mini-btn" onClick={() => setDialog('notes')}><Icon name="clipboard-list" />相關說明</button>
              <button className="mini-btn" onClick={() => setDialog('flight')} disabled={!props.trip.flight}><Icon name="plane-inflight" />航班資訊</button>
            </div>
            <div className="action-2" style={{ marginTop: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setDialog('map')}><Icon name="map-2" />集合地圖</button>
              <button className="btn btn-primary btn-sm" onClick={() => setDialog('qr')}><Icon name="qrcode" />簽到 QR</button>
            </div>
            {dialog === 'video' && props.trip.video && <VideoModal title={trip.title} src={props.trip.video} onClose={close} />}
            {dialog === 'notes' && <NotesModal title={trip.title} notes={props.trip.notes || []} onClose={close} />}
            {dialog === 'flight' && props.trip.flight && <FlightModal title={trip.title} flight={props.trip.flight} onClose={close} />}
            {dialog === 'map' && <MapModal place={props.trip.meetPlace} onClose={close} />}
            {dialog === 'qr' && <QrModal title={trip.title} payload={props.trip.qr} onClose={close} />}
          </>
        )}

        {props.kind === 'ongoing' && (
          <>
            <div className="meta-row"><Icon name="user-star" />領隊：{trip.guide} · {props.trip.day}</div>
            <button className="btn btn-primary btn-block" style={{ margin: '12px 0 8px' }} onClick={() => nav(`/traveler/my-tours/${trip.tourId}`)}><Icon name="map-cog" />進入行程管理</button>
            <div className="action-2">
              <button className="btn btn-ghost btn-sm" onClick={() => callLeader(props.trip.chatKey)}><Icon name="phone-call" />呼叫領隊</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setDialog('review')}><Icon name="star" />評價</button>
            </div>
          </>
        )}

        {props.kind === 'completed' && (
          <>
            <div className="rating-row">
              <span className="gold">{'★'.repeat(Math.round(props.trip.rating))}</span>
              <span className="muted">{props.trip.rating || '—'}/5.0{props.trip.memories ? ` · 回憶 ${props.trip.memories} 張` : ''}</span>
            </div>
            <div className="action-2">
              <button className="btn btn-ghost btn-sm" onClick={() => setDialog('memory')}><Icon name="camera-heart" />我的旅遊回憶</button>
              <button className={`btn ${props.trip.reviewed ? 'btn-ghost' : 'btn-primary'} btn-sm`} onClick={() => setDialog('review')}>
                <Icon name="star" />{props.trip.reviewed ? '已完成評價' : '撰寫評價'}
              </button>
            </div>
            {dialog === 'memory' && <MemoryModal tourTitle={trip.title} onClose={close} />}
          </>
        )}
        {dialog === 'review' && <ReviewModal tourTitle={trip.title} onClose={close} />}
      </div>
    </div>
  )
}

export default function MyTours() {
  const { data } = useTraveler()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as TripTab) || 'upcoming'

  return (
    <Screen>
      <div className="pad">
        <PageTitle>我的行程</PageTitle>
        <div className="dtabs">
          {(Object.keys(TAB_LABEL) as TripTab[]).map((t) => (
            <button key={t} className={`dtab ${tab === t ? 'active' : ''}`} onClick={() => setParams({ tab: t }, { replace: true })}>{TAB_LABEL[t]}</button>
          ))}
        </div>
        <div className="stack">
          {!data[tab].length && <Empty icon="calendar" text={`目前沒有${TAB_LABEL[tab]}的行程`} hint={tab === 'upcoming' ? '快去探索心動的行程吧！' : '行程結束後會顯示於此'} />}
          {tab === 'upcoming' && data.upcoming.map((t) => <MyTourCard key={t.tourId} kind="upcoming" trip={t} />)}
          {tab === 'ongoing' && data.ongoing.map((t) => <MyTourCard key={t.tourId} kind="ongoing" trip={t} />)}
          {tab === 'completed' && data.completed.map((t) => <MyTourCard key={t.tourId} kind="completed" trip={t} />)}
        </div>
      </div>
    </Screen>
  )
}
