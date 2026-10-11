/* ═══════════════════════════════════════════════
   後台管理的伺服器資料（TanStack Query）
   - 讀取：useAdminData('users', 'shops', …) 依需要載入各清單（各自快取），回傳與 AdminData 相同形狀的 data
   - 寫入：useCrud() 的 create / update / remove 先呼叫 API，成功後以後端回應更新快取；
           失敗時回傳 undefined / false，訊息由 queryClient 統一顯示
   ═══════════════════════════════════════════════ */
import { useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast, type IconName } from '../../components'
import {
  announcementsApi, bookingsApi, campaignsApi, crudOf, ordersApi, placesApi, productsApi, reportsApi, reviewsApi, salesApi, toursApi, trackingApi,
  usersApi, shopsApi, shopProductsApi, itineraryItemsApi, tourItinerariesApi, type EditableKey, type Item, type ItemChanges, type NewItem,
} from '../../api/admin'
import type {
  AdminData, GuideAssignment, ItineraryItemCreate, ItineraryItemProductWrite, ItineraryItemUpdate, ProductFilters, ShopProductCreate, ShopProductUpdate,
  TourItineraryCreate, TourItineraryUpdate, TourStatus,
} from '../../api/types/admin'

const LISTS = {
  users: () => usersApi.list(), tours: () => toursApi.list({ limit: 500 }), orders: () => ordersApi.list(), bookings: () => bookingsApi.list(),
  reviews: () => reviewsApi.list(), announcements: () => announcementsApi.list(), campaigns: () => campaignsApi.list(),
  products: () => productsApi.list(), places: () => placesApi.list(), shops: () => shopsApi.list(), monthly: () => salesApi.list(),
}
type ListKey = keyof typeof LISTS

export const adminKeys = {
  all: ['admin'] as const,
  list: (key: ListKey) => ['admin', key] as const,
  tracking: ['admin', 'tracking'] as const,
  stats: ['admin', 'stats'] as const,
  receivables: ['admin', 'receivables'] as const,
  tourItineraries: (tourId: number) => ['admin', 'tour-itineraries', tourId] as const,
  tourBookings: (tourId: number) => ['admin', 'tour-bookings', tourId] as const,
  shopProducts: (shopId: number) => ['admin', 'shop-products', shopId] as const,
  shopProductsAll: ['admin', 'shop-products'] as const,
  allProducts: (filters: object) => ['admin', 'products-all', filters] as const,
  allProductsAll: ['admin', 'products-all'] as const,
  itineraryItems: ['admin', 'itinerary-items'] as const,
  pickableProducts: ['admin', 'pickable-products'] as const,
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
 * 用法：const { queries, data } = useAdminData('users', 'shops')
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

type Id = string | number
type Row = { id: Id }

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
    /* 新增後重新讀取清單，以後端的排序顯示（等讀取完成才算成功，避免畫面跳動） */
    onSuccess: (_, { key }) => qc.invalidateQueries({ queryKey: adminKeys.list(key), refetchType: 'all' }),
  })
  const updateM = useMutation({
    mutationFn: ({ key, id, changes }: { key: EditableKey; id: Id; changes: object }) => {
      const api = crudOf(key)
      if (!api.update) throw new Error(`${key} 不支援修改`)
      return api.update({ id }, changes as never) as Promise<Row>
    },
    onSuccess: (saved, { key }) => setList(key, (l) => l.map((x) => (x.id === saved.id ? saved : x))),
  })
  const removeM = useMutation({
    mutationFn: ({ key, id }: { key: EditableKey; id: Id }) => {
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
      const saved = await createM.mutateAsync({ key, item: item as object }).catch(() => undefined)
      if (saved) done(msg, icon)
      return saved as Item<K> | undefined
    },
    /** 修改：回傳後端更新後的資料；失敗回傳 undefined */
    update: async <K extends EditableKey>(key: K, id: Id, changes: ItemChanges<K>, msg?: string, icon?: IconName) => {
      const saved = await updateM.mutateAsync({ key, id, changes: changes as object }).catch(() => undefined)
      if (saved) done(msg, icon)
      return saved as Item<K> | undefined
    },
    /** 刪除：回傳是否成功 */
    remove: async (key: EditableKey, id: Id, msg?: string) => {
      const ok = await removeM.mutateAsync({ key, id }).then(() => true, () => false)
      if (ok) done(msg, 'trash')
      return ok
    },
  }
}

