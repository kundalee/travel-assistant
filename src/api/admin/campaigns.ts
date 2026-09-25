import { get, resource } from '../resource'
import type { Campaign } from '../types/admin'

export const campaignsApi = resource('admin.campaigns', '後台 · 行銷 Campaigns', {
  list: get<Campaign[]>()('/admin/campaigns', '行銷訊息清單'),
})
