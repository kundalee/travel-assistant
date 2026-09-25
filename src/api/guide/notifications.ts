import { get, post, resource } from '../resource'
import type { Noti } from '../types/guide'

export const notificationsApi = resource('guide.notifications', '領隊 · 通知 Notifications', {
  list: get<Noti[]>()('/guide/notifications', '通知中心'),
  markAllRead: post()('/guide/notifications/read-all', '通知全部標為已讀', 'U'),
})
