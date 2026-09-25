import { useSyncExternalStore } from 'react'
import { AsyncButton, useBusy } from './AsyncButton'
import { confirmStore, type ConfirmState } from './confirm'
import { Icon } from './Icon'
import { Modal } from './Modal'

/* 放在版面最外層一次即可（與 <Toaster /> 並列）；以 confirmDialog() 觸發 */
export function ConfirmHost() {
  const c = useSyncExternalStore(confirmStore.subscribe, confirmStore.get)
  return c ? <ConfirmDialog key={c.id} c={c} /> : null
}

function ConfirmDialog({ c }: { c: ConfirmState }) {
  const [busy, run] = useBusy()
  /* 執行中不可取消（Esc、點背景、取消鈕皆無效） */
  const cancel = () => { if (!busy) confirmStore.close(false) }
  /* onConfirm 拋出錯誤（寫入失敗）時保留視窗，可再試或取消；錯誤訊息由呼叫端顯示 */
  const ok = () => run(async () => {
    try {
      await c.onConfirm?.()
    } catch {
      return
    }
    confirmStore.close(true)
  })

  return (
    <Modal center onClose={cancel} title={c.title}>
      {c.message && <div className="confirm-msg">{c.message}</div>}
      <div className="confirm-acts">
        <button className="btn btn-ghost" onClick={cancel} disabled={busy}>取消</button>
        <AsyncButton className={`btn ${c.danger ? 'btn-danger-solid' : 'btn-primary'}`} onClick={ok} autoFocus>
          {c.danger && <Icon name="trash" />}{c.confirmLabel || '確定'}
        </AsyncButton>
      </div>
    </Modal>
  )
}
