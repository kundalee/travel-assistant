/* ═══════════════════════════════════════════════
   資源檔的端點宣告：每個端點只寫一次，同時是
   - 頁面呼叫的函式：ordersApi.pay({ tourId, orderId })
   - endpoints.ts 清單的一筆（API 面板、docs/ENDPOINTS.md、真假後端切換）
   - 假後端實作的對象：route(ordersApi.pay, handler)

   用法：
     export const ordersApi = resource('traveler.orders', '團員 · 訂單 Orders', {
       list: get<HistoryOrder[]>()('/traveler/orders', '歷史訂單'),
       pay:  post<TripOrder>()('/traveler/trips/:tourId/orders/:orderId/pay', '訂單付款', 'U'),
     })
   get / post / upload… 的型別參數：<回應, 請求內容>；上傳檔案的端點用 upload()（multipart）；CRUD 預設依 method（GET = R、POST = C、PUT / PATCH = U、DELETE = D）
   ═══════════════════════════════════════════════ */
import { call } from './client'
import { register, type Crud, type Endpoint, type Group, type Method } from './endpoints'

/* 路徑樣板中的參數名稱：'/trips/:tourId/orders/:orderId' → 'tourId' | 'orderId' */
type ParamNames<S extends string> =
  S extends `${string}:${infer P}/${infer Rest}` ? P | ParamNames<`/${Rest}`>
  : S extends `${string}:${infer P}` ? P
  : never

export type PathParams<S extends string> = Record<ParamNames<S>, string | number>

/* 呼叫參數：有路徑參數時先傳 params，有請求內容時再傳 body */
type Args<S extends string, B> = [ParamNames<S>] extends [never]
  ? ([B] extends [void] ? [] : [body: B])
  : ([B] extends [void] ? [params: PathParams<S>] : [params: PathParams<S>, body: B])

export type ApiCall<S extends string, R, B> = ((...args: Args<S, B>) => Promise<R>) & { readonly endpoint: Endpoint }

const DEFAULT_CRUD: Record<Method, Crud> = { GET: 'R', POST: 'C', PUT: 'U', PATCH: 'U', DELETE: 'D' }

const define = <R, B>(method: Method, multipart?: boolean) => <S extends string>(path: S, desc: string, crud?: Crud): ApiCall<S, R, B> => {
  /* group 由 resource() 填入 */
  const endpoint: Endpoint = { method, path, desc, crud: crud ?? DEFAULT_CRUD[method], group: '', ...(multipart && { multipart }) }
  const hasParams = path.includes(':')
  const fn = (...args: unknown[]) => {
    const [params, body] = hasParams ? args : [undefined, args[0]]
    return call<R>(endpoint, params as Record<string, string | number> | undefined, body)
  }
  return Object.assign(fn, { endpoint }) as ApiCall<S, R, B>
}

export const get = <R>() => define<R, void>('GET')
export const post = <R = void, B = void>() => define<R, B>('POST')
export const put = <R = void, B = void>() => define<R, B>('PUT')
export const patch = <R = void, B = void>() => define<R, B>('PATCH')
export const del = <R = void>() => define<R, void>('DELETE')
/** POST multipart/form-data：File / File[] 欄位送出檔案，其餘欄位轉為字串 */
export const upload = <R = void, B = void>() => define<R, B>('POST', true)

/** 宣告一個群組（入口.資源）的端點並登記到 endpoints.ts；options.crud = false 表示不標示 CRUD（例如登入） */
export function resource<T extends Record<string, { endpoint: Endpoint }>>(group: Group, label: string, endpoints: T, options: { crud?: boolean } = {}): T {
  const list = Object.values(endpoints).map((e) => e.endpoint)
  list.forEach((e) => {
    e.group = group
    if (options.crud === false) delete e.crud
  })
  register(group, label, list)
  return endpoints
}
