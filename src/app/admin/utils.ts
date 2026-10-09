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
export const tourBatch = (t: Tour) => `${t.title}_${(t.start_date || '').replace(/-/g, '')}-${t.batch_seq || 1}團`

/* 依日期自動推算狀態：結束隔日＝已完成；起始日＝進行中；未指派領隊＝準備中；其餘＝即將出發 */
export function computeTourStatus(t: Tour): Tour['status'] {
  const sd = toDate(t.start_date), ed = toDate(t.end_date), now = today0()
  if (ed && now >= addDays(ed, 1)) return 'completed'
  if (sd && now >= sd) return 'ongoing'
  if (!t.guide_id) return 'preparing'
  return 'upcoming'
}

export function isHistoryTour(t: Tour, afterDays: number) {
  const ed = toDate(t.end_date)
  return !!ed && today0() > addDays(ed, afterDays)
}

export const avatarUrl = (name?: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=EEF0FE&color=4338CA`

/* ═══ 店家的商品 ═══ */
/** 金額顯示：「JPY 1,200」（後端以小數字串回傳） */
export const money = (amount: string | number, currency: string) => `${currency} ${fmt(Math.round(Number(amount) * 100) / 100)}`
/** 庫存：null = 不限、0 = 售完 */
export const stockText = (stock: number | null) => (stock == null ? '不限' : stock === 0 ? '售完' : fmt(stock))
/** 領隊佣金 = 售價 × 店家抽成 × 分潤比例 */
export const commission = (p: ShopProduct, shop: Shop) => Number(p.price) * Number(shop.agency_rate) * Number(p.default_commission_share)
