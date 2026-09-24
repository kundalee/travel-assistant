/* ═══════════════════════════════════════════════
   團員 後端 API 介面
   目前為 mock 實作；串接正式後端時實作 TravelerApi 並替換 `api` 匯出。
   寫入動作皆經由 send(action)。
   ═══════════════════════════════════════════════ */
import type { AuthUser } from './auth'
import { session } from './session'
import { clone } from '../lib/utils'
import { EMPTY_PROFILE, SAMPLE } from './mocks/traveler'
import type { Fulfillment, PayMethod, TravelerData, TravelerProfile, TravelerUser, TripOrder, Vitals } from './types/traveler'

export type TravelerAction =
  | { type: 'book'; tourId: string; name: string; phone: string; nationalId: string; passport: string; needs: string; pay: PayMethod }
  | { type: 'placeOrder'; tourId: string; orders: TripOrder[]; method: PayMethod; fulfillment: Fulfillment }
  | { type: 'updateOrder'; tourId: string; orderId: string; changes: Partial<TripOrder> }
  | { type: 'placeGroupBuy'; items: { id: string; qty: number }[] }
  | { type: 'review'; tourTitle: string; rating: number; title: string; content: string; anonymous: boolean; photos: File[] }
  | { type: 'publishMemory'; tourTitle: string; files: File[]; caption: string }
  | { type: 'sharePhotos'; tourId: string; files: File[] }
  | { type: 'uploadAlbum'; album: string; files: File[] }
  | { type: 'sendMessage'; chatKey: string; text: string }
  | { type: 'uploadVitals'; records: Vitals[] }
  | { type: 'markNotisRead' }

export interface TravelerApi {
  readonly mock: boolean
  /** 登入帳號對應的團員資料（護照、緊急聯絡人…）；登入見 auth.ts */
  loadProfile(auth: AuthUser): Promise<TravelerUser>
  loadAll(): Promise<TravelerData>
  saveProfile(profile: TravelerProfile): Promise<void>
  send(action: TravelerAction): Promise<void>
}

const PROFILE_KEY = 'traveler_profile'

const mockApi: TravelerApi = {
  mock: true,
  async loadProfile(auth) {
    const saved = session.get<TravelerProfile>(PROFILE_KEY)
    return { id: auth.id, email: auth.email, demo: auth.demo, profile: saved ?? { ...EMPTY_PROFILE, name: auth.name, email: auth.email } }
  },
  async loadAll() { return clone(SAMPLE) },
  async saveProfile(profile) { session.set(PROFILE_KEY, profile) },
  async send() {},
}

export const api: TravelerApi = mockApi
