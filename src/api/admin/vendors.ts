import { del, get, patch, post, resource } from '../resource'
import type { Vendor } from '../types/admin'

export const vendorsApi = resource('admin.vendors', '後台 · 支援店家 Vendors', {
  list: get<Vendor[]>()('/admin/vendors', '支援店家清單'),
  create: post<Vendor, Omit<Vendor, 'id'>>()('/admin/vendors', '新增支援店家'),
  update: patch<Vendor, Partial<Vendor>>()('/admin/vendors/:id', '修改支援店家'),
  remove: del()('/admin/vendors/:id', '刪除支援店家'),
})
