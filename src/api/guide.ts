/* ═══════════════════════════════════════════════
   領隊導遊 後端 API 介面
   目前為 mock 實作；串接正式後端時實作 GuideApi 並替換 `api` 匯出。
   所有寫入動作皆經由 send(action)，後端依 action.type 處理。
   ═══════════════════════════════════════════════ */
import type { AuthUser } from './auth'
import { clone } from '../lib/utils'
import { DEMO_PROFILE, SAMPLE } from './mocks/guide'
import type { Campaign, GatherPoint, GuideData, GuideUser, Notice, OrderStatus } from './types/guide'

export type GuideAction =
  | { type: 'placeGroupOrder'; tourId: string; items: { id: string; qty: number }[] }
  | { type: 'updateMemberOrder'; tourId: string; memberId: string; orderId: string; status: OrderStatus }
  | { type: 'saveNotice'; tourId: string; notice: Notice }
  | { type: 'deleteNotice'; tourId: string; id: string }
  | { type: 'sharePhotos'; tourId: string; files: File[]; memberIds: string[] | 'all' }
  | { type: 'saveCampaign'; campaign: Campaign }
  | { type: 'deleteCampaign'; id: string }
  | { type: 'callMembers'; campaignId: string; codes: string[] }
  | { type: 'savePoint'; point: GatherPoint }
  | { type: 'deletePoint'; id: string }
  | { type: 'setDealRecon'; orderId: string; recon: boolean }
  | { type: 'sendMessage'; context: 'tour' | 'deal'; chatKey: string; text: string }
  | { type: 'markNotisRead' }

export interface GuideApi {
  readonly mock: boolean
  /** 登入帳號對應的領隊資料（員編、頭像…）；登入見 auth.ts */
  loadProfile(auth: AuthUser): Promise<GuideUser>
  loadAll(): Promise<GuideData>
  send(action: GuideAction): Promise<void>
}

const mockApi: GuideApi = {
  mock: true,
  async loadProfile(auth) {
    return { id: auth.id, email: auth.email, demo: auth.demo, profile: { ...DEMO_PROFILE, name: auth.name, email: auth.email } }
  },
  async loadAll() { return clone(SAMPLE) },
  async send() {},
}

export const api: GuideApi = mockApi
