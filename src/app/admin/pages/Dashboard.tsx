import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OrderRow, OrderModal } from '../components/OrderParts'
import { Empty, Icon, type IconName, QueryState } from '../../../components'
import { useAdminData } from '../queries'
import type { AdminData } from '../../../api/types/admin'
import { fmt } from '../utils'
import { CreateUserModal } from './Users'

export default function Dashboard() {
  const { queries, data } = useAdminData('users', 'tours', 'orders')
  return <QueryState queries={queries}>{() => <DashboardView data={data!} />}</QueryState>
}

function DashboardView({ data }: { data: Pick<AdminData, 'users' | 'tours' | 'orders'> }) {
  const nav = useNavigate()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const rev = data.orders.filter((o) => o.status !== '已取消').reduce((s, o) => s + Number(o.amount || 0), 0)
  const stats: [IconName, string, string][] = [
    ['users', '使用者', fmt(data.users.length)],
    ['map-2', '行程', fmt(data.tours.length)],
    ['receipt', '訂單', fmt(data.orders.length)],
    ['coin', '營收', 'NT$' + (rev >= 1000 ? (rev / 1000).toFixed(1) + 'K' : fmt(rev))],
  ]

  return (
    <div className="pad">
      <div style={{ marginBottom: '1.1rem' }}>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>系統總覽</p>
        <h2 className="dash-title">營運儀表板</h2>
      </div>
      <div className="stat-grid" style={{ marginBottom: '1.4rem' }}>
        {stats.map(([icon, k, v]) => (
          <div className="stat" key={k}><div className="k"><Icon name={icon} />{k}</div><div className="v">{v}</div></div>
        ))}
      </div>

      <div className="section-title"><Icon name="bolt" />快速作業</div>
      <div className="qa-grid" style={{ marginBottom: '1.5rem' }}>
        <button className="qa" onClick={() => nav('/admin/users')}><Icon name="users" /><span>使用者</span></button>
        <button className="qa" onClick={() => nav('/admin/tours')}><Icon name="map-2" /><span>行程</span></button>
        <button className="qa" onClick={() => nav('/admin/orders')}><Icon name="receipt" /><span>訂單</span></button>
        <button className="qa" onClick={() => setCreating(true)}><Icon name="user-plus" /><span>建立帳號</span></button>
      </div>

      <div className="section-title">
        <Icon name="clock" />最新訂單<span className="more" onClick={() => nav('/admin/orders')}>全部</span>
      </div>
      <div className="stack">
        {data.orders.length ? data.orders.slice(0, 4).map((o) => <OrderRow key={o.id} o={o} onOpen={setOrderId} />) : <Empty text="尚無訂單" />}
      </div>

      {orderId && <OrderModal key={orderId} id={orderId} onClose={() => setOrderId(null)} />}
      {creating && <CreateUserModal onClose={() => setCreating(false)} />}
    </div>
  )
}
