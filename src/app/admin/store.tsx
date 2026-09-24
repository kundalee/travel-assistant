import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast, Toaster, type IconName } from '../../components'
import { api, type CollectionKey, type Item } from '../../api/admin'
import { SAMPLE } from '../../api/mocks/admin'
import type { AdminData } from '../../api/types/admin'
import { clone, errMsg } from './utils'

interface AdminStore {
  mock: boolean
  data: AdminData
  toast: (msg: string, icon?: IconName) => void
  refreshAll: () => Promise<void>
  /** 僅更新本地狀態（不呼叫 API） */
  patch: <K extends CollectionKey>(key: K, fn: (list: AdminData[K]) => AdminData[K]) => void
  /** 本地新增（置頂）＋ API */
  create: <K extends CollectionKey>(key: K, item: Item<K>, msg?: string, icon?: IconName) => Promise<void>
  /** 本地更新＋ API */
  update: <K extends CollectionKey>(key: K, id: string, changes: Partial<Item<K>>, msg?: string, icon?: IconName) => Promise<void>
  /** 本地刪除＋ API */
  remove: (key: CollectionKey, id: string, msg?: string) => Promise<void>
}

const AdminContext = createContext<AdminStore | null>(null)

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>')
  return ctx
}

type WithId = { id: string }

export function AdminProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdminData>(() => clone(SAMPLE))
  const patch = useCallback(<K extends CollectionKey>(key: K, fn: (list: AdminData[K]) => AdminData[K]) => {
    setData((d) => ({ ...d, [key]: fn(d[key]) }))
  }, [])

  /* 呼叫 API；成功顯示訊息，失敗提示 */
  const run = useCallback(async (call: () => Promise<void>, msg?: string, icon?: IconName) => {
    try {
      await call()
      if (msg) toast(msg, icon)
    } catch (e) {
      console.warn(e)
      toast('儲存失敗：' + errMsg(e), 'cloud-off')
    }
  }, [])

  const create = useCallback(<K extends CollectionKey>(key: K, item: Item<K>, msg?: string, icon?: IconName) => {
    patch(key, (l) => [item, ...l] as AdminData[K])
    return run(() => api.create(key, item), msg, icon)
  }, [patch, run])

  const update = useCallback(<K extends CollectionKey>(key: K, id: string, changes: Partial<Item<K>>, msg?: string, icon?: IconName) => {
    patch(key, (l) => (l as WithId[]).map((x) => (x.id === id ? { ...x, ...changes } : x)) as AdminData[K])
    return run(() => api.update(key, id, changes), msg, icon)
  }, [patch, run])

  const remove = useCallback((key: CollectionKey, id: string, msg?: string) => {
    patch(key, (l) => (l as WithId[]).filter((x) => x.id !== id) as AdminData[typeof key])
    return run(() => api.remove(key, id), msg, 'trash')
  }, [patch, run])

  const loadAll = useCallback(async () => {
    try {
      setData(await api.loadAll())
      return true
    } catch (e) {
      console.warn('loadAll failed', e)
      toast('資料讀取失敗', 'cloud-off')
      return false
    }
  }, [])

  const refreshAll = useCallback(async () => {
    if (await loadAll()) toast('已重新載入資料', 'refresh')
  }, [loadAll])

  /* 進入後台時載入資料（登入由共用的 AuthProvider 處理） */
  useEffect(() => {
    let alive = true
    api.loadAll()
      .then((d) => { if (alive) setData(d) })
      .catch(() => toast('資料讀取失敗', 'cloud-off'))
    return () => { alive = false }
  }, [])

  /* 只有 data 變動時才產生新 value，避免無謂的重新渲染 */
  const value = useMemo<AdminStore>(
    () => ({ mock: api.mock, data, toast, refreshAll, patch, create, update, remove }),
    [data, refreshAll, patch, create, update, remove],
  )
  return (
    <AdminContext.Provider value={value}>
      {children}
      <Toaster />
    </AdminContext.Provider>
  )
}
