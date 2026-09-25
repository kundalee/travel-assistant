/* ═══════════════════════════════════════════════
   登入 / 註冊（所有入口共用同一組帳號）
   一個帳號可擁有多個身分（roles）；進入哪個入口由網址決定，
   入口會檢查帳號是否具備該身分。
   ═══════════════════════════════════════════════ */
import { ApiError, apiUrl, isFake, setAuthToken } from './client'
import { fillPath } from './endpoints'
import { get, post, resource } from './resource'
import { storage } from './storage'

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
  /** true = 帳號群組由假後端回應（登入視窗顯示體驗帳號） */
  readonly mock: boolean
  login(email: string, password: string): Promise<AuthUser>
  /** 回傳 null 表示需先完成 Email 驗證（或等待審核）才能登入 */
  register(input: RegisterInput): Promise<AuthUser | null>
  oauth(provider: 'google' | 'facebook'): Promise<void>
  forgotPassword(email: string): Promise<void>
  changePassword(password: string): Promise<void>
  logout(): Promise<void>
  /** 以保存的 token 還原登入狀態（token 存於 localStorage，關閉分頁後仍保持登入） */
  restoreSession(): Promise<AuthUser | null>
  /** 其他分頁登入 / 登出時通知；回傳取消訂閱的函式 */
  onOtherTabChange(cb: () => void): () => void
}

interface TokenResponse { token: string; user: AuthUser }

/** 帳號端點；頁面請使用下方的 authApi（負責保存 token） */
export const authEndpoints = resource('auth', '帳號 Auth', {
  login: post<TokenResponse, { email: string; password: string }>()('/auth/login', '登入'),
  register: post<Partial<TokenResponse> | null, RegisterInput>()('/auth/register', '註冊（團員 / 支援店家）'),
  oauth: get<void>()('/auth/oauth/:provider', 'Google / Facebook 登入（整頁跳轉）'),
  forgotPassword: post<void, { email: string }>()('/auth/forgot-password', '寄送重設密碼信'),
  changePassword: post<void, { password: string }>()('/auth/change-password', '修改密碼'),
  logout: post()('/auth/logout', '登出'),
  me: get<AuthUser>()('/auth/me', '目前登入的帳號（還原登入狀態）'),
}, { crud: false })
const ep = authEndpoints

const TOKEN_KEY = 'auth_token'

function storeToken(token: string | null) {
  setAuthToken(token)
  if (token) storage.set(TOKEN_KEY, token)
  else storage.remove(TOKEN_KEY)
}

export const authApi: AuthApi = {
  mock: isFake('auth'),
  async login(email, password) {
    const res = await ep.login({ email, password })
    storeToken(res.token)
    return res.user
  },
  async register(input) {
    const res = await ep.register(input)
    if (!res?.token || !res.user) return null
    storeToken(res.token)
    return res.user
  },
  async oauth(provider) {
    /* 真正的後端：整頁跳轉至第三方登入；假後端無法模擬，直接回報錯誤 */
    if (isFake('auth')) {
      await ep.oauth({ provider })
      return
    }
    window.location.assign(apiUrl(`${fillPath(ep.oauth.endpoint.path, { provider })}?redirect=${encodeURIComponent(window.location.href)}`))
  },
  async forgotPassword(email) {
    await ep.forgotPassword({ email })
  },
  async changePassword(password) {
    await ep.changePassword({ password })
  },
  async logout() {
    try { await ep.logout() } finally { storeToken(null) }
  },
  async restoreSession() {
    const token = storage.get<string>(TOKEN_KEY)
    setAuthToken(token)
    if (!token) return null
    try {
      return await ep.me()
    } catch (e) {
      /* 只有 401（token 失效）才清除；離線等錯誤保留 token，下次開啟再試 */
      if (e instanceof ApiError && e.status === 401) storeToken(null)
      return null
    }
  },
  onOtherTabChange(cb) {
    const listener = (e: StorageEvent) => { if (e.key === TOKEN_KEY || e.key === null) cb() }
    window.addEventListener('storage', listener)
    return () => window.removeEventListener('storage', listener)
  },
}
