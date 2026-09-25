import { del, get, post, put, resource } from '../resource'
import type { Notice } from '../types/guide'

export const noticesApi = resource('guide.notices', '領隊 · 每日公告 Notices', {
  list: get<Notice[]>()('/guide/tours/:tourId/notices', '每日公告清單（新的在前）'),
  create: post<Notice, Omit<Notice, 'id' | 'time'>>()('/guide/tours/:tourId/notices', '新增每日公告'),
  update: put<Notice, Notice>()('/guide/tours/:tourId/notices/:noticeId', '修改 / 發佈公告'),
  remove: del()('/guide/tours/:tourId/notices/:noticeId', '刪除公告'),
})
