/* 假後端：領隊導遊 */
import { clone } from '../../lib/utils'
import { STATUS_ALL, type OrderStatus } from '../../lib/orders'
import { publicUser } from '../mocks/auth'
import { DEMO_PROFILE, IMG, SAMPLE } from '../mocks/guide'
import type { Campaign, ChatMsg, GatherPoint, Notice } from '../types/guide'
import type { Endpoint } from '../endpoints'
import {
  campaignsApi, chatApi, incomeApi, membersApi, noticesApi, notificationsApi, ordersApi, pointsApi, productsApi, profileApi, toursApi,
} from '../guide'
import { FakeError, files, json, persisted, requireUser, route, type Ctx } from './server'

const store = persisted('fake_guide_db', () => clone(SAMPLE))
const db = () => store.get()

/* 讀取需登入；寫入後保存。端點宣告見 src/api/guide/ */
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

const nowId = (p: string) => p + Date.now() + Math.random().toString(36).slice(2, 6)
const ongoing = (tourId: string) => {
  const t = db().ongoing.find((x) => x.tourId === tourId)
  if (!t) throw new FakeError(404, '找不到此進行中行程。')
  return t
}
const selfMsg = (text: string): ChatMsg => ({ self: true, name: '我 (領隊)', av: IMG.guideM, text, time: '剛剛' })

/* 呼叫團員：寫入團購對話（全體 + 各團員） */
function deliverCall(c: Campaign, codes: string[]) {
  const point = db().points.find((p) => p.id === c.pointId)
  const msg = selfMsg(`【${c.title}】${c.body}${point ? '　集結地點：' + point.name : ''}`)
  const gkey = 'dg_' + c.id
  db().dealChats[gkey] ??= { name: c.title + ' · 全體', group: true, msgs: [] }
  db().dealChats[gkey].msgs.push(msg)
  codes.forEach((code) => {
    db().dealChats[code] ??= { name: db().dealOrders.find((o) => o.code === code)?.member ?? code, group: false, msgs: [] }
    db().dealChats[code].msgs.push(msg)
  })
}

/* ── 個人資料 Profile ── */
read(profileApi.get, (ctx) => {
  const u = publicUser(ctx.userId!)
  return { ...DEMO_PROFILE, name: u?.name ?? DEMO_PROFILE.name, email: u?.email ?? '' }
})

/* ── 行程 Tours ── */
read(toursApi.mine, () => ({ ongoing: db().ongoing, upcoming: db().upcoming, completed: db().completed }))
read(toursApi.history, () => db().historyTours)
read(toursApi.photos, (ctx) => {
  ongoing(ctx.params.tourId)
  const pics: [string, string][] = [[IMG.kyoto, '清水寺'], [IMG.tokyo, '二年坂'], [IMG.hokkaido, '嵐山'], [IMG.hualien, '午餐'], [IMG.seoul, '祇園'], [IMG.bangkok, '合照']]
  return {
    shared: pics.map(([src, cap]) => ({ src, cap, up: '王大明 領隊' })),
    fromMembers: [
      { src: IMG.kyoto, cap: '清水舞台', up: '林小美' },
      { src: IMG.hokkaido, cap: '竹林小徑', up: '陳志豪' },
      { src: IMG.bangkok, cap: '晚餐', up: '黃雅婷' },
    ],
  }
})
write(toursApi.sharePhotos, (ctx) => {
  ongoing(ctx.params.tourId)
  const n = files(ctx, 'files').length
  if (!n) throw new FakeError(400, '請先選擇照片。')
  return { count: n }
})

/* ── 團員名冊 Members ── */
read(membersApi.list, () => ({ members: db().members, rosters: db().rosters, pastTours: db().pastTours }))

/* ── 每日公告 Notices ── */
read(noticesApi.list, (ctx) => ongoing(ctx.params.tourId).notices)
write(noticesApi.create, (ctx) => {
  const n: Notice = { ...json<Omit<Notice, 'id' | 'time'>>(ctx), id: nowId('nt'), time: '' }
  if (!n.headline?.trim()) throw new FakeError(400, '請輸入標題。')
  n.time = n.pub ? '剛剛' : '草稿'
  ongoing(ctx.params.tourId).notices.unshift(n)
  return n
})
write(noticesApi.update, (ctx) => {
  const list = ongoing(ctx.params.tourId).notices
  const i = list.findIndex((x) => x.id === ctx.params.noticeId)
  if (i < 0) throw new FakeError(404, '找不到此公告。')
  const n = { ...list[i], ...json<Partial<Notice>>(ctx), id: list[i].id }
  n.time = n.pub ? (list[i].pub ? list[i].time : '剛剛') : '草稿'
  list[i] = n
  return n
})
write(noticesApi.remove, (ctx) => {
  const t = ongoing(ctx.params.tourId)
  if (!t.notices.some((x) => x.id === ctx.params.noticeId)) throw new FakeError(404, '找不到此公告。')
  t.notices = t.notices.filter((x) => x.id !== ctx.params.noticeId)
})

