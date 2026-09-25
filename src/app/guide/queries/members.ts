import { useQuery } from '@tanstack/react-query'
import { membersApi } from '../../../api/guide'
import { guideKeys } from './keys'

/** 團員（進行中行程）、各行程名冊與歷史行程 */
export const useMembers = () => useQuery({ queryKey: guideKeys.members, queryFn: () => membersApi.list() })
