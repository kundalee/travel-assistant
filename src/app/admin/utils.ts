import { KIND_TW, ROSTER_SEED } from '../../api/mocks/admin'
import type { Product, Tour, Vendor } from '../../api/types/admin'

export { clone, errMsg, fmt, includesQ, parseCoord, uid } from '../../lib/utils'

export { ostatusClass, stars } from '../../lib/orders'

export const productKinds = (p: Product) => (p.kinds?.length ? p.kinds : [KIND_TW[p.kind]].filter(Boolean))
export const vendorName = (vendors: Vendor[], id?: string | null) => vendors.find((v) => v.id === id)?.name || ''

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

function hashStr(x: string) { let h = 0; for (let i = 0; i < x.length; i++) { h = ((h << 5) - h) + x.charCodeAt(i); h |= 0 } return h }

export function rosterOf(t: Tour) {
  return (ROSTER_SEED[t.id] || []).map((m, i) => ({
    ...m,
    code: `${tourBatch(t)}_${String(i + 1).padStart(3, '0')}`,
    loginId: m.email,
    loginPw: m.phone || 'TA' + String(Math.abs(hashStr(m.email))).slice(0, 6),
    pwSource: m.phone ? '電話' : '系統自訂',
  }))
}

export const avatarUrl = (name?: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=EEF0FE&color=4338CA`
