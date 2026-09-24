import type { IncomeRow } from '../../api/types/partner'

/* 利潤：有進價時為 銷售額 − 進價，否則以獎金計 */
export const profitOf = (r: IncomeRow) => (r.cost != null ? r.amount - r.cost : r.bonus || 0)

/* 已出貨的銷售額 / 利潤 / 筆數 */
export function shippedTotals(rows: IncomeRow[]) {
  const shipped = rows.filter((r) => r.shipped)
  return {
    amount: shipped.reduce((s, r) => s + r.amount, 0),
    profit: shipped.reduce((s, r) => s + profitOf(r), 0),
    count: shipped.length,
  }
}
