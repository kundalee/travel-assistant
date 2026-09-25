import { get, post, resource } from '../resource'
import type { TravelerData, Vitals } from '../types/traveler'

export const healthApi = resource('traveler.health', '團員 · 防疫監控 Health', {
  get: get<Pick<TravelerData, 'trace' | 'contacts'>>()('/traveler/health', '防疫監控：足跡與接觸者'),
  uploadVitals: post<{ count: number }, { records: Vitals[] }>()('/traveler/vitals', '回傳體溫血壓量測'),
})
