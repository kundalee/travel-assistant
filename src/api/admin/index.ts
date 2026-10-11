/* ═══════════════════════════════════════════════
   後台管理 後端 API（登入見 auth.ts）：每個資源一個檔案，端點宣告見各檔
   資料清單以 REST 存取：GET / POST /admin/<清單>、PATCH / DELETE /admin/<清單>/:id
   ═══════════════════════════════════════════════ */
import { isFake } from '../client'
import type { AdminCollections } from '../types/admin'
/* 匯入順序即 API 面板與 docs/ENDPOINTS.md 的群組順序 */
import { usersApi } from './users'
import { toursApi } from './tours'
import { tourItinerariesApi } from './tourItineraries'
import { ordersApi } from './orders'
import { bookingsApi } from './bookings'
import { reviewsApi } from './reviews'
import { announcementsApi } from './announcements'
import { campaignsApi } from './campaigns'
import { productsApi } from './products'
import { placesApi } from './places'
import { itineraryItemsApi } from './itineraryItems'
import { shopsApi } from './shops'
import { shopProductsApi } from './shopProducts'
import { salesApi } from './sales'
import { trackingApi } from './tracking'
import { reportsApi } from './reports'
import { aiApi } from './ai'

export {
  usersApi, toursApi, tourItinerariesApi, ordersApi, bookingsApi, reviewsApi, announcementsApi, campaignsApi, productsApi, placesApi, itineraryItemsApi, shopsApi, shopProductsApi,
  salesApi, trackingApi, reportsApi, aiApi,
}

/** true = 後台資料由假後端回應（個別群組見 isFake，例如 isFake('admin.users')） */
export const mock = isFake('admin')

/* ── 可新增 / 修改 / 刪除的清單（store 的 create / update / remove 依 key 呼叫對應的 API） ── */
type Id = string | number
type CrudApi<T> = {
  create?: (body: never) => Promise<T>
  update?: (params: { id: Id }, body: never) => Promise<T>
  remove?: (params: { id: Id }) => Promise<void>
}

export const editable = {
  users: usersApi, tours: toursApi, orders: ordersApi, bookings: bookingsApi, announcements: announcementsApi,
  products: productsApi, places: placesApi, shops: shopsApi,
} satisfies { [K in keyof AdminCollections]?: CrudApi<AdminCollections[K][number]> }

export type EditableKey = keyof typeof editable
export type Item<K extends EditableKey> = AdminCollections[K][number]
/** 新增時送出的內容（各清單的 create 請求內容；通常為不含 id 的資料，帳號則為 UserCreate） */
export type NewItem<K extends EditableKey> = (typeof editable)[K] extends { create: (body: infer B) => unknown } ? B : never
/** 修改時送出的內容（各清單的 update 請求內容） */
export type ItemChanges<K extends EditableKey> = (typeof editable)[K] extends { update: (params: never, body: infer B) => unknown } ? B : never

/** 依清單 key 取得其 create / update / remove（不支援的操作為 undefined） */
export function crudOf<K extends EditableKey>(key: K) {
  return editable[key] as CrudApi<Item<K>>
}
