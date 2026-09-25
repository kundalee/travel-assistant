import { del, get, patch, post, resource } from '../resource'
import type { Announcement } from '../types/admin'

export const announcementsApi = resource('admin.announcements', '後台 · 公告 Announcements', {
  list: get<Announcement[]>()('/admin/announcements', '公告清單'),
  create: post<Announcement, Omit<Announcement, 'id'>>()('/admin/announcements', '新增公告'),
  update: patch<Announcement, Partial<Announcement>>()('/admin/announcements/:id', '修改 / 發佈公告'),
  remove: del()('/admin/announcements/:id', '刪除公告'),
})
