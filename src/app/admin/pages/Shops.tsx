import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AsyncButton, confirmDialog, Empty, Field, Hl, Icon, Modal, PageHead, QueryState, SearchBox, toast } from '../../../components'
import { SETTLEMENT_TW } from '../../../api/mocks/admin'
import { DataNote } from '../components/DataNote'
import { useAdminData, useCrud, useShopProducts } from '../queries'
import type { AdminData, SettlementCycle, Shop } from '../../../api/types/admin'
import { includesQ, ratePct } from '../utils'

type StatusFilter = 'all' | 'active' | 'inactive'

/* Google 地圖搜尋：店名 + 地址，必要時補上城市 / 國家；沒有任何地址資料時不顯示。
   含逗號的地址（例如從 Google 地圖複製的「142 Yokooji …, Kyoto, 612-8244, Japan」）視為完整地址，不再補；
   否則只補地址中沒有出現的城市 / 國家 */
function mapUrl(s: Shop) {
  if (!s.address && !s.city && !s.country) return null
  const address = s.address ?? ''
  const complete = /[,，]/.test(address)
  const add = (part: string | null) => !complete && part && !address.toLowerCase().includes(part.toLowerCase())
  const query = [s.name, address, add(s.city) && s.city, add(s.country) && s.country].filter(Boolean).join(' ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/* 新增 / 修改支援店家（欄位與後端 /shops 相同） */
function ShopModal({ shop, onClose }: { shop: Shop | null; onClose: () => void }) {
  const { create, update } = useCrud()
  const [f, setF] = useState({
    name: shop?.name ?? '', contact_name: shop?.contact_name ?? '', phone: shop?.phone ?? '', email: shop?.email ?? '',
    country: shop?.country ?? '', city: shop?.city ?? '', address: shop?.address ?? '',
    ratePct: shop ? String(+(Number(shop.agency_rate) * 100).toFixed(2)) : '',
  })
  const [settlement, setSettlement] = useState<SettlementCycle>(shop?.settlement_cycle ?? 'monthly')
  const [active, setActive] = useState(shop?.is_active ?? true)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  async function save() {
    if (!f.name.trim()) return toast('請輸入支援店家名稱', 'alert-circle')
    const pct = Number(f.ratePct)
    if (f.ratePct.trim() === '' || !(pct >= 0 && pct <= 100)) return toast('抽成比例請輸入 0–100 的數字', 'alert-circle')
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) return toast('請輸入有效的 Email', 'alert-circle')
    if (f.country.trim() && !/^[A-Za-z]{2}$/.test(f.country.trim())) return toast('國家請填 2 碼（例：JP、TW、KR）', 'alert-circle')
    /* 選填欄位留空 = null（後端清除） */
    const opt = (v: string) => v.trim() || null
    const fields = {
      name: f.name.trim(), contact_name: opt(f.contact_name), phone: opt(f.phone), email: opt(f.email),
      country: opt(f.country.toUpperCase()), city: opt(f.city), address: opt(f.address), agency_rate: pct / 100, settlement_cycle: settlement,
    }
    const saved = shop
      ? await update('shops', shop.id, { ...fields, is_active: active }, '支援店家已儲存')
      : await create('shops', fields, '已新增支援店家', 'building-store')
    if (saved) onClose()
  }

  return (
    <Modal onClose={onClose} title={shop ? '修改支援店家' : '新增支援店家'} sub={shop ? shop.name : '店家資料・抽成與結算'}>
      <div className="section-title sm"><Icon name="building-store" />店家資料</div>
      <Field label="店家名稱"><input value={f.name} onChange={set('name')} placeholder="例：京都物產株式會社" /></Field>
      <div className="row-2">
        <Field label="聯絡人"><input value={f.contact_name} onChange={set('contact_name')} placeholder="山田太郎" /></Field>
        <Field label="電話"><input value={f.phone} onChange={set('phone')} placeholder="+81-75-123-4567" /></Field>
      </div>
      <Field label="Email"><input type="email" value={f.email} onChange={set('email')} placeholder="選填" /></Field>
      <div className="row-2">
        <Field label="國家" hint="2 碼"><input value={f.country} maxLength={2} onChange={set('country')} placeholder="JP" /></Field>
        <Field label="城市"><input value={f.city} onChange={set('city')} placeholder="京都" /></Field>
      </div>
      <Field label="地址"><input value={f.address} onChange={set('address')} placeholder="東山區清水 2-1" /></Field>

      <div className="section-title sm"><Icon name="percentage" />抽成與結算</div>
      <Field label="抽成比例（%）" hint="店家支付旅行社的比例，例：15 = 15%">
        <input type="number" min={0} max={100} step="0.01" value={f.ratePct} onChange={set('ratePct')} placeholder="15" />
      </Field>
      <Field label="結算週期">
        <div className="seg">
          {(Object.keys(SETTLEMENT_TW) as SettlementCycle[]).map((c) => (
            <button key={c} type="button" className={settlement === c ? 'on' : ''} onClick={() => setSettlement(c)}>{SETTLEMENT_TW[c]}</button>
          ))}
        </div>
      </Field>
      {shop && (
        <Field label="狀態" hint="店家不能刪除，停用後不再出現在選單中">
          <div className="seg">
            <button type="button" className={active ? 'on' : ''} onClick={() => setActive(true)}>啟用</button>
            <button type="button" className={!active ? 'on' : ''} onClick={() => setActive(false)}>停用</button>
          </div>
        </Field>
      )}
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={save}><Icon name="check" />儲存</AsyncButton>
    </Modal>
  )
}

/* 店家卡片上的商品：讀取該店家的商品（每家店家一個請求，已快取） */
function ShopProductsLink({ shop, q, onOpen }: { shop: Shop; q: string; onOpen: () => void }) {
  const products = useShopProducts(shop.id)
  const list = products.data ?? []
  return (
    <button className="vend-prod" onClick={onOpen}>
      <Icon name="package" />
      <div style={{ flex: 1, textAlign: 'left' }}>
        <b>商品{products.data ? ` (${list.length})` : ''}</b>
        <div className="vend-tags">
          {products.isPending ? <span style={{ color: 'var(--light)', fontSize: 12 }}>載入中…</span>
            : products.isError ? <span style={{ color: 'var(--light)', fontSize: 12 }}>商品讀取失敗</span>
            : list.length ? list.map((p) => <span className="vend-tag" key={p.id}><Hl text={p.name} q={q} /></span>)
            : <span style={{ color: 'var(--light)', fontSize: 12 }}>尚無商品，點擊新增或匯入</span>}
        </div>
      </div>
      <Icon name="chevron-right" style={{ color: 'var(--light)' }} />
    </button>
  )
}

export default function Shops() {
  const { queries, data } = useAdminData('shops')
  return <QueryState queries={queries}>{() => <ShopsView data={data!} />}</QueryState>
}

function ShopsView({ data }: { data: Pick<AdminData, 'shops'> }) {
  const { update, remove } = useCrud()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [editing, setEditing] = useState<Shop | 'new' | null>(null)

  const list = data.shops.filter((s) =>
    (status === 'all' || s.is_active === (status === 'active')) &&
    includesQ([s.name, s.contact_name, s.phone, s.email, s.country, s.city, s.address], q))
  const inactive = data.shops.filter((s) => !s.is_active).length

  /* 停用需確認；啟用直接送出 */
  function toggleActive(s: Shop) {
    if (!s.is_active) return update('shops', s.id, { is_active: true }, `已啟用「${s.name}」`)
    return confirmDialog({
      title: '停用支援店家？', message: `「${s.name}」停用後不再出現在選單中，可隨時再啟用。`, confirmLabel: '停用', danger: true,
      onConfirm: () => update('shops', s.id, { is_active: false }, `已停用「${s.name}」`),
    })
  }

  /* 刪除會連同商品一起刪除；後端拒絕時（有行程使用其商品）保留視窗，可改用停用 */
  function del(s: Shop) {
    return confirmDialog({
      title: '刪除支援店家？',
      message: `「${s.name}」及其所有商品將被永久刪除，無法復原。\n若有行程使用此店家的商品，將無法刪除，請改用「停用」。`,
      confirmLabel: '刪除', danger: true,
      onConfirm: async () => {
        if (!(await remove('shops', s.id, `已刪除「${s.name}」`))) throw new Error('delete refused')
      },
    })
  }

  return (
    <div className="pad">
      <PageHead icon="building-warehouse" title="支援店家管理">
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" />新增支援店家</button>
      </PageHead>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="全文檢索：店家 / 聯絡人 / 電話 / Email / 地區" />
        <select className="filt" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="all">全部狀態</option><option value="active">啟用中</option><option value="inactive">已停用</option>
        </select>
      </div>
      <DataNote group="admin.shops" />
      <div className="dt-count">共 {list.length} 家{inactive ? ` · ${inactive} 家已停用` : ''}</div>

      {list.length ? list.map((s) => {
        const area = [s.country, s.city, s.address].filter(Boolean).join(' · ')
        const map = mapUrl(s)
        return (
          <div className="vend-card" key={s.id} style={s.is_active ? undefined : { opacity: 0.65 }}>
            <div className="vend-top">
              <div className="vi"><Icon name="building-store" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="vend-name"><Hl text={s.name} q={q} /> {!s.is_active && <span className="draft-tag">已停用</span>}</div>
                <div className="vend-meta"><Hl text={area || '—'} q={q} /></div>
              </div>
            </div>
            <div className="vend-kv"><Icon name="user" /><span><Hl text={s.contact_name || '—'} q={q} /> · <Hl text={s.phone || '—'} q={q} /></span></div>
            {s.email && <div className="vend-kv"><Icon name="mail" /><span><Hl text={s.email} q={q} /></span></div>}
            <div className="vend-kv"><Icon name="percentage" /><span>抽成 <b>{ratePct(s.agency_rate)}</b> · {SETTLEMENT_TW[s.settlement_cycle]}</span></div>
            <ShopProductsLink shop={s} q={q} onOpen={() => nav(`/admin/shops/${s.id}/products`)} />
            <div className="crud-acts" style={{ marginTop: 10 }}>
              {map && <a className="oact" href={map} target="_blank" rel="noopener"><Icon name="map-2" />地圖</a>}
              <button className="oact" onClick={() => setEditing(s)}><Icon name="edit" />修改</button>
              {s.is_active
                ? <button className="oact del" onClick={() => toggleActive(s)}><Icon name="ban" />停用</button>
                : <AsyncButton className="oact pay" onClick={() => toggleActive(s)}><Icon name="check" />啟用</AsyncButton>}
              <button className="oact del" onClick={() => del(s)}><Icon name="trash" />刪除</button>
            </div>
          </div>
        )
      }) : <Empty text={data.shops.length ? '查無符合的支援店家' : '尚無支援店家，點右上角新增'} />}

      {editing && <ShopModal key={editing === 'new' ? 'new' : editing.id} shop={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
