import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pointsApi } from '../../../api/guide'
import type { GatherPoint } from '../../../api/types/guide'
import { removeById, upsertById } from './cache'
import { guideKeys } from './keys'

export const usePoints = () => useQuery({ queryKey: guideKeys.points, queryFn: () => pointsApi.list() })

/** 新增（加在最後）或修改 */
export function useSavePoint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: Omit<GatherPoint, 'id'> & { id?: string }) => p.id
      ? pointsApi.update({ pointId: p.id }, p as GatherPoint)
      : pointsApi.create(p),
    onSuccess: (saved) => qc.setQueryData<GatherPoint[]>(guideKeys.points, (l) => upsertById(l, saved, 'end')),
  })
}

export function useDeletePoint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pointId: string) => pointsApi.remove({ pointId }),
    onSuccess: (_, pointId) => qc.setQueryData<GatherPoint[]>(guideKeys.points, (l) => removeById(l, pointId)),
  })
}
