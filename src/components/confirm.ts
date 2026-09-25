import type { ReactNode } from 'react'

/* 全域確認視窗狀態（與 toast 相同做法）：confirmDialog() 開啟，<ConfirmHost /> 顯示 */
export interface ConfirmOptions {
  title: string
  message?: ReactNode
  /** 確定按鈕文字，預設「確定」 */
  confirmLabel?: string
  /** 危險操作（刪除等）：確定按鈕為紅色 */
  danger?: boolean
  /** 按下確定後執行（例如呼叫刪除 API）；執行中按鈕顯示讀取中、無法關閉，完成後才關閉視窗 */
  onConfirm?: () => unknown
}

export interface ConfirmState extends ConfirmOptions {
  id: number
  resolve: (ok: boolean) => void
}

let state: ConfirmState | null = null
let seq = 0
const listeners = new Set<() => void>()

function set(next: ConfirmState | null) {
  state = next
  listeners.forEach((l) => l())
}

/**
 * 以 modal 詢問使用者（取代 window.confirm）。
 * 按下確定：先執行 onConfirm（若有）再關閉，回傳 true；取消 / 關閉：回傳 false。
 * 例：confirmDialog({ title: '刪除公告？', danger: true, confirmLabel: '刪除', onConfirm: () => remove(id) })
 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  state?.resolve(false)
  return new Promise((resolve) => set({ ...options, id: ++seq, resolve }))
}

export const confirmStore = {
  subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb) } },
  get: () => state,
  close(ok: boolean) {
    const s = state
    set(null)
    s?.resolve(ok)
  },
}
