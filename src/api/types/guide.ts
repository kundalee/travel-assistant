import type { IconName } from '../../components'
import type { OrderStatus } from '../../lib/orders'

export type { OrderStatus }

export interface Member {
  id: string
  name: string
  av: string
  email: string
  nick: string
}

/* 團員名冊：團編號 code 格式為「行程_日期-團_序號」 */
export interface RosterMember {
  name: string
  email: string
  nick: string
  code: string
}

export interface PastMember extends RosterMember {
  tourId: string
  tourTitle: string
  batch: string
}

export interface RosterSeed {
  tourTitle: string
  batch: string
  members: Omit<RosterMember, 'code'>[]
}

export interface PastTour {
  tourId: string
  title: string
  batch: string
  count: number
}

export interface Souvenir {
  id: string
  name: string
  price: number
  emo: string
}

export interface TourLocation {
  name: string
  icon: IconName
  souvenirs: Souvenir[]
}

export interface MemberOrder {
  id: string
  product: string
  qty: number
  amount: number
  status: OrderStatus
}

export type NoticeType = '晨喚' | '集合時間與地點' | '行程概述' | '旅行社公告'

export interface Notice {
  id: string
  type: NoticeType
  headline: string
  body: string
  pub: boolean
  time: string
}

export interface Review {
  mid: string
  rating: number
  text: string
}

interface TourBase {
  tourId: string
  title: string
  dest: string
  img: string
  dates: string
}

export interface OngoingTour extends TourBase {
  day: string
  members: number
  locations: TourLocation[]
  memberOrders: Record<string, MemberOrder[]>
  notices: Notice[]
  reviews: Review[]
  chatKey: string
}

export interface CompletedTour extends TourBase {
  avg: number
  count: number
  reviews: Review[]
}

export interface Flight {
  dep: string
  depAir: string
  ret: string
  retAir: string
  pnr: string
  seat: string
}

export interface UpcomingTour extends TourBase {
  members: number
  video: string
  notes: string[]
  flight: Flight
}

export interface Boutique {
  name: string
  price: number
  emo: string
}

export interface Campaign {
  id: string
  title: string
  body: string
  pub: boolean
  time: string
  pointId: string
  /** 呼叫對象（團編號） */
  rcpt: string[]
}

export interface GatherPoint {
  id: string
  name: string
  time: string
  note: string
}

export interface DealOrder {
  id: string
  product: string
  tour: string
  date: string
  member: string
  nick: string
  email: string
  code: string
  qty: number
  amount: number
  status: OrderStatus
  recon: boolean
  pointId: string
}

export type IncomeCat = 'souv' | 'group'

export interface IncomeRow {
  item: string
  tour: string
  date: string
  shipped: number
  bonus: number
}

export interface IncomeSummary {
  monthBonus: number
  shipped: number
  total: number
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
  tourId: string
  title: string
  dates: string
  img: string
  memories: number
}

export interface Noti {
  id: string
  type: 'order' | 'msg' | 'review' | 'sys'
  title: string
  time: string
  read: boolean
  text: string
}

export interface ChatMsg {
  self: boolean
  name: string
  av?: string
  text: string
  time: string
}

export interface Chat {
  name: string
  group: boolean
  av?: string
  msgs: ChatMsg[]
}

export interface GuideData {
  ongoing: OngoingTour[]
  completed: CompletedTour[]
  upcoming: UpcomingTour[]
  members: Member[]
  rosters: Record<string, RosterSeed>
  pastTours: PastTour[]
  boutique: Boutique[]
  campaigns: Campaign[]
  points: GatherPoint[]
  dealOrders: DealOrder[]
  income: Record<IncomeCat, IncomeRow[]>
  incomeSummary: IncomeSummary
  historyOrders: HistoryOrder[]
  historyTours: HistoryTour[]
  notis: Noti[]
  /** 行程內對話：group1（全體）＋ 團員 id */
  chats: Record<string, Chat>
  /** 團購呼叫對話：dealgroup / dg_<campaignId>（全體）＋ 團編號 */
  dealChats: Record<string, Chat>
}

export interface GuideProfile {
  name: string
  email: string
  empId: string
  avatar: string
}

export interface GuideUser {
  id: string
  email: string
  demo?: boolean
  profile: GuideProfile
}
