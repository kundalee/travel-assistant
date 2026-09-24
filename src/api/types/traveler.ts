import type { IconName } from '../../components'
import type { OrderStatus } from '../../lib/orders'

export type { OrderStatus }

/* 行程目錄（探索 / 詳情 / 報名） */
export interface CatalogTour {
  id: string
  title: string
  dest: string
  region: string
  price: number
  img: string
  tags: string[]
  dates: string
  highlights: string[]
  itin: [day: string, text: string][]
  incl: { included: boolean; text: string }[]
  guide: string
}

export interface Flight {
  dep: string
  depAir: string
  ret: string
  retAir: string
  pnr: string
  seat: string
}

interface TripBase {
  tourId: string
  title: string
  dest: string
  img: string
  dates: string
  guide: string
}

export interface UpcomingTrip extends TripBase {
  meetTime: string
  meetPlace: string
  guideRole: string
  phone: string
  guideImg: string
  /** 簽到 QR code 內容 */
  qr: string
  video?: string
  notes?: string[]
  flight?: Flight
}

export interface Souvenir {
  id: string
  name: string
  price: number
  emo: string
}

export interface TripLocation {
  name: string
  icon: IconName
  souvenirs: Souvenir[]
}

export type PayMethod = 'card' | 'linepay' | 'mobilepay' | 'cvs' | 'atm' | 'guide'
export type Fulfillment = 'pickup' | 'ship'

export interface TripOrder {
  id: string
  product: string
  qty: number
  amount: number
  status: OrderStatus
  method?: PayMethod
  fulfillment?: Fulfillment
  /** 當地幣別參考 */
  local?: { code: string; sym: string; amount: number }
}

export interface OngoingTrip extends TripBase {
  guideRole: string
  phone: string
  guideImg: string
  chatKey: string
  day: string
  locations: TripLocation[]
  orders: TripOrder[]
}

export interface CompletedTrip extends TripBase {
  rating: number
  reviewed: boolean
  memories: number
}

export interface Noti {
  id: string
  type: 'depart' | 'msg' | 'pay' | 'weather' | 'photo' | 'review'
  title: string
  time: string
  read: boolean
  text: string
}

export interface ChatMsg {
  self: boolean
  guide?: boolean
  name: string
  av?: string
  text: string
  time: string
}

export interface Chat {
  name: string
  msgs: ChatMsg[]
}

export interface AlbumPhoto {
  src: string
  cap: string
  up: string
  by: 'guide' | 'mine'
}

export type NoticeType = '每日公告' | '一般公告'

export interface Notice {
  type: NoticeType
  kind: string
  title: string
  body: string
  by: string
  time: string
}

export interface Boutique {
  name: string
  price: number
  emo: string
  desc: string
}

export interface GroupBuyItem {
  id: string
  name: string
  emo: string
  price: number
  orig: number
  desc: string
}

export interface HistoryOrder {
  id: string
  product: string
  tour: string
  date: string
  amount: number
  status: OrderStatus
}

export interface HistoryTour {
  title: string
  dates: string
  img: string
  memories: number
}

export interface TravelerData {
  catalog: CatalogTour[]
  upcoming: UpcomingTrip[]
  ongoing: OngoingTrip[]
  completed: CompletedTrip[]
  notis: Noti[]
  chats: Record<string, Chat>
  album: AlbumPhoto[]
  notices: Notice[]
  boutique: Boutique[]
  groupbuy: GroupBuyItem[]
  historyOrders: HistoryOrder[]
  historyTours: HistoryTour[]
  /** 防疫監控：今日足跡 / 接觸者 */
  trace: { t: string; place: string }[]
  contacts: { name: string; n: number; note: string }[]
}

export interface TravelerProfile {
  name: string
  email: string
  phone: string
  birth: string
  passport: string
  expiry: string
  emName: string
  emRel: string
  emPhone: string
}

export interface TravelerUser {
  id: string
  email: string
  demo?: boolean
  profile: TravelerProfile
}

export interface Vitals {
  temp: number
  bp: string
}

export interface CartItem {
  id: string
  name: string
  price: number
  qty: number
}
