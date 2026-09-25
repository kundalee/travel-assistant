import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { addLine, AsyncButton, CartBar, cartCount, type CartLine, CartModal, cartTotal, changeLineQty, Empty, Field, Icon, LocationAccordion, Modal, QueryState, StatusGroups, toast, useBusy } from '../../../components'
import { ostatusClass, type OrderStatus } from '../../../lib/orders'
import { fmt } from '../../../lib/utils'
import { AlbumModal, PhotoGrid, RadioCards, SubHead } from '../components'
import { PAY_META } from '../../../api/mocks/traveler'
import { useAlbum, usePlaceOrder, useSharePhotos, useTripOrderActions, useTrips } from '../queries'
import type { Fulfillment, OngoingTrip, PayMethod, TripOrder } from '../../../api/types/traveler'

type OgTab = 'plan' | 'photo' | 'buy'
const TABS: [OgTab, string][] = [['plan', '行程安排'], ['photo', '照片分享'], ['buy', '我的購買']]

const PAY_OPTIONS: { key: PayMethod; icon: 'credit-card' | 'wallet' | 'device-mobile' | 'cash'; title: string; desc: string }[] = [
  { key: 'card', icon: 'credit-card', title: '信用卡', desc: 'VISA / Master / JCB 線上刷卡' },
  { key: 'linepay', icon: 'wallet', title: 'LINE Pay', desc: '綁定 LINE 一鍵付款' },
  { key: 'mobilepay', icon: 'device-mobile', title: 'Apple Pay / Google Pay', desc: '手機感應快速結帳' },
  { key: 'guide', icon: 'cash', title: '現場付款給領隊', desc: '集合時由領隊收款、勾稽' },
]
const SHIP_OPTIONS: { key: Fulfillment; icon: 'map-pin' | 'truck'; title: string; desc: string }[] = [
  { key: 'pickup', icon: 'map-pin', title: '集結地點取貨', desc: '由領隊於集合地點交付' },
  { key: 'ship', icon: 'truck', title: '宅配回台灣', desc: '回國後宅配到府' },
]

function CheckoutModal({ trip, cart, onDone, onClose }: { trip: OngoingTrip; cart: CartLine[]; onDone: () => void; onClose: () => void }) {
  const placeOrder = usePlaceOrder(trip.tourId)
  const [pay, setPay] = useState<PayMethod>('card')
  const [ship, setShip] = useState<Fulfillment>('pickup')
  const twd = cartTotal(cart)
  const lc = trip.currency
  const kind = PAY_META[pay].kind
  const payNote = { instant: '線上付款成功後，訂單即轉為「已付款」。', deferred: '取得繳費資訊後請於期限內繳費，入帳後轉為「已付款」。', onsite: '訂單先保留為「未付款」，集合時由領隊現場收款並勾稽。' }[kind]
  const shipNote = ship === 'pickup' ? '由領隊於集結地點交付。' : '回國後宅配至台灣府上（可能另有運費／關稅）。'
  const submitLabel = kind === 'instant' ? `確認付款 NT$ ${fmt(twd)}` : kind === 'deferred' ? '取得繳費資訊' : '送出訂單（現場付款）'

  async function place() {
    const n = cartCount(cart)
    const r = await placeOrder.mutateAsync({ items: cart.map(({ id, qty }) => ({ id, qty })), method: pay, fulfillment: ship })
    toast(r.payment?.type === 'cvs' ? `已產生超商繳費代碼 ${r.payment.code}，請於期限內繳費`
      : r.payment?.type === 'atm' ? `請轉帳至 ${r.payment.bank} 虛擬帳號 ${r.payment.account}`
      : kind === 'instant' ? `付款成功，已完成 ${n} 件訂單` : '訂單已送出，集合時由領隊收款',
    kind === 'instant' ? 'circle-check' : 'clock')
    onDone()
  }

  return (
    <Modal onClose={onClose} title="結帳" sub="選擇付款與取貨方式">
      <div className="section-title sm"><Icon name="credit-card" />付款方式</div>
      <RadioCards options={PAY_OPTIONS} value={pay} onChange={setPay} />
      <div className="section-title sm" style={{ marginTop: '1.1rem' }}><Icon name="package" />取貨方式</div>
      <RadioCards options={SHIP_OPTIONS} value={ship} onChange={setShip} />
      <div className="co-summary">
        <div className="co-line"><span>商品合計（{cartCount(cart)} 件）</span><span className="co-total">NT$ {fmt(twd)}</span></div>
        {lc && <div className="co-line"><span>當地幣別參考</span><span className="co-local">約 {lc.sym}{fmt(Math.round(twd * lc.per))} {lc.code}</span></div>}
        <div className="co-note"><Icon name="info-circle" /><span>{payNote}<br />{shipNote}</span></div>
      </div>
      <AsyncButton className="btn btn-primary btn-block btn-lg" style={{ marginTop: '0.9rem' }} onClick={place}><Icon name="check" />{submitLabel}</AsyncButton>
      <p className="hint" style={{ textAlign: 'center', marginTop: '0.75rem' }}>金額以新台幣結算；當地幣別金額僅供參考。此為流程展示，未進行實際扣款。</p>
    </Modal>
  )
}

