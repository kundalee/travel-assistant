import type { Role, UserRead } from '../auth'

export type { Role }
export type TourStatus = 'preparing' | 'upcoming' | 'ongoing' | 'completed'
export type ProductKind = 'souvenir' | 'deal' | 'boutique'
export type { OrderStatus } from '../../lib/orders'
import type { OrderStatus } from '../../lib/orders'

/** 帳號（與後端 UserRead 相同；GET /users） */
export type User = UserRead

/** 建立帳號（POST /users）：初始密碼由管理員設定 */
export interface UserCreate {
  email: string
  /** 8–128 字元 */
  password: string
  full_name: string
  phone?: string | null
  /** 至少一個 */
  roles: Role[]
}

/** 修改帳號（PATCH /users/:id）：未帶的欄位不變 */
export interface UserUpdate {
  full_name?: string
  phone?: string | null
  is_active?: boolean
  roles?: Role[]
}

export interface Tour {
  id: string
  title: string
  dest?: string
  country?: string
  dates_text?: string
  start_date?: string
  end_date?: string
  batch_seq?: number
  status: TourStatus
  img_url?: string
  guide_id: string | null
  guide_name?: string
  /** 團員人數（由後端依名冊計算） */
  member_count?: number
  places?: string[]
  published?: boolean
  source?: string
  synced_at?: string
}

export interface Order {
  id: string
  buyer_name?: string
  product_name: string
  qty: number
  amount: number
  status: OrderStatus
  method?: string
  payflow?: string
  fulfillment?: 'ship' | 'pickup'
  logistics?: string
  pickup?: string
  kind?: ProductKind
  cat?: string
  reconciled?: boolean
  created_at?: string
}

export interface Booking {
  id: string
  name: string
  tour_title?: string
  phone?: string
  status: 'pending' | 'approved'
  created_at?: string
}

export interface Review {
  id: string
  reviewer_name?: string
  tour_title?: string
  rating: number
  text?: string
}

export type AnnCat = '每日公告' | '一般公告'
export type AnnTarget = '依團名' | '依行程' | '依關鍵字'

export interface Announcement {
  id: string
  cat: AnnCat
  type: string
  headline: string
  body?: string
  tour_title?: string
  target: AnnTarget
  targetVal?: string
  mode: 'now' | 'schedule'
  pubFrom?: string
  pubTo?: string
  published: boolean
}

export interface Campaign {
  id: string
  channel: 'email' | 'sms'
  title: string
  published: boolean
}

export interface Product {
  id: string
  name: string
  price_twd: number
  cost?: number
  bonus_twd?: number
  kind: ProductKind
  kinds?: string[]
  cat?: string
  vendor_id?: string | null
  draft?: boolean
}

export interface Souvenir {
  id: string
  pid: string
  name: string
  price: number
}

export interface Place {
  id: string
  name: string
  lat: number
  lng: number
  desc?: string
  souvenirs: Souvenir[]
}

/** 結算週期：每團結算 / 每月結算 */
export type SettlementCycle = 'per_tour' | 'monthly'

/** 支援店家（與後端 ShopRead 相同；GET /shops）。刪除會連同商品一起刪除；有歷史資料者請停用 */
export interface Shop {
  id: number
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  country: string | null
  /** 店家支付旅行社的比例（小數字串，例："0.1500" = 15%） */
  agency_rate: string
  settlement_cycle: SettlementCycle
  is_active: boolean
  /** 此店家服務的旅遊地點 */
  place_ids: number[]
  created_at: string
}

/** 新增支援店家（POST /shops） */
export interface ShopCreate {
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  /** 0–1，例：0.15 = 15% */
  agency_rate: number
  settlement_cycle: SettlementCycle
  is_active?: boolean
  place_ids?: number[]
}

