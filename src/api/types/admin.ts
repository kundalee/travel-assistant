import type { Role } from '../auth'

export type { Role }
export type TourStatus = 'preparing' | 'upcoming' | 'ongoing' | 'completed'
export type ProductKind = 'souvenir' | 'deal' | 'boutique'
export type { OrderStatus } from '../../lib/orders'
import type { OrderStatus } from '../../lib/orders'

export interface User {
  id: string
  full_name: string
  email: string
  /** 一個帳號可擁有多個身分 */
  roles: Role[]
  phone?: string
  avatar_url?: string
  status?: 'on' | 'off'
  store_name?: string
  emp_no?: string
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

export interface Vendor {
  id: string
  name: string
  addr?: string
  lat: number | null
  lng: number | null
  contact?: string
  phone?: string
  im?: string
  pay: string
  payOther?: string
  ship: string
  shipPlace?: string
  draft: boolean
}

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
  vendors: Vendor[]
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
