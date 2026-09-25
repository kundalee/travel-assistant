import { useMutation, useQuery } from '@tanstack/react-query'
import { healthApi } from '../../../api/traveler'
import type { Vitals } from '../../../api/types/traveler'
import { travelerKeys } from './keys'

/** 防疫監控：今日足跡與接觸者 */
export const useHealth = () => useQuery({ queryKey: travelerKeys.health, queryFn: () => healthApi.get() })
export const useUploadVitals = () => useMutation({ mutationFn: (records: Vitals[]) => healthApi.uploadVitals({ records }) })
