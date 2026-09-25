import { useCallback, useRef, useState, type ButtonHTMLAttributes, type MouseEvent } from 'react'

/**
 * 同一時間只執行一個動作：執行中再次呼叫會被忽略（防止重複點擊 / 重複送出）。
 * 回傳 [busy, run]；run 回傳動作結果，被忽略時為 undefined。
 * 用於非按鈕觸發的寫入（選擇檔案後上傳、Enter 送出等）；按鈕請用 AsyncButton。
 */
export function useBusy() {
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const run = useCallback(async <T,>(fn: () => Promise<T> | T): Promise<T | undefined> => {
    if (lock.current) return undefined
    lock.current = true
    setBusy(true)
    try {
      return await fn()
    } finally {
      lock.current = false
      setBusy(false)
    }
  }, [])
  return [busy, run] as const
}

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  /** 回傳 Promise 時，等待期間按鈕停用並顯示讀取中 */
  onClick: (e: MouseEvent<HTMLButtonElement>) => unknown
  /** 外部的執行中狀態（例如同一表單的其他按鈕正在送出） */
  busy?: boolean
}

/** 寫入用按鈕：點擊後直到 API 回應前停用並顯示讀取中（樣式見 base.css 的 [aria-busy]）。
 *  onClick 拋出錯誤時（例如 mutateAsync 失敗）只記錄；錯誤訊息應已由呼叫端或 queryClient 顯示 */
export function AsyncButton({ onClick, busy: outerBusy, disabled, ...rest }: Props) {
  const [busy, run] = useBusy()
  const loading = busy || !!outerBusy
  return (
    <button type="button" {...rest} disabled={disabled || loading} aria-busy={loading || undefined}
      onClick={(e) => { void run(async () => { await onClick(e) }).catch((err: unknown) => console.warn('[AsyncButton]', err)) }} />
  )
}
