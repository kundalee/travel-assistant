import { del, download, get, patch, post, resource, upload } from '../resource'
import type { ImportJob, ProductFilters, ShopProduct, ShopProductCreate, ShopProductUpdate } from '../types/admin'

/* 店家的商品（管理員）：沿用後端路徑；清單與新增在店家底下，修改 / 刪除以商品 id */
export const shopProductsApi = resource('admin.shopProducts', '後台 · 店家商品 Shop products', {
  list: get<ShopProduct[]>()('/shops/:shopId/products', '店家的商品清單'),
  /** 所有店家的商品（依店家、SKU 排序）；limit 最多 500，以 offset 分頁 */
  listAll: get<ShopProduct[], ProductFilters>()('/products', '所有店家的商品（篩選、分頁）'),
  create: post<ShopProduct, ShopProductCreate>()('/shops/:shopId/products', '新增商品'),
  update: patch<ShopProduct, ShopProductUpdate>()('/products/:id', '修改商品（SKU 不能修改）'),
  remove: del()('/products/:id', '刪除商品'),
  importTemplate: download<{ file_format: 'csv' | 'xlsx' }>()('/shops/:shopId/products/import-template', '下載商品匯入範本（CSV / Excel）'),
  importFile: upload<ImportJob, { file: File }>()('/shops/:shopId/products/import', '匯入商品（CSV / Excel；全部正確才寫入）'),
})
