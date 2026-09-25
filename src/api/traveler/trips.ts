import { get, post, resource } from '../resource'
import type { CatalogTour, CompletedTrip, HistoryTour, OngoingTrip, PayMethod, UpcomingTrip } from '../types/traveler'

export interface BookingInput {
  tourId: string
  name: string
  phone: string
  nationalId: string
  passport: string
  needs: string
  pay: PayMethod
}

export const tripsApi = resource('traveler.trips', '團員 · 行程 Trips', {
  catalog: get<CatalogTour[]>()('/traveler/tours', '行程目錄（探索 / 詳情）'),
  mine: get<{ upcoming: UpcomingTrip[]; ongoing: OngoingTrip[]; completed: CompletedTrip[] }>()('/traveler/trips', '我的行程（即將出發 / 進行中 / 已完成）'),
  history: get<HistoryTour[]>()('/traveler/history-tours', '歷史行程'),
  /** 回傳報名編號、審核狀態與建立的即將出發行程（集合資訊待通知） */
  book: post<{ bookingId: string; status: 'pending' | 'approved'; trip: UpcomingTrip }, BookingInput>()('/traveler/bookings', '線上報名行程'),
})