/* ── 訂單 Orders ── */
read(ordersApi.history, () => db().historyOrders)
read(ordersApi.deals, () => db().dealOrders)
write(ordersApi.placeGroupOrder, (ctx) => {
  const t = ongoing(ctx.params.tourId)
  const { items = [] } = json<{ items?: { id: string; qty: number }[] }>(ctx)
  const souvenirs = t.locations.flatMap((l) => l.souvenirs)
  const lines = items.map(({ id, qty }) => {
    const s = souvenirs.find((x) => x.id === id)
    if (!s || qty < 1) throw new FakeError(400, '商品或數量有誤。')
    return { product: s.name, qty, amount: s.price * qty }
  })
  if (!lines.length) throw new FakeError(400, '購物車是空的。')
  return { orderId: nowId('go'), lines, total: lines.reduce((s, l) => s + l.amount, 0) }
})
write(ordersApi.updateMemberOrder, (ctx) => {
  const { status } = json<{ status: OrderStatus }>(ctx)
  if (!STATUS_ALL.includes(status)) throw new FakeError(400, '訂單狀態有誤。')
  const o = ongoing(ctx.params.tourId).memberOrders[ctx.params.memberId]?.find((x) => x.id === ctx.params.orderId)
  if (!o) throw new FakeError(404, '找不到此訂單。')
  if (o.status === '已取消') throw new FakeError(409, '此訂單已取消。')
  o.status = status
  return o
})
write(ordersApi.setDealRecon, (ctx) => {
  const o = db().dealOrders.find((x) => x.id === ctx.params.orderId)
  if (!o) throw new FakeError(404, '找不到此訂單。')
  o.recon = !!json<{ recon?: boolean }>(ctx).recon
  return o
})

/* ── 團購呼叫 Campaigns ── */
read(campaignsApi.list, () => db().campaigns)
write(campaignsApi.create, (ctx) => {
  const c: Campaign = { ...json<Omit<Campaign, 'id' | 'time'>>(ctx), id: nowId('c'), time: '' }
  if (!c.title?.trim()) throw new FakeError(400, '請輸入主旨。')
  if (c.pub && !c.rcpt?.length) throw new FakeError(400, '請先選擇呼叫對象。')
  c.time = c.pub ? '剛剛' : '草稿'
  db().campaigns.unshift(c)
  if (c.pub) deliverCall(c, c.rcpt)
  return c
})
write(campaignsApi.update, (ctx) => {
  const i = db().campaigns.findIndex((x) => x.id === ctx.params.campaignId)
  if (i < 0) throw new FakeError(404, '找不到此呼叫訊息。')
  const prev = db().campaigns[i]
  const c = { ...prev, ...json<Partial<Campaign>>(ctx), id: prev.id }
  c.time = c.pub ? (prev.pub ? prev.time : '剛剛') : '草稿'
  db().campaigns[i] = c
  if (c.pub && !prev.pub) deliverCall(c, c.rcpt)
  return c
})
write(campaignsApi.remove, (ctx) => {
  if (!db().campaigns.some((x) => x.id === ctx.params.campaignId)) throw new FakeError(404, '找不到此呼叫訊息。')
  db().campaigns = db().campaigns.filter((x) => x.id !== ctx.params.campaignId)
})
write(campaignsApi.call, (ctx) => {
  const c = db().campaigns.find((x) => x.id === ctx.params.campaignId)
  if (!c) throw new FakeError(404, '找不到此呼叫訊息。')
  const { codes = [] } = json<{ codes?: string[] }>(ctx)
  if (!codes.length) throw new FakeError(400, '請先選擇呼叫對象。')
  c.pub = true
  c.time = '剛剛'
  c.rcpt = codes
  deliverCall(c, codes)
  return c
})

/* ── 集結地點 Points ── */
read(pointsApi.list, () => db().points)
write(pointsApi.create, (ctx) => {
  const p: GatherPoint = { ...json<Omit<GatherPoint, 'id'>>(ctx), id: nowId('p') }
  if (!p.name?.trim()) throw new FakeError(400, '請輸入地點名稱。')
  db().points.push(p)
  return p
})
write(pointsApi.update, (ctx) => {
  const i = db().points.findIndex((x) => x.id === ctx.params.pointId)
  if (i < 0) throw new FakeError(404, '找不到此集結地點。')
  db().points[i] = { ...db().points[i], ...json<Partial<GatherPoint>>(ctx), id: db().points[i].id }
  return db().points[i]
})
write(pointsApi.remove, (ctx) => {
  if (!db().points.some((x) => x.id === ctx.params.pointId)) throw new FakeError(404, '找不到此集結地點。')
  db().points = db().points.filter((x) => x.id !== ctx.params.pointId)
})

/* ── 精品好物 Products ── */
read(productsApi.boutique, () => db().boutique)
write(productsApi.share, (ctx) => {
  const b = db().boutique.find((x) => x.id === ctx.params.itemId)
  if (!b) throw new FakeError(404, '找不到此商品。')
  const t = db().ongoing[0]
  if (t) db().chats[t.chatKey]?.msgs.push(selfMsg(`推薦好物：${b.name}（NT$ ${b.price}）`))
  return { sharedTo: t?.members ?? 0 }
})

/* ── 我的收入 Income ── */
read(incomeApi.get, () => ({ income: db().income, incomeSummary: db().incomeSummary }))

/* ── 對話 Chat ── */
read(chatApi.list, () => ({ chats: db().chats, dealChats: db().dealChats }))
write(chatApi.send, (ctx) => {
  const { context, chatKey } = ctx.params
  const { text = '' } = json<{ text?: string }>(ctx)
  if (!text.trim()) throw new FakeError(400, '訊息不可空白。')
  const chats = context === 'deal' ? db().dealChats : db().chats
  if (context !== 'deal' && !chats[chatKey]) throw new FakeError(404, '找不到此對話。')
  /* 首次對話：由後端建立（團購個別對話以團員姓名命名） */
  chats[chatKey] ??= {
    name: chatKey === 'dealgroup' ? '團購 · 全體團員' : db().dealOrders.find((o) => o.code === chatKey)?.member ?? chatKey,
    group: chatKey === 'dealgroup', msgs: [],
  }
  const msg = selfMsg(text)
  chats[chatKey].msgs.push(msg)
  return msg
})

/* ── 通知 Notifications ── */
read(notificationsApi.list, () => db().notis)
write(notificationsApi.markAllRead, () => {
  db().notis.forEach((n) => { n.read = true })
})
