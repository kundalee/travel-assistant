import { Fragment, useState } from 'react'
import { Icon } from '../../../components'
import { fmt, includesQ } from '../../../lib/utils'
import { api } from '../../../api/partner'
import { profitOf, shippedTotals } from '../income'
import { usePartner } from '../store'
import type { IncomeCat, IncomeRow } from '../../../api/types/partner'

type GroupBy = 'product' | 'tour' | 'date'
const GROUP_LABEL: Record<GroupBy, string> = { product: '商品', tour: '團名', date: '日期' }

/* 我的收入：依商品 / 團名 / 日期檢視已出貨的銷售額與利潤 */
export default function Income() {
  const { data } = usePartner()
  const [cat, setCat] = useState<IncomeCat>('souvenir')
  const [groupBy, setGroupBy] = useState<GroupBy>('product')
  const [shippedOnly, setShippedOnly] = useState(true)
  const [q, setQ] = useState('')
  const [demoEmpty, setDemoEmpty] = useState(false)

  const source = demoEmpty ? [] : data.income[cat]
  const rows = source.filter((r) => (!shippedOnly || r.shipped) && includesQ([r.product, r.tour], q))
  const totals = shippedTotals(rows)

  const groups = new Map<string, IncomeRow[]>()
  rows.forEach((r) => {
    const k = r[groupBy]
    groups.set(k, [...(groups.get(k) || []), r])
  })
  const keys = [...groups.keys()].sort()

  return (
    <div className="page active">
      <div className="wrap">
        <div className="page-head">
          <div><h1>我的收入 <span className="en">My Income</span></h1><p>依商品、依團名、依日期檢視已出貨的銷售額與利潤</p></div>
        </div>

        {api.mock && (
          <div className="demo-banner">
            <Icon name="flask" /><span><b>展示模式</b> — 尚未連接後端收入資料，以下為範例。</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setDemoEmpty(!demoEmpty)}>{demoEmpty ? '載入範例資料' : '切換空狀態'}</button>
          </div>
        )}

        <div className="stat-row">
          <div className="stat accent"><div className="label"><Icon name="cash" />銷售額</div><div className="value money">{fmt(totals.amount)}</div></div>
          <div className="stat green"><div className="label"><Icon name="trending-up" />利潤合計</div><div className="value money">{fmt(totals.profit)}</div></div>
          <div className="stat"><div className="label"><Icon name="list-check" />出貨筆數</div><div className="value">{totals.count}</div></div>
        </div>

        <div className="tabs">
          <button className={`tab ${cat === 'souvenir' ? 'active' : ''}`} onClick={() => setCat('souvenir')}><Icon name="gift-card" /> 紀念商品</button>
          <button className={`tab ${cat === 'groupbuy' ? 'active' : ''}`} onClick={() => setCat('groupbuy')}><Icon name="shopping-cart" /> 團購搶好康</button>
        </div>

        <div className="toolbar">
          <div className="field">
            <label>分組方式 Group by</label>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
              <option value="product">依商品</option><option value="tour">依團名</option><option value="date">依日期</option>
            </select>
          </div>
          <div className="field">
            <label>只看已出貨</label>
            <select value={shippedOnly ? 'shipped' : 'all'} onChange={(e) => setShippedOnly(e.target.value === 'shipped')}>
              <option value="all">全部</option><option value="shipped">已出貨</option>
            </select>
          </div>
          <div className="search" style={{ alignSelf: 'flex-end' }}>
            <Icon name="search" />
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜尋商品或團名…" />
          </div>
        </div>

        <div className="table-wrap">
          <div className="table-scroll">
            <table>
              <thead><tr>
                <th>商品</th><th>團名</th><th>日期</th><th className="ta-r">數量</th>
                <th className="ta-r">銷售額</th><th>狀態</th><th className="ta-r">利潤</th>
              </tr></thead>
              <tbody>
                {rows.length ? keys.map((k) => {
                  const g = groups.get(k)!
                  const gt = shippedTotals(g)
                  return (
                    <Fragment key={k}>
                      <tr className="group-head">
                        <td colSpan={4}>{GROUP_LABEL[groupBy]}：{k}</td>
                        <td className="num">NT$ {fmt(gt.amount)}</td><td /><td className="bonus">NT$ {fmt(gt.profit)}</td>
                      </tr>
                      {g.map((r) => (
                        <tr key={r.product + r.tour + r.date}>
                          <td>{r.product}</td><td>{r.tour}</td><td>{r.date}</td>
                          <td className="num">{r.qty}</td><td className="num">NT$ {fmt(r.amount)}</td>
                          <td>{r.shipped
                            ? <span className="pill shipped"><Icon name="truck-delivery" />已出貨</span>
                            : <span className="pill pending"><Icon name="clock" />待出貨</span>}</td>
                          <td className="bonus">NT$ {fmt(profitOf(r))}</td>
                        </tr>
                      ))}
                    </Fragment>
                  )
                }) : (
                  <tr><td colSpan={7}>
                    <div className="empty">
                      <Icon name="inbox" />
                      <h3>{source.length ? '查無符合資料' : '尚無收入資料'}</h3>
                      <p>{source.length ? '請調整篩選條件或搜尋關鍵字。' : '出貨與利潤資料將顯示於此。'}</p>
                    </div>
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
