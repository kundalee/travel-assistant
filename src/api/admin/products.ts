import { del, get, patch, post, resource } from '../resource'
import type { Product } from '../types/admin'

export const productsApi = resource('admin.products', '後台 · 商品 Products', {
  list: get<Product[]>()('/admin/products', '商品清單'),
  create: post<Product, Omit<Product, 'id'>>()('/admin/products', '新增商品'),
  update: patch<Product, Partial<Product>>()('/admin/products/:id', '修改商品'),
  remove: del()('/admin/products/:id', '刪除商品'),
})
