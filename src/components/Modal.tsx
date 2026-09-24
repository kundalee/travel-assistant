import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

interface ModalProps {
  onClose: () => void
  title: ReactNode
  sub?: ReactNode
  /** 置中對話框（否則為底部滑出的 sheet） */
  center?: boolean
  children: ReactNode
}

/* 目前開啟中的 modal（後開的在最上層）；Esc 只關閉最上層 */
const openModals: symbol[] = []

/* 以條件渲染開關：{open && <Modal …/>} */
export function Modal({ onClose, title, sub, center, children }: ModalProps) {
  const titleId = useId()
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    const me = Symbol('modal')
    openModals.push(me)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openModals.at(-1) === me) onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      openModals.splice(openModals.indexOf(me), 1)
      if (!openModals.length) document.body.style.overflow = prevOverflow
    }
  }, [])

  return (
    <div className={`modal-bd open${center ? ' center' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {!center && <div className="sheet-grip" />}
        <div className="sheet-head">
          <div><h3 id={titleId}>{title}</h3>{sub && <div className="sub">{sub}</div>}</div>
          <button className="x" onClick={onClose} aria-label="關閉"><Icon name="x" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