/** 店家的商品（與後端 ProductRead 相同；GET /shops/:shopId/products）。一個商品只屬於一家店家，不能移到其他店家 */
export interface ShopProduct {
  id: number
  shop_id: number
  /** 店家內的商品編號，建立後不能修改 */
  sku: string
  name: string
  description: string | null
  category: string | null
  image_url: string | null
  /** 售價（小數字串，例："1200.00"） */
  price: string
  /** 幣別（3 碼大寫，例：JPY） */
  currency: string
  /** 庫存：null = 不限、0 = 售完 */
  stock: number | null
  /** 領隊分潤比例：旅行社抽成中分給領隊的比例（小數字串，0–1）；佣金 = 售價 × 店家抽成 × 分潤比例 */
  default_commission_share: string
  sale_start: string | null
  sale_end: string | null
  is_on_sale: boolean
  created_at: string
}

/** 新增商品（POST /shops/:shopId/products） */
export interface ShopProductCreate {
  sku: string
  name: string
  description?: string | null
  category?: string | null
  image_url?: string | null
  price: number
  currency: string
  stock?: number | null
  /** 0–1，預設 0 */
  default_commission_share?: number
  sale_start?: string | null
  sale_end?: string | null
  /** 預設 true */
  is_on_sale?: boolean
}

/** 所有商品的篩選與分頁（GET /products 的查詢字串） */
export interface ProductFilters {
  shop_id?: number
  /** SKU / 商品名稱 */
  q?: string
  category?: string
  is_on_sale?: boolean
  /** 1–500，預設 100 */
  limit?: number
  offset?: number
  [key: string]: string | number | boolean | undefined
}

/** 修改商品（PATCH /products/:id）：未帶的欄位不變；SKU 不能修改 */
export type ShopProductUpdate = Partial<Omit<ShopProductCreate, 'sku'>>

/** 匯入結果：status = failed 時什麼都沒寫入，error_report 依列列出所有問題 */
export interface ImportJob {
  id: number
  status: string
  file_name: string
  target_id: number | null
  error_report: { row: number; field?: string; message: string }[] | null
  created_at: string
}

/** 修改支援店家（PATCH /shops/:id）：未帶的欄位不變、null 清除；停用 = is_active: false */
export type ShopUpdate = Partial<Omit<ShopCreate, 'place_ids'>>

export interface MonthlySales {
  month: string
  agency: string
  amount: number
  sent: boolean
}

export interface TrackingGroup {
  id: string
  tour: string
  city: string
  continent: string
  dates: string
  members: number
  alert: number
  guide: string
  guidePhone: string
  lat: number
  lng: number
  spot: string
  updated: string
}

/** 可新增 / 修改 / 刪除的資料集（對應 /admin/<collection>） */
export interface AdminCollections {
  users: User[]
  tours: Tour[]
  orders: Order[]
  bookings: Booking[]
  reviews: Review[]
  announcements: Announcement[]
  campaigns: Campaign[]
  products: Product[]
  places: Place[]
  shops: Shop[]
  monthly: MonthlySales[]
  trackingGroups: TrackingGroup[]
}

export interface RosterMember {
  name: string
  email: string
  phone: string
  nick?: string
}

/** 登入帳號預設值：ID = email、PW = 電話（無電話則由系統產生） */
export interface RosterEntry extends RosterMember {
  code: string
  loginId: string
  loginPw: string
  pwSource: '電話' | '系統自訂'
}

export interface RankRow { n: string; v: number }

export interface Stats {
  members: { tour: string; n: number; guide: string }[]
  rankSouvenir: RankRow[]
  rankDeal: RankRow[]
  rankTour: RankRow[]
  rankBoutique: RankRow[]
  perf: { who: string; role: string; kind: string; shipped: number; amount: number; bonus: number }[]
}

export interface Receivable {
  party: string
  type: '應收' | '應付'
  amount: number
  due: string
  done: boolean
}

export interface Vital { name: string; temp: number; bp: string; ok: boolean }
export interface Zone { name: string; note: string; level: 'warn' | 'ok' }

/** 後台畫面需要的全部資料：資料集 ＋ 唯讀報表 */
export interface AdminData extends AdminCollections {
  stats: Stats
  receivables: Receivable[]
  vitals: Vital[]
  zones: Zone[]
}