function QtyModal({ order, onSave, onClose }: { order: TripOrder; onSave: (qty: number) => Promise<unknown>; onClose: () => void }) {
  const [qty, setQty] = useState(order.qty)
  return (
    <Modal center onClose={onClose} title="修改數量" sub={order.product}>
      <Field label="數量">
        <div className="qty qty-lg">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="減少"><Icon name="minus" /></button><span>{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} aria-label="增加"><Icon name="plus" /></button>
        </div>
      </Field>
      <AsyncButton className="btn btn-primary btn-block" onClick={() => onSave(qty)}><Icon name="check" />更新</AsyncButton>
    </Modal>
  )
}

function PhotoPane({ trip }: { trip: OngoingTrip }) {
  const albumQ = useAlbum()
  const sharePhotos = useSharePhotos(trip.tourId)
  const [album, setAlbum] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, runUpload] = useBusy()
  function share(files: File[]) {
    if (!files.length) return
    void runUpload(async () => {
      const r = await sharePhotos.mutateAsync(files).catch(() => undefined)
      if (r) toast(`已發佈 ${r.count} 張照片給領隊與團員`)
    })
  }
  return (
    <>
      <div className="share-card">
        <div className="share-ico accent-soft"><Icon name="upload" /></div>
        <div className="share-txt"><h4>分享給導遊領隊</h4><p>選擇您拍攝的照片，發佈給領隊與團員</p></div>
        <button className="btn btn-primary btn-sm" disabled={uploading} aria-busy={uploading || undefined} onClick={() => fileRef.current?.click()}>{uploading ? '發佈中…' : '選擇照片與發佈'}</button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { share([...(e.target.files || [])]); e.target.value = '' }} />
      </div>
      <div className="share-card">
        <div className="share-ico info-soft"><Icon name="download" /></div>
        <div className="share-txt"><h4>來自於導遊領隊</h4><p>領隊當團拍攝的照片，可瀏覽並下載</p></div>
        <button className="btn btn-ghost btn-sm" onClick={() => setAlbum(true)}>選擇照片與下載</button>
      </div>
      <div className="section-title sm" style={{ marginTop: '1.25rem' }}><Icon name="photo" />當團最新照片</div>
      <QueryState queries={[albumQ]}>{() => <PhotoGrid photos={albumQ.data!.slice(0, 6)} className="rounded" />}</QueryState>
      {album && <AlbumModal name={trip.title} onClose={() => setAlbum(false)} />}
    </>
  )
}

function BuyPane({ trip }: { trip: OngoingTrip }) {
  const actions = useTripOrderActions(trip.tourId)
  const [filter, setFilter] = useState<OrderStatus | '全部'>('全部')
  const [editing, setEditing] = useState<TripOrder | null>(null)
  const orders = trip.orders
  if (!orders.length) return <Empty icon="receipt-off" text="尚無訂單" hint="於「行程安排」選購紀念商品後，訂單明細會顯示於此" />
  const total = orders.filter((o) => o.status !== '已取消').reduce((s, o) => s + o.amount, 0)

  /* 付款 / 取消 / 改數量皆以後端回應的訂單為準（見 useTripOrderActions） */
  const run = async (call: () => Promise<TripOrder>, msg: string, icon?: 'x') => {
    await call()
    toast(msg, icon)
  }

  return (
    <>
      <div className="section-title sm"><Icon name="receipt" />訂單明細<span className="title-aside">合計 NT$ {fmt(total)}</span></div>
      <StatusGroups rows={orders} filter={filter} onFilter={setFilter}
        render={(o) => (
          <div className={`order-row ${o.status === '已取消' ? 'cancelled' : ''}`} key={o.id}>
            <div className="order-main">
              <div className="order-name">{o.product}</div>
              <div className="order-sub">數量 {o.qty} · NT$ {fmt(o.amount)}</div>
              {o.method && (
                <div className="order-tags">
                  <span className="order-tag"><Icon name="credit-card" />{PAY_META[o.method].label}</span>
                  <span className="order-tag"><Icon name={o.fulfillment === 'ship' ? 'truck' : 'map-pin'} />{o.fulfillment === 'ship' ? '宅配回台灣' : '集結地點取貨'}</span>
                  {o.local && <span className="order-tag">{o.local.sym}{fmt(o.local.amount)} {o.local.code}</span>}
                </div>
              )}
            </div>
            <span className={`ostatus ${ostatusClass(o.status)}`}>{o.status}</span>
            {(o.status === '未付款' || o.status === '待出貨') && (
              <div className="order-acts">
                {o.status === '未付款' && <AsyncButton className="oact pay" onClick={() => run(() => actions.pay.mutateAsync(o.id), '付款成功')}><Icon name="credit-card" />付款</AsyncButton>}
                <button className="oact" onClick={() => setEditing(o)}><Icon name="edit" />修改</button>
                <AsyncButton className="oact del" onClick={() => run(() => actions.cancel.mutateAsync(o.id), '訂單已取消', 'x')}><Icon name="x" />取消</AsyncButton>
              </div>
            )}
          </div>
        )} />
      {editing && (
        <QtyModal order={editing} onClose={() => setEditing(null)} onSave={async (qty) => {
          await run(() => actions.updateQty.mutateAsync({ orderId: editing.id, qty }), '已更新數量')
          setEditing(null)
        }} />
      )}
    </>
  )
}

