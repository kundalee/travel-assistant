export interface Notice {
  type: 'warn' | 'info'
  title: string
  date: string
  body: string
}

export interface Good {
  name: string
  price: string
  note: string
}

export type IncomeCat = 'souvenir' | 'groupbuy'

export interface IncomeRow {
  product: string
  tour: string
  date: string
  qty: number
  amount: number
  shipped: boolean
  cost?: number
  bonus?: number
}

export interface CancelledOrder {
  orderNo: string
  product: string
  tour: string
  date: string
  amount: number
  reconciled: boolean
}

export interface Profile {
  name: string
  national_id: string
  birthday: string
  email: string
}

export interface PartnerData {
  notices: Notice[]
  goods: Good[]
  income: Record<IncomeCat, IncomeRow[]>
  cancelled: CancelledOrder[]
}

export interface PartnerUser {
  id: string
  email: string
  demo?: boolean
  profile: Profile
}
