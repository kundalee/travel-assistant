/* ═══════════════════════════════════════════════
   支援店家 後端 API 介面（登入見 auth.ts）
   目前為 mock 實作；串接正式後端時實作 PartnerApi 並替換 `api` 匯出。
   ═══════════════════════════════════════════════ */
import type { AuthUser } from './auth'
import { session } from './session'
import { clone } from '../lib/utils'
import { SAMPLE } from './mocks/partner'
import type { PartnerData, PartnerUser, Profile } from './types/partner'

export interface PartnerApi {
  readonly mock: boolean
  /** 登入帳號對應的店家資料（身分證字號、生日…） */
  loadProfile(auth: AuthUser): Promise<PartnerUser>
  /** 公告、精品好物、收入與已取消訂單 */
  loadAll(): Promise<PartnerData>
  saveProfile(profile: Omit<Profile, 'email'>): Promise<void>
  setReconciled(orderNos: string[], reconciled: boolean): Promise<void>
}

const PROFILE_KEY = 'partner_profile'

const mockApi: PartnerApi = {
  mock: true,
  async loadProfile(auth) {
    const saved = session.get<Omit<Profile, 'email'>>(PROFILE_KEY)
    return { id: auth.id, email: auth.email, demo: auth.demo, profile: { name: auth.name, national_id: '', birthday: '', ...saved, email: auth.email } }
  },
  async loadAll() { return clone(SAMPLE) },
  async saveProfile(profile) { session.set(PROFILE_KEY, profile) },
  async setReconciled() {},
}

export const api: PartnerApi = mockApi
