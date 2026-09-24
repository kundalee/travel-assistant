import type { IconName } from './Icon'

/* 全域 toast 狀態：獨立於 React 樹，顯示/隱藏只會重新渲染 <Toaster /> */
export interface ToastState { show: boolean; msg: string; icon: IconName }

let state: ToastState = { show: false, msg: '', icon: 'circle-check' }
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | undefined

function set(next: ToastState) {
  state = next
  listeners.forEach((l) => l())
}

export function toast(msg: string, icon: IconName = 'circle-check') {
  set({ show: true, msg, icon })
  clearTimeout(timer)
  timer = setTimeout(() => set({ ...state, show: false }), 2600)
}

export const toastStore = {
  subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb) } },
  get: () => state,
}
