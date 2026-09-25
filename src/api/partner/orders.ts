import { get, post, resource } from '../resource'
import type { CancelledOrder } from '../types/partner'

export const ordersApi = resource('partner.orders', '店家 · 已取消訂單 Orders', {
  cancelled: get<CancelledOrder[]>()('/partner/cancelled-orders', '已取消訂單'),
  reconcile: post<void, { orderNos: string[]; reconciled: boolean }>()('/partner/cancelled-orders/reconcile', '勾稽 / 取消勾稽', 'U'),
})
