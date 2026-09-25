import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '../../../api/guide'
import type { DealOrder, OrderStatus } from '../../../api/types/guide'
import { upsertById } from './cache'
import { guideKeys } from './keys'
import type { ToursData } from './tours'

export const useHistoryOrders = () => useQuery({ queryKey: guideKeys.orders, queryFn: () => ordersApi.history() })
export const useDealOrders = () => useQuery({ queryKey: guideKeys.dealOrders, queryFn: () => ordersApi.deals() })

/** 紀念商品團體下單 */
export function usePlaceGroupOrder(tourId: string) {
  return useMutation({
    mutationFn: (items: { id: string; qty: number }[]) => ordersApi.placeGroupOrder({ tourId }, { items }),
  })
}

/** 修改 / 取消團員訂單：以後端回傳的訂單取代行程內的該筆 */
export function useUpdateMemberOrder(tourId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { memberId: string; orderId: string; status: OrderStatus }) =>
      ordersApi.updateMemberOrder({ tourId, memberId: v.memberId, orderId: v.orderId }, { status: v.status }),
    onSuccess: (updated, { memberId }) => qc.setQueryData<ToursData>(guideKeys.tours, (d) => d && {
      ...d,
      ongoing: d.ongoing.map((t) => t.tourId !== tourId ? t : {
        ...t, memberOrders: { ...t.memberOrders, [memberId]: upsertById(t.memberOrders[memberId], updated) },
      }),
    }),
  })
}

/** 團購訂單勾稽 */
export function useSetDealRecon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { orderId: string; recon: boolean }) => ordersApi.setDealRecon({ orderId: v.orderId }, { recon: v.recon }),
    onSuccess: (updated) => qc.setQueryData<DealOrder[]>(guideKeys.dealOrders, (l) => upsertById(l, updated)),
  })
}
