import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { addLine, CartBar, cartCount, CartModal, changeLineQty, Empty, Field, Icon, LocationAccordion, Modal, toast, type CartLine } from '../../../components'
import { ostatusClass, STATUS_ALL } from '../../../lib/orders'
import { fmt, uid } from '../../../lib/utils'
import { OngoingBanner, ReviewCard, SubHead } from '../components'
import { IMG } from '../../../api/mocks/guide'
import { useGuide } from '../store'
import type { Notice, NoticeType, OngoingTour } from '../../../api/types/guide'

type MgTab = 'plan' | 'photo' | 'buy' | 'notice' | 'call' | 'review'
const TABS: [MgTab, string][] = [['plan', '行程安排'], ['photo', '照片分享'], ['buy', '購買狀況'], ['notice', '每日公告'], ['call', '呼叫團員'], ['review', '查看評價']]
const NOTICE_TYPES: NoticeType[] = ['晨喚', '集合時間與地點', '行程概述', '旅行社公告']

/* ── 照片分享 ── */
function ShareModal({ tour, onClose }: { tour: OngoingTour; onClose: () => void }) {
  const { data, commit } = useGuide()
  const fileRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [scope, setScope] = useState<'all' | 'ind'>('all')
  const [picked, setPicked] = useState<string[]>([])
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  function publish() {
    if (!files.length) return toast('請先選擇照片', 'alert-circle')
    if (scope === 'ind' && !picked.length) return toast('請選擇至少一位團員', 'alert-circle')
    const who = scope === 'all' ? '所有團員' : picked.map((id) => data.members.find((m) => m.id === id)?.name).join('、')
    onClose()
    commit(() => {}, { type: 'sharePhotos', tourId: tour.tourId, files, memberIds: scope === 'all' ? 'all' : picked }, `已發佈 ${files.length} 張照片給${who}`)
  }

  return (
    <Modal onClose={onClose} title="分享給團員" sub="選擇照片與發佈對象">
      <Field label="選擇照片">
        <div className="upload-zone" onClick={() => fileRef.current?.click()}>
          <Icon name="photo-up" /><p className="muted" style={{ fontSize: 13, marginTop: 6 }}>點擊選擇要分享的照片</p>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => setFiles([...(e.target.files || [])])} />
        </div>
        {files.length > 0 && <p className="hint">已選擇 {files.length} 張照片</p>}
      </Field>
      <Field label="發佈對象">
        <div className="seg">
          <button className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>所有團員</button>
          <button className={scope === 'ind' ? 'on' : ''} onClick={() => setScope('ind')}>個別團員</button>
        </div>
      </Field>
      {scope === 'ind' && (
        <div className="mpick">
          {data.members.map((m) => (
            <button key={m.id} className={`mp ${picked.includes(m.id) ? 'on' : ''}`} onClick={() => toggle(m.id)}><img src={m.av} alt="" />{m.name}</button>
          ))}
        </div>
      )}
      <button className="btn btn-primary btn-block btn-lg" onClick={publish}><Icon name="send" />發佈照片</button>
    </Modal>
  )
}

function PhotoPane({ tour }: { tour: OngoingTour }) {
  const [sharing, setSharing] = useState(false)
  const recent: [string, string][] = [[IMG.kyoto, '清水寺'], [IMG.tokyo, '二年坂'], [IMG.hokkaido, '嵐山'], [IMG.hualien, '午餐'], [IMG.seoul, '祇園'], [IMG.bangkok, '合照']]
  return (
    <>
      <div className="share-card">
        <div className="share-ico accent-soft"><Icon name="upload" /></div>
        <div className="share-txt"><h4>分享給團員</h4><p>選擇照片，發佈給個別或所有團員</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => setSharing(true)}>選擇照片與發佈</button>
      </div>
      <div className="share-card">
        <div className="share-ico info-soft"><Icon name="download" /></div>
        <div className="share-txt"><h4>來自團員</h4><p>團員上傳的照片，可瀏覽並下載</p></div>
        <button className="btn btn-ghost btn-sm" onClick={() => toast('已開啟團員相簿，可下載照片', 'download')}>選擇照片與下載</button>
      </div>
      <div className="section-title sm" style={{ marginTop: '1.25rem' }}><Icon name="photo" />近期分享</div>
      <div className="photo-grid rounded">
        {recent.map(([src, cap]) => <div className="cell" key={cap}><img src={src} alt={cap} loading="lazy" /><div className="cap">{cap}</div></div>)}
      </div>
      {sharing && <ShareModal tour={tour} onClose={() => setSharing(false)} />}
    </>
  )
}

