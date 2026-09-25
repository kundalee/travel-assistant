import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, type IconName, QueryState, StatusGroups, toast } from '../../../components'
import { ostatusClass, type OrderStatus } from '../../../lib/orders'
import { fmt } from '../../../lib/utils'
import { useAuth } from '../../auth/AuthProvider'
import { Screen } from '../components'
import { useHistoryOrders, useHistoryTours, useProfile } from '../queries'

function MeRow({ icon, label, onClick, danger }: { icon: IconName; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button className={`me-row ${danger ? 'danger' : ''}`} onClick={onClick}>
      <Icon name={icon} /><span>{label}</span><Icon name="chevron-right" className="chev" />
    </button>
  )
}

export default function Me() {
  const { logout } = useAuth()
  const profile = useProfile()
  const orders = useHistoryOrders()
  const historyTours = useHistoryTours()
  const nav = useNavigate()
  const [filter, setFilter] = useState<OrderStatus | '全部'>('全部')
  const p = profile.data

  return (
    <Screen>
      <div className="pad">
        {p && (
          <div className="me-head">
            <img src={p.avatar} alt="頭像" />
            <div style={{ flex: 1 }}>
              <h2>{p.name}</h2>
              <div className="me-tags"><span className="crud-badge">領隊導遊</span><span className="muted">員編 {p.empId}</span></div>
            </div>
          </div>
        )}

        <div className="card flush" style={{ marginBottom: '1.4rem' }}>
          <MeRow icon="users-group" label="我的歷史團員" onClick={() => nav('/guide/past-members')} />
        </div>

        <div className="section-title md"><Icon name="receipt-2" />歷史訂單</div>
        <div style={{ marginBottom: '1.4rem' }}>
          <QueryState queries={[orders]}>{() => (
          <StatusGroups rows={orders.data!} filter={filter} onFilter={setFilter}
            render={(o) => (
              <div className={`order-row ${o.status === '已取消' ? 'cancelled' : ''}`} key={o.id}>
                <div className="order-main"><div className="order-name">{o.product}</div><div className="order-sub">{o.date} · {o.tour} · NT$ {fmt(o.amount)}</div></div>
                <span className={`ostatus ${ostatusClass(o.status)}`}>{o.status}</span>
              </div>
            )} />
          )}</QueryState>
        </div>

        <div className="section-title md"><Icon name="map-2" />歷史行程</div>
        <div className="stack" style={{ marginBottom: '1.4rem' }}>
          <QueryState queries={[historyTours]}>{() => historyTours.data!.map((t) => (
            <div className="card hist-tour" key={t.tourId}>
              <img src={t.img} alt="" />
              <div style={{ flex: 1 }}>
                <h3>{t.title}</h3>
                <div className="meta-row"><Icon name="calendar" />{t.dates}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => toast(`開啟「${t.title}」旅遊回憶 · ${t.memories} 張`, 'camera-heart')}><Icon name="camera-heart" />旅遊回憶</button>
            </div>
          ))}</QueryState>
        </div>

        <div className="section-title md"><Icon name="settings" />設定</div>
        <div className="card flush">
          <MeRow icon="wallet" label="我的收入" onClick={() => nav('/guide/income')} />
          <MeRow icon="diamond" label="精品好物分享" onClick={() => toast('精品好物分享管理', 'diamond')} />
          <MeRow icon="bell-cog" label="通知設定" onClick={() => toast('通知設定', 'bell')} />
          <MeRow icon="help-circle" label="說明與客服" onClick={() => toast('說明與客服', 'help-circle')} />
          <MeRow icon="logout" label="登出" danger onClick={logout} />
        </div>
        <p className="version">TravelAssistant 領隊導遊版 · v2026-07-06</p>
      </div>
    </Screen>
  )
}
