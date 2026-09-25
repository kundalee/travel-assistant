import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toursApi } from '../../../api/guide'
import { guideKeys } from './keys'

export type ToursData = Awaited<ReturnType<typeof toursApi.mine>>

/** 我的行程（進行中 / 即將出發 / 已完成；進行中含地點、團員訂單與評價） */
export const useTours = () => useQuery({ queryKey: guideKeys.tours, queryFn: () => toursApi.mine() })

export const useHistoryTours = () => useQuery({ queryKey: guideKeys.historyTours, queryFn: () => toursApi.history() })

/** 行程照片（近期分享 / 來自團員） */
export const useTourPhotos = (tourId: string) =>
  useQuery({ queryKey: guideKeys.tourPhotos(tourId), queryFn: () => toursApi.photos({ tourId }) })

/** 分享照片給團員；成功後重新讀取照片 */
export function useSharePhotos(tourId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { files: File[]; memberIds: string }) => toursApi.sharePhotos({ tourId }, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: guideKeys.tourPhotos(tourId) }),
  })
}
