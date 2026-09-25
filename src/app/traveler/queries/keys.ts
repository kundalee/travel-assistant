/* 團員入口的 query key；失效（invalidate）以前綴比對，['traveler'] 代表整個入口 */
export const travelerKeys = {
  all: ['traveler'] as const,
  profile: ['traveler', 'profile'] as const,
  catalog: ['traveler', 'catalog'] as const,
  trips: ['traveler', 'trips'] as const,
  historyTours: ['traveler', 'history-tours'] as const,
  orders: ['traveler', 'orders'] as const,
  boutique: ['traveler', 'boutique'] as const,
  groupBuy: ['traveler', 'group-buy'] as const,
  album: ['traveler', 'album'] as const,
  chats: ['traveler', 'chats'] as const,
  notices: ['traveler', 'notices'] as const,
  notifications: ['traveler', 'notifications'] as const,
  health: ['traveler', 'health'] as const,
}
