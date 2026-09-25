import { useState } from 'react'
import { fmt } from '../../../lib/utils'
import { QueryState } from '../../../components'
import { PageTitle, Screen } from '../components'
import { useIncome } from '../queries'
import type { IncomeCat, IncomeRow } from '../../../api/types/guide'

type GroupBy = 'item' | 'tour' | 'date'

export default function Income() {
  const income = useIncome()
  return (
    <Screen>
      <div className="pad">
        <PageTitle>我的收入</PageTitle>
        <QueryState queries={[income]}>{() => <IncomeView data={income.data!} />}</QueryState>
      </div>
    </Screen>
  )
}

function IncomeView({ data }: { data: NonNullable<ReturnType<typeof useIncome>['data']> }) {
  const [cat, setCat] = useState<IncomeCat>('souv')
  const [by, setBy] = useState<GroupBy>('item')
  const s = data.incomeSummary

  const groups = new Map<string, { shipped: number; bonus: number; items: IncomeRow[] }>()
  data.income[cat].forEach((r) => {
    const g = groups.get(r[by]) || { shipped: 0, bonus: 0, items: [] }
    groups.set(r[by], { shipped: g.shipped + r.shipped, bonus: g.bonus + r.bonus, items: [...g.items, r] })
  })

  return (
    <>
      <div className="inc-summary">
        <div className="inc-sum-card"><div className="k">本月獎金</div><div className="v">NT${fmt(s.monthBonus)}</div></div>
        <div className="inc-sum-card alt"><div className="k">已出貨</div><div className="v">{s.shipped} 件</div></div>
        <div className="inc-sum-card alt"><div className="k">累計收入</div><div className="v">NT${s.total >= 1000 ? Math.round(s.total / 1000) + 'K' : fmt(s.total)}</div></div>
      </div>
      <div className="seg" style={{ marginBottom: '1rem' }}>
        <button className={cat === 'souv' ? 'on' : ''} onClick={() => setCat('souv')}>紀念商品</button>
        <button className={cat === 'group' ? 'on' : ''} onClick={() => setCat('group')}>團購搶好康</button>
      </div>
      <div className="filt-row">
        <select className="filt" value={by} onChange={(e) => setBy(e.target.value as GroupBy)}>
          <option value="item">依商品</option><option value="tour">依團名</option><option value="date">依日期</option>
        </select>
      </div>
      {[...groups].map(([key, g]) => (
        <div className="inc-row" key={key}>
          <div className="inc-main">
            <div className="inc-name">{key}</div>
            <div className="inc-sub">已出貨 {g.shipped} 件{by !== 'item' ? ' · ' + g.items.map((i) => i.item).join('、') : ''}</div>
          </div>
          <div className="inc-bonus"><b>NT$ {fmt(g.bonus)}</b><small>獎金</small></div>
        </div>
      ))}
    </>
  )
}
