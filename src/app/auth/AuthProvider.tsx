import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, type AuthUser, type RegisterInput, type Role } from '../../api/auth'
import { toast } from '../../components'
import { queryClient } from '../queryClient'

interface AuthStore {
  user: AuthUser | null
  ready: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  /** 回傳 null 表示需先完成驗證 / 審核 */
  register: (input: RegisterInput) => Promise<AuthUser | null>
  logout: () => Promise<void>
  hasRole: (role: Role) => boolean
}

const AuthContext = createContext<AuthStore | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/* 全站共用的登入狀態（一次登入，所有具備身分的入口皆可進入） */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const restore = () => authApi.restoreSession().then(setUser).catch(() => setUser(null)).finally(() => setReady(true))
    restore()
    /* 其他分頁登入 / 登出 / 切換帳號時同步 */
    return authApi.onOtherTabChange(restore)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const u = await authApi.login(email, password)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const u = await authApi.register(input)
    if (u) setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    setUser(null)
    toast('已登出', 'logout')
  }, [])

  /* 換帳號或登出時清除伺服器資料快取，避免看到上一個帳號的資料 */
  const userId = user?.id
  useEffect(() => { queryClient.clear() }, [userId])

  const hasRole = useCallback((role: Role) => !!user?.roles.includes(role), [user])

  const value = useMemo(() => ({ user, ready, login, register, logout, hasRole }), [user, ready, login, register, logout, hasRole])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
