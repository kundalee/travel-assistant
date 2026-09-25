/* ═══════════════════════════════════════════════
   後端 HTTP client（resource.ts 宣告的端點經由 call() 呼叫）

   依環境變數決定每個請求送往哪裡：
   - 未設定 VITE_API_BASE_URL            → 全部由瀏覽器內的假後端回應
   - 設定 VITE_API_BASE_URL              → 全部送往真正的後端
   - 另設定 VITE_API_REAL=auth,traveler.profile
                                         → 只有列出的群組送往真正的後端，其餘仍用假後端
                                           （群組為各資源檔 resource() 的第一個參數；可用「traveler」代表整個入口）
   ═══════════════════════════════════════════════ */
import { callLog } from './calls'
import { endpointKey, fillPath, type Endpoint, type Group, type Method } from './endpoints'

/* import.meta.env 在 Node（tsx 腳本）中不存在 */
const env = (import.meta.env ?? {}) as Record<string, string | undefined>
const BASE_URL = env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
const REAL_GROUPS = (env.VITE_API_REAL ?? '').split(',').map((s) => s.trim()).filter(Boolean)

/** 此群組是否由假後端回應 */
export function isFake(group: Group) {
  if (!BASE_URL) return true
  if (!REAL_GROUPS.length) return false
  return !REAL_GROUPS.some((g) => g === group || group.startsWith(g + '.'))
}

/** 是否有任何請求會由假後端回應（決定是否顯示開發用 API 面板） */
export const USE_FAKE = !BASE_URL || REAL_GROUPS.length > 0

/** 完整網址（OAuth 等需要整頁跳轉的情況） */
export const apiUrl = (path: string) => BASE_URL + path

let authToken: string | null = null

/** 登入後設定；登出時傳入 null */
export function setAuthToken(token: string | null) {
  authToken = token
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/* 送往真正的後端 */
async function fetchReal(path: string, method: Method, body: unknown, signal?: AbortSignal) {
  const headers: Record<string, string> = {}
  let payload: BodyInit | undefined
  if (body instanceof FormData) payload = body
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  if (authToken) headers.Authorization = `Bearer ${authToken}`
  const res = await fetch(BASE_URL + path, { method, signal, headers, body: payload })
  const data: unknown = res.status === 204 ? null : await res.json().catch(() => null)
  return { status: res.status, data }
}

/* 由假後端回應（僅在需要時載入） */
async function fetchFake(endpoint: Endpoint, path: string, params: Record<string, string>, body: unknown) {
  const { handle } = await import('./fake')
  return handle(endpoint, path, params, body, authToken)
}


/* multipart 端點：File / File[] 欄位附加檔案，其餘欄位轉為字串 */
function toFormData(body: object) {
  const fd = new FormData()
  Object.entries(body).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((x) => fd.append(k, x instanceof File ? x : String(x)))
    else if (v instanceof File) fd.append(k, v)
    else if (v !== undefined && v !== null) fd.append(k, String(v))
  })
  return fd
}

/** 呼叫一個已登記的端點（resource.ts 使用）：以 params 填入路徑；JSON 進、JSON 出；非 2xx 時丟出 ApiError */
export async function call<T>(endpoint: Endpoint, params: Record<string, string | number> = {}, body?: unknown, signal?: AbortSignal): Promise<T> {
  const path = fillPath(endpoint.path, params)
  const strParams = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  const payload = endpoint.multipart && body && typeof body === 'object' ? toFormData(body) : body
  const fake = isFake(endpoint.group)
  const { status, data } = fake ? await fetchFake(endpoint, path, strParams, payload) : await fetchReal(path, endpoint.method, payload, signal)

  if (USE_FAKE) callLog.add({ method: endpoint.method, path, key: endpointKey(endpoint), status, mode: fake ? 'fake' : 'real', at: Date.now() })
  if (status >= 400) throw new ApiError(status, (data as { message?: string } | null)?.message || `請求失敗（${status}）`)
  return data as T
}

