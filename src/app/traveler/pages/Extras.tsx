import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { addLine, AsyncButton, CartBar, cartCount, CartModal, changeLineQty, Chips, Empty, Icon, QueryState, Tabs, toast } from '../../../components'
import { ostatusClass, STATUS_ALL, type OrderStatus } from '../../../lib/orders'
import { fmt } from '../../../lib/utils'
import { AlbumModal, BoutiqueCard, GroupBuyCard, NoticeCard, Screen, SubHead } from '../components'
import {
  useBoutique, useGroupBuy, useHealth, useHistoryOrders, useHistoryTours, useMarkAllRead, useNotices, useNotifications, usePlaceGroupBuy, useUploadVitals,
} from '../queries'
import { useGbCart } from '../store'
import type { GroupBuyItem, NoticeType, Vitals } from '../../../api/types/traveler'

/* 公告：/traveler/notices?tab=（開啟時將通知標為已讀） */
export function Notices() {
  const notices = useNotices()
  const notis = useNotifications()
  const markAll = useMarkAllRead()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as NoticeType) || '每日公告'
  const hasUnread = !!notis.data?.some((n) => !n.read)
  const markAllRead = markAll.mutate

  useEffect(() => {
    if (hasUnread) markAllRead()
  }, [hasUnread, markAllRead])

  return (
    <Screen>
      <SubHead title="公告" back="/traveler" />
      <div className="pad">
        <Tabs<NoticeType> value={tab} onChange={(t) => setParams({ tab: t }, { replace: true })} tabs={[['每日公告', '每日公告'], ['一般公告', '一般公告']]} />
        <p className="hint" style={{ marginBottom: '0.8rem' }}>{tab === '每日公告' ? '由領隊導遊發佈' : '由旅行社公司發佈'}</p>
        <QueryState queries={[notices]}>{() => {
          const list = notices.data!.filter((n) => n.type === tab)
          return <div className="stack">{list.length ? list.map((n) => <NoticeCard key={n.title} n={n} />) : <Empty icon="speakerphone" text={`目前沒有${tab}`} />}</div>
        }}</QueryState>
      </div>
    </Screen>
  )
}

/* 防疫監控：軌跡定位 / 人際關係追蹤 / 體溫血壓（無網路時暫存） */
const MAP_POINTS: [number, number][] = [[18, 70], [35, 48], [58, 58], [78, 32]]

