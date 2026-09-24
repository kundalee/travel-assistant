import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty, Field, Hl, Icon, MapEmbed, Modal, OptSingle, PageHead, SearchBox } from '../../../components'
import { V_PAY, V_SHIP } from '../../../api/mocks/admin'
import { useAdmin } from '../store'
import type { Vendor } from '../../../api/types/admin'
import { includesQ, parseCoord, uid } from '../utils'

function VendorModal({ vendor, onClose, onDelete }: { vendor: Vendor | null; onClose: () => void; onDelete: (v: Vendor) => void }) {
  const { create, update, toast } = useAdmin()
  const [f, setF] = useState({
    name: vendor?.name || '', addr: vendor?.addr || '',
    coord: vendor?.lat != null ? `${vendor.lat}, ${vendor.lng}` : '',
    contact: vendor?.contact || '', phone: vendor?.phone || '', im: vendor?.im || '',
    pay: vendor?.pay || '', payOther: vendor?.payOther || '', ship: vendor?.ship || '', shipPlace: vendor?.shipPlace || '',
  })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const c = parseCoord(f.coord)

  /* draft=true 為暫時儲存，可略過必填 */
  function save(draft: boolean) {
    if (!f.name.trim()) return toast('請輸入支援店家名稱', 'alert-circle')
    if (!draft) {
      if (!f.pay) return toast('請選擇結帳方式', 'alert-circle')
      if (!f.ship) return toast('請選擇交貨方式', 'alert-circle')
      if (f.pay === '其它' && !f.payOther.trim()) return toast('請填寫其它結帳方式', 'alert-circle')
      if (f.ship === '指定地點' && !f.shipPlace.trim()) return toast('請填寫指定交貨地點', 'alert-circle')
    }
    const { coord: _coord, ...rest } = f
    const rec = { ...rest, name: f.name.trim(), lat: c?.lat ?? null, lng: c?.lng ?? null, draft }
    const msg = draft ? '已暫時儲存（草稿）' : '支援店家已儲存'
    const icon = draft ? 'device-floppy' : 'check'
    onClose()
    if (vendor) update('vendors', vendor.id, rec, msg, icon)
    else create('vendors', { id: uid('v'), ...rec }, msg, icon)
  }

  return (
    <Modal onClose={onClose} title={vendor ? '修改支援店家' : '新增支援店家'}
      sub={vendor ? vendor.name + (vendor.draft ? '（暫存）' : '') : '廠商資料・商品・結帳與交貨'}>
      <div className="section-title sm"><Icon name="building-store" />廠商資料</div>
      <Field label="a. 支援店家名稱"><input value={f.name} onChange={set('name')} placeholder="例：京都物產株式會社" /></Field>
      <Field label="b. 國家與地址"><input value={f.addr} onChange={set('addr')} placeholder="日本 · 京都市東山區清水 2-1" /></Field>
      <Field label="地圖經緯度" hint="直接貼上（緯度, 經度）"><input value={f.coord} onChange={set('coord')} placeholder="34.994856, 135.785046" /></Field>
      {c && <div style={{ marginBottom: '0.8rem' }}><MapEmbed lat={c.lat} lng={c.lng} h={150} /></div>}
      <Field label="c. 聯絡人"><input value={f.contact} onChange={set('contact')} placeholder="山田太郎" /></Field>
      <Field label="d. 連絡電話"><input value={f.phone} onChange={set('phone')} placeholder="+81-75-123-4567" /></Field>
      <Field label="e. IM 帳號" hint="LINE / WeChat / WhatsApp"><input value={f.im} onChange={set('im')} placeholder="LINE: kyoto-bussan" /></Field>

      <div className="section-title sm"><Icon name="credit-card" />結帳與交貨</div>
      <Field label="結帳方式" hint="僅單選">
        <OptSingle options={V_PAY} value={f.pay} onChange={(pay) => setF({ ...f, pay })} />
        {f.pay === '其它' && <input value={f.payOther} onChange={set('payOther')} placeholder="其它結帳方式" style={{ marginTop: 8 }} />}
      </Field>
      <Field label="交貨方式" hint="僅單選">
        <OptSingle options={V_SHIP} value={f.ship} onChange={(ship) => setF({ ...f, ship })} />
        {f.ship === '指定地點' && <input value={f.shipPlace} onChange={set('shipPlace')} placeholder="指定地點" style={{ marginTop: 8 }} />}
      </Field>

      <div className="action-2">
        <button className="btn btn-ghost" onClick={() => save(true)}><Icon name="device-floppy" />暫時儲存</button>
        <button className="btn btn-primary" onClick={() => save(false)}><Icon name="check" />儲存</button>
      </div>
      {vendor && (
        <button className="btn btn-ghost btn-block btn-sm btn-danger" style={{ marginTop: '0.7rem' }} onClick={() => { onClose(); onDelete(vendor) }}>
          <Icon name="trash" />刪除此廠商
        </button>
      )}
    </Modal>
  )
}

