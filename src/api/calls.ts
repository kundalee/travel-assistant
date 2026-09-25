/* API 呼叫紀錄（真實與假後端皆記錄，供開發用 API 面板顯示） */
import type { Method } from './endpoints'

export interface CallRecord {
  method: Method
  path: string
  /** 端點 key（`METHOD /path` 樣板） */
  key: string
  status: number
  mode: 'real' | 'fake'
  at: number
}

let calls: CallRecord[] = []
const listeners = new Set<() => void>()

export const callLog = {
  get: () => calls,
  add(r: CallRecord) {
    calls = [...calls, r]
    listeners.forEach((l) => l())
    if (import.meta.env?.DEV) console.info(`[API ${r.mode}] ${r.method} ${r.path} → ${r.status}`)
  },
  clear() {
    calls = []
    listeners.forEach((l) => l())
  },
  subscribe(cb: () => void) {
    listeners.add(cb)
    return () => { listeners.delete(cb) }
  },
}
