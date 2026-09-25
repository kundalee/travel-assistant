/* ═══════════════════════════════════════════════
   領隊導遊 後端 API（登入見 auth.ts）：每個資源一個檔案，端點宣告見各檔
   畫面透過 src/app/guide/queries/ 的 TanStack Query hooks 使用
   ═══════════════════════════════════════════════ */
/* 匯入順序即 API 面板與 docs/ENDPOINTS.md 的群組順序 */
import { profileApi } from './profile'
import { toursApi } from './tours'
import { membersApi } from './members'
import { noticesApi } from './notices'
import { ordersApi } from './orders'
import { campaignsApi } from './campaigns'
import { pointsApi } from './points'
import { productsApi } from './products'
import { incomeApi } from './income'
import { chatApi } from './chat'
import { notificationsApi } from './notifications'

export { profileApi, toursApi, membersApi, noticesApi, ordersApi, campaignsApi, pointsApi, productsApi, incomeApi, chatApi, notificationsApi }
export type { GroupOrderResult } from './orders'
