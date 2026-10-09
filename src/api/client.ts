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
async function fetchReal(path: string, method: Method, body: unknown, signal?: AbortSignal, download?: boolean) {
  const headers: Record<string, string> = {}
  let payload: BodyInit | undefined
  if (body instanceof FormData) payload = body
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  if (authToken) headers.Authorization = `Bearer ${authToken}`
  const res = await fetch(BASE_URL + path, { method, signal, headers, body: payload })
  /* 檔案下載：成功時回傳 { blob, filename }，錯誤時仍為 JSON */
  if (download && res.ok) {
    const name = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(res.headers.get('Content-Disposition') ?? '')?.[1]
    return { status: res.status, data: { blob: await res.blob(), filename: name ? decodeURIComponent(name) : 'download' } }
  }
  const data: unknown = res.status === 204 ? null : await res.json().catch(() => null)
  return { status: res.status, data }
}

/* 由假後端回應（僅在需要時載入） */
async function fetchFake(endpoint: Endpoint, path: string, params: Record<string, string>, body: unknown) {
  const { handle } = await import('./fake')
  const res = await handle(endpoint, path, params, body, authToken)
  /* 假後端的下載端點回傳 { filename, content, type } → 轉成與真正後端相同的 { blob, filename } */
  if (endpoint.download && res.status < 400) {
    const f = res.data as { filename: string; content: string; type: string }
    return { status: res.status, data: { blob: new Blob([f.content], { type: f.type }), filename: f.filename } }
  }
  return res
}


/* 錯誤訊息：後端 { error: { code, message } }、FastAPI 預設 { detail }、假後端 { message } */
type ErrorBody = { error?: { message?: string }; detail?: string | { msg?: string }[]; message?: string } | null
function errorMessage(data: unknown) {
  const d = data as ErrorBody
  if (d?.error?.message) return d.error.message
  if (typeof d?.detail === 'string') return d.detail
  if (Array.isArray(d?.detail)) return d.detail.map((x) => x.msg).filter(Boolean).join('；')
  return d?.message
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
export async function call<T>(endpoint: Endpoint, params: Record<string, string | number | boolean | null | undefined> = {}, body?: unknown, signal?: AbortSignal): Promise<T> {
  /* 路徑沒用到的參數 → 查詢字串（undefined / null 不送出） */
  const pathKeys = new Set([...endpoint.path.matchAll(/:(\w+)/g)].map((m) => m[1]))
  const query = new URLSearchParams(Object.entries(params).flatMap(([k, v]) => (pathKeys.has(k) || v == null ? [] : [[k, String(v)]])))
  const path = fillPath(endpoint.path, params as Record<string, string | number>) + (query.size ? `?${query}` : '')
  const strParams = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  const payload = endpoint.multipart && body && typeof body === 'object' ? toFormData(body) : body
  const fake = isFake(endpoint.group)
  const { status, data } = fake ? await fetchFake(endpoint, path, strParams, payload) : await fetchReal(path, endpoint.method, payload, signal, endpoint.download)

  if (USE_FAKE) callLog.add({ method: endpoint.method, path, key: endpointKey(endpoint), status, mode: fake ? 'fake' : 'real', at: Date.now() })
  if (status >= 400) throw new ApiError(status, errorMessage(data) || `請求失敗（${status}）`)
  return data as T
}

