import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { photosApi } from '../../../api/traveler'
import type { AlbumPhoto } from '../../../api/types/traveler'
import { travelerKeys } from './keys'

export const useAlbum = () => useQuery({ queryKey: travelerKeys.album, queryFn: () => photosApi.album() })

/** 分享照片給領隊與團員 */
export const useSharePhotos = (tourId: string) =>
  useMutation({ mutationFn: (files: File[]) => photosApi.share({ tourId }, { files }) })

/** 上傳照片到團員相簿 → 重新讀取相簿 */
export function useUploadToAlbum(album: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (files: File[]) => photosApi.uploadToAlbum({ album }, { files }),
    onSuccess: () => qc.invalidateQueries({ queryKey: travelerKeys.album }),
  })
}

export function useFavoritePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (photoId: string) => photosApi.favorite({ photoId }),
    onSuccess: (_, photoId) => qc.setQueryData<AlbumPhoto[]>(travelerKeys.album, (l) => l?.map((p) => (p.id === photoId ? { ...p, favorite: true } : p))),
  })
}
