import { get, put, resource } from '../resource'
import type { Profile } from '../types/partner'

export const profileApi = resource('partner.profile', '店家 · 店家資料 Profile', {
  /** email 為登入帳號的 email（不可修改） */
  get: get<Profile>()('/partner/profile', '店家資料（身分證字號、生日、email）'),
  /** 回傳儲存後的店家資料 */
  save: put<Profile, Omit<Profile, 'email'>>()('/partner/profile', '儲存店家資料'),
})
