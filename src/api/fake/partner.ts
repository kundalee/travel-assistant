/* 假後端：支援店家 */
import { clone } from '../../lib/utils'
import { publicUser } from '../mocks/auth'
import { SAMPLE } from '../mocks/partner'
import type { Profile } from '../types/partner'
import type { Endpoint } from '../endpoints'
import { contentApi, incomeApi, ordersApi, profileApi } from '../partner'
import { json, persisted, requireUser, route, type Ctx } from './server'

const store = persisted('fake_partner_db', () => ({
  ...clone(SAMPLE),
  profiles: {} as Record<string, Omit<Profile, 'email'>>,
}))
const db = () => store.get()

/* 讀取需登入；寫入後保存。端點宣告見 src/api/partner/ */
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

/* ── 店家資料 Profile ── */
/* email 一律取自登入帳號；儲存時整理欄位並回傳儲存結果 */
const partnerProfile = (userId: string): Profile => {
  const u = publicUser(userId)
  return { ...(db().profiles[userId] ?? { name: u?.name ?? '', national_id: '', birthday: '' }), email: u?.email ?? '' }
}
read(profileApi.get, (ctx) => partnerProfile(ctx.userId!))
write(profileApi.save, (ctx) => {
  const { name = '', national_id = '', birthday = '' } = json<Partial<Profile>>(ctx)
  db().profiles[ctx.userId!] = { name: name.trim(), national_id: national_id.trim().toUpperCase(), birthday }
  return partnerProfile(ctx.userId!)
})

/* ── 公告與精品 Content ── */
read(contentApi.notices, () => db().notices)
read(contentApi.boutique, () => db().goods)

/* ── 我的收入 Income ── */
read(incomeApi.get, () => db().income)

/* ── 已取消訂單 Orders ── */
read(ordersApi.cancelled, () => db().cancelled)
write(ordersApi.reconcile, (ctx) => {
  const { orderNos = [], reconciled = true } = json<{ orderNos?: string[]; reconciled?: boolean }>(ctx)
  db().cancelled.forEach((o) => { if (orderNos.includes(o.orderNo)) o.reconciled = reconciled })
})
