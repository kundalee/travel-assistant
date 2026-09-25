import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../../../api/guide'
import type { Noti } from '../../../api/types/guide'
import { guideKeys } from './keys'

export const useNotifications = () => useQuery({ queryKey: guideKeys.notifications, queryFn: () => notificationsApi.list() })

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.setQueryData<Noti[]>(guideKeys.notifications, (l) => l?.map((n) => ({ ...n, read: true }))),
  })
}
