/* 假後端：後台管理 */
import { clone } from '../../lib/utils'
import { IMG, RECEIVABLE, ROSTER_SEED, SAMPLE, STATS, VITALS, ZONES } from '../mocks/admin'
import type {
  AdminCollections, ImportJob, ItineraryItem, ItineraryItemCreate, ItineraryItemProductWrite, ItineraryItemUpdate, RosterEntry, Shop, ShopCreate, ShopProduct, ShopProductCreate, ShopProductUpdate, ShopUpdate, Tour, User, UserCreate, UserUpdate,
} from '../types/admin'
import type { Endpoint } from '../endpoints'
import {
  aiApi, announcementsApi, bookingsApi, campaignsApi, ordersApi, placesApi, productsApi, reportsApi, reviewsApi, salesApi, toursApi,
  trackingApi, usersApi, shopsApi, shopProductsApi, itineraryItemsApi,
} from '../admin'
import { FakeError, files, json, persisted, requireUser, route, type Ctx } from './server'

const store = persisted('fake_admin_db_v3', () => clone(SAMPLE))
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

/* 帳號：與真正後端相同（數字 id、初始密碼至少 8 碼、email 不可重複；回傳不含密碼） */
route(usersApi.list, handler(() => db().users))
route(usersApi.create, handler((ctx) => {
  const { password = '', ...input } = json<UserCreate>(ctx)
  if (password.length < 8) throw new FakeError(422, 'body.password: String should have at least 8 characters')
  if (!input.roles?.length) throw new FakeError(422, 'body.roles: List should have at least 1 item')
  if (db().users.some((u) => u.email.toLowerCase() === input.email?.toLowerCase())) throw new FakeError(409, 'Email already registered')
  const user: User = {
    id: Math.max(0, ...db().users.map((u) => u.id)) + 1, email: input.email, full_name: input.full_name, phone: input.phone || null,
    roles: input.roles, is_active: true, last_login_at: null, created_at: new Date().toISOString(),
  }
  db().users.push(user)
  return user
}, true))
route(usersApi.update, handler((ctx) => {
  const user = db().users.find((u) => String(u.id) === ctx.params.id)
  if (!user) throw new FakeError(404, 'User not found')
  const changes = json<UserUpdate>(ctx)
  Object.entries(changes).forEach(([k, v]) => { if (v !== undefined) (user as unknown as Record<string, unknown>)[k] = v })
  return user
}, true))
collection('tours', toursApi, 't', (r) => withCount(r as Tour), (r) => { (r as Tour).img_url ||= IMG.kyoto })
collection('orders', ordersApi, 'o')
collection('bookings', bookingsApi, 'b')
collection('reviews', reviewsApi, 'r')
collection('announcements', announcementsApi, 'an')
collection('campaigns', campaignsApi, 'c')
collection('products', productsApi, 'p')
collection('places', placesApi, 'pl')
/* 支援店家：與真正後端相同（數字 id；name、agency_rate 0–1、settlement_cycle 必填；agency_rate 以 4 位小數字串回傳） */
const rate = (v: unknown) => {
  const n = Number(v)
  if (v === '' || v == null || !(n >= 0 && n <= 1)) throw new FakeError(422, 'body.agency_rate: Input should be between 0 and 1')
  return n.toFixed(4)
}
const shopCountry = (v: unknown) => {
  if (v == null || v === '') return null
  if (!/^[A-Za-z]{2}$/.test(String(v))) throw new FakeError(422, 'body.country: Value error, country must be an ISO 3166-1 alpha-2 code such as JP, TW or US')
  return String(v).toUpperCase()
}
route(shopsApi.list, handler(() => db().shops))
route(shopsApi.create, handler((ctx) => {
  const input = json<ShopCreate>(ctx)
  if (!input.name?.trim()) throw new FakeError(422, 'body.name: String should have at least 1 character')
  if (!['per_tour', 'monthly'].includes(input.settlement_cycle)) throw new FakeError(422, "body.settlement_cycle: Input should be 'per_tour' or 'monthly'")
  const shop: Shop = {
    id: Math.max(0, ...db().shops.map((s) => s.id)) + 1, name: input.name, contact_name: input.contact_name ?? null, phone: input.phone ?? null,
    email: input.email ?? null, address: input.address ?? null, city: input.city ?? null, country: shopCountry(input.country),
    agency_rate: rate(input.agency_rate), settlement_cycle: input.settlement_cycle, is_active: input.is_active ?? true,
    place_ids: input.place_ids ?? [], created_at: new Date().toISOString(),
  }
  db().shops.push(shop)
  return shop
}, true))
/* 刪除：連同此店家的商品一起刪除（假後端沒有行程停靠點，不會拒絕） */
route(shopsApi.remove, handler((ctx) => {
  if (!db().shops.some((s) => String(s.id) === ctx.params.id)) throw new FakeError(404, 'Shop not found')
  db().shops = db().shops.filter((s) => String(s.id) !== ctx.params.id)
  db().products = db().products.filter((p) => p.vendor_id !== ctx.params.id)
  pdb().products = pdb().products.filter((p) => String(p.shop_id) !== ctx.params.id)
  pstore.save()
}, true))
/* ── 店家的商品：與真正後端相同（數字 id；SKU 於店家內不可重複且不能修改；price / 分潤比例以小數字串回傳；
      匯入 CSV 全部正確才寫入，否則依列回報錯誤）。假後端的 Excel 匯入只回報錯誤 ── */