export default function Vendors() {
  const { data, remove } = useAdmin()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Vendor | 'new' | null>(null)

  const productsOf = (vid: string) => data.products.filter((p) => p.vendor_id === vid)
  const list = data.vendors.filter((v) => includesQ([
    v.name, v.addr, v.contact, v.phone, v.im, v.pay, v.payOther, v.ship, v.shipPlace,
    ...productsOf(v.id).map((p) => [p.name, p.cat, ...(p.kinds || [])].join(' ')),
  ], q))
  const drafts = data.vendors.filter((v) => v.draft).length

  function del(v: Vendor) {
    if (confirm(`確定刪除支援店家「${v.name}」？`)) remove('vendors', v.id, '已刪除支援店家')
  }

  return (
    <div className="pad">
      <PageHead icon="building-warehouse" title="支援店家管理">
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" />新增支援店家</button>
      </PageHead>
      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="全文檢索：廠商 / 商品 / 聯絡人 / 電話 / 分類" /></div>
      <div className="dt-count">共 {list.length} 家{drafts ? ` · ${drafts} 筆暫存` : ''}</div>

      {list.length ? list.map((v) => {
        const prods = productsOf(v.id)
        return (
          <div className="vend-card" key={v.id}>
            <div className="vend-top">
              <div className="vi"><Icon name="building-store" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="vend-name"><Hl text={v.name} q={q} /> {v.draft && <span className="draft-tag">暫存</span>}</div>
                <div className="vend-meta"><Hl text={v.addr || '—'} q={q} /></div>
              </div>
            </div>
            <div className="vend-kv"><Icon name="user" /><span><Hl text={v.contact || '—'} q={q} /> · <Hl text={v.phone || '—'} q={q} /></span></div>
            <div className="vend-kv"><Icon name="message-circle" /><span><Hl text={v.im || '—'} q={q} /></span></div>
            <div className="vend-kv"><Icon name="credit-card" />
              <span>{v.pay === '其它' ? v.payOther || '其它' : v.pay || '—'} · {v.ship === '指定地點' ? '指定地點：' + (v.shipPlace || '—') : v.ship || '—'}</span>
            </div>
            {v.lat != null && <div className="vend-kv"><Icon name="map-pin" /><span>{v.lat}, {v.lng}</span></div>}
            <button className="vend-prod" onClick={() => nav(`/admin/vendors/${v.id}/products`)}>
              <Icon name="package" />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <b>商品 ({prods.length})</b>
                <div className="vend-tags">
                  {prods.length
                    ? prods.map((p) => <span className="vend-tag" key={p.id}><Hl text={p.name} q={q} /></span>)
                    : <span style={{ color: 'var(--light)', fontSize: 12 }}>尚無商品，點擊新增</span>}
                </div>
              </div>
              <Icon name="chevron-right" style={{ color: 'var(--light)' }} />
            </button>
            <div className="crud-acts" style={{ marginTop: 10 }}>
              {v.lat != null && <a className="oact" href={`https://www.google.com/maps?q=${v.lat},${v.lng}`} target="_blank" rel="noopener"><Icon name="map-2" />地圖</a>}
              <button className="oact" onClick={() => setEditing(v)}><Icon name="edit" />修改</button>
              <button className="oact del" onClick={() => del(v)}><Icon name="trash" />刪除</button>
            </div>
          </div>
        )
      }) : <Empty text="查無符合的支援店家" />}

      {editing && (
        <VendorModal key={editing === 'new' ? 'new' : editing.id} vendor={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)} onDelete={del} />
      )}
    </div>
  )
}
