import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewsApi, type ReviewInput } from '../../../api/traveler'
import { travelerKeys } from './keys'

/* 評價與回憶會改變已完成行程的評分 / 回憶張數 → 重新讀取行程 */
export function useCreateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: ReviewInput) => reviewsApi.create(v),
    onSuccess: () => qc.invalidateQueries({ queryKey: travelerKeys.trips }),
  })
}

export function usePublishMemory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { tourId: string; caption: string; files: File[] }) => reviewsApi.publishMemory(v),
    onSuccess: () => qc.invalidateQueries({ queryKey: travelerKeys.trips }),
  })
}
