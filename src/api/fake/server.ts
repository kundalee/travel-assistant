/* ═══════════════════════════════════════════════
   假後端（瀏覽器內）：未送往真正後端的請求由此處回應。
   只能實作資源檔宣告的端點。
   ═══════════════════════════════════════════════ */
import { endpointKey, ENDPOINTS, type Endpoint } from '../endpoints'

export class FakeError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export interface Ctx {
  params: Record<string, string>
  query: URLSearchParams
  /** JSON 物件或 FormData */
  body: unknown
  /** 由 Bearer token 解析；未登入為 null */
  userId: string | null
}

type Handler = (ctx: Ctx) => unknown

const handlers = new Map<string, Handler>()

/** 實作一個端點：傳入資源檔宣告的端點，例如 route(ordersApi.pay, handler) */
export function route(api: { endpoint: Endpoint }, handler: Handler) {
  const key = endpointKey(api.endpoint)
  handlers.set(key, handler)
}

/** 清單內但假後端尚未實作的端點（開發時提醒用） */
export const unimplemented = () => ENDPOINTS.filter((e) => !handlers.has(endpointKey(e)))

/* 假 token 格式：fake.<userId>（重新整理後仍可解析）。
   帳號群組已切換到真正後端時，token 由真正後端發出；假後端將其視為一位已登入的使用者 */
export const makeToken = (userId: string) => `fake.${userId}`
const userOf = (token: string | null) => {
  if (!token) return null
  return token.startsWith('fake.') ? token.slice(5) : `real:${token}`
}

const delay = () => new Promise((r) => setTimeout(r, 120 + Math.random() * 180))

export async function handle(endpoint: Endpoint, rawPath: string, params: Record<string, string>, body: unknown, token: string | null): Promise<{ status: number; data: unknown }> {
  await delay()
  const handler = handlers.get(endpointKey(endpoint))
  if (!handler) return { status: 404, data: { message: `假後端尚未實作 ${endpointKey(endpoint)}` } }
  try {
    const data = await handler({ params, query: new URLSearchParams(rawPath.split('?')[1] ?? ''), body, userId: userOf(token) })
    if (data === undefined) return { status: 204, data: null }
    /* 與真正的 HTTP 相同：回傳 JSON 複本，而非假資料庫的物件本身（避免畫面 / 快取與假資料庫共用同一物件） */
    return { status: endpoint.method === 'POST' ? 201 : 200, data: JSON.parse(JSON.stringify(data)) as unknown }
  } catch (e) {
    return { status: e instanceof FakeError ? e.status : 500, data: { message: e instanceof Error ? e.message : '假後端錯誤' } }
  }
}

/* ── 共用小工具 ── */
export function requireUser(ctx: Ctx) {
  if (!ctx.userId) throw new FakeError(401, '請先登入。')
  return ctx.userId
}

export const json = <T,>(ctx: Ctx) => (ctx.body ?? {}) as T
export const files = (ctx: Ctx, field: string) => (ctx.body instanceof FormData ? ctx.body.getAll(field).filter((f): f is File => f instanceof File) : [])
export const field = (ctx: Ctx, name: string) => (ctx.body instanceof FormData ? String(ctx.body.get(name) ?? '') : '')

/* 以 sessionStorage 保存假資料庫，重新整理後寫入的資料仍在 */
export function persisted<T>(key: string, init: () => T) {
  let db: T
  try { db = JSON.parse(sessionStorage.getItem(key) || 'null') ?? init() } catch { db = init() }
  return {
    get: () => db,
    save() { try { sessionStorage.setItem(key, JSON.stringify(db)) } catch { /* ignore */ } },
  }
}