const PRODUCT_COLUMNS = ['sku', 'name', 'description', 'category', 'image_url', 'price', 'currency', 'stock', 'default_commission_share', 'sale_start', 'sale_end', 'is_on_sale']
const seedProduct = (id: number, shop_id: number, sku: string, name: string, category: string, price: number, currency: string, stock: number | null, share: number): ShopProduct => ({
  id, shop_id, sku, name, description: null, category, image_url: null, price: price.toFixed(2), currency, stock,
  default_commission_share: share.toFixed(4), sale_start: null, sale_end: null, is_on_sale: true, created_at: '2026-02-01T09:00:00Z',
})
const pstore = persisted('fake_shop_products_v1', () => ({
  products: [
    seedProduct(1, 1, 'KB-001', '八橋餅禮盒', '伴手禮', 1200, 'JPY', 50, 0.3),
    seedProduct(2, 1, 'KB-002', '京漬物三味', '食品', 1600, 'JPY', null, 0.3),
    seedProduct(3, 1, 'KB-003', '清酒一合瓶', '酒類', 2200, 'JPY', 0, 0.25),
    seedProduct(4, 2, 'UJ-001', '宇治抹茶粉', '茶葉', 2800, 'JPY', 30, 0.2),
    seedProduct(5, 3, 'HK-001', '北海道海鮮干貝', '海產', 4500, 'JPY', 12, 0.2),
  ],
  jobs: 0,
}))
const pdb = () => pstore.get()
const productHandler = (fn: (ctx: Ctx) => unknown, save = false) => async (ctx: Ctx) => {
  requireUser(ctx)
  const out = await fn(ctx)
  if (save) pstore.save()
  return out
}
const shopOf = (id: string) => {
  const shop = db().shops.find((s) => String(s.id) === id)
  if (!shop) throw new FakeError(404, 'Shop not found')
  return shop
}
const productOf = (id: string) => {
  const product = pdb().products.find((x) => String(x.id) === id)
  if (!product) throw new FakeError(404, 'Product not found')
  return product
}
/* 驗證並整理一筆商品；回傳錯誤清單（field + message） */
function checkProduct(p: Partial<ShopProductCreate>, creating: boolean) {
  const errors: { field: string; message: string }[] = []
  if (creating && !p.sku?.trim()) errors.push({ field: 'sku', message: 'Field required' })
  if ((creating || p.name !== undefined) && !p.name?.trim()) errors.push({ field: 'name', message: creating && p.name === undefined ? 'Field required' : 'String should have at least 1 character' })
  if (creating || p.price != null) {
    const price = Number(p.price)
    if (p.price == null || (p.price as unknown) === '') errors.push({ field: 'price', message: 'Field required' })
    else if (!(price >= 0)) errors.push({ field: 'price', message: 'Input should be a valid decimal' })
  }
  if ((creating || p.currency != null) && !/^[A-Z]{3}$/.test(p.currency ?? '')) errors.push({ field: 'currency', message: "String should match pattern '^[A-Z]{3}$'" })
  if (p.stock != null && !(Number.isInteger(Number(p.stock)) && Number(p.stock) >= 0)) errors.push({ field: 'stock', message: 'Input should be greater than or equal to 0' })
  if (p.default_commission_share != null && !(Number(p.default_commission_share) >= 0 && Number(p.default_commission_share) <= 1)) errors.push({ field: 'default_commission_share', message: 'Input should be less than or equal to 1' })
  return errors
}
const normalize = (p: Partial<ShopProductCreate>): Partial<ShopProduct> => ({
  ...(p as Partial<ShopProduct>),
  ...(p.price != null && { price: Number(p.price).toFixed(2) }),
  ...(p.default_commission_share != null && { default_commission_share: Number(p.default_commission_share).toFixed(4) }),
  ...(p.stock != null && { stock: Number(p.stock) }),
})
const failOn = (errors: { field: string; message: string }[]) => {
  if (errors.length) throw new FakeError(422, errors.map((e) => `body.${e.field}: ${e.message}`).join('; '))
}

