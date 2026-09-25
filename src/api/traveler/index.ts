/* ═══════════════════════════════════════════════
   團員 後端 API（登入見 auth.ts）：每個資源一個檔案，端點宣告見各檔
   畫面透過 src/app/traveler/queries/ 的 TanStack Query hooks 使用
   ═══════════════════════════════════════════════ */
import { isFake } from '../client'
/* 匯入順序即 API 面板與 docs/ENDPOINTS.md 的群組順序 */
import { profileApi } from './profile'
import { tripsApi } from './trips'
import { ordersApi } from './orders'
import { productsApi } from './products'
import { photosApi } from './photos'
import { reviewsApi } from './reviews'
import { chatApi } from './chat'
import { noticesApi } from './notices'
import { healthApi } from './health'

export { profileApi, tripsApi, ordersApi, productsApi, photosApi, reviewsApi, chatApi, noticesApi, healthApi }
export type { BookingInput } from './trips'
export type { PlaceOrderResult } from './orders'
export type { ReviewInput } from './reviews'

/** true = 個人資料群組由假後端回應（提示訊息標示「展示」） */
export const mock = isFake('traveler.profile')
