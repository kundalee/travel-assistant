import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AsyncButton, Icon, type IconName, QueryState, toast } from '../../../components'
import { fmt } from '../../../lib/utils'
import { OngoingBanner, Screen, TourCard } from '../components'
import { useBoutique, useChats, useDealOrders, useIncome, useProfile, useShareBoutique, useTours } from '../queries'
import { UpcomingModals, type UpcomingView } from './Tours'
import type { ToursData } from '../queries'
import type { Boutique, Chat, DealOrder } from '../../../api/types/guide'

export default function Home() {
  const profile = useProfile()
  const tours = useTours()
  const dealOrders = useDealOrders()
  const chats = useChats()
  const income = useIncome()
  const boutique = useBoutique()
  return (
    <Screen>
      <QueryState queries={[profile, tours, dealOrders, chats, income, boutique]}>
        {() => <HomeView name={profile.data!.name} tours={tours.data!} dealOrders={dealOrders.data!} chats={chats.data!.chats}
          bonus={income.data!.incomeSummary.monthBonus} boutique={boutique.data!} />}
      </QueryState>
    </Screen>
  )
}

function HomeView({ name, tours, dealOrders, chats, bonus, boutique }: {
  name: string
  tours: ToursData
  dealOrders: DealOrder[]
  chats: Record<string, Chat>
  bonus: number
  boutique: Boutique[]
}) {
  const nav = useNavigate()
  const share = useShareBoutique()
  const [view, setView] = useState<UpcomingView | null>(null)
  const ongoing = tours.ongoing[0]
  const upcoming = tours.upcoming[0]

  const pendingOrders = [
    ...tours.ongoing.flatMap((t) => Object.values(t.memberOrders).flat()),
    ...dealOrders,
  ].filter((o) => o.status === '未付款' || o.status === '已付款' || o.status === '待出貨').length
  const unreadMsgs = Object.values(chats).reduce((n, c) => n + (c.msgs.at(-1)?.self === false ? 1 : 0), 0)

  const stats: [IconName, string, string, string][] = [
    ['users', '今日團員', String(tours.ongoing.reduce((n, t) => n + t.members, 0)), '人'],
    ['receipt', '待處理訂單', String(pendingOrders), '筆'],
    ['message-dots', '未讀訊息', String(unreadMsgs), '則'],
    ['coin', '本月獎金', bonus >= 1000 ? (bonus / 1000).toFixed(1) + 'K' : fmt(bonus), ''],
  ]
  const manageAt = (tab: string) => ongoing && nav(`/guide/tours/${ongoing.tourId}/manage?tab=${tab}`)

  return (
    <>
      <div className="pad">
        <div style={{ marginBottom: '1.2rem' }}>
          <p className="muted" style={{ fontSize: 13 }}>歡迎回來，領隊</p>
          <h2 className="page-title" style={{ fontSize: '1.5rem', marginBottom: 0 }}>{name || '領隊'}</h2>
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
          {boutique.map((b) => (
            <div className="boutique-card" key={b.id}>
              <div className="bimg">{b.emo}</div>
              <div className="bbody">
                <h4>{b.name}</h4><div className="bprice">NT$ {fmt(b.price)}</div>
                <AsyncButton className="btn btn-ghost btn-sm btn-block" onClick={async () => { const r = await share.mutateAsync(b.id); toast(`已分享「${b.name}」給 ${r.sharedTo} 位團員`, 'diamond') }}><Icon name="share" />分享</AsyncButton>
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
    </>
  )
}
