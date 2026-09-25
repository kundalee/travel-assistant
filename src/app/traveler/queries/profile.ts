import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../../../api/traveler'
import type { TravelerProfile } from '../../../api/types/traveler'
import { travelerKeys } from './keys'

/** 個人資料（護照、緊急聯絡人、email） */
export const useProfile = () => useQuery({ queryKey: travelerKeys.profile, queryFn: () => profileApi.get() })

/** 儲存個人資料：以後端回傳的儲存結果更新快取（email 由帳號決定，不送出） */
export function useSaveProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ email: _email, ...p }: TravelerProfile) => profileApi.save(p),
    onSuccess: (saved) => qc.setQueryData(travelerKeys.profile, saved),
  })
}

export const useUploadPassportPhoto = () => useMutation({ mutationFn: (file: File) => profileApi.uploadPassportPhoto({ file }) })