route(shopProductsApi.list, productHandler((ctx) => {
  shopOf(ctx.params.shopId)
  return pdb().products.filter((x) => String(x.shop_id) === ctx.params.shopId)
}))
/* 所有商品：與真正後端相同，依店家、SKU 排序，支援篩選與 limit / offset 分頁 */
route(shopProductsApi.listAll, productHandler((ctx) => {
  const qp = ctx.query
  const q = (qp.get('q') ?? '').toLowerCase()
  const limit = Math.min(500, Math.max(1, Number(qp.get('limit') ?? 100)))
  const offset = Math.max(0, Number(qp.get('offset') ?? 0))
  return pdb().products
    .filter((x) => !qp.get('shop_id') || String(x.shop_id) === qp.get('shop_id'))
    .filter((x) => !q || x.sku.toLowerCase().includes(q) || x.name.toLowerCase().includes(q))
    .filter((x) => !qp.get('category') || x.category === qp.get('category'))
    .filter((x) => !qp.get('is_on_sale') || String(x.is_on_sale) === qp.get('is_on_sale'))
    .sort((a, b) => a.shop_id - b.shop_id || a.sku.localeCompare(b.sku))
    .slice(offset, offset + limit)
}))
route(shopProductsApi.create, productHandler((ctx) => {
  const shop = shopOf(ctx.params.shopId)
  const input = json<ShopProductCreate>(ctx)
  failOn(checkProduct(input, true))
  if (pdb().products.some((x) => x.shop_id === shop.id && x.sku === input.sku)) throw new FakeError(409, `SKU ${input.sku} already exists in this shop`)
  const product: ShopProduct = {
    ...seedProduct(Math.max(0, ...pdb().products.map((x) => x.id)) + 1, shop.id, input.sku, input.name, '', 0, input.currency, null, 0),
    ...normalize(input), created_at: new Date().toISOString(),
  } as ShopProduct
  product.category = input.category ?? null
  product.is_on_sale = input.is_on_sale ?? true
  pdb().products.push(product)
  return product
}, true))
route(shopProductsApi.update, productHandler((ctx) => {
  const product = productOf(ctx.params.id)
  const changes = json<ShopProductUpdate & { sku?: string }>(ctx)
  failOn(checkProduct(changes, false))
  Object.entries(normalize(changes)).forEach(([k, v]) => { if (v !== undefined && k !== 'sku') (product as unknown as Record<string, unknown>)[k] = v })
  return product
}, true))
route(shopProductsApi.remove, productHandler((ctx) => {
  const product = productOf(ctx.params.id)
  if (idb().items.some((x) => x.products.some((p) => p.product_id === product.id))) throw new FakeError(409, 'An itinerary item sells this product; take it off sale instead')
  pdb().products = pdb().products.filter((x) => String(x.id) !== ctx.params.id)
}, true))
route(shopProductsApi.importTemplate, productHandler((ctx) => {
  shopOf(ctx.params.shopId)
  /* 假後端一律產生 CSV 範本（Excel 範本由真正後端提供） */
  return { filename: 'products-template.csv', content: PRODUCT_COLUMNS.join(',') + '\n', type: 'text/csv;charset=utf-8' }
}))
route(shopProductsApi.importFile, productHandler(async (ctx) => {
  const shop = shopOf(ctx.params.shopId)
  const file = files(ctx, 'file')[0]
  if (!file) throw new FakeError(422, 'body.file: Field required')
  const job: ImportJob = { id: ++pdb().jobs, status: 'failed', file_name: file.name, target_id: shop.id, error_report: [], created_at: new Date().toISOString() }
  if (!file.name.toLowerCase().endsWith('.csv')) {
    job.error_report = [{ row: 1, message: '假後端只支援 CSV 匯入（Excel 請連接真正後端）' }]
    return job
  }
  const [header = [], ...rows] = parseCsv((await file.text()).replace(/^\uFEFF/, ''))
  const cols = header.map((h) => h.trim())
  const parsed = rows.map((cells, i) => {
    const r = Object.fromEntries(cols.map((c, j) => [c, cells[j]?.trim() ?? '']))
    const opt = (k: string) => r[k] || null
    const input: ShopProductCreate = {
      sku: r.sku, name: r.name, description: opt('description'), category: opt('category'), image_url: opt('image_url'),
      price: r.price === '' ? (undefined as unknown as number) : (r.price as unknown as number), currency: r.currency,
      stock: r.stock === '' || r.stock == null ? null : Number(r.stock), default_commission_share: r.default_commission_share ? Number(r.default_commission_share) : 0,
      sale_start: opt('sale_start'), sale_end: opt('sale_end'), is_on_sale: r.is_on_sale ? r.is_on_sale.toLowerCase() !== 'false' : true,
    }
    const errors = checkProduct(input, true)
    if (input.sku && pdb().products.some((x) => x.shop_id === shop.id && x.sku === input.sku)) errors.push({ field: 'sku', message: `SKU ${input.sku} already exists in this shop` })
    return { row: i + 2, input, errors }
  })
  job.error_report = parsed.flatMap((p) => p.errors.map((e) => ({ row: p.row, ...e })))
  if (job.error_report.length) return job
  let next = Math.max(0, ...pdb().products.map((x) => x.id))
  parsed.forEach(({ input }) => pdb().products.push({ ...seedProduct(++next, shop.id, input.sku, input.name, '', 0, input.currency, null, 0), ...normalize(input), created_at: new Date().toISOString() } as ShopProduct))
  return { ...job, status: 'succeeded', error_report: null }
}, true))

