import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { addLine, AsyncButton, CartBar, cartCount, type CartLine, CartModal, changeLineQty, confirmDialog, Empty, Field, Icon, LocationAccordion, Modal, QueryState, toast } from '../../../components'
import { ostatusClass, STATUS_ALL } from '../../../lib/orders'
import { fmt } from '../../../lib/utils'
import { OngoingBanner, ReviewCard, SubHead } from '../components'
import {
  useChats, useDeleteNotice, useMembers, useNotices, usePlaceGroupOrder, useSaveNotice, useSharePhotos, useTourPhotos, useTours, useUpdateMemberOrder,
} from '../queries'
import type { Member, Notice, NoticeType, OngoingTour, OrderStatus, TourPhoto } from '../../../api/types/guide'

type MgTab = 'plan' | 'photo' | 'buy' | 'notice' | 'call' | 'review'
const TABS: [MgTab, string][] = [['plan', '行程安排'], ['photo', '照片分享'], ['buy', '購買狀況'], ['notice', '每日公告'], ['call', '呼叫團員'], ['review', '查看評價']]
const NOTICE_TYPES: NoticeType[] = ['晨喚', '集合時間與地點', '行程概述', '旅行社公告']

/* ── 照片分享 ── */
function ShareModal({ tour, members, onClose }: { tour: OngoingTour; members: Member[]; onClose: () => void }) {
  const share = useSharePhotos(tour.tourId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [scope, setScope] = useState<'all' | 'ind'>('all')
  const [picked, setPicked] = useState<string[]>([])
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  /* 發佈成功才關閉；失敗時保留已選的照片 */
  async function publish() {
    if (!files.length) return toast('請先選擇照片', 'alert-circle')
    if (scope === 'ind' && !picked.length) return toast('請選擇至少一位團員', 'alert-circle')
    const who = scope === 'all' ? '所有團員' : picked.map((id) => members.find((m) => m.id === id)?.name).join('、')
    const r = await share.mutateAsync({ files, memberIds: scope === 'all' ? 'all' : picked.join(',') })
    toast(`已發佈 ${r.count} 張照片給${who}`)
    onClose()
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
          {members.map((m) => (
            <button key={m.id} className={`mp ${picked.includes(m.id) ? 'on' : ''}`} onClick={() => toggle(m.id)}><img src={m.av} alt="" />{m.name}</button>
          ))}
        </div>
      )}
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={publish}><Icon name="send" />發佈照片</AsyncButton>
    </Modal>
  )
}

function PhotoGrid({ photos }: { photos: TourPhoto[] }) {
  return (
    <div className="photo-grid rounded">
      {photos.map((p, i) => (
        <a className="cell" key={i} href={p.src} target="_blank" rel="noopener" download title={`${p.cap} · ${p.up}`}>
          <img src={p.src} alt={p.cap} loading="lazy" /><div className="cap">{p.cap}</div>
        </a>
      ))}
    </div>
  )
}

function PhotoPane({ tour, members }: { tour: OngoingTour; members: Member[] }) {
  const [sharing, setSharing] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  /* 開啟照片分享時載入（近期分享 / 來自團員）；分享成功後自動重新讀取 */
  const photosQ = useTourPhotos(tour.tourId)
  const photos = photosQ.data

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
        <button className="btn btn-ghost btn-sm" onClick={() => setMembersOpen(true)} disabled={!photos}>選擇照片與下載</button>
      </div>
      <div className="section-title sm" style={{ marginTop: '1.25rem' }}><Icon name="photo" />近期分享</div>
      <QueryState queries={[photosQ]}>{() => <PhotoGrid photos={photos!.shared} />}</QueryState>
      {sharing && <ShareModal tour={tour} members={members} onClose={() => setSharing(false)} />}
      {membersOpen && photos && (
        <Modal onClose={() => setMembersOpen(false)} title="來自團員" sub={`${photos.fromMembers.length} 張 · 點選照片即可下載`}>
          {photos.fromMembers.length ? <PhotoGrid photos={photos.fromMembers} /> : <Empty icon="photo-off" text="團員尚未上傳照片" />}
        </Modal>
      )}
    </>
  )
}

