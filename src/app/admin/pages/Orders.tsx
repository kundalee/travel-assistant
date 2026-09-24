import { useState } from 'react'
import { OrderRow, OrderModal } from '../components/OrderParts'
import { Chips, Empty, Icon, PageHead } from '../../../components'
import { DataNote } from '../components/DataNote'
import { ORDER_KINDS, STATUS_ALL } from '../../../api/mocks/admin'
import { useAdmin } from '../store'
import type { Order, OrderStatus, ProductKind } from '../../../api/types/admin'
import { fmt, ostatusClass } from '../utils'

type KindFilter = ProductKind | 'all'
type StatusFilter = OrderStatus | '全部'

function StatusBlock({ rows, status, onOpen }: { rows: Order[]; status: OrderStatus; onOpen: (id: string) => void }) {
  if (!rows.length) return null
  const sum = rows.reduce((a, o) => a + Number(o.amount || 0), 0)
  const qty = rows.reduce((a, o) => a + Number(o.qty || 0), 0)
  return (
    <div className="buy-group">
      <div className="buy-group-head">
        <span className={`ostatus ${ostatusClass(status)}`}>{status}</span>
        <span className="buy-sub">{rows.length} 筆 · {qty} 件 · 總額 <b>NT$ {fmt(sum)}</b></span>
      </div>
      {rows.map((o) => <OrderRow key={o.id} o={o} onOpen={onOpen} />)}
    </div>
  )
}

/* 訂單：商品類別 → 細分類 → 各狀態加總 */
export default function Orders() {
  const { data } = useAdmin()
  const [kind, setKind] = useState<KindFilter>('all')
  const [cat, setCat] = useState('全部')
  const [status, setStatus] = useState<StatusFilter>('全部')
  const [openId, setOpenId] = useState<string | null>(null)

  const orders = data.orders
  const byKind = orders.filter((o) => kind === 'all' || o.kind === kind)
  const catOf = (o: Order) => o.cat || '未分類'
  const cats = ['全部', ...[...new Set(byKind.map(catOf))].sort()]
  const byCat = byKind.filter((o) => cat === '全部' || catOf(o) === cat)
  const shownStatuses = status === '全部' ? STATUS_ALL : [status]
  const shownRows = byCat.filter((o) => status === '全部' || o.status === status)
  const overall = shownRows.filter((o) => o.status !== '已取消').reduce((a, o) => a + Number(o.amount || 0), 0)

  return (
    <div className="pad">
      <PageHead icon="receipt" title="訂單管理" />

      <div className="dtabs scroll" style={{ marginBottom: '0.9rem' }}>
        {ORDER_KINDS.map(([k, label]) => {
          const n = k === 'all' ? orders.length : orders.filter((o) => o.kind === k).length
          return (
            <button key={k} className={`dtab ${kind === k ? 'active' : ''}`} onClick={() => { setKind(k); setCat('全部') }}>
              {label}{n ? ` (${n})` : ''}
            </button>
          )
        })}
      </div>
      {cats.length > 1 && (
        <Chips
          className="cat-chips" value={cat} onChange={setCat}
          items={cats.map((c) => [c, c, c === '全部' ? byKind.length : byKind.filter((o) => catOf(o) === c).length])}
        />
      )}
      <Chips<StatusFilter>
        style={{ marginBottom: '0.9rem' }} value={status} onChange={setStatus}
        items={(['全部', ...STATUS_ALL] as StatusFilter[]).map((s) => [s, s, s === '全部' ? byCat.length : byCat.filter((o) => o.status === s).length])}
      />
      <DataNote />

      <div className="data-note"><Icon name="receipt" />合計 {shownRows.length} 筆 · NT$ {fmt(overall)}（不含已取消）</div>
      {shownRows.length
        ? shownStatuses.map((st) => <StatusBlock key={st} status={st} rows={byCat.filter((o) => o.status === st)} onOpen={setOpenId} />)
        : <Empty text="查無符合的訂單" />}

      {openId && <OrderModal key={openId} id={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}
