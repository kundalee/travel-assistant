import { useState } from 'react'
import SouvPicker from '../components/SouvPicker'
import { AsyncButton, confirmDialog, Empty, Field, Icon, MapEmbed, Modal, PageHead, QueryState, toast } from '../../../components'
import { useQueryClient } from '@tanstack/react-query'
import { adminKeys, useAdminData, useCrud } from '../queries'
import type { AdminData } from '../../../api/types/admin'
import type { Place, Souvenir } from '../../../api/types/admin'
import { fmt, parseCoord } from '../utils'

function PlaceModal({ place, onClose }: { place: Place | null; onClose: () => void }) {
  const { create, update } = useCrud()
  const [name, setName] = useState(place?.name || '')
  const [coord, setCoord] = useState(place ? `${place.lat}, ${place.lng}` : '')
  const [desc, setDesc] = useState(place?.desc || '')
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>(place?.souvenirs || [])
  const [picking, setPicking] = useState(false)
  const c = parseCoord(coord)

  async function save() {
    if (!name.trim()) return toast('請輸入地點名稱', 'alert-circle')
    if (!c) return toast('請貼上有效的座標（緯度, 經度）', 'alert-circle')
    const rec = { name: name.trim(), lat: c.lat, lng: c.lng, desc: desc.trim(), souvenirs }
    const saved = place ? await update('places', place.id, rec, '旅遊地點已儲存', 'map-pin-check') : await create('places', rec, '旅遊地點已儲存', 'map-pin-check')
    if (saved) onClose()
  }

  return (
    <>
      <Modal onClose={onClose} title={place ? '修改旅遊地點' : '新增旅遊地點'} sub="名稱 · Google 座標 · 概述">
        <Field label="地點名稱"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：清水寺 · 二年坂" /></Field>
        <Field label="Google 座標" hint="直接貼上（緯度, 經度）">
          <input value={coord} onChange={(e) => setCoord(e.target.value)} placeholder="34.994856, 135.785046" />
          <p className="hint">於 Google 地圖上按右鍵，點最上方的座標即可複製，直接貼於此欄。</p>
        </Field>
        <Field label="概述"><textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="地點簡介與導覽重點…" /></Field>

        <div className="section-title sm"><Icon name="gift" />紀念商品<span className="lbl-hint" style={{ marginLeft: 6 }}>從紀念商品資料庫挑選</span></div>
        <div style={{ marginBottom: '0.7rem' }}>
          {souvenirs.length ? souvenirs.map((s) => (
            <div className="lrow" key={s.pid} style={{ marginBottom: '0.5rem' }}>
              <div className="lmain"><div className="lname">{s.name}</div><div className="lsub">NT$ {fmt(s.price)}</div></div>
              <div className="lacts"><button className="iconbtn-sm del" onClick={() => setSouvenirs(souvenirs.filter((x) => x.pid !== s.pid))}><Icon name="x" /></button></div>
            </div>
          )) : <p className="hint">尚未串聯紀念商品</p>}
        </div>
        <button className="btn btn-ghost btn-block btn-sm" style={{ marginBottom: '0.9rem' }} onClick={() => setPicking(true)}>
          <Icon name="search" />挑選 / 新增紀念商品
        </button>

        {c && <div style={{ marginBottom: '0.9rem' }}><MapEmbed lat={c.lat} lng={c.lng} /></div>}
        <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={save}><Icon name="device-floppy" />儲存地點</AsyncButton>
      </Modal>

      {picking && (
        <SouvPicker
          title={name} initial={souvenirs.map((s) => s.pid)} onClose={() => setPicking(false)}
          onApply={(chosen) => { setSouvenirs(chosen); setPicking(false) }}
        />
      )}
    </>
  )
}

export default function Places() {
  const { queries, data } = useAdminData('places', 'products')
  return <QueryState queries={queries}>{() => <PlacesView data={data!} />}</QueryState>
}

function PlacesView({ data }: { data: Pick<AdminData, 'places' | 'products'> }) {
  const { update, remove } = useCrud()
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Place | 'new' | null>(null)
  const [souvOf, setSouvOf] = useState<Place | null>(null)

  /* 刪除成功後，後端已自行程移除此地點，畫面同步 */
  function del(p: Place) {
    return confirmDialog({
      title: '刪除旅遊地點？', message: `「${p.name}」將被刪除，並自所有行程移除（相關紀念商品一併移除）。`, confirmLabel: '刪除', danger: true,
      onConfirm: async () => {
        if (!(await remove('places', p.id, '已刪除地點'))) return
        /* 後端已自各行程移除此地點 → 重新讀取行程 */
        void qc.invalidateQueries({ queryKey: adminKeys.list('tours') })
      },
    })
  }

  return (
    <div className="pad">
      <PageHead icon="map-pin" title="旅遊地點">
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="map-pin-plus" />新增旅遊地點</button>
      </PageHead>

      {data.places.length ? data.places.map((p) => (
        <div className="crud-card" key={p.id}>
          <div className="crud-top"><span className="crud-badge"><Icon name="map-pin" /></span><div className="crud-title">{p.name}</div></div>
          <div className="crud-body">{p.desc || '—'}</div>
          <div className="crud-meta"><Icon name="world-latitude" />{p.lat}, {p.lng} · 紀念商品 {p.souvenirs.length} 項</div>
          <MapEmbed lat={p.lat} lng={p.lng} h={150} />
          <div className="crud-acts">
            <button className="oact" onClick={() => setSouvOf(p)}><Icon name="gift" />紀念商品</button>
            <button className="oact" onClick={() => setEditing(p)}><Icon name="edit" />修改</button>
            <button className="oact del" onClick={() => del(p)}><Icon name="trash" />刪除</button>
          </div>
        </div>
      )) : <Empty text="尚無旅遊地點" />}

      {editing && <PlaceModal key={editing === 'new' ? 'new' : editing.id} place={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {souvOf && (
        <SouvPicker
          title={souvOf.name} initial={souvOf.souvenirs.map((s) => s.pid)} onClose={() => setSouvOf(null)}
          onApply={async (chosen) => { if (await update('places', souvOf.id, { souvenirs: chosen }, `已串聯 ${chosen.length} 項紀念商品`, 'gift')) setSouvOf(null) }}
        />
      )}
    </div>
  )
}
