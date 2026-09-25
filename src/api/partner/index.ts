/* ═══════════════════════════════════════════════
   支援店家 後端 API（登入見 auth.ts）：每個資源一個檔案，端點宣告見各檔
   ═══════════════════════════════════════════════ */
import { isFake } from '../client'
/* 匯入順序即 API 面板與 docs/ENDPOINTS.md 的群組順序 */
import { profileApi } from './profile'
import { contentApi } from './content'
import { incomeApi } from './income'
import { ordersApi } from './orders'

export { profileApi, contentApi, incomeApi, ordersApi }

/** true = 店家資料群組由假後端回應（提示訊息標示「展示」） */
export const mock = isFake('partner.profile')
