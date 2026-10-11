import { KIND_TW } from '../../api/mocks/admin'
import type { Product, Shop, ShopProduct, Tour } from '../../api/types/admin'

import { fmt } from '../../lib/utils'
export { clone, errMsg, fmt, includesQ, parseCoord, uid } from '../../lib/utils'

export { ostatusClass, stars } from '../../lib/orders'

export const productKinds = (p: Product) => (p.kinds?.length ? p.kinds : [KIND_TW[p.kind]].filter(Boolean))
/* 商品的 vendor_id 為字串（商品尚未串接後端），店家 id 為數字 */
export const shopName = (shops: Shop[], id?: string | number | null) => shops.find((s) => String(s.id) === String(id ?? ''))?.name || ''
/** 抽成比例（"0.1500"）→ 百分比文字（"15%"） */
export const ratePct = (rate: string | number) => `${+(Number(rate) * 100).toFixed(2)}%`

/* ═══ 行程：團編 / 自動狀態 / 歷史 / 名冊 ═══ */
const toDate = (s?: string) => { if (!s) return null; const d = new Date(s + 'T00:00:00'); return isNaN(+d) ? null : d }
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

/* 團編：行程名_YYYYMMDD-N團 */
/** 已取消，或結束 afterDays 天後 → 歸入歷史行程 */
export function isHistoryTour(t: Tour, afterDays: number) {
  const ed = toDate(t.end_date)
  return t.status === 'cancelled' || (!!ed && today0() > addDays(ed, afterDays))
}

/** 主要領隊（未標記時取第一位） */
export const leadGuide = (t: Tour) => t.guides.find((g) => g.is_lead) ?? t.guides[0]

export const avatarUrl = (name?: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=EEF0FE&color=4338CA`

/* ═══ 店家的商品 ═══ */
/** 金額顯示：「JPY 1,200」（後端以小數字串回傳） */
export const money = (amount: string | number, currency: string) => `${currency} ${fmt(Math.round(Number(amount) * 100) / 100)}`
/** 庫存：null = 不限、0 = 售完 */
export const stockText = (stock: number | null) => (stock == null ? '不限' : stock === 0 ? '售完' : fmt(stock))
/** 領隊佣金 = 售價 × 店家抽成 × 分潤比例 */
export const commission = (p: ShopProduct, shop: Shop) => Number(p.price) * Number(shop.agency_rate) * Number(p.default_commission_share)
