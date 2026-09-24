import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast, Toaster, type IconName } from '../../components'
import { useAuth } from '../auth/AuthProvider'
import { errMsg } from '../../lib/utils'
import { api, type TravelerAction } from '../../api/traveler'
import { SAMPLE } from '../../api/mocks/traveler'
import type { CartItem, TravelerData, TravelerProfile, TravelerUser } from '../../api/types/traveler'

interface TravelerStore {
  user: TravelerUser | null
  ready: boolean
  data: TravelerData
  logout: () => Promise<void>
  saveProfile: (profile: TravelerProfile) => Promise<void>
  /** 修改本地資料（在複本上改寫）並送出 action；recipe 需為純函式 */
  commit: (recipe: (draft: TravelerData) => void, action?: TravelerAction, msg?: string, icon?: IconName) => Promise<void>
  /** 團購購物車（跨畫面保留） */
  gbCart: CartItem[]
  setGbCart: (fn: (cart: CartItem[]) => CartItem[]) => void
}

const TravelerContext = createContext<TravelerStore | null>(null)

export function useTraveler() {
  const ctx = useContext(TravelerContext)
  if (!ctx) throw new Error('useTraveler must be used inside <TravelerProvider>')
  return ctx
}

export function TravelerProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TravelerUser | null>(null)
  const [ready, setReady] = useState(false)
  const [data, setData] = useState<TravelerData>(SAMPLE)
  const [gbCart, setGbCartState] = useState<CartItem[]>([])

  /* 登入 / 登出由共用的 AuthProvider 處理；登出後入口改顯示登入視窗，本 store 隨之卸載 */
  const auth = useAuth()
  const logout = auth.logout

  const saveProfile = useCallback(async (profile: TravelerProfile) => {
    try {
      await api.saveProfile(profile)
      setUser((u) => (u ? { ...u, profile } : u))
      toast(api.mock ? '資料已儲存（展示）' : '資料已儲存')
    } catch (e) {
      toast('儲存失敗：' + errMsg(e), 'alert-circle')
    }
  }, [])

  const commit = useCallback(async (recipe: (draft: TravelerData) => void, action?: TravelerAction, msg?: string, icon?: IconName) => {
    setData((prev) => {
      const next = structuredClone(prev)
      recipe(next)
      return next
    })
    if (msg) toast(msg, icon)
    if (!action) return
    try {
      await api.send(action)
    } catch (e) {
      toast('同步失敗：' + errMsg(e), 'cloud-off')
    }
  }, [])

  const setGbCart = useCallback((fn: (cart: CartItem[]) => CartItem[]) => setGbCartState(fn), [])

  /* 載入登入帳號的團員資料與行程資料 */
  const authUser = auth.user
  useEffect(() => {
    if (!authUser) return
    let alive = true
    Promise.all([api.loadProfile(authUser), api.loadAll()])
      .then(([u, d]) => { if (alive) { setUser(u); setData(d) } })
      .catch((e) => toast('資料讀取失敗：' + errMsg(e), 'cloud-off'))
      .finally(() => { if (alive) setReady(true) })
    return () => { alive = false }
  }, [authUser])

  const value = useMemo<TravelerStore>(
    () => ({ user, ready, data, logout, saveProfile, commit, gbCart, setGbCart }),
    [user, ready, data, logout, saveProfile, commit, gbCart, setGbCart],
  )
  return (
    <TravelerContext.Provider value={value}>
      {children}
      <Toaster />
    </TravelerContext.Provider>
  )
}
