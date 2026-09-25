import { get, put, resource, upload } from '../resource'
import type { TravelerProfile } from '../types/traveler'

export const profileApi = resource('traveler.profile', '團員 · 個人資料 Profile', {
  /** email 為登入帳號的 email（不可修改） */
  get: get<TravelerProfile>()('/traveler/profile', '個人資料（護照、緊急聯絡人、email）'),
  /** 回傳儲存後的個人資料 */
  save: put<TravelerProfile, Omit<TravelerProfile, 'email'>>()('/traveler/profile', '儲存個人資料'),
  uploadPassportPhoto: upload<{ url: string }, { file: File }>()('/traveler/profile/passport-photo', '上傳護照照片'),
})
