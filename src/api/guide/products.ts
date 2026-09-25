import { get, post, resource } from '../resource'
import type { Boutique } from '../types/guide'

export const productsApi = resource('guide.products', '領隊 · 精品好物 Products', {
  boutique: get<Boutique[]>()('/guide/boutique', '精品好物'),
  share: post<{ sharedTo: number }>()('/guide/boutique/:itemId/share', '分享精品好物給團員'),
})
