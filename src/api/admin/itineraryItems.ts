import { del, get, post, patch, put, resource } from '../resource'
import type { ItineraryItem, ItineraryItemCreate, ItineraryItemProduct, ItineraryItemProductWrite, ItineraryItemUpdate } from '../types/admin'

/* 旅遊地點（行程項目，管理員）：不屬於任何行程，排入行程時再指定日期 / 時間；每個地點可串聯店家的商品（售價 / 分潤比例可另訂） */
export const itineraryItemsApi = resource('admin.itineraryItems', '後台 · 旅遊地點 Itinerary items', {
  /** limit 最多 500；q 搜尋名稱 / 地址 */
  list: get<ItineraryItem[], { q?: string; city?: string; country?: string; limit?: number; offset?: number }>()('/itinerary-items', '旅遊地點清單'),
  create: post<ItineraryItem, ItineraryItemCreate>()('/itinerary-items', '新增旅遊地點'),
  update: patch<ItineraryItem, ItineraryItemUpdate>()('/itinerary-items/:id', '修改旅遊地點'),
  remove: del()('/itinerary-items/:id', '刪除旅遊地點'),
  duplicate: post<ItineraryItem, { name?: string | null }>()('/itinerary-items/:id/duplicate', '複製旅遊地點（含商品；名稱未帶 = 原名稱 + " (copy)"）'),
  products: get<ItineraryItemProduct[]>()('/itinerary-items/:id/products', '旅遊地點販售的商品'),
  setProducts: put<ItineraryItem, { products: ItineraryItemProductWrite[] }>()('/itinerary-items/:id/products', '設定旅遊地點販售的商品（整份取代）'),
})
