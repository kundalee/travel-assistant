import { useQuery } from '@tanstack/react-query'
import { profileApi } from '../../../api/guide'
import { guideKeys } from './keys'

/** 登入帳號的領隊資料（員編、頭像、email） */
export const useProfile = () => useQuery({ queryKey: guideKeys.profile, queryFn: () => profileApi.get() })
