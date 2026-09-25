import { del, get, post, put, resource } from '../resource'
import type { Campaign } from '../types/guide'

/** 發佈（pub = true）時後端同時呼叫 rcpt 內的團員 */
export const campaignsApi = resource('guide.campaigns', '領隊 · 團購呼叫 Campaigns', {
  list: get<Campaign[]>()('/guide/campaigns', '團購呼叫訊息'),
  create: post<Campaign, Omit<Campaign, 'id' | 'time'>>()('/guide/campaigns', '新增呼叫訊息（發佈時同時呼叫）'),
  update: put<Campaign, Campaign>()('/guide/campaigns/:campaignId', '修改呼叫訊息'),
  remove: del()('/guide/campaigns/:campaignId', '刪除呼叫訊息'),
  call: post<Campaign, { codes: string[] }>()('/guide/campaigns/:campaignId/call', '發出呼叫（一對多）'),
})
