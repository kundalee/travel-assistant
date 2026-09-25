import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { campaignsApi } from '../../../api/guide'
import type { Campaign } from '../../../api/types/guide'
import { removeById, upsertById } from './cache'
import { guideKeys } from './keys'

export const useCampaigns = () => useQuery({ queryKey: guideKeys.campaigns, queryFn: () => campaignsApi.list() })

/** 新增或修改；發佈（pub = true）時後端同時呼叫團員並寫入團購對話 → 重新讀取對話 */
export function useSaveCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (c: Omit<Campaign, 'id' | 'time'> & { id?: string }) => c.id
      ? campaignsApi.update({ campaignId: c.id }, c as Campaign)
      : campaignsApi.create(c),
    onSuccess: (saved) => {
      qc.setQueryData<Campaign[]>(guideKeys.campaigns, (l) => upsertById(l, saved))
      if (saved.pub) void qc.invalidateQueries({ queryKey: guideKeys.chats })
    },
  })
}

/** 發出呼叫（一對多） */
export function useCallCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { campaignId: string; codes: string[] }) => campaignsApi.call({ campaignId: v.campaignId }, { codes: v.codes }),
    onSuccess: (saved) => {
      qc.setQueryData<Campaign[]>(guideKeys.campaigns, (l) => upsertById(l, saved))
      void qc.invalidateQueries({ queryKey: guideKeys.chats })
    },
  })
}

export function useDeleteCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (campaignId: string) => campaignsApi.remove({ campaignId }),
    onSuccess: (_, campaignId) => qc.setQueryData<Campaign[]>(guideKeys.campaigns, (l) => removeById(l, campaignId)),
  })
}
