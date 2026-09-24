import { useState } from 'react'
import { Icon, toast } from '../../../components'
import { fmt, includesQ } from '../../../lib/utils'
import { usePartner } from '../store'
import type { CancelledOrder } from '../../../api/types/partner'

/* 已取消：訂單明細與勾稽 */
export default function Cancelled() {
  const { data, setReconciled } = usePartner()
  const [q, setQ] = useState('')
  const rows = data.cancelled.filter((r) => includesQ([r.orderNo, r.product, r.tour], q))

  function toggle(r: CancelledOrder) {
    setReconciled([r.orderNo], !r.reconciled)
    toast(!r.reconciled ? '已勾稽 ' + r.orderNo : '取消勾稽', !r.reconciled ? 'check' : 'x')
  }

  function reconcileAll() {
    setReconciled(data.cancelled.map((r) => r.orderNo), true)
    toast('已全部勾稽')
  }

  return (
    <div className="page active">
      <div className="wrap">
        <div className="page-head">
          <div><h1>已取消 <span className="en">Cancelled</span></h1><p>訂單明細與勾稽 — 核對已取消訂單狀態</p></div>
        </div>
        <div className="toolbar">
          <div className="search">
            <Icon name="search" />
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜尋訂單編號、商品或團名…" />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={reconcileAll} disabled={!data.cancelled.length}><Icon name="checks" /> 全部勾稽</button>
        </div>
        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead><tr>
                <th style={{ width: 44 }}>勾稽</th><th>訂單編號</th><th>商品</th><th>團名</th>
                <th>取消日期</th><th className="ta-r">金額</th><th>狀態</th>
              </tr></thead>
              <tbody>
                {rows.length ? rows.map((r) => (
                  <tr key={r.orderNo}>
                    <td><input type="checkbox" className="chk" checked={r.reconciled} onChange={() => toggle(r)} aria-label={`勾稽 ${r.orderNo}`} /></td>
                    <td className="tabular">{r.orderNo}</td>
                    <td>{r.product}</td><td>{r.tour}</td><td>{r.date}</td>
                    <td className="num">NT$ {fmt(r.amount)}</td>
                    <td>{r.reconciled
                      ? <span className="pill shipped"><Icon name="check" />已勾稽</span>
                      : <span className="pill cancelled"><Icon name="x" />待勾稽</span>}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={7}>
                    {data.cancelled.length
                      ? <div className="empty"><Icon name="search-off" /><h3>查無資料</h3><p>試試其他關鍵字。</p></div>
                      : <div className="empty"><Icon name="receipt-off" /><h3>無已取消訂單</h3><p>已取消的訂單明細會顯示於此，供您勾稽核對。</p></div>}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
