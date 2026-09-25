import { get, resource } from '../resource'
import type { Good, Notice } from '../types/partner'

export const contentApi = resource('partner.content', '店家 · 公告與精品 Content', {
  notices: get<Notice[]>()('/partner/notices', '一般公告'),
  boutique: get<Good[]>()('/partner/boutique', '精品好物'),
})
