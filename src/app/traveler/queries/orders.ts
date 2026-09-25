import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { ordersApi } from '../../../api/traveler'
import type { Fulfillment, HistoryOrder, PayMethod, TripOrder } from '../../../api/types/traveler'
import { travelerKeys } from './keys'
import type { TripsData } from './trips'

type Items = { id: string; qty: number }[]

export const useHistoryOrders = () => useQuery({ queryKey: travelerKeys.orders, queryFn: () => ordersApi.history() })

/* 行程內的訂單：以 fn 更新該行程的 orders */
function updateTripOrders(qc: QueryClient, tourId: string, fn: (orders: TripOrder[]) => TripOrder[]) {
  qc.setQueryData<TripsData>(travelerKeys.trips, (d) => d && {
    ...d, ongoing: d.ongoing.map((t) => (t.tourId === tourId ? { ...t, orders: fn(t.orders) } : t)),
  })
}
const replaceOrder = (updated: TripOrder) => (orders: TripOrder[]) => orders.map((o) => (o.id === updated.id ? updated : o))

/** 紀念商品下單（結帳）：後端建立的訂單加入行程；延後付款另回傳繳費資訊 */
export function usePlaceOrder(tourId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { items: Items; method: PayMethod; fulfillment: Fulfillment }) => ordersApi.place({ tourId }, v),
    onSuccess: (r) => updateTripOrders(qc, tourId, (orders) => [...orders, ...r.orders]),
  })
}

/** 付款 / 取消 / 改數量：以後端回傳的訂單取代 */
export function useTripOrderActions(tourId: string) {
  const qc = useQueryClient()
  const onSuccess = (updated: TripOrder) => updateTripOrders(qc, tourId, replaceOrder(updated))
  return {
    pay: useMutation({ mutationFn: (orderId: string) => ordersApi.pay({ tourId, orderId }), onSuccess }),
    cancel: useMutation({ mutationFn: (orderId: string) => ordersApi.cancel({ tourId, orderId }), onSuccess }),
    updateQty: useMutation({ mutationFn: (v: { orderId: string; qty: number }) => ordersApi.updateQty({ tourId, orderId: v.orderId }, { qty: v.qty }), onSuccess }),
  }
}

/** 團購下單：後端建立的訂單加入歷史訂單 */
export function usePlaceGroupBuy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (items: Items) => ordersApi.placeGroupBuy({ items }),
    onSuccess: (created) => qc.setQueryData<HistoryOrder[]>(travelerKeys.orders, (l) => [...created, ...(l ?? [])]),
  })
}
