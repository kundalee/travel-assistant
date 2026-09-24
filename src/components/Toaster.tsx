import { useSyncExternalStore } from 'react'
import { Icon } from './Icon'
import { toastStore } from './toast'

/* 放在版面最外層一次即可；以 toast() 觸發 */
export function Toaster() {
  const s = useSyncExternalStore(toastStore.subscribe, toastStore.get)
  return (
    <div id="toast" className={s.show ? 'show' : ''} role="status" aria-live="polite">
      <Icon name={s.icon} /><span>{s.msg}</span>
    </div>
  )
}
