import { del, download, get, patch, post, resource, upload } from '../resource'
import type { ImportJob, TourItinerary, TourItineraryCreate, TourItineraryUpdate } from '../types/admin'

/* 行程表（管理員）：把旅遊地點排進行程的某一天；清單與新增在行程底下，修改 / 刪除以項目 id */
export const tourItinerariesApi = resource('admin.tourItineraries', '後台 · 行程表 Tour itineraries', {
  list: get<TourItinerary[]>()('/tours/:tourId/tour-itineraries', '行程表（依日期、順序）'),
  create: post<TourItinerary, TourItineraryCreate>()('/tours/:tourId/tour-itineraries', '加入行程表（日期須在行程期間內；順序未帶 = 當天最後）'),
  update: patch<TourItinerary, TourItineraryUpdate>()('/tour-itineraries/:id', '修改行程表項目（同一天的順序不可重複）'),
  remove: del()('/tour-itineraries/:id', '自行程表移除'),
  importTemplate: download<{ file_format: 'csv' | 'xlsx' }>()('/tours/:tourId/tour-itineraries/import-template', '下載行程表匯入範本（CSV / Excel）'),
  importFile: upload<ImportJob, { file: File }>()('/tours/:tourId/tour-itineraries/import', '匯入行程表（CSV / Excel；全部正確才寫入）'),
})
