import { useState } from 'react'
import { Icon, PageHead, Tabs, type IconName } from '../../../components'
import { STATS } from '../../../api/mocks/admin'
import { fmt } from '../utils'

type Tab = 'members' | 'product' | 'perf'

function RankList({ rows, unit }: { rows: { n: string; v: number }[]; unit: string }) {
  const max = Math.max(...rows.map((r) => r.v), 1)
  return (
    <>
      {rows.map((r, i) => (
        <div className="lrow" key={r.n}>
          <div className={`rank-n ${i === 0 ? 'top' : ''}`}>{i + 1}</div>
          <div className="lmain">
            <div className="lname">{r.n}</div>
            <div className="bar-row" style={{ marginTop: 6 }}>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round((r.v / max) * 100)}%` }} /></div>
              <span className="bv">{fmt(r.v)} {unit}</span>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

const RANKS: [IconName, string, { n: string; v: number }[], string][] = [
  ['gift', '紀念商品排名', STATS.rankSouvenir, '件'],
  ['discount', '團購商品排名', STATS.rankDeal, '件'],
  ['map-2', '推薦行程排名', STATS.rankTour, '人'],
  ['diamond', '精品好物排名', STATS.rankBoutique, '件'],
]

export default function Stats() {
  const [tab, setTab] = useState<Tab>('members')
  return (
    <div className="pad">
      <PageHead icon="chart-bar" title="統計分析報表" />
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[['members', '參加團員列表'], ['product', '商品分析'], ['perf', '業績管理']]} />

      {tab === 'members' && STATS.members.map((m) => (
        <div className="lrow" key={m.tour}>
          <div className="lmain"><div className="lname">{m.tour}</div><div className="lsub">領隊：{m.guide}</div></div>
          <div style={{ textAlign: 'right' }}><b style={{ fontSize: 16, color: 'var(--accent)' }}>{m.n}</b><div className="lsub2">位團員</div></div>
        </div>
      ))}

      {tab === 'product' && RANKS.map(([icon, title, rows, unit], i) => (
        <div key={title}>
          <div className="section-title sm" style={i ? { marginTop: '1rem' } : undefined}><Icon name={icon} />{title}</div>
          <RankList rows={rows} unit={unit} />
        </div>
      ))}

      {tab === 'perf' && (
        <>
          {STATS.perf.map((p) => (
            <div className="lrow" key={p.who}>
              <div className="lmain">
                <div className="lname">{p.who} <span className="rbadge guide">{p.role}</span></div>
                <div className="lsub">{p.kind} · 已出貨 {p.shipped} 件 · 銷售 NT$ {fmt(p.amount)}</div>
              </div>
              <div style={{ textAlign: 'right' }}><b style={{ color: 'var(--accent)' }}>NT$ {fmt(p.bonus)}</b><div className="lsub2">獎金計算</div></div>
            </div>
          ))}
          <p className="hint" style={{ marginTop: '0.6rem' }}>獎金依訂單狀況（未付款／已付款／待出貨／已出貨／已取消）與金流（現金／電子支付）統計。</p>
        </>
      )}
    </div>
  )
}
