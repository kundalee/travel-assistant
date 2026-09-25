import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { AsyncButton, Chips, confirmDialog, Empty, Field, Hl, Icon, Modal, OptMulti, OptSingle, PageHead, QueryState, SearchBox, toast, useBusy } from '../../../components'
import { CATS, KIND_KEY, KIND_TW, V_KINDS } from '../../../api/mocks/admin'
import { useAdminData, useCrud } from '../queries'
import type { AdminData } from '../../../api/types/admin'
import type { Product, ProductKind } from '../../../api/types/admin'
import { fmt, includesQ, productKinds, vendorName } from '../utils'

function ProductModal({ product, scopeVendorId, onClose }: { product: Product | null; scopeVendorId?: string; onClose: () => void }) {
  const data = useAdminData('vendors').data!
  const { create, update } = useCrud()
  const [name, setName] = useState(product?.name || '')
  const [vendor, setVendor] = useState(vendorName(data.vendors, scopeVendorId ?? product?.vendor_id))
  const [kinds, setKinds] = useState<string[]>(product ? productKinds(product) : [])
  const [cat, setCat] = useState(product?.cat || '')
  const [cost, setCost] = useState(product?.cost ? String(product.cost) : '')
  const [price, setPrice] = useState(product ? String(product.price_twd) : '')
  const [bonus, setBonus] = useState(product?.bonus_twd ? String(product.bonus_twd) : '')

  const nCost = Number(cost) || 0, nPrice = Number(price) || 0
  const profit = nPrice - nCost
  const profitText = !cost && !price ? '' : `NT$ ${fmt(profit)}` + (nPrice ? `　（毛利率 ${Math.round((profit / nPrice) * 100)}%）` : '')

  /* 依名稱取得支援店家；不存在則建立一筆基本資料（暫存，供後續銷售分析歸戶） */
  async function resolveVendor(nm: string) {
    const t = nm.trim(); if (!t) return null
    const found = data.vendors.find((v) => v.name === t)
    if (found) return found.id
    const saved = await create('vendors', { name: t, addr: '', lat: null, lng: null, contact: '', phone: '', im: '', pay: '', payOther: '', ship: '', shipPlace: '', draft: true },
      `已建立支援店家「${t}」（基本資料待補）`, 'building-store')
    return saved ? saved.id : undefined
  }

  /* 兩個送出按鈕共用：任一執行中時兩者皆停用 */
  const [saving, run] = useBusy()
  async function save(draft: boolean) {
    if (!name.trim()) return toast('請輸入商品名稱', 'alert-circle')
    if (!draft) {
      if (!kinds.length) return toast('請至少選擇一個商品分類', 'alert-circle')
      if (!cat) return toast('請選擇商品效用', 'alert-circle')
    }
    const vendorId = await resolveVendor(vendor)
    if (vendorId === undefined) return
    const rec = {
      name: name.trim(), vendor_id: vendorId, kinds, kind: KIND_KEY[kinds[0]] || 'souvenir', cat,
      cost: nCost, price_twd: nPrice, bonus_twd: Number(bonus) || 0, draft,
    }
    const msg = draft ? '已暫時儲存（草稿）' : '商品已儲存'
    const icon = draft ? 'device-floppy' : 'check'
    const saved = product ? await update('products', product.id, rec, msg, icon) : await create('products', rec, msg, icon)
    if (saved) onClose()
  }

  return (
    <Modal onClose={onClose} title={product ? '修改商品' : '新增商品'} sub="商品分類・效用・進銷與供貨店家">
      <Field label="商品名稱"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="宇治抹茶精選組" /></Field>
      <Field label="支援店家" hint={scopeVendorId ? undefined : '輸入名稱，不存在時自動建立'}>
        <input list="vendorNames" value={vendor} onChange={(e) => setVendor(e.target.value)} readOnly={!!scopeVendorId}
          className={scopeVendorId ? 'readonly' : ''} placeholder="例：京都物產株式會社" autoComplete="off" />
        <datalist id="vendorNames">{data.vendors.map((v) => <option key={v.id} value={v.name} />)}</datalist>
        <p className="hint">{scopeVendorId ? '此商品歸屬於目前的支援店家' : '若輸入的店家不存在，儲存時會自動建立一筆基本資料'}</p>
      </Field>
      <Field label="商品分類" hint="可複選"><OptMulti options={V_KINDS} value={kinds} onChange={setKinds} /></Field>
      <Field label="商品效用" hint="僅單選"><OptSingle options={CATS} value={cat} onChange={setCat} /></Field>
      <div className="filt-row">
        <Field label="進價成本" style={{ flex: 1, margin: 0 }}><input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="300" /></Field>
        <Field label="銷售金額" style={{ flex: 1, margin: 0 }}><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="480" /></Field>
      </div>
      <Field label="利潤" hint="自動計算">
        <input readOnly value={profitText} placeholder="—" className="readonly"
          style={{ fontWeight: 700, color: profit < 0 ? 'var(--danger)' : 'var(--ok)' }} />
      </Field>
      <Field label="每件獎金 (NT$)"><input type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} placeholder="120" /></Field>
      <div className="action-2">
        <AsyncButton className="btn btn-ghost" disabled={saving} onClick={() => run(() => save(true))}><Icon name="device-floppy" />暫時儲存</AsyncButton>
        <AsyncButton className="btn btn-primary" disabled={saving} onClick={() => run(() => save(false))}><Icon name="check" />儲存商品</AsyncButton>
      </div>
    </Modal>
  )
}

