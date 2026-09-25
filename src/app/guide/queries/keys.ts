/* 領隊入口的 query key；失效（invalidate）以前綴比對，['guide'] 代表整個入口 */
export const guideKeys = {
  all: ['guide'] as const,
  profile: ['guide', 'profile'] as const,
  tours: ['guide', 'tours'] as const,
  historyTours: ['guide', 'history-tours'] as const,
  tourPhotos: (tourId: string) => ['guide', 'tour-photos', tourId] as const,
  notices: (tourId: string) => ['guide', 'notices', tourId] as const,
  members: ['guide', 'members'] as const,
  orders: ['guide', 'orders'] as const,
  dealOrders: ['guide', 'deal-orders'] as const,
  campaigns: ['guide', 'campaigns'] as const,
  points: ['guide', 'points'] as const,
  boutique: ['guide', 'boutique'] as const,
  income: ['guide', 'income'] as const,
  chats: ['guide', 'chats'] as const,
  notifications: ['guide', 'notifications'] as const,
}
