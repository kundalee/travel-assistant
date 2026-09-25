import { del, get, patch, post, resource } from '../resource'
import type { Place } from '../types/admin'

export const placesApi = resource('admin.places', '後台 · 旅遊地點 Places', {
  list: get<Place[]>()('/admin/places', '旅遊地點清單（含紀念商品）'),
  create: post<Place, Omit<Place, 'id'>>()('/admin/places', '新增旅遊地點'),
  update: patch<Place, Partial<Place>>()('/admin/places/:id', '修改地點 / 串聯紀念商品'),
  remove: del()('/admin/places/:id', '刪除地點（並自行程移除）'),
})
