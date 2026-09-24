/* ═══════════════════════════════════════════════
   登入 / 註冊（所有入口共用同一組帳號）
   一個帳號可擁有多個身分（roles）；進入哪個入口由網址決定，
   入口會檢查帳號是否具備該身分。
   目前為 mock 實作；串接正式後端時實作 AuthApi 並替換 `authApi` 匯出。
   ═══════════════════════════════════════════════ */
import { session } from './session'

export type Role = 'admin' | 'guide' | 'traveler' | 'partner'

export interface AuthUser {
  id: string
  email: string
  name: string
  roles: Role[]
  /** 體驗帳號（展示資料） */
  demo?: boolean
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  /** 在哪個入口註冊，即申請的身分（團員 / 支援店家） */
  role: Extract<Role, 'traveler' | 'partner'>
}

export interface AuthApi {
  readonly mock: boolean
  login(email: string, password: string): Promise<AuthUser>
  /** 回傳 null 表示需先完成 Email 驗證（或等待審核）才能登入 */
  register(input: RegisterInput): Promise<AuthUser | null>
  oauth(provider: 'google' | 'facebook'): Promise<void>
  forgotPassword(email: string): Promise<void>
  changePassword(password: string): Promise<void>
  logout(): Promise<void>
  restoreSession(): Promise<AuthUser | null>
}

/* 體驗帳號：每個入口一組（listedOn = 列在哪個入口的登入視窗）。
   guide 同時具備團員身分，用來示範多重身分：於 /guide 登入後可直接進入 /traveler */
export const DEMO_ACCOUNTS: (AuthUser & { password: string; listedOn: Role })[] = [
  { id: 'demo-admin', name: '系統管理員', email: 'admin@example.com', password: 'admin1234', roles: ['admin'], listedOn: 'admin', demo: true },
  { id: 'demo-guide', name: '王大明', email: 'guide@example.com', password: 'guide1234', roles: ['guide', 'traveler'], listedOn: 'guide', demo: true },
  { id: 'demo-traveler', name: '團員', email: 'member@example.com', password: 'member1234', roles: ['traveler'], listedOn: 'traveler', demo: true },
  { id: 'demo-partner', name: '京都物產店', email: 'store@example.com', password: 'store1234', roles: ['partner'], listedOn: 'partner', demo: true },
]

const SESSION_KEY = 'auth_session'

const mockAuth: AuthApi = {
  mock: true,
  async login(email, password) {
    const acc = DEMO_ACCOUNTS.find((a) => a.email === email.toLowerCase() && a.password === password)
    if (!acc) throw new Error('電子郵件或密碼錯誤。')
    const { password: _pw, listedOn: _listedOn, ...user } = acc
    session.set(SESSION_KEY, user)
    return user
  },
  async register() {
    throw new Error('展示模式無法註冊，請使用體驗帳號登入。')
  },
  async oauth(provider) {
    throw new Error(`${provider === 'google' ? 'Google' : 'Facebook'} 登入需串接後端後才能使用。`)
  },
  async forgotPassword() {},
  async changePassword() {},
  async logout() { session.remove(SESSION_KEY) },
  async restoreSession() { return session.get<AuthUser>(SESSION_KEY) },
}

export const authApi: AuthApi = mockAuth
