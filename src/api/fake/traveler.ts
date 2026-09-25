/* 假後端：團員 */
import { clone } from '../../lib/utils'
import type { OrderStatus } from '../../lib/orders'
import { publicUser } from '../mocks/auth'
import { CCY, EMPTY_PROFILE, IMG, PAY_META, SAMPLE } from '../mocks/traveler'
import type { Fulfillment, PayMethod, TravelerProfile, TripOrder, Vitals } from '../types/traveler'
import type { Endpoint } from '../endpoints'
import { chatApi, healthApi, noticesApi, ordersApi, photosApi, productsApi, profileApi, reviewsApi, tripsApi } from '../traveler'
import { FakeError, field, files, json, persisted, requireUser, route, type Ctx } from './server'

const store = persisted('fake_traveler_db', () => ({
  ...clone(SAMPLE),
  profiles: {} as Record<string, TravelerProfile>,
  favorites: [] as string[],
  vitals: [] as (Vitals & { userId: string; at: number })[],
}))
const db = () => store.get()

/* 讀取需登入；寫入後保存。端點宣告見 src/api/traveler/ */
type Api = { endpoint: Endpoint }
const read = (api: Api, pick: (ctx: Ctx) => unknown) =>
  route(api, (ctx) => { requireUser(ctx); return pick(ctx) })

const write = (api: Api, fn: (ctx: Ctx) => unknown) =>
  route(api, (ctx) => {
    requireUser(ctx)
    const out = fn(ctx)
    store.save()
    return out
  })

const ongoingTrip = (tourId: string) => {
  const t = db().ongoing.find((x) => x.tourId === tourId)
  if (!t) throw new FakeError(404, '找不到此行程。')
  return t
}
const tripOrder = (tourId: string, orderId: string) => {
  const o = ongoingTrip(tourId).orders.find((x) => x.id === orderId)
  if (!o) throw new FakeError(404, '找不到此訂單。')
  return o
}
const nowId = (p: string) => p + Date.now() + Math.random().toString(36).slice(2, 6)
const today = () => new Date().toISOString().slice(0, 10).replace(/-/g, '/')

/* ── 個人資料 Profile ── */
/* email 一律取自登入帳號；儲存時整理欄位並回傳儲存結果 */
const travelerProfile = (userId: string): TravelerProfile => {
  const u = publicUser(userId)
  return { ...(db().profiles[userId] ?? { ...EMPTY_PROFILE, name: u?.name ?? '' }), email: u?.email ?? '' }
}
read(profileApi.get, (ctx) => travelerProfile(ctx.userId!))
write(profileApi.save, (ctx) => {
  const body = json<Partial<TravelerProfile>>(ctx)
  const trimmed = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]))
  db().profiles[ctx.userId!] = { ...travelerProfile(ctx.userId!), ...trimmed, passport: String(trimmed.passport ?? '').toUpperCase() } as TravelerProfile
  return travelerProfile(ctx.userId!)
})
write(profileApi.uploadPassportPhoto, (ctx) => {
  if (!files(ctx, 'file').length) throw new FakeError(400, '請選擇照片。')
  return { url: IMG.me }
})

/* ── 行程 Trips ── */
read(tripsApi.catalog, () => db().catalog)
/* 進行中行程附上當地幣別（依目的地國家） */
const currencyOf = (dest: string) => CCY[(dest.split(',').pop() || '').trim()]
read(tripsApi.mine, () => ({ upcoming: db().upcoming, ongoing: db().ongoing.map((t) => ({ ...t, currency: currencyOf(t.dest) })), completed: db().completed }))
read(tripsApi.history, () => db().historyTours)
write(tripsApi.book, (ctx) => {
  const { tourId } = json<{ tourId: string }>(ctx)
  const t = db().catalog.find((x) => x.id === tourId)
  if (!t) throw new FakeError(404, '找不到此行程。')
  if (db().upcoming.some((x) => x.tourId === tourId)) throw new FakeError(409, '您已報名此行程。')
  const bookingId = nowId('bk')
  const trip = {
    tourId, title: t.title, dest: t.dest, img: t.img, dates: t.dates, meetTime: '待通知', meetPlace: '待通知',
    guide: t.guide, guideRole: '領隊導遊', phone: '—', guideImg: IMG.guideM, qr: 'TA-' + bookingId.toUpperCase(),
  }
  db().upcoming.push(trip)
  return { bookingId, status: 'pending', trip }
})

