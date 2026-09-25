import { AsyncButton, Icon, type IconName, QueryState, toast } from '../../../components'
import { SubHead } from '../components'
import { useMarkAllRead, useNotifications } from '../queries'
import type { Noti } from '../../../api/types/guide'

const NOTI_ICON: Record<Noti['type'], IconName> = { order: 'receipt', msg: 'message-dots', review: 'star', sys: 'speakerphone' }

export default function Notifications() {
  const notis = useNotifications()
  const markAll = useMarkAllRead()

  return (
    <section className="screen active">
      <SubHead title="通知中心" back="/guide">
        <AsyncButton className="btn btn-ghost btn-sm" onClick={async () => { await markAll.mutateAsync(); toast('已全部標為已讀') }}>全部已讀</AsyncButton>
      </SubHead>
      <div className="pad">
        <QueryState queries={[notis]}>{() => notis.data!.map((n) => (
          <div className={`card noti-card ${n.read ? '' : 'unread'}`} key={n.id}>
            <div className="noti-ico"><Icon name={NOTI_ICON[n.type]} /></div>
            <div style={{ flex: 1 }}>
              <div className="noti-top"><h4>{n.title}</h4><span>{n.time}</span></div>
              <p>{n.text}</p>
            </div>
          </div>
        ))}</QueryState>
      </div>
    </section>
  )
}
