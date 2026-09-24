import { useState, type ReactNode } from 'react'
import { fmt } from '../lib/utils'
import { Empty } from './Empty'
import { Icon, type IconName } from './Icon'
import { Modal } from './Modal'

/* 行程地點紀念商品 → 購物車（領隊團體下單、團員個人下單共用） */

export interface CartLine {
  id: string
  name: string
  price: number
  qty: number
}

export interface SouvenirLocation {
  name: string
  icon: IconName
  souvenirs: { id: string; name: string; price: number; emo: string }[]
}

export const cartCount = (cart: CartLine[]) => cart.reduce((s, c) => s + c.qty, 0)
export const cartTotal = (cart: CartLine[]) => cart.reduce((s, c) => s + c.price * c.qty, 0)

/* 加入一件（已存在則數量 +1） */
export function addLine(cart: CartLine[], item: Omit<CartLine, 'qty'>): CartLine[] {
  return cart.some((c) => c.id === item.id)
    ? cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
    : [...cart, { ...item, qty: 1 }]
}

export function changeLineQty(cart: CartLine[], id: string, d: number): CartLine[] {
  return cart.map((c) => (c.id === id ? { ...c, qty: c.qty + d } : c)).filter((c) => c.qty > 0)
}

/* 地點手風琴：預設展開第一個地點 */
export function LocationAccordion({ locations, onAdd }: { locations: SouvenirLocation[]; onAdd: (id: string) => void }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]))
  const toggle = (i: number) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n })
  return (
    <>
      {locations.map((loc, i) => (
        <div className="loc-acc" key={loc.name}>
          <button className="loc-head" onClick={() => toggle(i)}>
            <span className="loc-ico"><Icon name={loc.icon} /></span>
            <span className="loc-name">地點{String.fromCharCode(65 + i)} · {loc.name}</span>
            <Icon name="chevron-down" className={`loc-chev ${open.has(i) ? 'open' : ''}`} />
          </button>
          {open.has(i) && (
            <div className="loc-body">
              <div className="souv-note"><Icon name="gift" />紀念商品</div>
              {loc.souvenirs.map((s) => (
                <div className="souv" key={s.id}>
                  <div className="souv-emo">{s.emo || '🎁'}</div>
                  <div className="souv-info"><div className="souv-name">{s.name}</div><div className="souv-price">NT$ {fmt(s.price)}</div></div>
                  <button className="souv-add" onClick={() => onAdd(s.id)} aria-label={`加入 ${s.name}`}><Icon name="plus" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  )
}

/* 底部浮動購物車列 */
export function CartBar({ cart, onOpen }: { cart: CartLine[]; onOpen: () => void }) {
  if (!cart.length) return null
  return (
    <div className="cart-bar" onClick={onOpen}>
      <div className="cart-bar-left"><Icon name="shopping-cart" />{cartCount(cart)} 件</div>
      <div className="cart-bar-right">NT$ {fmt(cartTotal(cart))} · 查看購物車 <Icon name="chevron-up" /></div>
    </div>
  )
}

interface CartModalProps {
  title?: string
  sub: string
  cart: CartLine[]
  onQty: (id: string, d: number) => void
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
  confirmIcon?: IconName
  onClose: () => void
  footer?: ReactNode
}

export function CartModal({ title = '購物車', sub, cart, onQty, onCancel, onConfirm, confirmLabel = '確認下單', confirmIcon = 'check', onClose, footer }: CartModalProps) {
  return (
    <Modal onClose={onClose} title={title} sub={sub}>
      {cart.length ? cart.map((c) => (
        <div className="cart-item" key={c.id}>
          <div className="souv-info"><div className="souv-name">{c.name}</div><div className="souv-price">NT$ {fmt(c.price)}</div></div>
          <div className="qty">
            <button onClick={() => onQty(c.id, -1)} aria-label="減少"><Icon name="minus" /></button><span>{c.qty}</span>
            <button onClick={() => onQty(c.id, 1)} aria-label="增加"><Icon name="plus" /></button>
          </div>
        </div>
      )) : <Empty icon="shopping-cart-off" text="購物車是空的" />}
      <div className="cart-total-row">合計 <b>NT$ {fmt(cartTotal(cart))}</b></div>
      <div className="action-2">
        <button className="btn btn-ghost" onClick={onCancel}><Icon name="trash" />取消下單</button>
        <button className="btn btn-primary" onClick={onConfirm}><Icon name={confirmIcon} />{confirmLabel}</button>
      </div>
      {footer}
    </Modal>
  )
}
