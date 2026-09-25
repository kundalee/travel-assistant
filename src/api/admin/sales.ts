import { get, post, resource } from '../resource'
import type { MonthlySales } from '../types/admin'

export const salesApi = resource('admin.sales', '後台 · 月銷售額 Sales', {
  list: get<MonthlySales[]>()('/admin/monthly-sales', '月銷售額'),
  send: post<MonthlySales>()('/admin/monthly-sales/:month/send', '回傳月銷售額至大後台', 'U'),
})