/* ── 購買狀況：各團員訂單 ── */
function BuyPane({ tour, members }: { tour: OngoingTour; members: Member[] }) {
  const update = useUpdateMemberOrder(tour.tourId)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const total = Object.values(tour.memberOrders).flat().filter((o) => o.status !== '已取消').reduce((s, o) => s + o.amount, 0)

  async function setStatus(memberId: string, orderId: string, status: OrderStatus, msg: string, icon?: 'x') {
    await update.mutateAsync({ memberId, orderId, status })
    toast(msg, icon)
  }

  return (
    <>
      <div className="section-title sm"><Icon name="receipt" />訂單明細<span className="title-aside">團體合計 NT$ {fmt(total)}</span></div>
      {members.map((m) => {
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
                        <AsyncButton className="oact" onClick={() => {
                          const next = STATUS_ALL[(STATUS_ALL.indexOf(o.status) + 1) % STATUS_ALL.length]
                          return setStatus(m.id, o.id, next, `${m.name}：${o.product} → ${next}`)
                        }}><Icon name="edit" />修改</AsyncButton>
                        <AsyncButton className="oact del" onClick={() => setStatus(m.id, o.id, '已取消', '已取消訂單', 'x')}><Icon name="x" />取消</AsyncButton>
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

/* ── 每日公告（TanStack Query：資料與寫入見 ../queries/notices.ts） ── */
function NoticeModal({ tourId, notice, onClose }: { tourId: string; notice: Notice | null; onClose: () => void }) {
  const save = useSaveNotice(tourId)
  const [type, setType] = useState<NoticeType>(notice?.type || '晨喚')
  const [headline, setHeadline] = useState(notice?.headline || '')
  const [body, setBody] = useState(notice?.body || '')

  async function submit(pub: boolean) {
    if (!headline.trim()) return toast('請輸入標題', 'alert-circle')
    await save.mutateAsync({ ...notice, type, headline: headline.trim(), body: body.trim(), pub })
    toast(pub ? '公告已發佈給團員 📢' : '已存為草稿')
    onClose()
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
      {/* save.isPending：任一按鈕送出中時兩者皆停用 */}
      <div className="action-2">
        <AsyncButton className="btn btn-ghost" disabled={save.isPending} onClick={() => submit(false)}><Icon name="device-floppy" />存為草稿</AsyncButton>
        <AsyncButton className="btn btn-primary" disabled={save.isPending} onClick={() => submit(true)}><Icon name="speakerphone" />發佈公告</AsyncButton>
      </div>
    </Modal>
  )
}

function NoticePane({ tourId }: { tourId: string }) {
  const notices = useNotices(tourId)
  const save = useSaveNotice(tourId)
  const del = useDeleteNotice(tourId)
  const [editing, setEditing] = useState<Notice | 'new' | null>(null)

  const publish = async (n: Notice) => {
    await save.mutateAsync({ ...n, pub: true })
    toast('公告已發佈 📢')
  }

  const remove = (n: Notice) => confirmDialog({
    title: '刪除公告？',
    message: n.pub ? `「${n.headline}」已發佈給團員，刪除後團員將看不到此公告。` : `草稿「${n.headline}」將被刪除。`,
    confirmLabel: '刪除', danger: true,
    onConfirm: async () => {
      await del.mutateAsync(n.id)
      toast('已刪除公告', 'trash')
    },
  })

  return (
    <>
      <button className="btn btn-primary btn-block" style={{ marginBottom: '1rem' }} onClick={() => setEditing('new')}><Icon name="plus" />新增公告</button>
      <QueryState queries={[notices]}>{() => notices.data!.length ? notices.data!.map((n) => (
          <div className="crud-card" key={n.id}>
            <div className="crud-top"><span className={`crud-badge ${n.pub ? 'pub' : 'draft'}`}>{n.type}</span><div className="crud-title">{n.headline}</div></div>
            <div className="crud-body">{n.body}</div>
            <div className="crud-meta"><Icon name="clock" />{n.time} · {n.pub ? '已發佈' : '草稿'}</div>
            <div className="crud-acts">
              {!n.pub && <AsyncButton className="oact pay" onClick={() => publish(n)}><Icon name="speakerphone" />發佈</AsyncButton>}
              <button className="oact" onClick={() => setEditing(n)}><Icon name="edit" />修改</button>
              <button className="oact del" onClick={() => remove(n)}><Icon name="trash" />刪除</button>
            </div>
          </div>
        )) : <Empty icon="speakerphone" text="尚無公告" hint="點上方按鈕新增每日公告" />}</QueryState>
      {editing && <NoticeModal key={editing === 'new' ? 'new' : editing.id} tourId={tourId} notice={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  )
}

/* ── 呼叫團員：群體 / 個別 → 對話 ── */
function CallPane({ tour, members }: { tour: OngoingTour; members: Member[] }) {
  const chats = useChats()
  const nav = useNavigate()
  return (
    <>
      <button className="btn btn-primary btn-block" style={{ marginBottom: '1rem' }} onClick={() => nav(`/guide/chat/${tour.chatKey}`)}>
        <Icon name="users" />群體呼叫（全體團員）
      </button>
      <div className="section-title sm"><Icon name="phone-call" />個別呼叫</div>
      {members.map((m) => (
        <div className="guide-strip" style={{ marginBottom: '0.6rem' }} key={m.id}>
          <img src={m.av} alt={m.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="g-name">{m.name}</div>
            <div className="g-role ellipsis">{chats.data?.chats[m.id]?.msgs.at(-1)?.text || (chats.isPending ? '…' : '尚無對話紀錄')}</div>
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
  const { tourId = '' } = useParams()
  const tours = useTours()
  const members = useMembers()
  return (
    <QueryState queries={[tours, members]}>{() => {
      const tour = tours.data!.ongoing.find((t) => t.tourId === tourId)
      return tour ? <ManageView tour={tour} members={members.data!.members} /> : <Navigate to="/guide/tours" replace />
    }}</QueryState>
  )
}

function ManageView({ tour, members }: { tour: OngoingTour; members: Member[] }) {
  const placeOrder = usePlaceGroupOrder(tour.tourId)
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as MgTab) || 'plan'
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  const souvenirs = tour.locations.flatMap((l) => l.souvenirs)

  function addToCart(id: string) {
    const s = souvenirs.find((x) => x.id === id)
    if (!s) return
    setCart((c) => addLine(c, { id, name: s.name, price: s.price }))
    toast('已加入購物車：' + s.name, 'shopping-cart-plus')
  }

  async function confirmOrder() {
    if (!cart.length) return toast('購物車是空的', 'alert-circle')
    await placeOrder.mutateAsync(cart.map(({ id, qty }) => ({ id, qty })))
    toast(`已為團體確認下單 ${cartCount(cart)} 件`)
    setCart([])
    setCartOpen(false)
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
        {tab === 'photo' && <PhotoPane tour={tour} members={members} />}
        {tab === 'buy' && <BuyPane tour={tour} members={members} />}
        {tab === 'notice' && <NoticePane tourId={tour.tourId} />}
        {tab === 'call' && <CallPane tour={tour} members={members} />}
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
