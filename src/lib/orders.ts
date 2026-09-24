/* 訂單狀態（各入口共用） */
export type OrderStatus = '未付款' | '已付款' | '待出貨' | '已出貨' | '已取消'
export const STATUS_ALL: OrderStatus[] = ['未付款', '已付款', '待出貨', '已出貨', '已取消']

export function ostatusClass(s: string) {
  const map: Record<string, string> = { 未付款: 'unpaid', 已付款: 'paid', 已出貨: 'shipped', 待出貨: 'pending', 已取消: 'void', 取消: 'void' }
  return map[s] || 'pending'
}

export const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))
