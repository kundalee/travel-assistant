import { useState } from 'react'
import { AsyncButton, Field, Icon, Modal, toast } from '../../../components'
import type { Shop, ShopProduct } from '../../../api/types/admin'
import { useProductActions } from '../queries'
import { money, ratePct } from '../utils'

/* 商品表單與顯示（店家的商品頁、所有商品頁共用） */
const CURRENCIES = ['TWD', 'JPY', 'KRW', 'THB', 'USD', 'CNY', 'HKD', 'SGD', 'VND', 'MYR', 'EUR']


/**
 * 新增 / 修改商品（欄位與後端相同；SKU 建立後不能修改）。
 * shop 已知時直接使用（店家的商品頁、修改）；未指定時先選擇店家（所有商品頁的新增）
 */
export function ProductModal({ shop: fixedShop, shops = [], product, categories, onClose }: {
  shop?: Shop
  shops?: Shop[]
  product: ShopProduct | null
  categories: string[]
  onClose: () => void
}) {
  const { save } = useProductActions()
  const [shopId, setShopId] = useState(fixedShop?.id ?? 0)
  const shop = fixedShop ?? shops.find((s) => s.id === shopId)
  const [f, setF] = useState({
    sku: product?.sku ?? '', name: product?.name ?? '', category: product?.category ?? '', description: product?.description ?? '',
    image_url: product?.image_url ?? '', price: product ? String(Number(product.price)) : '', currency: product?.currency ?? 'JPY',
    stock: product?.stock == null ? '' : String(product.stock), sharePct: product ? String(+(Number(product.default_commission_share) * 100).toFixed(2)) : '0',
    sale_start: product?.sale_start ?? '', sale_end: product?.sale_end ?? '',
  })
  const [onSale, setOnSale] = useState(product?.is_on_sale ?? true)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const price = Number(f.price), share = Number(f.sharePct) / 100
  const estimate = shop && f.price !== '' && price >= 0 && share >= 0 ? money(price * Number(shop.agency_rate) * share, f.currency) : '—'

  async function submit() {
    if (!shop) return toast('請選擇支援店家', 'alert-circle')
    if (!product && !f.sku.trim()) return toast('請輸入 SKU', 'alert-circle')
    if (!f.name.trim()) return toast('請輸入商品名稱', 'alert-circle')
    if (f.price.trim() === '' || !(price >= 0)) return toast('請輸入正確的售價', 'alert-circle')
    if (!/^[A-Z]{3}$/.test(f.currency)) return toast('幣別需為 3 碼大寫英文（例：JPY）', 'alert-circle')
    if (f.stock !== '' && !(Number.isInteger(Number(f.stock)) && Number(f.stock) >= 0)) return toast('庫存需為 0 以上的整數，或留空表示不限', 'alert-circle')
    if (!(share >= 0 && share <= 1)) return toast('分潤比例請輸入 0–100', 'alert-circle')
    if (f.sale_start && f.sale_end && f.sale_end < f.sale_start) return toast('販售結束日不能早於開始日', 'alert-circle')
    /* 選填欄位留空 = null */
    const opt = (v: string) => v.trim() || null
    const fields = {
      name: f.name.trim(), category: opt(f.category), description: opt(f.description), image_url: opt(f.image_url),
      price, currency: f.currency, stock: f.stock === '' ? null : Number(f.stock), default_commission_share: share,
      sale_start: f.sale_start || null, sale_end: f.sale_end || null, is_on_sale: onSale,
    }
    await save.mutateAsync(product ? { shopId: shop.id, id: product.id, changes: fields } : { shopId: shop.id, create: { sku: f.sku.trim(), ...fields } })
    toast(product ? '商品已儲存' : '已新增商品')
    onClose()
  }

  return (
    <Modal onClose={onClose} title={product ? '修改商品' : '新增商品'} sub={shop?.name ?? '選擇支援店家'}>
      {!fixedShop && (
        <Field label="支援店家" hint="商品只能屬於一家店家，建立後不能更換">
          <select className="filt full" value={shopId} onChange={(e) => setShopId(Number(e.target.value))}>
            <option value={0}>請選擇支援店家</option>
            {shops.filter((s) => s.is_active).map((s) => <option key={s.id} value={s.id}>{s.name}（抽成 {ratePct(s.agency_rate)}）</option>)}
          </select>
        </Field>
      )}
      <div className="row-2">
        <Field label="SKU" hint={product ? '建立後不能修改' : '店家內的商品編號'}>
          <input value={f.sku} onChange={set('sku')} disabled={!!product} placeholder="KB-001" />
        </Field>
        <Field label="分類"><input list="productCategories" value={f.category} onChange={set('category')} placeholder="伴手禮" />
          <datalist id="productCategories">{categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
      </div>
      <Field label="商品名稱"><input value={f.name} onChange={set('name')} placeholder="八橋餅禮盒" /></Field>
      <Field label="說明"><textarea value={f.description} onChange={set('description')} placeholder="選填" /></Field>
      <Field label="圖片網址"><input value={f.image_url} onChange={set('image_url')} placeholder="https://…（選填）" /></Field>
      <div className="row-2">
        <Field label="售價"><input type="number" min={0} step="0.01" value={f.price} onChange={set('price')} placeholder="1200" /></Field>
        <Field label="幣別">
          <select className="filt full" value={f.currency} onChange={set('currency')}>
            {[...new Set([f.currency, ...CURRENCIES])].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div className="row-2">
        <Field label="庫存" hint="留空 = 不限；0 = 售完"><input type="number" min={0} step={1} value={f.stock} onChange={set('stock')} placeholder="不限" /></Field>
        <Field label="領隊分潤比例（%）" hint={shop ? `店家抽成 ${ratePct(shop.agency_rate)} 中分給領隊的比例` : '旅行社抽成中分給領隊的比例'}>
          <input type="number" min={0} max={100} step="0.01" value={f.sharePct} onChange={set('sharePct')} />
        </Field>
      </div>
      <div className="data-note"><Icon name="coin" />每件領隊佣金約 <b>{estimate}</b>（售價 × 店家抽成 × 分潤比例）</div>
      <div className="row-2">
        <Field label="販售開始"><input type="date" value={f.sale_start} onChange={set('sale_start')} /></Field>
        <Field label="販售結束"><input type="date" value={f.sale_end} onChange={set('sale_end')} /></Field>
      </div>
      <Field label="狀態">
        <div className="seg">
          <button type="button" className={onSale ? 'on' : ''} onClick={() => setOnSale(true)}>上架</button>
          <button type="button" className={!onSale ? 'on' : ''} onClick={() => setOnSale(false)}>下架</button>
        </div>
      </Field>
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={submit}><Icon name="check" />儲存</AsyncButton>
    </Modal>
  )
}
