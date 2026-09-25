import { get, resource, upload } from '../resource'
import type { CompletedTour, HistoryTour, OngoingTour, TourPhotos, UpcomingTour } from '../types/guide'

export const toursApi = resource('guide.tours', '領隊 · 行程 Tours', {
  mine: get<{ ongoing: OngoingTour[]; upcoming: UpcomingTour[]; completed: CompletedTour[] }>()('/guide/tours', '我的行程（進行中 / 即將出發 / 已完成）'),
  history: get<HistoryTour[]>()('/guide/history-tours', '歷史行程'),
  photos: get<TourPhotos>()('/guide/tours/:tourId/photos', '行程照片（近期分享 / 來自團員）'),
  /** memberIds：'all' 或以逗號分隔的團員 id */
  sharePhotos: upload<{ count: number }, { files: File[]; memberIds: string }>()('/guide/tours/:tourId/photos', '分享照片給團員'),
})
