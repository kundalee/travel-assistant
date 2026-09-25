/* 假後端：後台管理 */
import { clone } from '../../lib/utils'
import { IMG, RECEIVABLE, ROSTER_SEED, SAMPLE, STATS, VITALS, ZONES } from '../mocks/admin'
import type { AdminCollections, RosterEntry, Tour } from '../types/admin'
import type { Endpoint } from '../endpoints'
import {
  aiApi, announcementsApi, bookingsApi, campaignsApi, ordersApi, placesApi, productsApi, reportsApi, reviewsApi, salesApi, toursApi,
  trackingApi, usersApi, vendorsApi,
} from '../admin'
import { FakeError, json, persisted, requireUser, route, type Ctx } from './server'

const store = persisted('fake_admin_db', () => clone(SAMPLE))
const db = () => store.get()

type Key = keyof AdminCollections
type Row = { id: string }

/* 需登入；寫入後保存。端點宣告見 src/api/admin/ */
const handler = (fn: (ctx: Ctx) => unknown, save = false) => (ctx: Ctx) => {
  requireUser(ctx)
  const out = fn(ctx)
  if (save) store.save()
  return out
}
const list = (key: Key) => db()[key] as unknown as Row[]
const nowId = (p: string) => p + Date.now() + Math.random().toString(36).slice(2, 6)
const find = (key: Key, id: string) => {
  const row = list(key).find((x) => x.id === id)
  if (!row) throw new FakeError(404, '找不到此筆資料。')
  return row
}

/* ── 團員名冊：帳號預設 email、密碼預設電話（無電話則由系統產生） ── */
const batch = (t: Tour) => `${t.title}_${(t.start_date || '').replace(/-/g, '')}-${t.batch_seq || 1}團`
function hashStr(x: string) { let h = 0; for (let i = 0; i < x.length; i++) { h = ((h << 5) - h) + x.charCodeAt(i); h |= 0 } return h }
function roster(t: Tour): RosterEntry[] {
  return (ROSTER_SEED[t.id] || []).map((m, i) => ({
    ...m,
    code: `${batch(t)}_${String(i + 1).padStart(3, '0')}`,
    loginId: m.email,
    loginPw: m.phone || 'TA' + String(Math.abs(hashStr(m.email))).slice(0, 6),
    pwSource: m.phone ? '電話' : '系統自訂',
  }))
}
const withCount = (t: Tour): Tour => ({ ...t, member_count: (ROSTER_SEED[t.id] || []).length })

/* ── 清單 CRUD：依資源檔宣告的操作（list / create / update / remove）實作 ── */
type Api = { endpoint: Endpoint }
type CollectionApi = { list: Api; create?: Api; update?: Api; remove?: Api }
/* init：新增時由後端補上的預設值 */
function collection(key: Key, api: CollectionApi, prefix: string, map = (r: Row) => r as unknown, init = (_r: Row) => {}) {
  route(api.list, handler(() => list(key).map(map)))
  if (api.create) {
    route(api.create, handler((ctx) => {
      const row = { ...json<object>(ctx), id: nowId(prefix) } as Row
      init(row)
      list(key).unshift(row)
      return map(row)
    }, true))
  }
  if (api.update) {
    route(api.update, handler((ctx) => {
      const row = find(key, ctx.params.id)
      Object.assign(row, json<object>(ctx), { id: row.id })
      return map(row)
    }, true))
  }
  if (api.remove) {
    route(api.remove, handler((ctx) => {
      find(key, ctx.params.id)
      ;(db()[key] as unknown as Row[]) = list(key).filter((x) => x.id !== ctx.params.id)
      /* 刪除地點時一併自行程移除 */
      if (key === 'places') db().tours.forEach((t) => { if (t.places) t.places = t.places.filter((p) => p !== ctx.params.id) })
    }, true))
  }
}

collection('users', usersApi, 'u')
collection('tours', toursApi, 't', (r) => withCount(r as Tour), (r) => { (r as Tour).img_url ||= IMG.kyoto })
collection('orders', ordersApi, 'o')
collection('bookings', bookingsApi, 'b')
collection('reviews', reviewsApi, 'r')
collection('announcements', announcementsApi, 'an')
collection('campaigns', campaignsApi, 'c')
collection('products', productsApi, 'p')
collection('places', placesApi, 'pl')
collection('vendors', vendorsApi, 'v')

/* ── 行程：名冊 / CRM 同步 ── */
route(toursApi.members, handler((ctx) => roster(find('tours', ctx.params.id) as Tour)))
route(toursApi.syncCrm, handler(() => ({
  syncedAt: new Date().toLocaleString('zh-TW', { hour12: false }),
  tours: db().tours.map(withCount),
})))

/* ── 月銷售額 ── */
route(salesApi.list, handler(() => db().monthly))
route(salesApi.send, handler((ctx) => {
  const m = db().monthly.find((x) => x.month === ctx.params.month)
  if (!m) throw new FakeError(404, '找不到此月份。')
  if (m.sent) throw new FakeError(409, '此月份已回傳。')
  m.sent = true
  return m
}, true))

/* ── 團體追蹤 ── */
route(trackingApi.get, handler(() => ({ groups: db().trackingGroups, vitals: VITALS, zones: ZONES })))
route(trackingApi.location, handler((ctx) => {
  const g = db().trackingGroups.find((x) => x.id === ctx.params.groupId)
  if (!g) throw new FakeError(404, '找不到此旅遊團。')
  g.lat += (Math.random() - 0.5) * 0.004
  g.lng += (Math.random() - 0.5) * 0.004
  g.updated = '剛剛'
  return g
}, true))
route(trackingApi.exportTocc, handler(() => ({ filename: `TOCC_${new Date().toISOString().slice(0, 10)}.csv`, rows: db().trackingGroups.length })))

/* ── 報表 ── */
route(reportsApi.stats, handler(() => STATS))
route(reportsApi.receivables, handler(() => RECEIVABLE))

/* ── AI 許願池（示範回覆） ── */
route(aiApi.chat, handler((ctx) => {
  const { message = '' } = json<{ message?: string }>(ctx)
  if (!message.trim()) throw new FakeError(400, '請輸入問題。')
  const top = STATS.rankSouvenir[0]
  return { reply: `（示範回覆）依目前資料，最熱銷紀念商品為「${top.n}」（${top.v} 件）。可於「統計分析報表 → 商品分析」查看完整排名。` }
}))