/* 進行中行程管理：/traveler/my-tours/:tourId?tab= */
export default function Ongoing() {
  const { tourId } = useParams()
  const trips = useTrips()
  return (
    <QueryState queries={[trips]}>{() => {
      const trip = trips.data!.ongoing.find((t) => t.tourId === tourId)
      return trip ? <OngoingView trip={trip} /> : <Navigate to="/traveler/my-tours?tab=ongoing" replace />
    }}</QueryState>
  )
}

function OngoingView({ trip }: { trip: OngoingTrip }) {
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as OgTab) || 'plan'
  const [cart, setCart] = useState<CartLine[]>([])
  const [dialog, setDialog] = useState<'cart' | 'checkout' | null>(null)

  const setTab = (t: OgTab) => setParams({ tab: t }, { replace: true })

  function addToCart(id: string) {
    const s = trip.locations.flatMap((l) => l.souvenirs).find((x) => x.id === id)
    if (!s) return
    setCart((c) => addLine(c, { id, name: s.name, price: s.price }))
    toast('已加入購物車：' + s.name, 'shopping-cart-plus')
  }

  return (
    <section className="screen active">
      <SubHead title={trip.title} back="/traveler/my-tours?tab=ongoing" />
      <div className="ong-banner">
        <img src={trip.img} alt="" />
        <div className="ong-banner-info"><div className="ong-day">{trip.day}</div><h3>{trip.title}</h3><span>{trip.dates} · 領隊 {trip.guide}</span></div>
        <button className="ong-call" onClick={() => { nav(`/traveler/chat?c=${trip.chatKey}`); toast('已為您接通領隊聊天室', 'phone-call') }}><Icon name="phone-call" />呼叫領隊</button>
      </div>
      <div className="dtabs" style={{ margin: '1rem 1.1rem 0' }}>
        {TABS.map(([k, label]) => <button key={k} className={`dtab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}</button>)}
      </div>
      <div className="pad og-pane">
        {tab === 'plan' && <LocationAccordion locations={trip.locations} onAdd={addToCart} />}
        {tab === 'photo' && <PhotoPane trip={trip} />}
        {tab === 'buy' && <BuyPane trip={trip} />}
      </div>

      {tab === 'plan' && <CartBar cart={cart} onOpen={() => setDialog('cart')} />}
      {dialog === 'cart' && (
        <CartModal sub="紀念商品下單" cart={cart} onQty={(id, d) => setCart((c) => changeLineQty(c, id, d))}
          onCancel={() => { setCart([]); setDialog(null); if (cart.length) toast('已取消下單，購物車已清空', 'trash') }}
          onConfirm={() => (cart.length ? setDialog('checkout') : toast('購物車是空的', 'alert-circle'))}
          confirmLabel="前往結帳" confirmIcon="arrow-right" onClose={() => setDialog(null)}
          footer={<p className="hint" style={{ textAlign: 'center', marginTop: '0.75rem' }}>下一步選擇付款方式與取貨方式，此為流程展示。</p>} />
      )}
      {dialog === 'checkout' && (
        <CheckoutModal trip={trip} cart={cart} onClose={() => setDialog(null)} onDone={() => { setCart([]); setDialog(null); setTab('buy') }} />
      )}
    </section>
  )
}
