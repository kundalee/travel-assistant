import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '../../../api/guide'
import { guideKeys } from './keys'

export const useBoutique = () => useQuery({ queryKey: guideKeys.boutique, queryFn: () => productsApi.boutique() })

/** 分享精品好物給團員（後端寫入行程對話）→ 重新讀取對話 */
export function useShareBoutique() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => productsApi.share({ itemId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: guideKeys.chats }),
  })
}
