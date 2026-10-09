import { del, get, patch, post, resource } from '../resource'
import type { Shop, ShopCreate, ShopUpdate } from '../types/admin'

/* 支援店家（管理員）：路徑沿用後端的 /shops。
   刪除會連同所有商品一起刪除，且有行程使用其商品時後端會拒絕；有歷史資料的店家請改用停用（is_active: false） */
export const shopsApi = resource('admin.shops', '後台 · 支援店家 Shops', {
  list: get<Shop[]>()('/shops', '支援店家清單'),
  create: post<Shop, ShopCreate>()('/shops', '新增支援店家'),
  update: patch<Shop, ShopUpdate>()('/shops/:id', '修改 / 停用支援店家'),
  remove: del()('/shops/:id', '刪除支援店家（連同所有商品；有行程使用時拒絕）'),
})
