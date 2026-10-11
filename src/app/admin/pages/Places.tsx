import { useState } from 'react'
import { AsyncButton, confirmDialog, Empty, Field, Icon, Modal, PageHead, QueryState, SearchBox, toast } from '../../../components'
import type { ItineraryItem, ItineraryItemProductWrite, Shop } from '../../../api/types/admin'
import { DataNote } from '../components/DataNote'
import { useAdminData, useItineraryItemActions, useItineraryItems, usePickableProducts } from '../queries'
import { includesQ, money, ratePct, shopName } from '../utils'

const place = (it: ItineraryItem) => [it.address, it.city, it.country].filter(Boolean).join('，')
const mapUrl = (it: ItineraryItem) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([it.name, it.address, it.city].filter(Boolean).join(' '))}`

function ItemModal({ item, onClose }: { item: ItineraryItem | null; onClose: () => void }) {
  const { save } = useItineraryItemActions()
  const [f, setF] = useState({
    name: item?.name ?? '', address: item?.address ?? '', city: item?.city ?? '', country: item?.country ?? '', meeting_point: item?.meeting_point ?? '',
  })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  async function submit() {
    if (!f.name.trim()) return toast('請輸入地點名稱', 'alert-circle')
    if (f.country.trim() && !/^[A-Za-z]{2}$/.test(f.country.trim())) return toast('國別請填 2 碼（例：JP、TW）', 'alert-circle')
    const body = {
      name: f.name.trim(), address: f.address.trim() || null, city: f.city.trim() || null,
      country: f.country.trim().toUpperCase() || null, meeting_point: f.meeting_point.trim() || null,
    }
    await save.mutateAsync({ id: item?.id, body })
    toast('旅遊地點已儲存', 'map-pin-check')
    onClose()
  }

  return (
    <Modal onClose={onClose} title={item ? '修改旅遊地點' : '新增旅遊地點'} sub="名稱 · 地址 · 集合地點">
      <Field label="地點名稱"><input value={f.name} onChange={set('name')} placeholder="例：清水寺 · 二年坂" /></Field>
      <Field label="地址"><input value={f.address} onChange={set('address')} /></Field>
      <div className="row-2">
        <Field label="城市"><input value={f.city} onChange={set('city')} placeholder="例：京都" /></Field>
        <Field label="國別" hint="2 碼"><input value={f.country} maxLength={2} onChange={set('country')} placeholder="JP" /></Field>
      </div>
      <Field label="集合地點"><input value={f.meeting_point} onChange={set('meeting_point')} placeholder="例：仁王門前" /></Field>
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={submit}><Icon name="device-floppy" />儲存地點</AsyncButton>
    </Modal>
  )
}

/* 地點販售的商品：從各店家的商品挑選；售價 / 分潤比例留空 = 沿用商品設定 */
type Override = { price: string; sharePct: string }

function ItemProductsModal({ item, shops, onClose }: { item: ItineraryItem; shops: Shop[]; onClose: () => void }) {
  const products = usePickableProducts()
  const { setProducts } = useItineraryItemActions()
  const [q, setQ] = useState('')
  const [chosen, setChosen] = useState<Map<number, Override>>(() => new Map(item.products.map((p) => [p.product_id, {
    price: p.price_override ? String(Number(p.price_override)) : '',
    sharePct: p.commission_share_override ? String(+(Number(p.commission_share_override) * 100).toFixed(2)) : '',
  }])))

  const toggle = (id: number) => setChosen((m) => { const n = new Map(m); if (n.has(id)) n.delete(id); else n.set(id, { price: '', sharePct: '' }); return n })
  const edit = (id: number, k: keyof Override, v: string) => setChosen((m) => new Map(m).set(id, { ...m.get(id)!, [k]: v }))

  async function submit() {
    const rows: ItineraryItemProductWrite[] = []
    for (const [product_id, o] of chosen) {
      const share = o.sharePct === '' ? null : Number(o.sharePct) / 100
      if (o.price !== '' && !(Number(o.price) >= 0)) return toast('售價須為 0 以上的數字', 'alert-circle')
      if (share != null && !(share >= 0 && share <= 1)) return toast('分潤比例須介於 0–100%', 'alert-circle')
      rows.push({ product_id, price_override: o.price === '' ? null : Number(o.price), commission_share_override: share })
    }
    await setProducts.mutateAsync({ id: item.id, products: rows })
    toast(`已串聯 ${rows.length} 項商品`, 'gift')
    onClose()
  }

  return (
    <Modal onClose={onClose} title="挑選紀念商品" sub={item.name}>
      <p className="hint" style={{ marginBottom: '0.6rem' }}>勾選要在此地點販售的商品；售價、分潤比例留空則沿用商品設定。</p>
      <QueryState queries={[products]}>{() => {
        const list = products.data!.filter((p) => includesQ([p.sku, p.name, p.category, shopName(shops, p.shop_id)], q))
        return products.data!.length ? (
          <>
            <SearchBox value={q} onChange={setQ} placeholder="搜尋：商品名稱 / SKU / 分類 / 店家" />
            <div style={{ maxHeight: 380, overflowY: 'auto', margin: '0.6rem 0 0.9rem' }}>
              {list.map((p) => {
                const o = chosen.get(p.id)
                return (
                  <div className={`lrow pick-row ${o ? 'on' : ''}`} key={p.id} style={{ flexWrap: 'wrap' }} onClick={() => toggle(p.id)}>
                    <div className="pick-box">{o && <Icon name="check" />}</div>
                    <div className="lmain">
                      <div className="lname">{p.name}{!p.is_on_sale && <span className="st-badge off" style={{ marginLeft: 6 }}>下架</span>}</div>
                      <div className="lsub">{shopName(shops, p.shop_id)} · {p.sku} · {money(p.price, p.currency)} · 分潤 {ratePct(p.default_commission_share)}</div>
                    </div>
                    {/* 另訂售價 / 分潤：點輸入框不切換勾選 */}
                    {o && (
                      <div className="row-2" style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
                        <input type="number" min={0} value={o.price} onChange={(e) => edit(p.id, 'price', e.target.value)} placeholder={`售價 ${p.currency}（預設 ${Number(p.price)}）`} />
                        <input type="number" min={0} max={100} value={o.sharePct} onChange={(e) => edit(p.id, 'sharePct', e.target.value)} placeholder={`分潤 %（預設 ${ratePct(p.default_commission_share)}）`} />
                      </div>
                    )}
                  </div>
                )
              })}
              {!list.length && <p className="hint">查無符合的商品</p>}
            </div>
          </>
        ) : <Empty icon="package" text="尚無商品" hint="請先於支援店家新增商品" />
      }}</QueryState>
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={submit}><Icon name="device-floppy" />儲存（{chosen.size} 項）</AsyncButton>
    </Modal>
  )
}

export default function Places() {
  const items = useItineraryItems()
  const shops = useAdminData('shops')
  return <QueryState queries={[items, ...shops.queries]}>{() => <PlacesView items={items.data!} shops={shops.data!.shops} />}</QueryState>
}

function PlacesView({ items, shops }: { items: ItineraryItem[]; shops: Shop[] }) {
  const { duplicate, remove } = useItineraryItemActions()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<ItineraryItem | 'new' | null>(null)
  const [productsOf, setProductsOf] = useState<ItineraryItem | null>(null)
  const list = items.filter((it) => includesQ([it.name, it.address, it.city, it.country, it.meeting_point, ...it.products.map((p) => p.product_name)], q))

  async function copy(it: ItineraryItem) {
    const saved = await duplicate.mutateAsync(it.id)
    toast(`已複製為「${saved.name}」`, 'copy')
  }

  function del(it: ItineraryItem) {
    return confirmDialog({
      title: '刪除旅遊地點？', message: `「${it.name}」將被刪除（串聯的商品一併移除）。`, confirmLabel: '刪除', danger: true,
      onConfirm: async () => { await remove.mutateAsync(it.id); toast('已刪除地點', 'trash') },
    })
  }

  return (
    <div className="pad">
      <PageHead icon="map-pin" title="旅遊地點">
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="map-pin-plus" />新增旅遊地點</button>
      </PageHead>
      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="搜尋：地點名稱 / 地址 / 城市 / 商品" /></div>
      <DataNote group="admin.itineraryItems" />

      {list.length ? list.map((it) => (
        <div className="crud-card" key={it.id}>
          <div className="crud-top"><span className="crud-badge"><Icon name="map-pin" /></span><div className="crud-title">{it.name}</div></div>
          <div className="crud-meta"><Icon name="map-search" />{place(it) || '未填地址'}</div>
          {it.meeting_point && <div className="crud-meta"><Icon name="users-group" />集合：{it.meeting_point}</div>}
          <div className="crud-meta">
            <Icon name="gift" />{it.products.length ? it.products.map((p) => `${p.product_name}（${money(p.price, p.currency)}）`).join('、') : '尚未串聯商品'}
          </div>
          <div className="crud-acts">
            <button className="oact" onClick={() => setProductsOf(it)}><Icon name="gift" />商品</button>
            <a className="oact" href={mapUrl(it)} target="_blank" rel="noreferrer"><Icon name="external-link" />地圖</a>
            <button className="oact" onClick={() => setEditing(it)}><Icon name="edit" />修改</button>
            <AsyncButton className="oact" onClick={() => copy(it)}><Icon name="copy" />複製</AsyncButton>
            <button className="oact del" onClick={() => del(it)}><Icon name="trash" />刪除</button>
          </div>
        </div>
      )) : <Empty text={items.length ? '查無符合的地點' : '尚無旅遊地點'} />}

      {editing && <ItemModal key={editing === 'new' ? 'new' : editing.id} item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {productsOf && <ItemProductsModal item={productsOf} shops={shops} onClose={() => setProductsOf(null)} />}
    </div>
  )
}
