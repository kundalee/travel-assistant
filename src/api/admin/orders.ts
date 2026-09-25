import { get, patch, resource } from '../resource'
import type { Order } from '../types/admin'

export const ordersApi = resource('admin.orders', '後台 · 訂單 Orders', {
  list: get<Order[]>()('/admin/orders', '訂單清單'),
  update: patch<Order, Partial<Order>>()('/admin/orders/:id', '更新訂單狀態 / 勾稽'),
})
