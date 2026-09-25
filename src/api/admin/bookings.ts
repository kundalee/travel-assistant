import { get, patch, resource } from '../resource'
import type { Booking } from '../types/admin'

export const bookingsApi = resource('admin.bookings', '後台 · 報名審核 Bookings', {
  list: get<Booking[]>()('/admin/bookings', '報名清單'),
  update: patch<Booking, Partial<Booking>>()('/admin/bookings/:id', '核准報名'),
})
