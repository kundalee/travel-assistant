/* 支援店家入口的伺服器資料（TanStack Query）：讀取 useXxx、寫入 useXxx mutation；寫入成功後以後端結果更新快取 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contentApi, incomeApi, ordersApi, profileApi } from '../../../api/partner'
import type { CancelledOrder, Profile } from '../../../api/types/partner'

export const partnerKeys = {
  all: ['partner'] as const,
  profile: ['partner', 'profile'] as const,
  notices: ['partner', 'notices'] as const,
  boutique: ['partner', 'boutique'] as const,
  income: ['partner', 'income'] as const,
  cancelled: ['partner', 'cancelled-orders'] as const,
}

/** 店家資料（身分證字號、生日、email） */
export const useProfile = () => useQuery({ queryKey: partnerKeys.profile, queryFn: () => profileApi.get() })

/** 儲存店家資料：以後端回傳的儲存結果更新快取 */
export function useSaveProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: Omit<Profile, 'email'>) => profileApi.save(p),
    onSuccess: (saved) => qc.setQueryData(partnerKeys.profile, saved),
  })
}

export const useNotices = () => useQuery({ queryKey: partnerKeys.notices, queryFn: () => contentApi.notices() })
export const useBoutique = () => useQuery({ queryKey: partnerKeys.boutique, queryFn: () => contentApi.boutique() })
export const useIncome = () => useQuery({ queryKey: partnerKeys.income, queryFn: () => incomeApi.get() })
export const useCancelledOrders = () => useQuery({ queryKey: partnerKeys.cancelled, queryFn: () => ordersApi.cancelled() })

/** 勾稽 / 取消勾稽（後端回 204）：成功後更新這些訂單的勾稽狀態 */
export function useReconcile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { orderNos: string[]; reconciled: boolean }) => ordersApi.reconcile(v),
    onSuccess: (_, { orderNos, reconciled }) => qc.setQueryData<CancelledOrder[]>(partnerKeys.cancelled,
      (l) => l?.map((o) => (orderNos.includes(o.orderNo) ? { ...o, reconciled } : o))),
  })
}
