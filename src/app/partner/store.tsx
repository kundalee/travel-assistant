import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast, Toaster } from '../../components'
import { useAuth } from '../auth/AuthProvider'
import { errMsg } from '../../lib/utils'
import { api } from '../../api/partner'
import type { PartnerData, PartnerUser, Profile } from '../../api/types/partner'

interface PartnerStore {
  user: PartnerUser | null
  ready: boolean
  data: PartnerData
  logout: () => Promise<void>
  saveProfile: (profile: Omit<Profile, 'email'>) => Promise<void>
  setReconciled: (orderNos: string[], reconciled: boolean) => Promise<void>
}

const EMPTY: PartnerData = { notices: [], goods: [], income: { souvenir: [], groupbuy: [] }, cancelled: [] }

const PartnerContext = createContext<PartnerStore | null>(null)

export function usePartner() {
  const ctx = useContext(PartnerContext)
  if (!ctx) throw new Error('usePartner must be used inside <PartnerProvider>')
  return ctx
}

export function PartnerProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PartnerUser | null>(null)
  const [ready, setReady] = useState(false)
  const [data, setData] = useState<PartnerData>(EMPTY)

  /* 登入 / 登出由共用的 AuthProvider 處理 */
  const auth = useAuth()
  const logout = auth.logout

  const saveProfile = useCallback(async (profile: Omit<Profile, 'email'>) => {
    try {
      await api.saveProfile(profile)
      setUser((u) => (u ? { ...u, profile: { ...u.profile, ...profile } } : u))
      toast(api.mock ? '資料已儲存（展示）' : '資料已儲存')
    } catch (e) {
      toast('儲存失敗：' + errMsg(e), 'alert-circle')
    }
  }, [])

  const setReconciled = useCallback(async (orderNos: string[], reconciled: boolean) => {
    setData((d) => ({ ...d, cancelled: d.cancelled.map((o) => (orderNos.includes(o.orderNo) ? { ...o, reconciled } : o)) }))
    try {
      await api.setReconciled(orderNos, reconciled)
    } catch (e) {
      toast('更新失敗：' + errMsg(e), 'alert-circle')
    }
  }, [])

  /* 載入登入帳號的店家資料與收入資料 */
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

  const value = useMemo<PartnerStore>(
    () => ({ user, ready, data, logout, saveProfile, setReconciled }),
    [user, ready, data, logout, saveProfile, setReconciled],
  )
  return (
    <PartnerContext.Provider value={value}>
      {children}
      <Toaster />
    </PartnerContext.Provider>
  )
}
