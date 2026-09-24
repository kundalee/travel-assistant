import { Empty, Icon, PageHead } from '../../../components'
import { useAdmin } from '../store'
import { stars } from '../utils'

export function Bookings() {
  const { data, update } = useAdmin()
  return (
    <div className="pad">
      <PageHead icon="clipboard-check" title="報名審核" />
      {data.bookings.length ? data.bookings.map((b) => (
        <div className="lrow" key={b.id}>
          <div className="lmain">
            <div className="lname">{b.name}</div>
            <div className="lsub">{b.tour_title} · {b.phone}</div>
            <div className="lsub2">{b.created_at}</div>
          </div>
          {b.status === 'approved'
            ? <span className="rbadge on">已核准</span>
            : <div className="lacts"><button className="iconbtn-sm" title="核准" onClick={() => update('bookings', b.id, { status: 'approved' }, '已核准報名')}><Icon name="check" /></button></div>}
        </div>
      )) : <Empty text="尚無報名" />}
    </div>
  )
}

export function Reviews() {
  const { data } = useAdmin()
  return (
    <div className="pad">
      <PageHead icon="star" title="評價管理" />
      {data.reviews.length ? data.reviews.map((r) => (
        <div className="lrow" key={r.id}>
          <div className="lmain">
            <div className="lname">{r.reviewer_name || '—'} <span style={{ color: 'var(--gold)', fontSize: 13 }}>{stars(r.rating)}</span></div>
            <div className="lsub">{r.tour_title}</div>
            <div className="lsub2" style={{ whiteSpace: 'normal' }}>{r.text}</div>
          </div>
        </div>
      )) : <Empty text="尚無評價" />}
    </div>
  )
}

export function Campaigns() {
  const { data } = useAdmin()
  return (
    <div className="pad">
      <PageHead icon="discount" title="行銷 / 團購" />
      {data.campaigns.length ? data.campaigns.map((c) => (
        <div className="lrow" key={c.id}>
          <div className="lmain"><div className="lname">{c.title}</div><div className="lsub">{c.channel === 'email' ? 'Email' : 'SMS'}</div></div>
          <span className={`rbadge ${c.published ? 'on' : 'off'}`}>{c.published ? '已發佈' : '草稿'}</span>
        </div>
      )) : <Empty text="尚無行銷訊息" />}
    </div>
  )
}
