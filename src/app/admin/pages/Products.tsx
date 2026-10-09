import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AsyncButton, confirmDialog, Hl, Icon, PageHead, QueryState, SearchBox, TableEmpty, toast } from '../../../components'
import type { Shop, ShopProduct } from '../../../api/types/admin'
import { DataNote } from '../components/DataNote'
import { ProductModal } from '../components/ProductParts'
import { useAdminData, useAllProducts, useProductActions } from '../queries'
import { commission, money, ratePct, stockText } from '../utils'

type SaleFilter = 'all' | 'on' | 'off'

/* 輸入停止一段時間後才更新（搜尋送到後端，避免每個字都請求一次） */
function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/* 所有店家的商品：/admin/products（GET /products：篩選在後端，每次載入 100 筆） */
export default function Products() {
  const shops = useAdminData('shops')
  return <QueryState queries={shops.queries}>{() => <ProductsView shops={shops.data!.shops} />}</QueryState>
}

function ProductsView({ shops }: { shops: Shop[] }) {
  const { remove } = useProductActions()
  const [q, setQ] = useState('')
  const [shopId, setShopId] = useState(0)
  const [category, setCategory] = useState('')
  const [sale, setSale] = useState<SaleFilter>('all')
  const [editing, setEditing] = useState<ShopProduct | 'new' | null>(null)

  const search = useDebounced(q.trim())
  const products = useAllProducts({
    shop_id: shopId || undefined, q: search || undefined, category: category || undefined,
    is_on_sale: sale === 'all' ? undefined : sale === 'on',
  })
  const list = products.data?.pages.flat() ?? []
  const shopOf = (id: number) => shops.find((s) => s.id === id)

  /* 分類選單：已載入商品的分類 + 目前選擇的分類（後端沒有分類清單） */
  const knownCategories = [...new Set([...list.map((p) => p.category), category].filter((c): c is string => !!c))].sort()

  function del(p: ShopProduct) {
    return confirmDialog({
      title: '刪除商品？', message: `「${p.name}」（${p.sku}）將被永久刪除。`, confirmLabel: '刪除', danger: true,
      onConfirm: async () => { await remove.mutateAsync(p.id); toast('已刪除商品', 'trash') },
    })
  }

  return (
    <div className="pad">
      <PageHead icon="package" title="商品資料管理">
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" />新增商品</button>
      </PageHead>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="搜尋 SKU / 商品名稱" />
        <select className="filt" value={shopId} onChange={(e) => setShopId(Number(e.target.value))}>
          <option value={0}>全部店家</option>
          {shops.map((s) => <option key={s.id} value={s.id}>{s.name}{s.is_active ? '' : '（已停用）'}</option>)}
        </select>
        <select className="filt" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">全部分類</option>{knownCategories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="filt" value={sale} onChange={(e) => setSale(e.target.value as SaleFilter)}>
          <option value="all">全部狀態</option><option value="on">上架中</option><option value="off">已下架</option>
        </select>
      </div>
      <DataNote group="admin.shopProducts" />

      <QueryState queries={[products]}>{() => (
        <>
          <div className="dt-count">已顯示 {list.length} 筆{products.hasNextPage ? '（還有更多）' : ''}</div>
          <div className="card-wrap">
            <table className="dtable">
              <thead><tr>
                <th>商品</th><th style={{ width: 170 }}>店家</th><th style={{ width: 130 }}>售價</th><th style={{ width: 70 }}>庫存</th>
                <th style={{ width: 140 }}>領隊佣金 / 件</th><th style={{ width: 70 }}>狀態</th><th style={{ width: 80 }}>工具</th>
              </tr></thead>
              <tbody>
                {list.length ? list.map((p) => {
                  const shop = shopOf(p.shop_id)
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="t-title"><Hl text={p.name} q={search} /></div>
                        <div className="t-sub"><Hl text={p.sku} q={search} />{p.category && ` · ${p.category}`}</div>
                      </td>
                      <td className="t-sub">{shop ? <Link to={`/admin/shops/${shop.id}/products`}>{shop.name}</Link> : `#${p.shop_id}`}</td>
                      <td>{money(p.price, p.currency)}</td>
                      <td className={p.stock === 0 ? 't-sub' : undefined}>{stockText(p.stock)}</td>
                      <td className="t-sub">{shop ? money(commission(p, shop), p.currency) : '—'}<br />分潤 {ratePct(p.default_commission_share)}</td>
                      <td><span className={`st-badge ${p.is_on_sale ? 'on' : 'off'}`}>{p.is_on_sale ? '上架' : '下架'}</span></td>
                      <td><div className="dt-acts">
                        <button onClick={() => setEditing(p)} title="修改"><Icon name="edit" /></button>
                        <button className="del" onClick={() => del(p)} title="刪除"><Icon name="trash" /></button>
                      </div></td>
                    </tr>
                  )
                }) : <TableEmpty cols={7} icon="package" text={search || shopId || category || sale !== 'all' ? '查無符合的商品' : '尚無商品'} />}
              </tbody>
            </table>
          </div>
          {products.hasNextPage && (
            <AsyncButton className="btn btn-ghost btn-block" style={{ marginTop: '0.9rem' }} onClick={() => products.fetchNextPage()}>
              <Icon name="chevron-down" />載入更多
            </AsyncButton>
          )}
        </>
      )}</QueryState>

      {editing && (
        <ProductModal key={editing === 'new' ? 'new' : editing.id} shops={shops} categories={knownCategories}
          shop={editing === 'new' ? undefined : shopOf(editing.shop_id)} product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