/* ── 店家的商品（依店家讀取；寫入後重新讀取清單，以後端的排序與計算結果為準） ── */

/** 一家店家的商品 */
export const useShopProducts = (shopId: number) =>
  useQuery({ queryKey: adminKeys.shopProducts(shopId), queryFn: () => shopProductsApi.list({ shopId }) })

/** 所有店家的商品（GET /products）：依篩選條件分頁讀取，每頁 PRODUCT_PAGE 筆，「載入更多」讀下一頁 */
export const PRODUCT_PAGE = 100
export const useAllProducts = (filters: Omit<ProductFilters, 'limit' | 'offset'>) =>
  useInfiniteQuery({
    queryKey: adminKeys.allProducts(filters),
    queryFn: ({ pageParam }) => shopProductsApi.listAll({ ...filters, limit: PRODUCT_PAGE, offset: pageParam }),
    initialPageParam: 0,
    /* 後端沒有總筆數：這頁滿了才可能還有下一頁 */
    getNextPageParam: (last, pages) => (last.length === PRODUCT_PAGE ? pages.length * PRODUCT_PAGE : undefined),
  })

/** 新增 / 修改 / 刪除 / 匯入商品：成功後重新讀取各店家與「所有商品」清單；失敗訊息由 queryClient 統一顯示 */
export function useProductActions() {
  const qc = useQueryClient()
  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: adminKeys.shopProductsAll, refetchType: 'all' }),
    qc.invalidateQueries({ queryKey: adminKeys.allProductsAll, refetchType: 'all' }),
  ])
  return {
    save: useMutation({
      mutationFn: (v: { shopId: number; id?: number; create?: ShopProductCreate; changes?: ShopProductUpdate }) => v.id
        ? shopProductsApi.update({ id: v.id }, v.changes ?? {})
        : shopProductsApi.create({ shopId: v.shopId }, v.create!),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (id: number) => shopProductsApi.remove({ id }), onSuccess: refresh }),
    /* 匯入一定回 200：status = failed 時沒有寫入任何資料，由畫面顯示 error_report */
    importFile: useMutation({
      mutationFn: (v: { shopId: number; file: File }) => shopProductsApi.importFile({ shopId: v.shopId }, { file: v.file }),
      onSuccess: (job) => (job.status !== 'failed' ? refresh() : undefined),
    }),
  }
}

/** 下載商品匯入範本（CSV / Excel）並存檔 */
export async function downloadProductTemplate(shopId: number, fileFormat: 'csv' | 'xlsx') {
  const { blob, filename } = await shopProductsApi.importTemplate({ shopId, file_format: fileFormat })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

/* ── 旅遊地點（行程項目；寫入後重新讀取清單） ── */

/** 所有旅遊地點（後端每次最多 500 筆） */
export const useItineraryItems = () => useQuery({ queryKey: adminKeys.itineraryItems, queryFn: () => itineraryItemsApi.list({ limit: 500 }) })

/** 可串聯到旅遊地點的商品：所有店家的商品（含已下架） */
export const usePickableProducts = () =>
  useQuery({ queryKey: adminKeys.pickableProducts, queryFn: () => shopProductsApi.listAll({ limit: 500 }) })

/** 新增 / 修改 / 複製 / 刪除 / 設定商品：成功後重新讀取旅遊地點清單；失敗訊息由 queryClient 統一顯示 */
export function useItineraryItemActions() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: adminKeys.itineraryItems, refetchType: 'all' })
  return {
    save: useMutation({
      mutationFn: (v: { id?: number; body: ItineraryItemCreate | ItineraryItemUpdate }) => v.id
        ? itineraryItemsApi.update({ id: v.id }, v.body)
        : itineraryItemsApi.create(v.body as ItineraryItemCreate),
      onSuccess: refresh,
    }),
    duplicate: useMutation({ mutationFn: (id: number) => itineraryItemsApi.duplicate({ id }, {}), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: number) => itineraryItemsApi.remove({ id }), onSuccess: refresh }),
    setProducts: useMutation({
      mutationFn: (v: { id: number; products: ItineraryItemProductWrite[] }) => itineraryItemsApi.setProducts({ id: v.id }, { products: v.products }),
      onSuccess: refresh,
    }),
  }
}