/* ── 訂單 Orders ── */
read(ordersApi.history, () => db().historyOrders)
write(ordersApi.place, (ctx) => {
  const trip = ongoingTrip(ctx.params.tourId)
  const { items = [], method, fulfillment } = json<{ items: { id: string; qty: number }[]; method: PayMethod; fulfillment: Fulfillment }>(ctx)
  const souvenirs = trip.locations.flatMap((l) => l.souvenirs)
  const kind = PAY_META[method]?.kind
  if (!kind) throw new FakeError(400, '不支援的付款方式。')
  const lc = currencyOf(trip.dest)
  const orders: TripOrder[] = items.map(({ id, qty }) => {
    const s = souvenirs.find((x) => x.id === id)
    if (!s || qty < 1) throw new FakeError(400, '商品或數量有誤。')
    const amount = s.price * qty
    return {
      id: nowId('o'), product: s.name, qty, amount, method, fulfillment,
      status: (kind === 'instant' ? '已付款' : '未付款') as OrderStatus,
      local: lc ? { code: lc.code, sym: lc.sym, amount: Math.round(amount * lc.per) } : undefined,
    }
  })
  trip.orders.push(...orders)
  const total = orders.reduce((s, o) => s + o.amount, 0)
  /* 延後付款：回傳繳費資訊（超商代碼 / ATM 虛擬帳號） */
  const payment = method === 'cvs' ? { type: 'cvs', code: 'CVS' + Date.now().toString().slice(-10), total }
    : method === 'atm' ? { type: 'atm', bank: '812', account: '9' + Date.now().toString().slice(-13), total }
    : null
  return { orders, payment }
})
write(ordersApi.updateQty, (ctx) => {
  const o = tripOrder(ctx.params.tourId, ctx.params.orderId)
  const { qty } = json<{ qty: number }>(ctx)
  if (!(qty >= 1)) throw new FakeError(400, '數量至少 1。')
  const unit = Math.round(o.amount / o.qty)
  o.qty = qty
  o.amount = unit * qty
  return o
})
write(ordersApi.pay, (ctx) => {
  const o = tripOrder(ctx.params.tourId, ctx.params.orderId)
  if (o.status !== '未付款') throw new FakeError(409, '此訂單無需付款。')
  o.status = '已付款'
  return o
})
write(ordersApi.cancel, (ctx) => {
  const o = tripOrder(ctx.params.tourId, ctx.params.orderId)
  if (o.status !== '未付款' && o.status !== '待出貨') throw new FakeError(409, '此訂單已無法取消。')
  o.status = '已取消'
  return o
})
write(ordersApi.placeGroupBuy, (ctx) => {
  const { items = [] } = json<{ items: { id: string; qty: number }[] }>(ctx)
  const rows = items.map(({ id, qty }) => {
    const g = db().groupbuy.find((x) => x.id === id)
    if (!g || qty < 1) throw new FakeError(400, '商品或數量有誤。')
    return { id: nowId('g'), product: g.name, tour: '團購搶好康', date: today(), amount: g.price * qty, status: '未付款' as OrderStatus }
  })
  db().historyOrders.unshift(...rows)
  return rows
})

/* ── 商品 Products ── */
read(productsApi.boutique, () => db().boutique)
read(productsApi.groupBuy, () => db().groupbuy)

/* ── 相簿 Photos ── */
read(photosApi.album, () => db().album.map((p) => ({ ...p, favorite: db().favorites.includes(p.id) })))
write(photosApi.share, (ctx) => {
  ongoingTrip(ctx.params.tourId)
  return { count: files(ctx, 'files').length }
})
write(photosApi.uploadToAlbum, (ctx) => ({ count: files(ctx, 'files').length }))
write(photosApi.favorite, (ctx) => {
  if (!db().album.some((p) => p.id === ctx.params.photoId)) throw new FakeError(404, '找不到此照片。')
  if (!db().favorites.includes(ctx.params.photoId)) db().favorites.push(ctx.params.photoId)
})

/* ── 評價與回憶 Reviews ── */
write(reviewsApi.create, (ctx) => {
  const t = db().completed.find((x) => x.tourId === field(ctx, 'tourId'))
  const rating = Number(field(ctx, 'rating'))
  if (!(rating >= 1 && rating <= 5)) throw new FakeError(400, '評分需為 1–5。')
  if (t) { t.reviewed = true; t.rating = rating }
  return { reviewId: nowId('rv') }
})
write(reviewsApi.publishMemory, (ctx) => {
  const n = files(ctx, 'files').length
  if (!n) throw new FakeError(400, '請至少選擇一張照片。')
  const t = db().completed.find((x) => x.tourId === field(ctx, 'tourId'))
  if (t) t.memories += n
  return { count: n }
})

/* ── 聊天 Chat ── */
read(chatApi.list, () => db().chats)
write(chatApi.send, (ctx) => {
  const chat = db().chats[ctx.params.chatKey]
  if (!chat) throw new FakeError(404, '找不到此聊天室。')
  const { text = '' } = json<{ text?: string }>(ctx)
  if (!text.trim()) throw new FakeError(400, '訊息不可空白。')
  const now = new Date()
  const msg = { self: true, name: '我', av: IMG.me, text, time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}` }
  chat.msgs.push(msg)
  return msg
})

/* ── 公告與通知 Notices ── */
read(noticesApi.notices, () => db().notices)
read(noticesApi.notifications, () => db().notis)
write(noticesApi.markAllRead, () => {
  db().notis.forEach((n) => { n.read = true })
})

/* ── 防疫監控 Health ── */
read(healthApi.get, () => ({ trace: db().trace, contacts: db().contacts }))
write(healthApi.uploadVitals, (ctx) => {
  const { records = [] } = json<{ records: Vitals[] }>(ctx)
  db().vitals.push(...records.map((r) => ({ ...r, userId: ctx.userId!, at: Date.now() })))
  return { count: records.length }
})
