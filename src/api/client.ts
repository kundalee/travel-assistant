/* ═══════════════════════════════════════════════
   後端 HTTP client（各入口 api.ts 共用）
   設定 VITE_API_BASE_URL 後，各入口的 api.ts 以 request() 呼叫後端。
   ═══════════════════════════════════════════════ */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

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

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

/** 呼叫後端：JSON 進、JSON 出；非 2xx 時丟出 ApiError（訊息取自回應的 message 欄位） */
export async function request<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  const isForm = body instanceof FormData
  const res = await fetch(BASE_URL + path, {
    method,
    signal,
    headers: {
      ...(isForm || body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data?.message || `請求失敗（${res.status}）`)
  return data as T
}