/* ── 行程：狀態 / 領隊 / 複製 / 匯入（新增 / 修改 / 刪除用 useCrud）；成功後重新讀取行程清單 ── */

export function useTourActions() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: adminKeys.list('tours'), refetchType: 'all' })
  return {
    setStatus: useMutation({ mutationFn: (v: { id: number; status: TourStatus }) => toursApi.setStatus({ id: v.id }, { status: v.status }), onSuccess: refresh }),
    setGuides: useMutation({ mutationFn: (v: { id: number; guides: GuideAssignment[] }) => toursApi.setGuides({ id: v.id }, { guides: v.guides }), onSuccess: refresh }),
    duplicate: useMutation({
      mutationFn: (v: { id: number; code: string; start_date: string; name?: string | null }) =>
        toursApi.duplicate({ id: v.id }, { code: v.code, start_date: v.start_date, name: v.name }),
      onSuccess: refresh,
    }),
    /* 匯入一定回 200：status = failed 時沒有寫入任何資料，由畫面顯示 error_report */
    importFile: useMutation({ mutationFn: (file: File) => toursApi.importFile({ file }), onSuccess: (job) => (job.status !== 'failed' ? refresh() : undefined) }),
  }
}

/** 行程的報名（團員、付款狀態） */
export const useTourBookings = (tourId: number) =>
  useQuery({ queryKey: adminKeys.tourBookings(tourId), queryFn: () => toursApi.bookings({ id: tourId }) })

/** 行程表（依日期、順序） */
export const useTourItineraries = (tourId: number) =>
  useQuery({ queryKey: adminKeys.tourItineraries(tourId), queryFn: () => tourItinerariesApi.list({ tourId }) })

/** 行程表的新增 / 修改 / 移除 / 匯入：成功後重新讀取行程表；新增時可能同時新增旅遊地點，一併重新讀取 */
export function useTourItineraryActions(tourId: number) {
  const qc = useQueryClient()
  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: adminKeys.tourItineraries(tourId), refetchType: 'all' }),
    qc.invalidateQueries({ queryKey: adminKeys.itineraryItems }),
  ])
  return {
    save: useMutation({
      mutationFn: (v: { id?: number; body: TourItineraryCreate | TourItineraryUpdate }) => v.id
        ? tourItinerariesApi.update({ id: v.id }, v.body)
        : tourItinerariesApi.create({ tourId }, v.body as TourItineraryCreate),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (id: number) => tourItinerariesApi.remove({ id }), onSuccess: refresh }),
    importFile: useMutation({
      mutationFn: (file: File) => tourItinerariesApi.importFile({ tourId }, { file }),
      onSuccess: (job) => (job.status !== 'failed' ? refresh() : undefined),
    }),
  }
}

/** 下載行程 / 行程表匯入範本（CSV / Excel）並存檔 */
export async function downloadTourTemplate(fileFormat: 'csv' | 'xlsx', tourId?: number) {
  const { blob, filename } = tourId
    ? await tourItinerariesApi.importTemplate({ tourId, file_format: fileFormat })
    : await toursApi.importTemplate({ file_format: fileFormat })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}
