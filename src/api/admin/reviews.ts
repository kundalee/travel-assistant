import { get, resource } from '../resource'
import type { Review } from '../types/admin'

export const reviewsApi = resource('admin.reviews', '後台 · 評價 Reviews', {
  list: get<Review[]>()('/admin/reviews', '評價清單'),
})
