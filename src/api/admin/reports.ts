import { get, resource } from '../resource'
import type { Receivable, Stats } from '../types/admin'

export const reportsApi = resource('admin.reports', '後台 · 報表 Reports', {
  stats: get<Stats>()('/admin/stats', '統計分析報表'),
  receivables: get<Receivable[]>()('/admin/receivables', '應收應付款'),
})
