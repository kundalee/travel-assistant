import { get, post, resource } from '../resource'
import type { Noti, Notice } from '../types/traveler'

export const noticesApi = resource('traveler.notices', '團員 · 公告與通知 Notices', {
  notices: get<Notice[]>()('/traveler/notices', '公告（每日 / 一般）'),
  notifications: get<Noti[]>()('/traveler/notifications', '通知（鈴鐺未讀數）'),
  markAllRead: post()('/traveler/notifications/read-all', '通知全部標為已讀', 'U'),
})
