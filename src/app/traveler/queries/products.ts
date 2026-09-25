import { useQuery } from '@tanstack/react-query'
import { productsApi } from '../../../api/traveler'
import { travelerKeys } from './keys'

export const useBoutique = () => useQuery({ queryKey: travelerKeys.boutique, queryFn: () => productsApi.boutique() })
export const useGroupBuy = () => useQuery({ queryKey: travelerKeys.groupBuy, queryFn: () => productsApi.groupBuy() })
