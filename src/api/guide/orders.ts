import { get, patch, post, resource } from '../resource'
import type { DealOrder, HistoryOrder, MemberOrder, OrderStatus } from '../types/guide'

export interface GroupOrderResult {
  orderId: string
  lines: { product: string; qty: number; amount: number }[]
  total: number
}

export const ordersApi = resource('guide.orders', '領隊 · 訂單 Orders', {
  history: get<HistoryOrder[]>()('/guide/orders', '歷史訂單'),
  deals: get<DealOrder[]>()('/guide/deal-orders', '團購訂單'),
  placeGroupOrder: post<GroupOrderResult, { items: { id: string; qty: number }[] }>()('/guide/tours/:tourId/group-orders', '紀念商品團體下單'),
  updateMemberOrder: patch<MemberOrder, { status: OrderStatus }>()('/guide/tours/:tourId/members/:memberId/orders/:orderId', '修改 / 取消團員訂單'),
  setDealRecon: patch<DealOrder, { recon: boolean }>()('/guide/deal-orders/:orderId', '團購訂單勾稽'),
})
