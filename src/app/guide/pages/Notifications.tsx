import { Icon, type IconName } from '../../../components'
import { SubHead } from '../components'
import { useGuide } from '../store'
import type { Noti } from '../../../api/types/guide'

const NOTI_ICON: Record<Noti['type'], IconName> = { order: 'receipt', msg: 'message-dots', review: 'star', sys: 'speakerphone' }

export default function Notifications() {
  const { data, commit } = useGuide()
  const markAll = () => commit((d) => { d.notis.forEach((n) => { n.read = true }) }, { type: 'markNotisRead' }, '已全部標為已讀')

  return (
    <section className="screen active">
      <SubHead title="通知中心" back="/guide">
        <button className="btn btn-ghost btn-sm" onClick={markAll}>全部已讀</button>
      </SubHead>
      <div className="pad">
        {data.notis.map((n) => (
          <div className={`card noti-card ${n.read ? '' : 'unread'}`} key={n.id}>
            <div className="noti-ico"><Icon name={NOTI_ICON[n.type]} /></div>
            <div style={{ flex: 1 }}>
              <div className="noti-top"><h4>{n.title}</h4><span>{n.time}</span></div>
              <p>{n.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
