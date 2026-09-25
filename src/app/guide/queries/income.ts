import { useQuery } from '@tanstack/react-query'
import { incomeApi } from '../../../api/guide'
import { guideKeys } from './keys'

export const useIncome = () => useQuery({ queryKey: guideKeys.income, queryFn: () => incomeApi.get() })
