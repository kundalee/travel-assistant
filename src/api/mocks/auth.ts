import type { AuthUser, Role } from '../auth'

/* 體驗帳號：每個入口一組（listedOn = 列在哪個入口的登入視窗）。
   guide 同時具備團員身分，用來示範多重身分：於 /guide 登入後可直接進入 /traveler */
export const DEMO_ACCOUNTS: (AuthUser & { password: string; listedOn: Role })[] = [
  { id: 'demo-admin', name: '系統管理員', email: 'admin@example.com', password: 'admin1234', roles: ['admin'], listedOn: 'admin', demo: true },
  { id: 'demo-guide', name: '王大明', email: 'guide@example.com', password: 'guide1234', roles: ['guide', 'traveler'], listedOn: 'guide', demo: true },
  { id: 'demo-traveler', name: '團員', email: 'member@example.com', password: 'member1234', roles: ['traveler'], listedOn: 'traveler', demo: true },
  { id: 'demo-partner', name: '京都物產店', email: 'store@example.com', password: 'store1234', roles: ['partner'], listedOn: 'partner', demo: true },
]

/* 帳號（不含密碼等內部欄位） */
export function publicUser(id: string): AuthUser | null {
  const a = DEMO_ACCOUNTS.find((x) => x.id === id)
  if (!a) return null
  const { password: _pw, listedOn: _l, ...user } = a
  return user
}
