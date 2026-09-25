import { AsyncButton, Icon, PageHead, QueryState, toast } from '../../../components'
import { salesApi } from '../../../api/admin'
import { useQueryClient } from '@tanstack/react-query'
import { adminKeys, useAdminData } from '../queries'
import type { AdminData, MonthlySales } from '../../../api/types/admin'
import { errMsg, fmt } from '../utils'

export default function Sales() {
  const { queries, data } = useAdminData('monthly')
  return <QueryState queries={queries}>{() => <SalesView data={data!} />}</QueryState>
}

function SalesView({ data }: { data: Pick<AdminData, 'monthly'> }) {
  const qc = useQueryClient()

  async function send(month: string) {
    try {
      const updated = await salesApi.send({ month })
      qc.setQueryData<MonthlySales[]>(adminKeys.list('monthly'), (l) => l?.map((m) => (m.month === updated.month ? updated : m)))
      toast(month + ' 月銷售額已回傳大後台', 'report-money')
    } catch (e) {
      toast('回傳失敗：' + errMsg(e), 'alert-circle')
    }
  }

  return (
    <div className="pad">
      <PageHead icon="report-money" title="月銷售額回傳" />
      {data.monthly.map((m) => (
        <div className="lrow" key={m.month}>
          <div className="lmain"><div className="lname">{m.month} · {m.agency}</div><div className="lsub">月銷售額 NT$ {fmt(m.amount)}</div></div>
          {m.sent
            ? <span className="rbadge on">已回傳</span>
            : <AsyncButton className="btn btn-primary btn-sm" onClick={() => send(m.month)}><Icon name="send" />回傳</AsyncButton>}
        </div>
      ))}
    </div>
  )
}
