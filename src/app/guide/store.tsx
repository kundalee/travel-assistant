import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast, Toaster, type IconName } from '../../components'
import { useAuth } from '../auth/AuthProvider'
import { errMsg } from '../../lib/utils'
import { api, type GuideAction } from '../../api/guide'
import { SAMPLE } from '../../api/mocks/guide'
import type { GuideData, GuideUser } from '../../api/types/guide'

interface GuideStore {
  user: GuideUser | null
  ready: boolean
  data: GuideData
  logout: () => Promise<void>
  /**
   * 修改本地資料（在複本上直接改寫），並將 action 送往後端。
   * recipe 需為純函式（StrictMode 下可能執行兩次）。
   */
  commit: (recipe: (draft: GuideData) => void, action?: GuideAction, msg?: string, icon?: IconName) => Promise<void>
}

const GuideContext = createContext<GuideStore | null>(null)

export function useGuide() {
  const ctx = useContext(GuideContext)
  if (!ctx) throw new Error('useGuide must be used inside <GuideProvider>')
  return ctx
}

export function GuideProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GuideUser | null>(null)
  const [ready, setReady] = useState(false)
  const [data, setData] = useState<GuideData>(SAMPLE)

  const auth = useAuth()
  const logout = auth.logout

  const commit = useCallback(async (recipe: (draft: GuideData) => void, action?: GuideAction, msg?: string, icon?: IconName) => {
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

  /* 載入登入帳號的領隊資料與行程資料（登入由共用的 AuthProvider 處理） */
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

  const value = useMemo<GuideStore>(() => ({ user, ready, data, logout, commit }), [user, ready, data, logout, commit])
  return (
    <GuideContext.Provider value={value}>
      {children}
      <Toaster />
    </GuideContext.Provider>
  )
}
