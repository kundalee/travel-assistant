/* ═══════════════════════════════════════════════
   每日公告
   讀取與寫入都在這裡；畫面只用 hooks，不直接碰快取或 store。
   寫入一律先呼叫 API，成功後以後端回應更新快取；失敗訊息由 queryClient 統一顯示。
   ═══════════════════════════════════════════════ */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { noticesApi } from '../../../api/guide'
import type { Notice } from '../../../api/types/guide'
import { removeById, upsertById } from './cache'
import { guideKeys } from './keys'

/** 行程的每日公告（新的在前） */
export function useNotices(tourId: string) {
  return useQuery({
    queryKey: guideKeys.notices(tourId),
    queryFn: () => noticesApi.list({ tourId }),
  })
}

/** 新增或修改（含發佈：pub = true） */
export function useSaveNotice(tourId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (n: Omit<Notice, 'id' | 'time'> & { id?: string }) => n.id
      ? noticesApi.update({ tourId, noticeId: n.id }, n as Notice)
      : noticesApi.create({ tourId }, n),
    onSuccess: (saved) => qc.setQueryData<Notice[]>(guideKeys.notices(tourId), (l) => upsertById(l, saved)),
  })
}

export function useDeleteNotice(tourId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noticeId: string) => noticesApi.remove({ tourId, noticeId }),
    onSuccess: (_, noticeId) => qc.setQueryData<Notice[]>(guideKeys.notices(tourId), (l) => removeById(l, noticeId)),
  })
}
