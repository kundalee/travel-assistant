import type { Role, UserRead } from '../auth'

/* 體驗帳號：每個入口一組（listedOn = 列在哪個入口的登入視窗）。
   guide 同時具備團員身分，用來示範多重身分：於 /guide 登入後可直接進入 /traveler */
export const DEMO_ACCOUNTS: (Pick<UserRead, 'id' | 'full_name' | 'email' | 'roles'> & { password: string; listedOn: Role })[] = [
  { id: 1, full_name: '系統管理員', email: 'admin@example.com', password: 'admin1234', roles: ['admin'], listedOn: 'admin' },
  { id: 2, full_name: '王大明', email: 'guide@example.com', password: 'guide1234', roles: ['guide', 'member'], listedOn: 'guide' },
  { id: 3, full_name: '團員', email: 'member@example.com', password: 'member1234', roles: ['member'], listedOn: 'member' },
  { id: 4, full_name: '京都物產店', email: 'store@example.com', password: 'store1234', roles: ['agent'], listedOn: 'agent' },
]

/** 帳號（與後端 GET /auth/me 相同的格式；不含密碼等內部欄位） */
export function publicUser(id: string): UserRead | null {
  const a = DEMO_ACCOUNTS.find((x) => String(x.id) === id)
  if (!a) return null
  const { password: _pw, listedOn: _l, ...user } = a
  return { ...user, phone: null, is_active: true, last_login_at: null, created_at: '2026-01-01T00:00:00Z' }
}
