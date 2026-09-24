/* ═══════════════════════════════════════════════
   後台管理 後端 API 介面（登入見 auth.ts）
   目前為 mock 實作（範例資料、存於記憶體）。
   串接正式後端時，實作 AdminApi 並替換下方 `api` 匯出即可。
   ═══════════════════════════════════════════════ */
import { SAMPLE } from './mocks/admin'
import type { AdminData } from './types/admin'
import { clone } from '../lib/utils'

export type CollectionKey = keyof AdminData
export type Item<K extends CollectionKey> = AdminData[K][number]

export interface AdminApi {
  /** true = 使用範例資料（尚未連接後端） */
  readonly mock: boolean
  loadAll(): Promise<AdminData>
  create<K extends CollectionKey>(key: K, item: Item<K>): Promise<void>
  update<K extends CollectionKey>(key: K, id: string, changes: Partial<Item<K>>): Promise<void>
  remove(key: CollectionKey, id: string): Promise<void>
}

const mockApi: AdminApi = {
  mock: true,
  async loadAll() { return clone(SAMPLE) },
  async create() {},
  async update() {},
  async remove() {},
}

export const api: AdminApi = mockApi
