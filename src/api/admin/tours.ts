import { del, get, patch, post, resource } from '../resource'
import type { RosterEntry, Tour } from '../types/admin'

/** 每筆行程皆含 member_count */
export const toursApi = resource('admin.tours', '後台 · 行程 Tours', {
  list: get<Tour[]>()('/admin/tours', '行程清單（含團員人數）'),
  create: post<Tour, Omit<Tour, 'id'>>()('/admin/tours', '新增行程'),
  update: patch<Tour, Partial<Tour>>()('/admin/tours/:id', '修改行程 / 指派領隊 / 發佈給團員'),
  remove: del()('/admin/tours/:id', '刪除行程'),
  /** 團員名冊（含預設登入帳密） */
  members: get<RosterEntry[]>()('/admin/tours/:id/members', '團員名冊（含預設登入帳密）'),
  /** 與 CRM 同步，回傳同步時間與最新行程 */
  syncCrm: post<{ syncedAt: string; tours: Tour[] }>()('/admin/crm/sync', '與 CRM 同步行程 / 團編 / 團員', 'U'),
})
