import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, toast, type IconName } from '../../../components'
import { fmt } from '../../../lib/utils'
import { OngoingBanner, Screen, TourCard } from '../components'
import { useGuide } from '../store'
import { UpcomingModals, type UpcomingView } from './Tours'

export default function Home() {
  const { user, data } = useGuide()
  const nav = useNavigate()
  const [view, setView] = useState<UpcomingView | null>(null)
  const ongoing = data.ongoing[0]
  const upcoming = data.upcoming[0]

  const pendingOrders = [
    ...data.ongoing.flatMap((t) => Object.values(t.memberOrders).flat()),
    ...data.dealOrders,
  ].filter((o) => o.status === '未付款' || o.status === '已付款' || o.status === '待出貨').length
  const unreadMsgs = Object.values(data.chats).reduce((n, c) => n + (c.msgs.at(-1)?.self === false ? 1 : 0), 0)
  const bonus = data.incomeSummary.monthBonus

  const stats: [IconName, string, string, string][] = [
    ['users', '今日團員', String(data.ongoing.reduce((n, t) => n + t.members, 0)), '人'],
    ['receipt', '待處理訂單', String(pendingOrders), '筆'],
    ['message-dots', '未讀訊息', String(unreadMsgs), '則'],
    ['coin', '本月獎金', bonus >= 1000 ? (bonus / 1000).toFixed(1) + 'K' : fmt(bonus), ''],
  ]
  const manageAt = (tab: string) => ongoing && nav(`/guide/tours/${ongoing.tourId}/manage?tab=${tab}`)

  return (
    <Screen>
      <div className="pad">
        <div style={{ marginBottom: '1.2rem' }}>
          <p className="muted" style={{ fontSize: 13 }}>歡迎回來，領隊</p>
          <h2 className="page-title" style={{ fontSize: '1.5rem', marginBottom: 0 }}>{user?.profile.name || '領隊'}</h2>
        </div>

        <div style={{ marginBottom: '1.3rem' }}>
          {ongoing
            ? <OngoingBanner tour={ongoing} showRoster onManage={() => nav(`/guide/tours/${ongoing.tourId}/manage`)} />
            : <div className="card" style={{ padding: '1.2rem', textAlign: 'center', color: 'var(--muted)' }}>目前沒有進行中的行程</div>}
        </div>

        <div className="stat-grid" style={{ marginBottom: '1.4rem' }}>
          {stats.map(([icon, k, v, unit]) => (
            <div className="stat" key={k}><div className="k"><Icon name={icon} />{k}</div><div className="v">{v} {unit && <small>{unit}</small>}</div></div>
          ))}
        </div>

        <div className="section-title"><Icon name="bolt" />快速作業</div>
        <div className="qa-grid" style={{ marginBottom: '1.5rem' }}>
          <button className="qa" onClick={() => manageAt('notice')}><Icon name="speakerphone" /><span>每日公告</span></button>
          <button className="qa" onClick={() => manageAt('call')}><Icon name="phone-call" /><span>呼叫團員</span></button>
          <button className="qa" onClick={() => manageAt('photo')}><Icon name="photo-up" /><span>照片分享</span></button>
          <button className="qa" onClick={() => manageAt('buy')}><Icon name="shopping-bag" /><span>購買狀況</span></button>
        </div>

        <div className="section-title"><Icon name="diamond" />精品好物分享<span className="more" onClick={() => toast('已開啟精品好物管理', 'diamond')}>管理</span></div>
        <div className="boutique-scroll">
          {data.boutique.map((b) => (
            <div className="boutique-card" key={b.name}>
              <div className="bimg">{b.emo}</div>
              <div className="bbody">
                <h4>{b.name}</h4><div className="bprice">NT$ {fmt(b.price)}</div>
                <button className="btn btn-ghost btn-sm btn-block" onClick={() => toast(`已分享「${b.name}」給團員`, 'diamond')}><Icon name="share" />分享</button>
              </div>
            </div>
          ))}
        </div>

        <div className="section-title" style={{ marginTop: '1.4rem' }}>
          <Icon name="plane-departure" />即將出發<span className="more" onClick={() => nav('/guide/tours?tab=upcoming')}>全部</span>
        </div>
        <div className="stack">
          {upcoming && (
            <TourCard kind="upcoming" tour={upcoming}
              onVideo={() => setView({ kind: 'video', tour: upcoming })}
              onNotes={() => setView({ kind: 'notes', tour: upcoming })}
              onFlight={() => setView({ kind: 'flight', tour: upcoming })} />
          )}
        </div>
      </div>
      <UpcomingModals view={view} onClose={() => setView(null)} />
    </Screen>
  )
}