type KindFilter = ProductKind | '全部'

export default function Products() {
  const { queries, data } = useAdminData('vendors', 'products')
  return <QueryState queries={queries}>{() => <ProductsView data={data!} />}</QueryState>
}

function ProductsView({ data }: { data: Pick<AdminData, 'vendors' | 'products'> }) {
  const { vendorId } = useParams()
  const { remove } = useCrud()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<KindFilter>('全部')
  const [cat, setCat] = useState('全部')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)

  const scoped = !!vendorId
  const vname = vendorName(data.vendors, vendorId)
  if (scoped && !vname) return <Navigate to="/admin/vendors" replace />

  const pool = scoped ? data.products.filter((p) => p.vendor_id === vendorId) : data.products
  const hasKind = (p: Product, k: ProductKind) => productKinds(p).includes(KIND_TW[k]) || p.kind === k
  const list = pool.filter((p) =>
    (scoped || kind === '全部' || hasKind(p, kind)) &&
    (cat === '全部' || (p.cat || '') === cat) &&
    includesQ([p.name, p.cat, productKinds(p).join(' '), scoped ? '' : vendorName(data.vendors, p.vendor_id), String(p.price_twd), String(p.cost)], q))

  const kindKeys: KindFilter[] = ['全部', ...V_KINDS.map((k) => KIND_KEY[k])]

  function del(p: Product) {
    return confirmDialog({ title: '刪除商品？', message: `「${p.name}」將被刪除。`, confirmLabel: '刪除', danger: true, onConfirm: () => remove('products', p.id, '已刪除商品') })
  }

  return (
    <div className="pad">
      <PageHead icon="package" title={scoped ? '商品資料管理_' + vname : '商品資料管理'} back={scoped ? '/admin/vendors' : undefined}>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" />新增商品</button>
      </PageHead>
      {scoped && <div className="data-note"><Icon name="building-store" />此處商品皆屬於「{vname}」</div>}
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder={scoped ? '全文檢索：商品 / 效用 / 價格' : '全文檢索：商品 / 效用 / 支援店家 / 價格'} />
      </div>
      {!scoped && (
        <Chips<KindFilter> style={{ marginBottom: '0.7rem' }} value={kind} onChange={setKind}
          items={kindKeys.map((k) => [k, k === '全部' ? '全部' : KIND_TW[k], k === '全部' ? pool.length : pool.filter((p) => hasKind(p, k)).length])} />
      )}
      <Chips className="cat-chips" value={cat} onChange={setCat}
        items={['全部', ...CATS].map((c) => [c, c, c === '全部' ? pool.length : pool.filter((p) => (p.cat || '') === c).length])} />
      <div className="data-note"><Icon name="list-search" />符合 {list.length} 筆</div>

      {list.length ? list.map((p) => {
        const vn = scoped ? '' : vendorName(data.vendors, p.vendor_id)
        return (
          <div className="lrow" key={p.id}>
            <div className="lmain">
              <div className="lname"><Hl text={p.name} q={q} /> {p.draft && <span className="draft-tag">暫存</span>}</div>
              <div className="lsub">NT$ {fmt(p.price_twd)} · 進價 NT$ {fmt(p.cost)} · 獎金 NT$ {fmt(p.bonus_twd)}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              <div className="p-tags">
                {p.cat && <span className="p-tag cat"><Hl text={p.cat} q={q} /></span>}
                {vn && <span className="p-tag vend"><Icon name="building-store" /><Hl text={vn} q={q} /></span>}
                {!scoped && productKinds(p).map((k) => <span className="rbadge guide" key={k}>{k}</span>)}
              </div>
              <div className="lacts">
                <button className="iconbtn-sm" onClick={() => setEditing(p)}><Icon name="edit" /></button>
                <button className="iconbtn-sm del" onClick={() => del(p)}><Icon name="trash" /></button>
              </div>
            </div>
          </div>
        )
      }) : <Empty text="查無符合的商品" />}

      {editing && (
        <ProductModal key={editing === 'new' ? 'new' : editing.id} product={editing === 'new' ? null : editing}
          scopeVendorId={vendorId} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
