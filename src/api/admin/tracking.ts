import { get, resource } from '../resource'
import type { TrackingGroup, Vital, Zone } from '../types/admin'

export const trackingApi = resource('admin.tracking', '後台 · 團體追蹤 Tracking', {
  get: get<{ groups: TrackingGroup[]; vitals: Vital[]; zones: Zone[] }>()('/admin/tracking', '團體位置、體溫警示、警戒區域'),
  /** 領隊公司手機的最新定位 */
  location: get<TrackingGroup>()('/admin/tracking/:groupId/location', '更新領隊手機定位'),
  exportTocc: get<{ filename: string; rows: number }>()('/admin/tracking/export', '匯出 TOCC 資料'),
})
