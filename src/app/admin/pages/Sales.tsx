import { Icon, PageHead } from '../../../components'
import { useAdmin } from '../store'
import { fmt } from '../utils'

export default function Sales() {
  const { data, patch, toast } = useAdmin()

  function send(month: string) {
    patch('monthly', (l) => l.map((m) => (m.month === month ? { ...m, sent: true } : m)))
    toast(month + ' 月銷售額已回傳大後台', 'report-money')
  }

  return (
    <div className="pad">
      <PageHead icon="report-money" title="月銷售額回傳" />
      {data.monthly.map((m) => (
        <div className="lrow" key={m.month}>
          <div className="lmain"><div className="lname">{m.month} · {m.agency}</div><div className="lsub">月銷售額 NT$ {fmt(m.amount)}</div></div>
          {m.sent
            ? <span className="rbadge on">已回傳</span>
            : <button className="btn btn-primary btn-sm" onClick={() => send(m.month)}><Icon name="send" />回傳</button>}
        </div>
      ))}
    </div>
  )
}
