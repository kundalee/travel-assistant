import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tripsApi, type BookingInput } from '../../../api/traveler'
import { travelerKeys } from './keys'

export type TripsData = Awaited<ReturnType<typeof tripsApi.mine>>

/** 行程目錄（探索 / 詳情） */
export const useCatalog = () => useQuery({ queryKey: travelerKeys.catalog, queryFn: () => tripsApi.catalog() })
/** 我的行程（即將出發 / 進行中 / 已完成；進行中含訂單） */
export const useTrips = () => useQuery({ queryKey: travelerKeys.trips, queryFn: () => tripsApi.mine() })
export const useHistoryTours = () => useQuery({ queryKey: travelerKeys.historyTours, queryFn: () => tripsApi.history() })

/** 線上報名：後端建立的行程加入「即將出發」 */
export function useBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: BookingInput) => tripsApi.book(v),
    onSuccess: (r) => qc.setQueryData<TripsData>(travelerKeys.trips, (d) => d && { ...d, upcoming: [...d.upcoming, r.trip] }),
  })
}
