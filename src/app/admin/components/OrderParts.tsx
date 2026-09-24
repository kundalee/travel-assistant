import { useState } from 'react'
import { KIND_TW, PAYFLOW, PAYLABEL, STATUS_ALL } from '../../../api/mocks/admin'
import { useAdmin } from '../store'
import type { Order, OrderStatus } from '../../../api/types/admin'
import { fmt, ostatusClass } from '../utils'
import { Icon, Modal } from '../../../components'

export function OrderRow({ o, onOpen }: { o: Order; onOpen: (id: string) => void }) {
  return (
    <div className="lrow" onClick={() => onOpen(o.id)} style={{ cursor: 'pointer' }}>
      <div className="lmain">
        <div className="lname">{o.product_name}</div>
        <div className="lsub">{o.buyer_name || '—'} · 數量 {o.qty} · NT$ {fmt(o.amount)}</div>
        <div className="lsub2">{o.kind ? KIND_TW[o.kind] : ''}{o.cat ? ' · ' + o.cat : ''}</div>
        <div className="lsub2">
          {PAYLABEL[o.method || ''] || o.method || ''} · {o.fulfillment === 'ship' ? '宅配' : '取貨'}{o.reconciled ? ' · 已勾稽' : ''}
        </div>
      </div>
      <span className={`ostatus ${ostatusClass(o.status)}`}>{o.status}</span>
    </div>
  )
}

/* 父元件以 key={id} 掛載，確保切換訂單時重設狀態 */
export function OrderModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, update, toast } = useAdmin()
  const o = data.orders.find((x) => x.id === id)
  const [status, setStatus] = useState<OrderStatus>(o?.status || '未付款')
  const [reconciled, setReconciled] = useState(!!o?.reconciled)

  if (!o) return null
  const ship = o.fulfillment === 'ship'
  const rows: [string, string][] = [
    ['購買者', o.buyer_name || '—'],
    ['商品', `${o.product_name} ×${o.qty}`],
    ['金額', `NT$ ${fmt(o.amount)}`],
    ['付款方式', PAYLABEL[o.method || ''] || o.method || '—'],
    ['取貨方式', ship ? '宅配回台灣' : '集結地點取貨'],
    ['類別', (o.kind && KIND_TW[o.kind]) || '—'],
    ['金流', PAYFLOW[o.payflow || ''] || '—'],
    [ship ? '物流' : '取貨點', (ship ? o.logistics : o.pickup) || '—'],
    ['勾稽', reconciled ? '已勾稽' : '未勾稽'],
  ]

  function toggleRecon() {
    setReconciled(!reconciled)
    toast(!reconciled ? '已勾稽 ✓' : '已取消勾稽')
  }

  function save() {
    onClose()
    update('orders', id, { status, reconciled }, '訂單已更新')
  }

  return (
    <Modal onClose={onClose} title="訂單明細" sub={o.product_name}>
      {rows.map(([k, v]) => <div className="kv" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>)}
      <div className="field" style={{ marginTop: '0.6rem' }}>
        <label>更新狀態</label>
        <select className="filt" style={{ width: '100%' }} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
          {STATUS_ALL.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="action-2">
        <button className="btn btn-ghost" onClick={toggleRecon}><Icon name="checkbox" />{reconciled ? '取消勾稽' : '勾稽'}</button>
        <button className="btn btn-primary" onClick={save}><Icon name="check" />更新</button>
      </div>
    </Modal>
  )
}
