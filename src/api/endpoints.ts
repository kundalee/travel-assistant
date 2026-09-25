/* ═══════════════════════════════════════════════
   API 端點清單（唯一的來源）
   各資源檔（src/api/<入口>/<資源>.ts）以 resource() 宣告端點時登記到這裡：
   - client.ts 依端點的群組決定送往真正的後端或假後端（VITE_API_REAL）
   - 假後端只能實作清單內的端點
   - 開發用 API 面板與 docs/ENDPOINTS.md 依此清單產生
   ═══════════════════════════════════════════════ */

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type Crud = 'C' | 'R' | 'U' | 'D'

/** 群組 key：「入口.資源」，例如 traveler.orders；VITE_API_REAL 以此切換 */
export type Group = string

export interface Endpoint {
  method: Method
  /** 例：/traveler/trips/:tourId/orders */
  path: string
  group: Group
  desc: string
  crud?: Crud
  /** 請求內容以 multipart/form-data 送出（含檔案） */
  multipart?: boolean
}

/** 群組 → 顯示名稱（依登記順序） */
export const GROUPS: Record<Group, string> = {}
export const ENDPOINTS: Endpoint[] = []

/** 登記一個群組的端點（resource() 呼叫） */
export function register(group: Group, label: string, endpoints: Endpoint[]) {
  GROUPS[group] = label
  ENDPOINTS.push(...endpoints)
}

export const endpointKey = (e: Pick<Endpoint, 'method' | 'path'>) => `${e.method} ${e.path}`

/** 以參數填入路徑樣板；缺少參數時丟出錯誤 */
export function fillPath(path: string, params: Record<string, string | number> = {}) {
  return path.replace(/:(\w+)/g, (_, k: string) => {
    if (params[k] === undefined || params[k] === '') throw new Error(`[api] ${path} 缺少參數 ${k}`)
    return encodeURIComponent(String(params[k]))
  })
}
