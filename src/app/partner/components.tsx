import { Icon } from '../../components'
import type { Good, Notice } from '../../api/types/partner'

export function NoticeGrid({ notices }: { notices: Notice[] }) {
  return (
    <div className="grid grid-2">
      {notices.map((n) => (
        <div className="card hoverable notice-card" key={n.title}>
          <div className={`notice-ico ${n.type}`}><Icon name={n.type === 'warn' ? 'alert-triangle' : 'info-circle'} /></div>
          <div><h3>{n.title}</h3><div className="meta">{n.date} · 注意事項</div><p className="body">{n.body}</p></div>
        </div>
      ))}
    </div>
  )
}

export function GoodsGrid({ goods }: { goods: Good[] }) {
  return (
    <div className="grid grid-3">
      {goods.map((g) => (
        <div className="card hoverable" key={g.name}>
          <div className="row-center" style={{ gap: 10, marginBottom: 8 }}>
            <div className="notice-ico info"><Icon name="diamond" /></div>
            <div><h3>{g.name}</h3><div className="meta">{g.note}</div></div>
          </div>
          <div className="row-between">
            <span className="price-tag">NT$ {g.price}</span>
            <button className="btn btn-ghost btn-sm"><Icon name="external-link" />詳情</button>
          </div>
        </div>
      ))}
    </div>
  )
}
