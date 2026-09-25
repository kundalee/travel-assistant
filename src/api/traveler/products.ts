import { get, resource } from '../resource'
import type { Boutique, GroupBuyItem } from '../types/traveler'

export const productsApi = resource('traveler.products', '團員 · 商品 Products', {
  boutique: get<Boutique[]>()('/traveler/boutique', '精品好物'),
  groupBuy: get<GroupBuyItem[]>()('/traveler/group-buy', '團購搶好康商品'),
})
