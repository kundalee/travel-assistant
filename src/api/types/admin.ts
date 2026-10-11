import type { Role, UserRead } from '../auth'

export type { Role }
/** 行程狀態：準備中 / 即將出發 / 進行中 / 已結束 / 已取消（取消只能由人設定） */
export type TourStatus = 'preparing' | 'upcoming' | 'ongoing' | 'closed' | 'cancelled'
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

/** 行程的領隊（is_lead = 主要領隊） */
export interface TourGuide {
  guide_id: number
  full_name: string
  is_lead: boolean
}

/** 指派領隊（PUT /tours/:id/guides 的一項） */
export interface GuideAssignment {
  guide_id: number
  is_lead?: boolean
}

/** 行程（與後端 TourRead 相同；GET /tours） */
export interface Tour {
  id: number
  /** 團號，不可重複 */
  code: string
  name: string
  description: string | null
  destination: string
  /** YYYY-MM-DD */
  start_date: string
  end_date: string
  status: TourStatus
  /** true = 狀態依日期自動更新 */
  auto_status: boolean
  status_changed_at: string
  notes: string | null
  min_size: number
  max_size: number
  /** 每人團費（小數字串） */
  price_per_person: string
  /** 3 碼大寫，例：JPY */
  currency: string
  /** 所屬旅行社（agent 帳號） */
  owner_agent_id: number
  guides: TourGuide[]
  created_at: string
}

/** 新增行程（POST /tours）；管理員建立時 owner_agent_id 必填 */
export interface TourCreate {
  code: string
  name: string
  description?: string | null
  destination: string
  start_date: string
  end_date: string
  min_size: number
  max_size: number
  price_per_person: number
  currency: string
  auto_status?: boolean
  owner_agent_id?: number | null
}

/** 修改行程（PATCH /tours/:id）：未帶的欄位不變 */
export type TourUpdate = Partial<TourCreate> & { notes?: string | null }

/** 行程清單的篩選與分頁（GET /tours 的查詢字串） */
export interface TourFilters {
  status?: TourStatus
  date_from?: string
  date_to?: string
  guide_id?: number
  agent_id?: number
  /** 團號 / 名稱 / 目的地 */
  q?: string
  /** 1–500，預設 100 */
  limit?: number
  offset?: number
  [key: string]: string | number | boolean | undefined
}

/** 行程的一個行程表項目（與後端 TourItineraryRead 相同；GET /tours/:tourId/tour-itineraries，依日期、順序排列） */
export interface TourItinerary {
  id: number
  tour_id: number
  /** 對應的旅遊地點（/admin/places） */
  itinerary_item_id: number
  name: string
  address: string | null
  city: string | null
  country: string | null
  meeting_point: string | null
  /** YYYY-MM-DD，須在行程期間內 */
  visit_date: string
  /** HH:MM:SS */
  start_time: string | null
  end_time: string | null
  /** 當天的順序（從 1 開始；同一天不可重複，可不連續） */
  sequence: number
  notes: string | null
  products: ItineraryItemProduct[]
}

/** 新增行程表項目（POST /tours/:tourId/tour-itineraries）：itinerary_item_id 或 itinerary_item（同時新增地點）擇一；sequence 未帶 = 當天最後 */
export interface TourItineraryCreate {
  itinerary_item_id?: number | null
  itinerary_item?: ItineraryItemCreate | null
  visit_date: string
  start_time?: string | null
  end_time?: string | null
  sequence?: number | null
  notes?: string | null
}

/** 修改行程表項目（PATCH /tour-itineraries/:id）：未帶的欄位不變、null 清除 */
export type TourItineraryUpdate = Partial<Omit<TourItineraryCreate, 'itinerary_item'>>

export type PaymentStatus = 'unpaid' | 'deposit' | 'paid' | 'refunded'

/** 行程的報名（與後端 BookingRead 相同；GET /tours/:tourId/bookings） */
export interface TourBooking {
  id: number
  tour_id: number
  tour_code: string
  member_id: number
  member_name: string
  payment_status: PaymentStatus
  amount_due: string
  amount_paid: string
  currency: string
  booked_at: string
  cancelled_at: string | null
  notes: string | null
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

/** 旅遊地點販售的商品（GET /itinerary-items/:id/products）；price / commission_share 為實際值，override 為 null 時沿用商品設定 */
export interface ItineraryItemProduct {
  product_id: number
  sku: string
  product_name: string
  currency: string
  price: string
  commission_share: string
  price_override: string | null
  commission_share_override: string | null
}

/** 旅遊地點（與後端 ItineraryItemRead 相同；GET /itinerary-items）：不屬於任何行程 */
export interface ItineraryItem {
  id: number
  name: string
  address: string | null
  city: string | null
  /** ISO 3166-1 二碼國別（例：JP） */
  country: string | null
  meeting_point: string | null
  products: ItineraryItemProduct[]
  created_at: string
}

/** 新增旅遊地點（POST /itinerary-items） */
export interface ItineraryItemCreate {
  name: string
  address?: string | null
  city?: string | null
  country?: string | null
  meeting_point?: string | null
}

/** 修改旅遊地點（PATCH /itinerary-items/:id）：未帶的欄位不變、null 清除 */
export type ItineraryItemUpdate = Partial<ItineraryItemCreate>

/** 設定旅遊地點販售的商品（PUT /itinerary-items/:id/products 的一項）；可混合幣別、可含已下架商品 */
export interface ItineraryItemProductWrite {
  product_id: number
  price_override?: number | null
  /** 0–1 */
  commission_share_override?: number | null
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