export function Epidemic() {
  const health = useHealth()
  const uploadVitals = useUploadVitals()
  const [vitals, setVitals] = useState<Vitals>({ temp: 36.5, bp: '118/76' })
  const [pending, setPending] = useState<Vitals[]>([])
  const hot = vitals.temp >= 37.5

  function measure() {
    const v = {
      temp: Math.round((36.2 + Math.random() * 1.6) * 10) / 10,
      bp: `${110 + Math.floor(Math.random() * 25)}/${70 + Math.floor(Math.random() * 15)}`,
    }
    setVitals(v)
    setPending((p) => [...p, v])
    toast(v.temp >= 37.5 ? '體溫偏高，請留意並通知領隊' : '量測完成', v.temp >= 37.5 ? 'alert-triangle' : 'device-watch')
  }

  /* 回傳成功才清除暫存；失敗時保留，可再試 */
  async function upload() {
    if (!pending.length) return toast('沒有待回傳的資料', 'cloud-check')
    const records = pending
    const r = await uploadVitals.mutateAsync(records)
    setPending((p) => p.slice(records.length))
    toast(`已回傳 ${r.count} 筆量測資料至後台`, 'cloud-upload')
  }

  return (
    <Screen>
      <SubHead title="防疫監控" back="/traveler">
        <span className={`sync-chip ${pending.length ? 'off' : 'ok'}`}>
          <Icon name={pending.length ? 'cloud-off' : 'cloud-check'} />{pending.length ? `暫存 ${pending.length} 筆` : '已同步'}
        </span>
      </SubHead>
      <div className="pad">
        <div className="epi-card">
          <div className="epi-head"><div className="epi-ico"><Icon name="map-pin" /></div>
            <div style={{ flex: 1 }}><h4>軌跡定位與電子地圖</h4><p>行程期間自動記錄足跡，供防疫追蹤</p></div></div>
          <div className="map-box">
            <svg className="map-path" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points={MAP_POINTS.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="2 1.5" opacity="0.55" />
            </svg>
            {MAP_POINTS.map(([x, y], i) => <div key={i} className={`map-pin ${i === MAP_POINTS.length - 1 ? 'me' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} />)}
          </div>
          <QueryState queries={[health]}>{() => health.data!.trace.map((t) => <div className="trace-row" key={t.t}><span className="t">{t.t}</span><Icon name="map-pin" className="accent" /><span>{t.place}</span></div>)}</QueryState>
        </div>

        <div className="epi-card">
          <div className="epi-head"><div className="epi-ico"><Icon name="users-group" /></div>
            <div style={{ flex: 1 }}><h4>人際關係追蹤</h4><p>同團接觸者與鄰近旅團紀錄</p></div></div>
          <QueryState queries={[health]}>{() => health.data!.contacts.map((c) => (
            <div className="trace-row" key={c.name}>
              <Icon name="users" className="accent" />
              <span style={{ flex: 1 }}>{c.name}<div className="trace-note">{c.note}</div></span><b>{c.n}</b>
            </div>
          ))}</QueryState>
        </div>

        <div className="epi-card">
          <div className="epi-head"><div className="epi-ico"><Icon name="heart-rate-monitor" /></div>
            <div style={{ flex: 1 }}><h4>體溫與血壓量測</h4><p>資料自動回傳後台；無網路時先暫存</p></div></div>
          <div className="vital-grid">
            <div className={`vital ${hot ? 'warn' : ''}`}><div className="k"><Icon name="temperature" />體溫</div><div className="v">{vitals.temp.toFixed(1)} <small>°C</small></div></div>
            <div className="vital"><div className="k"><Icon name="activity-heartbeat" />血壓</div><div className="v">{vitals.bp} <small>mmHg</small></div></div>
          </div>
          <div className="action-2" style={{ marginTop: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={measure}><Icon name="device-watch" />量測</button>
            <AsyncButton className="btn btn-primary btn-sm" onClick={upload}><Icon name="cloud-upload" />回傳後台</AsyncButton>
          </div>
          <p className="hint" style={{ marginTop: 8 }}>
            {pending.length ? `目前無網路，已暫存 ${pending.length} 筆量測資料，恢復連線後會自動回傳後台。` : '量測資料會自動回傳後台。'}
          </p>
        </div>
      </div>
    </Screen>
  )
}

/* 團購搶好康（購物車跨畫面保留） */
export function GroupBuy() {
  const groupbuy = useGroupBuy()
  const place = usePlaceGroupBuy()
  const [gbCart, setGbCart] = useGbCart()
  const [open, setOpen] = useState(false)

  function add(g: GroupBuyItem) {
    setGbCart((c) => addLine(c, { id: g.id, name: g.name, price: g.price }))
    toast('已加入購物車：' + g.name, 'shopping-cart-plus')
  }

  async function confirm() {
    if (!gbCart.length) return toast('購物車是空的', 'alert-circle')
    const n = cartCount(gbCart)
    await place.mutateAsync(gbCart.map(({ id, qty }) => ({ id, qty })))
    toast(`已確認下單 ${n} 件，請至歷史訂單完成付款`)
    setGbCart([])
    setOpen(false)
  }

  return (
    <Screen>
      <SubHead title="團購搶好康" back="/traveler" />
      <div className="pad">
        <p className="page-sub">限時團購價，於集結地點取貨或宅配回台。</p>
        <QueryState queries={[groupbuy]}>{() => groupbuy.data!.map((g) => <GroupBuyCard key={g.id} g={g} onAdd={() => add(g)} />)}</QueryState>
      </div>
      <CartBar cart={gbCart} onOpen={() => setOpen(true)} />
      {open && (
        <CartModal title="團購購物車" sub="團購搶好康下單" cart={gbCart} onQty={(id, d) => setGbCart((c) => changeLineQty(c, id, d))}
          onCancel={() => { setGbCart([]); setOpen(false); toast('已取消下單', 'trash') }} onConfirm={confirm} onClose={() => setOpen(false)} />
      )}
    </Screen>
  )
}

export function BoutiquePage() {
  const boutique = useBoutique()
  return (
    <Screen>
      <SubHead title="精品好物分享" back="/traveler" />
      <div className="pad">
        <p className="page-sub">領隊嚴選商品內容，可透過外接購物系統購買。</p>
        <QueryState queries={[boutique]}>{() => boutique.data!.map((b) => <BoutiqueCard key={b.name} b={b} />)}</QueryState>
      </div>
    </Screen>
  )
}

/* 歷史訂單（5 狀態） */
export function Orders() {
  const orders = useHistoryOrders()
  const [filter, setFilter] = useState<OrderStatus | '全部'>('全部')
  return (
    <Screen>
      <SubHead title="歷史訂單" back="/traveler/me" />
      <div className="pad">
        <Chips<OrderStatus | '全部'> style={{ marginBottom: '0.9rem' }} value={filter} onChange={setFilter}
          items={(['全部', ...STATUS_ALL] as (OrderStatus | '全部')[]).map((s) => [s, s])} />
        <QueryState queries={[orders]}>{() => {
          const list = orders.data!.filter((o) => filter === '全部' || o.status === filter)
          return list.length ? list.map((o) => (
          <div className={`order-row ${o.status === '已取消' ? 'cancelled' : ''}`} key={o.id}>
            <div className="order-main"><div className="order-name">{o.product}</div><div className="order-sub">{o.date} · {o.tour} · NT$ {fmt(o.amount)}</div></div>
            <span className={`ostatus ${ostatusClass(o.status)}`}>{o.status}</span>
          </div>
          )) : <Empty icon="receipt-off" text="查無此狀態訂單" />
        }}</QueryState>
      </div>
    </Screen>
  )
}

/* 歷史行程（旅遊回憶） */
export function History() {
  const historyTours = useHistoryTours()
  const [album, setAlbum] = useState<string | null>(null)
  return (
    <Screen>
      <SubHead title="歷史行程" back="/traveler/me" />
      <div className="pad">
        <QueryState queries={[historyTours]}>{() => historyTours.data!.map((t) => (
          <div className="hist-card" key={t.title}>
            <img src={t.img} alt="" loading="lazy" />
            <div style={{ flex: 1 }}><h4>{t.title}</h4><div className="meta-row" style={{ marginTop: 3 }}><Icon name="calendar" />{t.dates}</div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => setAlbum(t.title)}><Icon name="camera-heart" />旅遊回憶</button>
          </div>
        ))}</QueryState>
      </div>
      {album && <AlbumModal name={album} onClose={() => setAlbum(null)} />}
    </Screen>
  )
}
