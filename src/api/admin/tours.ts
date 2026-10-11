import { del, download, get, patch, post, put, resource, upload } from '../resource'
import type { GuideAssignment, ImportJob, Tour, TourBooking, TourCreate, TourFilters, TourStatus, TourUpdate } from '../types/admin'

/* 行程（管理員）：沿用後端路徑；只有「準備中」的行程可以刪除，其他狀態請改為取消 */
export const toursApi = resource('admin.tours', '後台 · 行程 Tours', {
  /** limit 最多 500 */
  list: get<Tour[], TourFilters>()('/tours', '行程清單（篩選、分頁）'),
  create: post<Tour, TourCreate>()('/tours', '新增行程（團號不可重複；管理員需指定所屬旅行社）'),
  update: patch<Tour, TourUpdate>()('/tours/:id', '修改行程'),
  remove: del()('/tours/:id', '刪除行程（僅限準備中）'),
  setStatus: patch<Tour, { status: TourStatus }>()('/tours/:id/status', '變更行程狀態（含取消）'),
  setGuides: put<Tour, { guides: GuideAssignment[] }>()('/tours/:id/guides', '設定領隊（整份取代；is_lead = 主要領隊）'),
  duplicate: post<Tour, { code: string; start_date: string; name?: string | null }>()('/tours/:id/duplicate', '複製行程（含行程表，日期依新出發日平移；不含領隊）'),
  importTemplate: download<{ file_format: 'csv' | 'xlsx' }>()('/tours/import-template', '下載行程匯入範本（CSV / Excel）'),
  importFile: upload<ImportJob, { file: File }>()('/tours/import', '匯入行程（CSV / Excel；全部正確才寫入）'),
  bookings: get<TourBooking[], { include_cancelled?: boolean }>()('/tours/:id/bookings', '行程的報名（團員、付款狀態）'),
})
