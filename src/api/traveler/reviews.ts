import { resource, upload } from '../resource'

export interface ReviewInput {
  tourId: string
  rating: number
  title: string
  content: string
  anonymous: boolean
  photos: File[]
}

export const reviewsApi = resource('traveler.reviews', '團員 · 評價與回憶 Reviews', {
  create: upload<{ reviewId: string }, ReviewInput>()('/traveler/reviews', '撰寫行程評價'),
  publishMemory: upload<{ count: number }, { tourId: string; caption: string; files: File[] }>()('/traveler/memories', '發佈旅遊回憶'),
})
