import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { noticesApi } from '../../../api/traveler'
import type { Noti } from '../../../api/types/traveler'
import { travelerKeys } from './keys'

/** 公告（每日 / 一般） */
export const useNotices = () => useQuery({ queryKey: travelerKeys.notices, queryFn: () => noticesApi.notices() })
/** 通知（鈴鐺未讀數） */
export const useNotifications = () => useQuery({ queryKey: travelerKeys.notifications, queryFn: () => noticesApi.notifications() })

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => noticesApi.markAllRead(),
    onSuccess: () => qc.setQueryData<Noti[]>(travelerKeys.notifications, (l) => l?.map((n) => ({ ...n, read: true }))),
  })
}
