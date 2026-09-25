import { get, resource } from '../resource'
import type { GuideProfile } from '../types/guide'

export const profileApi = resource('guide.profile', '領隊 · 個人資料 Profile', {
  /** email 為登入帳號的 email */
  get: get<GuideProfile>()('/guide/profile', '領隊資料（員編、頭像、email）'),
})
