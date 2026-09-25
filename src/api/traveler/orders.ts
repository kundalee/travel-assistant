import { get, patch, post, resource } from '../resource'
import type { Fulfillment, HistoryOrder, PayMethod, TripOrder } from '../types/traveler'

type Items = { items: { id: string; qty: number }[] }

/** 下單回應：後端建立的訂單；延後付款（超商 / ATM）另附繳費資訊 */
export interface PlaceOrderResult {
  orders: TripOrder[]
  payment: { type: 'cvs'; code: string; total: number } | { type: 'atm'; bank: string; account: string; total: number } | null
}

/** 付款 / 取消 / 改數量皆回傳更新後的訂單；狀態由後端決定（即時付款 → 已付款；其餘 → 未付款） */
export const ordersApi = resource('traveler.orders', '團員 · 訂單 Orders', {
  history: get<HistoryOrder[]>()('/traveler/orders', '歷史訂單'),
  place: post<PlaceOrderResult, Items & { method: PayMethod; fulfillment: Fulfillment }>()('/traveler/trips/:tourId/orders', '紀念商品下單（結帳）'),
  updateQty: patch<TripOrder, { qty: number }>()('/traveler/trips/:tourId/orders/:orderId', '修改訂單數量'),
  pay: post<TripOrder>()('/traveler/trips/:tourId/orders/:orderId/pay', '訂單付款', 'U'),
  cancel: post<TripOrder>()('/traveler/trips/:tourId/orders/:orderId/cancel', '取消訂單', 'U'),
  placeGroupBuy: post<HistoryOrder[], Items>()('/traveler/group-buy/orders', '團購下單'),
})
