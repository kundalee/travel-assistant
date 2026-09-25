import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type { CartItem } from '../../api/types/traveler'

/* 團購購物車：跨畫面保留的畫面狀態（伺服器資料一律在 queries/） */
type GbCart = [CartItem[], Dispatch<SetStateAction<CartItem[]>>]

const GbCartContext = createContext<GbCart | null>(null)

export function useGbCart() {
  const ctx = useContext(GbCartContext)
  if (!ctx) throw new Error('useGbCart must be used inside <GbCartProvider>')
  return ctx
}

export function GbCartProvider({ children }: { children: ReactNode }) {
  const cart = useState<CartItem[]>([])
  return <GbCartContext.Provider value={cart}>{children}</GbCartContext.Provider>
}
