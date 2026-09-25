import { Icon, PageHead, QueryState } from '../../../components'
import { useAdminData } from '../queries'
import type { AdminData } from '../../../api/types/admin'
import { fmt } from '../utils'

export default function Receivable() {
  const { queries, data } = useAdminData('receivables')
  return <QueryState queries={queries}>{() => <ReceivableView data={data!} />}</QueryState>
}

function ReceivableView({ data }: { data: Pick<AdminData, 'receivables'> }) {
  const RECEIVABLE = data.receivables
  const inSum = RECEIVABLE.filter((r) => r.type === '應收').reduce((s, r) => s + r.amount, 0)
  const outSum = RECEIVABLE.filter((r) => r.type === '應付').reduce((s, r) => s + r.amount, 0)
  return (
    <div className="pad">
      <PageHead icon="scale" title="應收應付款" />
      <div className="stat-grid" style={{ marginBottom: '1rem' }}>
        <div className="stat"><div className="k"><Icon name="arrow-down-left" />應收合計</div><div className="v">NT${fmt(inSum)}</div></div>
        <div className="stat"><div className="k"><Icon name="arrow-up-right" />應付合計</div><div className="v">NT${fmt(outSum)}</div></div>
      </div>
      {RECEIVABLE.map((r) => (
        <div className="lrow" key={r.party + r.due}>
          <div className="lmain"><div className="lname">{r.party}</div><div className="lsub">{r.type} · 到期 {r.due}</div></div>
          <div style={{ textAlign: 'right' }}>
            <b style={{ color: r.type === '應收' ? 'var(--ok)' : 'var(--warn)' }}>NT$ {fmt(r.amount)}</b>
            <div className="lsub2">{r.done ? '已結清' : '未結清'}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