/* CSV（雙引號欄位、欄位內逗號與換行） */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((x) => x.trim()))
}

route(shopsApi.update, handler((ctx) => {
  const shop = db().shops.find((s) => String(s.id) === ctx.params.id)
  if (!shop) throw new FakeError(404, 'Shop not found')
  const changes = json<ShopUpdate>(ctx)
  Object.entries(changes).forEach(([k, v]) => {
    if (v === undefined) return
    ;(shop as unknown as Record<string, unknown>)[k] = k === 'agency_rate' ? rate(v) : k === 'country' ? shopCountry(v) : v
  })
  return shop
}, true))

/* ── 旅遊地點（行程項目）：與真正後端相同（數字 id，不屬於任何行程；國別為 ISO 二碼；商品可混合幣別、可含已下架商品，
      售價 / 分潤比例可另訂並以小數字串回傳；複製時連同商品） ── */
const seedItem = (id: number, name: string, city: string, address: string | null, meeting_point: string | null): ItineraryItem => ({
  id, name, address, city, country: 'JP', meeting_point, products: [], created_at: '2026-02-01T09:00:00Z',
})
const istore = persisted('fake_itinerary_items_v1', () => ({
  items: [
    seedItem(1, '清水寺 · 二年坂', '京都', '京都市東山區清水 1-294', '仁王門前'),
    seedItem(2, '八坂神社 · 祇園', '京都', '京都市東山區祇園町北側 625', null),
    seedItem(3, '宇治平等院', '宇治', '宇治市宇治蓮華 116', '表參道入口'),
  ],
}))
const idb = () => istore.get()
const itemHandler = (fn: (ctx: Ctx) => unknown, save = false) => (ctx: Ctx) => {
  requireUser(ctx)
  const out = fn(ctx)
  if (save) istore.save()
  return out
}
const itemOf = (id: string) => {
  const item = idb().items.find((s) => String(s.id) === id)
  if (!item) throw new FakeError(404, 'Itinerary item not found')
  return item
}
const nextItemId = () => Math.max(0, ...idb().items.map((s) => s.id)) + 1
function checkItem(s: ItineraryItemUpdate, creating: boolean) {
  const errors: { field: string; message: string }[] = []
  if ((creating || s.name !== undefined) && !s.name?.trim()) errors.push({ field: 'name', message: creating && s.name === undefined ? 'Field required' : 'String should have at least 1 character' })
  if (s.country && !/^[A-Za-z]{2}$/.test(s.country)) errors.push({ field: 'country', message: 'Value error, country must be an ISO 3166-1 alpha-2 code such as JP, TW or US' })
  return errors
}
const itemFields = (s: ItineraryItemUpdate) => ({ ...s, ...(s.country && { country: s.country.toUpperCase() }) })

