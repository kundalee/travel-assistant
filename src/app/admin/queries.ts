/* ═══════════════════════════════════════════════
   後台管理的伺服器資料（TanStack Query）
   - 讀取：useAdminData('users', 'vendors', …) 依需要載入各清單（各自快取），回傳與 AdminData 相同形狀的 data
   - 寫入：useCrud() 的 create / update / remove 先呼叫 API，成功後以後端回應更新快取；
           失敗時回傳 undefined / false，訊息由 queryClient 統一顯示
   ═══════════════════════════════════════════════ */
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast, type IconName } from '../../components'
import {
  announcementsApi, bookingsApi, campaignsApi, crudOf, ordersApi, placesApi, productsApi, reportsApi, reviewsApi, salesApi, toursApi, trackingApi,
  usersApi, vendorsApi, type EditableKey, type Item, type NewItem,
} from '../../api/admin'
import type { AdminData } from '../../api/types/admin'

const LISTS = {
  users: () => usersApi.list(), tours: () => toursApi.list(), orders: () => ordersApi.list(), bookings: () => bookingsApi.list(),
  reviews: () => reviewsApi.list(), announcements: () => announcementsApi.list(), campaigns: () => campaignsApi.list(),
  products: () => productsApi.list(), places: () => placesApi.list(), vendors: () => vendorsApi.list(), monthly: () => salesApi.list(),
}
type ListKey = keyof typeof LISTS

export const adminKeys = {
  all: ['admin'] as const,
  list: (key: ListKey) => ['admin', key] as const,
  tracking: ['admin', 'tracking'] as const,
  stats: ['admin', 'stats'] as const,
  receivables: ['admin', 'receivables'] as const,
  roster: (tourId: string) => ['admin', 'roster', tourId] as const,
}

/* 每個 data 欄位的來源查詢（團體追蹤三個欄位共用同一個查詢） */
type DataKey = keyof AdminData
type Source = { queryKey: readonly unknown[]; queryFn: () => Promise<unknown>; pick?: (d: never) => unknown }
const tracking = { queryKey: adminKeys.tracking, queryFn: () => trackingApi.get() }
const SOURCES: Record<DataKey, Source> = {
  ...(Object.fromEntries((Object.keys(LISTS) as ListKey[]).map((k): [ListKey, Source] => [k, { queryKey: adminKeys.list(k), queryFn: LISTS[k] }])) as Record<ListKey, Source>),
  trackingGroups: { ...tracking, pick: (d: Awaited<ReturnType<typeof trackingApi.get>>) => d.groups },
  vitals: { ...tracking, pick: (d: Awaited<ReturnType<typeof trackingApi.get>>) => d.vitals },
  zones: { ...tracking, pick: (d: Awaited<ReturnType<typeof trackingApi.get>>) => d.zones },
  stats: { queryKey: adminKeys.stats, queryFn: () => reportsApi.stats() },
  receivables: { queryKey: adminKeys.receivables, queryFn: () => reportsApi.receivables() },
}

/**
 * 載入畫面需要的資料；全部就緒前 data 為 undefined。
 * 用法：const { queries, data } = useAdminData('users', 'vendors')
 *       <QueryState queries={queries}>{() => <View data={data!} />}</QueryState>
 */
export function useAdminData<K extends DataKey>(...keys: K[]) {
  /* 同一個查詢只請求一次（例如團體追蹤的三個欄位） */
  const ids = [...new Set(keys.map((k) => JSON.stringify(SOURCES[k].queryKey)))]
  const queries = useQueries({
    queries: ids.map((id) => {
      const s = SOURCES[keys.find((k) => JSON.stringify(SOURCES[k].queryKey) === id)!]
      return { queryKey: s.queryKey, queryFn: s.queryFn }
    }),
  })
  const ready = queries.every((q) => q.data !== undefined)
  const dataOf = (k: K) => queries[ids.indexOf(JSON.stringify(SOURCES[k].queryKey))].data
  const data = ready
    ? Object.fromEntries(keys.map((k) => [k, SOURCES[k].pick ? SOURCES[k].pick!(dataOf(k) as never) : dataOf(k)])) as Pick<AdminData, K>
    : undefined
  return { queries, data }
}

/** 團員名冊（含預設登入帳密） */
export const useRoster = (tourId: string) =>
  useQuery({ queryKey: adminKeys.roster(tourId), queryFn: () => toursApi.members({ id: tourId }) })

type Row = { id: string }

/** 清單的新增 / 修改 / 刪除：以後端回應更新快取；成功時顯示 msg */
export function useCrud() {
  const qc = useQueryClient()
  const setList = (key: EditableKey, fn: (l: Row[]) => Row[]) => qc.setQueryData<Row[]>(adminKeys.list(key), (l) => l && fn(l))

  const createM = useMutation({
    mutationFn: ({ key, item }: { key: EditableKey; item: object }) => {
      const api = crudOf(key)
      if (!api.create) throw new Error(`${key} 不支援新增`)
      return api.create(item as never) as Promise<Row>
    },
    onSuccess: (saved, { key }) => setList(key, (l) => [saved, ...l]),
  })
  const updateM = useMutation({
    mutationFn: ({ key, id, changes }: { key: EditableKey; id: string; changes: object }) => {
      const api = crudOf(key)
      if (!api.update) throw new Error(`${key} 不支援修改`)
      return api.update({ id }, changes as never) as Promise<Row>
    },
    onSuccess: (saved, { key }) => setList(key, (l) => l.map((x) => (x.id === saved.id ? saved : x))),
  })
  const removeM = useMutation({
    mutationFn: ({ key, id }: { key: EditableKey; id: string }) => {
      const api = crudOf(key)
      if (!api.remove) throw new Error(`${key} 不支援刪除`)
      return api.remove({ id })
    },
    onSuccess: (_, { key, id }) => setList(key, (l) => l.filter((x) => x.id !== id)),
  })

  const done = (msg?: string, icon?: IconName) => { if (msg) toast(msg, icon) }
  return {
    /** 新增：回傳後端建立的資料（含 id）；失敗回傳 undefined */
    create: async <K extends EditableKey>(key: K, item: NewItem<K>, msg?: string, icon?: IconName) => {
      const saved = await createM.mutateAsync({ key, item }).catch(() => undefined)
      if (saved) done(msg, icon)
      return saved as Item<K> | undefined
    },
    /** 修改：回傳後端更新後的資料；失敗回傳 undefined */
    update: async <K extends EditableKey>(key: K, id: string, changes: Partial<Item<K>>, msg?: string, icon?: IconName) => {
      const saved = await updateM.mutateAsync({ key, id, changes }).catch(() => undefined)
      if (saved) done(msg, icon)
      return saved as Item<K> | undefined
    },
    /** 刪除：回傳是否成功 */
    remove: async (key: EditableKey, id: string, msg?: string) => {
      const ok = await removeM.mutateAsync({ key, id }).then(() => true, () => false)
      if (ok) done(msg, 'trash')
      return ok
    },
  }
}