/* ── 購買狀況：各團員訂單 ── */
function BuyPane({ tour }: { tour: OngoingTour }) {
  const { data, commit } = useGuide()
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const total = Object.values(tour.memberOrders).flat().filter((o) => o.status !== '已取消').reduce((s, o) => s + o.amount, 0)

  function setStatus(memberId: string, orderId: string, status: (typeof STATUS_ALL)[number], msg: string, icon?: 'x') {
    commit((d) => {
      const o = d.ongoing.find((t) => t.tourId === tour.tourId)?.memberOrders[memberId]?.find((x) => x.id === orderId)
      if (o) o.status = status
    }, { type: 'updateMemberOrder', tourId: tour.tourId, memberId, orderId, status }, msg, icon)
  }

  return (
    <>
      <div className="section-title sm"><Icon name="receipt" />訂單明細<span className="title-aside">團體合計 NT$ {fmt(total)}</span></div>
      {data.members.map((m) => {
        const orders = tour.memberOrders[m.id] || []
        if (!orders.length) return null
        const sum = orders.reduce((s, o) => s + o.amount, 0)
        return (
          <div className="mem-group" key={m.id}>
            <button className="mem-head" onClick={() => setOpen({ ...open, [m.id]: !open[m.id] })}>
              <img className="mem-av" src={m.av} alt="" />
              <div style={{ flex: 1 }}><div className="mem-name">{m.name}</div><div className="mem-sum">{orders.length} 筆 · NT$ {fmt(sum)}</div></div>
              <Icon name="chevron-down" className={`loc-chev ${open[m.id] ? 'open' : ''}`} />
            </button>
            {open[m.id] && (
              <div className="mem-body">
                {orders.map((o) => (
                  <div className={`order-row ${o.status === '已取消' ? 'cancelled' : ''}`} key={o.id}>
                    <div className="order-main"><div className="order-name">{o.product}</div><div className="order-sub">數量 {o.qty} · NT$ {fmt(o.amount)}</div></div>
                    <span className={`ostatus ${ostatusClass(o.status)}`}>{o.status}</span>
                    {o.status !== '已取消' && (
                      <div className="order-acts">
                        {/* 修改：依序切換至下一個狀態 */}
                        <button className="oact" onClick={() => {
                          const next = STATUS_ALL[(STATUS_ALL.indexOf(o.status) + 1) % STATUS_ALL.length]
                          setStatus(m.id, o.id, next, `${m.name}：${o.product} → ${next}`)
                        }}><Icon name="edit" />修改</button>
                        <button className="oact del" onClick={() => setStatus(m.id, o.id, '已取消', '已取消訂單', 'x')}><Icon name="x" />取消</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

/* ── 每日公告 ── */
function NoticeModal({ tour, notice, onClose }: { tour: OngoingTour; notice: Notice | null; onClose: () => void }) {
  const { commit } = useGuide()
  const [type, setType] = useState<NoticeType>(notice?.type || '晨喚')
  const [headline, setHeadline] = useState(notice?.headline || '')
  const [body, setBody] = useState(notice?.body || '')

  function save(pub: boolean) {
    if (!headline.trim()) return toast('請輸入標題', 'alert-circle')
    const n: Notice = { id: notice?.id || uid('nt'), type, headline: headline.trim(), body: body.trim(), pub, time: pub ? '剛剛' : '草稿' }
    onClose()
    commit((d) => {
      const t = d.ongoing.find((x) => x.tourId === tour.tourId)!
      const i = t.notices.findIndex((x) => x.id === n.id)
      if (i >= 0) t.notices[i] = n
      else t.notices.unshift(n)
    }, { type: 'saveNotice', tourId: tour.tourId, notice: n }, pub ? '公告已發佈給團員 📢' : '已存為草稿')
  }

  return (
    <Modal onClose={onClose} title={notice ? '修改公告' : '新增公告'} sub="每日公告">
      <Field label="公告類別">
        <select className="filt full" value={type} onChange={(e) => setType(e.target.value as NoticeType)}>
          {NOTICE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="標題"><input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="例：明日 06:30 晨喚" /></Field>
      <Field label="內容"><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="輸入公告內容…" /></Field>
      <div className="action-2">
        <button className="btn btn-ghost" onClick={() => save(false)}><Icon name="device-floppy" />存為草稿</button>
        <button className="btn btn-primary" onClick={() => save(true)}><Icon name="speakerphone" />發佈公告</button>
      </div>
    </Modal>
  )
}

function NoticePane({ tour }: { tour: OngoingTour }) {
  const { commit } = useGuide()
  const [editing, setEditing] = useState<Notice | 'new' | null>(null)

  const publish = (n: Notice) => commit((d) => {
    const x = d.ongoing.find((t) => t.tourId === tour.tourId)!.notices.find((y) => y.id === n.id)
    if (x) { x.pub = true; x.time = '剛剛' }
  }, { type: 'saveNotice', tourId: tour.tourId, notice: { ...n, pub: true, time: '剛剛' } }, '公告已發佈 📢')

  const remove = (id: string) => commit((d) => {
    const t = d.ongoing.find((x) => x.tourId === tour.tourId)!
    t.notices = t.notices.filter((x) => x.id !== id)
  }, { type: 'deleteNotice', tourId: tour.tourId, id }, '已刪除公告', 'trash')

  return (
    <>
      <button className="btn btn-primary btn-block" style={{ marginBottom: '1rem' }} onClick={() => setEditing('new')}><Icon name="plus" />新增公告</button>
      {tour.notices.length ? tour.notices.map((n) => (
        <div className="crud-card" key={n.id}>
          <div className="crud-top"><span className={`crud-badge ${n.pub ? 'pub' : 'draft'}`}>{n.type}</span><div className="crud-title">{n.headline}</div></div>
          <div className="crud-body">{n.body}</div>
          <div className="crud-meta"><Icon name="clock" />{n.time} · {n.pub ? '已發佈' : '草稿'}</div>
          <div className="crud-acts">
            {!n.pub && <button className="oact pay" onClick={() => publish(n)}><Icon name="speakerphone" />發佈</button>}
            <button className="oact" onClick={() => setEditing(n)}><Icon name="edit" />修改</button>
            <button className="oact del" onClick={() => remove(n.id)}><Icon name="trash" />刪除</button>
          </div>
        </div>
      )) : <Empty icon="speakerphone" text="尚無公告" hint="點上方按鈕新增每日公告" />}
      {editing && <NoticeModal key={editing === 'new' ? 'new' : editing.id} tour={tour} notice={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  )
}

/* ── 呼叫團員：群體 / 個別 → 對話 ── */
function CallPane({ tour }: { tour: OngoingTour }) {
  const { data } = useGuide()
  const nav = useNavigate()
  return (
    <>
      <button className="btn btn-primary btn-block" style={{ marginBottom: '1rem' }} onClick={() => nav(`/guide/chat/${tour.chatKey}`)}>
        <Icon name="users" />群體呼叫（全體團員）
      </button>
      <div className="section-title sm"><Icon name="phone-call" />個別呼叫</div>
      {data.members.map((m) => (
        <div className="guide-strip" style={{ marginBottom: '0.6rem' }} key={m.id}>
          <img src={m.av} alt={m.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="g-name">{m.name}</div>
            <div className="g-role ellipsis">{data.chats[m.id]?.msgs.at(-1)?.text || '尚無對話紀錄'}</div>
          </div>
          <button className="icon-btn accent" onClick={() => nav(`/guide/chat/${m.id}`)} aria-label={`與 ${m.name} 對話`}><Icon name="message" /></button>
        </div>
      ))}
    </>
  )
}

function ReviewPane({ tour }: { tour: OngoingTour }) {
  const rv = tour.reviews
  const avg = rv.length ? (rv.reduce((s, r) => s + r.rating, 0) / rv.length).toFixed(1) : '—'
  return (
    <>
      <div className="inc-sum-card" style={{ marginBottom: '1rem' }}><div className="k">團體平均評價</div><div className="v">{avg} / 5.0 · {rv.length} 則</div></div>
      {rv.length ? rv.map((r, i) => <ReviewCard key={i} review={r} />) : <Empty icon="star" text="尚無評價" />}
    </>
  )
}

/* 進行中行程管理：/guide/tours/:tourId/manage?tab= */
export default function Manage() {
  const { tourId } = useParams()
  const { data, commit } = useGuide()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as MgTab) || 'plan'
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const tour = data.ongoing.find((t) => t.tourId === tourId)
  if (!tour) return <Navigate to="/guide/tours" replace />

  const souvenirs = tour.locations.flatMap((l) => l.souvenirs)

  function addToCart(id: string) {
    const s = souvenirs.find((x) => x.id === id)
    if (!s) return
    setCart((c) => addLine(c, { id, name: s.name, price: s.price }))
    toast('已加入購物車：' + s.name, 'shopping-cart-plus')
  }

  function confirmOrder() {
    if (!cart.length) return toast('購物車是空的', 'alert-circle')
    const items = cart.map(({ id, qty }) => ({ id, qty }))
    setCart([]); setCartOpen(false)
    commit(() => {}, { type: 'placeGroupOrder', tourId: tour!.tourId, items }, `已為團體確認下單 ${cartCount(cart)} 件`)
  }

  return (
    <section className="screen active">
      <SubHead title={tour.title} back="/guide/tours" />
      <OngoingBanner tour={tour} />
      <div style={{ padding: '0.9rem 1.1rem 0' }}>
        <div className="dtabs scroll">
          {TABS.map(([k, label]) => (
            <button key={k} className={`dtab ${tab === k ? 'active' : ''}`} onClick={() => setParams({ tab: k }, { replace: true })}>{label}</button>
          ))}
        </div>
      </div>
      <div className="pad mg-pane">
        {tab === 'plan' && (
          <>
            <p className="muted" style={{ fontSize: 13, marginBottom: '0.9rem' }}>各地點紀念商品清單，可為團體加入購物車並下單。</p>
            <LocationAccordion locations={tour.locations} onAdd={addToCart} />
          </>
        )}
        {tab === 'photo' && <PhotoPane tour={tour} />}
        {tab === 'buy' && <BuyPane tour={tour} />}
        {tab === 'notice' && <NoticePane tour={tour} />}
        {tab === 'call' && <CallPane tour={tour} />}
        {tab === 'review' && <ReviewPane tour={tour} />}
      </div>

      {tab === 'plan' && <CartBar cart={cart} onOpen={() => setCartOpen(true)} />}
      {cartOpen && (
        <CartModal sub="紀念商品團體下單" cart={cart} onQty={(id, d) => setCart((c) => changeLineQty(c, id, d))} onConfirm={confirmOrder}
          onClose={() => setCartOpen(false)} onCancel={() => { setCart([]); setCartOpen(false); toast('已取消下單', 'trash') }} />
      )}
    </section>
  )
}