route(itineraryItemsApi.list, itemHandler((ctx) => {
  const qp = ctx.query
  const q = (qp.get('q') ?? '').toLowerCase()
  const limit = Math.min(500, Math.max(1, Number(qp.get('limit') ?? 100)))
  const offset = Math.max(0, Number(qp.get('offset') ?? 0))
  return idb().items
    .filter((x) => !q || x.name.toLowerCase().includes(q) || (x.address ?? '').toLowerCase().includes(q))
    .filter((x) => !qp.get('city') || x.city === qp.get('city'))
    .filter((x) => !qp.get('country') || x.country === qp.get('country')?.toUpperCase())
    .slice(offset, offset + limit)
}))
route(itineraryItemsApi.create, itemHandler((ctx) => {
  const input = json<ItineraryItemCreate>(ctx)
  failOn(checkItem(input, true))
  const item: ItineraryItem = { ...seedItem(nextItemId(), '', '', null, null), city: null, country: null, ...itemFields(input), products: [], created_at: new Date().toISOString() }
  idb().items.push(item)
  return item
}, true))
route(itineraryItemsApi.update, itemHandler((ctx) => {
  const item = itemOf(ctx.params.id)
  const changes = json<ItineraryItemUpdate>(ctx)
  failOn(checkItem(changes, false))
  Object.entries(itemFields(changes)).forEach(([k, v]) => { if (v !== undefined && k in item && k !== 'id' && k !== 'products') (item as unknown as Record<string, unknown>)[k] = v })
  return item
}, true))
route(itineraryItemsApi.remove, itemHandler((ctx) => {
  const item = itemOf(ctx.params.id)
  idb().items = idb().items.filter((s) => s !== item)
}, true))
route(itineraryItemsApi.duplicate, itemHandler((ctx) => {
  const item = itemOf(ctx.params.id)
  const { name } = json<{ name?: string | null }>(ctx)
  const copy: ItineraryItem = { ...clone(item), id: nextItemId(), name: name?.trim() || `${item.name} (copy)`, created_at: new Date().toISOString() }
  idb().items.push(copy)
  return copy
}, true))
route(itineraryItemsApi.products, itemHandler((ctx) => itemOf(ctx.params.id).products))
route(itineraryItemsApi.setProducts, itemHandler((ctx) => {
  const item = itemOf(ctx.params.id)
  const { products = [] } = json<{ products?: ItineraryItemProductWrite[] }>(ctx)
  const rows = products.map((w, i) => {
    const p = pdb().products.find((x) => x.id === Number(w.product_id))
    if (!p) throw new FakeError(404, `Product ${w.product_id} not found`)
    if (w.price_override != null && !(Number(w.price_override) >= 0)) throw new FakeError(422, `body.products.${i}.price_override: Input should be greater than or equal to 0`)
    const share = w.commission_share_override
    if (share != null && !(Number(share) >= 0 && Number(share) <= 1)) throw new FakeError(422, `body.products.${i}.commission_share_override: Input should be less than or equal to 1`)
    const price = w.price_override != null ? Number(w.price_override).toFixed(2) : null
    const shareStr = share != null ? Number(share).toFixed(4) : null
    return {
      product_id: p.id, sku: p.sku, product_name: p.name, currency: p.currency, price: price ?? p.price,
      commission_share: shareStr ?? p.default_commission_share, price_override: price, commission_share_override: shareStr,
    }
  })
  if (new Set(rows.map((x) => x.product_id)).size !== rows.length) throw new FakeError(422, 'Duplicate product in list')
  item.products = rows
  return item
}, true))

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
