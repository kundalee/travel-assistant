/* ═══════════════════════════════════════════════
   後台管理 後端 API（登入見 auth.ts）：每個資源一個檔案，端點宣告見各檔
   資料清單以 REST 存取：GET / POST /admin/<清單>、PATCH / DELETE /admin/<清單>/:id
   ═══════════════════════════════════════════════ */
import { isFake } from '../client'
import type { AdminCollections } from '../types/admin'
/* 匯入順序即 API 面板與 docs/ENDPOINTS.md 的群組順序 */
import { usersApi } from './users'
import { toursApi } from './tours'
import { ordersApi } from './orders'
import { bookingsApi } from './bookings'
import { reviewsApi } from './reviews'
import { announcementsApi } from './announcements'
import { campaignsApi } from './campaigns'
import { productsApi } from './products'
import { placesApi } from './places'
import { vendorsApi } from './vendors'
import { salesApi } from './sales'
import { trackingApi } from './tracking'
import { reportsApi } from './reports'
import { aiApi } from './ai'

export {
  usersApi, toursApi, ordersApi, bookingsApi, reviewsApi, announcementsApi, campaignsApi, productsApi, placesApi, vendorsApi,
  salesApi, trackingApi, reportsApi, aiApi,
}

/** true = 使用者群組由假後端回應 */
export const mock = isFake('admin.users')

/* ── 可新增 / 修改 / 刪除的清單（store 的 create / update / remove 依 key 呼叫對應的 API） ── */
type CrudApi<T> = {
  create?: (body: Omit<T, 'id'>) => Promise<T>
  update?: (params: { id: string }, body: Partial<T>) => Promise<T>
  remove?: (params: { id: string }) => Promise<void>
}

export const editable = {
  users: usersApi, tours: toursApi, orders: ordersApi, bookings: bookingsApi, announcements: announcementsApi,
  products: productsApi, places: placesApi, vendors: vendorsApi,
} satisfies { [K in keyof AdminCollections]?: CrudApi<AdminCollections[K][number]> }

export type EditableKey = keyof typeof editable
export type Item<K extends EditableKey> = AdminCollections[K][number]
/** 新增時不帶 id，由後端產生 */
export type NewItem<K extends EditableKey> = Omit<Item<K>, 'id'>

/** 依清單 key 取得其 create / update / remove（不支援的操作為 undefined） */
export function crudOf<K extends EditableKey>(key: K) {
  return editable[key] as CrudApi<Item<K>>
}
