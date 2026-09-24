import { useState } from 'react'
import SouvPicker from '../components/SouvPicker'
import { Empty, Field, Hl, Icon, Modal, PageHead, SearchBox, TableEmpty } from '../../../components'
import { DataNote } from '../components/DataNote'
import { HISTORY_AFTER_DAYS, IMG, TOUR_STATUS_TW } from '../../../api/mocks/admin'
import { useAdmin } from '../store'
import type { Tour, TourStatus } from '../../../api/types/admin'
import { avatarUrl, computeTourStatus, includesQ, isHistoryTour, rosterOf, tourBatch, uid } from '../utils'

/* 行程來源：旅行社 CRM／行程建立系統 API 同步
   本系統不自行產生行程，僅接收 行程(旅遊地點) + 團編 + 團員 資料。
   團編規則：行程名_出團日-序號團_團員序號；團員帳密預設 ID = email / PW = 電話（無電話則系統自訂） */

const isHistory = (t: Tour) => isHistoryTour(t, HISTORY_AFTER_DAYS)
const tourMatch = (t: Tour, q: string) =>
  includesQ([t.title, t.dest, t.dates_text, t.guide_name, tourBatch(t), TOUR_STATUS_TW[t.status], t.source, t.synced_at], q)

interface RowProps {
  t: Tour
  q: string
  isHist: boolean
  onRoster: () => void
  onEdit: () => void
  onPublish: () => void
  onDelete: () => void
}

function TourRow({ t, q, isHist, onRoster, onEdit, onPublish, onDelete }: RowProps) {
  const needsGuide = !t.guide_id
  return (
    <tr className={needsGuide && !isHist ? 'row-warn' : ''}>
      <td style={{ width: 64 }}><img className="lthumb" style={{ width: 48, height: 40, borderRadius: 7 }} src={t.img_url || IMG.kyoto} alt="" loading="lazy" /></td>
      <td>
        <div className="tour-batch" style={{ fontSize: 11 }}><Hl text={tourBatch(t)} q={q} /></div>
        <div className="t-title"><Hl text={t.title} q={q} /></div>
        <div className="t-sub"><Hl text={t.dest} q={q} /> · <Hl text={t.dates_text} q={q} /> · 團員 {rosterOf(t).length} 位</div>
      </td>
      <td className="t-sub">
        {needsGuide
          ? <span className="unassigned"><Icon name="alert-triangle" style={{ fontSize: 12 }} />未指定</span>
          : <Hl text={t.guide_name} q={q} />}
        <br /><span className={`pub-tag ${t.published ? 'yes' : 'no'}`}>{t.published ? '已發佈' : '未發佈'}</span>
      </td>
      <td><span className={`rbadge ${t.status}`}>{TOUR_STATUS_TW[t.status]}</span></td>
      <td>
        <div className="dt-acts">
          <button onClick={onRoster} title="團員名冊"><Icon name="users" /></button>
          {!isHist && !t.published && <button className="pub" onClick={onPublish} title="發佈給團員"><Icon name="send" /></button>}
          <button onClick={onEdit} title="修改"><Icon name="edit" /></button>
          {!isHist && <button className="del" onClick={onDelete} title="刪除"><Icon name="trash" /></button>}
        </div>
      </td>
    </tr>
  )
}

function TourTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-wrap">
      <table className="dtable">
        <thead><tr><th style={{ width: 64 }}>圖</th><th>行程 / 團編</th><th style={{ width: 150 }}>領隊 / 發佈</th><th style={{ width: 100 }}>狀態</th><th style={{ width: 130 }}>工具</th></tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function RosterModal({ tour, onClose }: { tour: Tour; onClose: () => void }) {
  const list = rosterOf(tour)
  return (
    <Modal onClose={onClose} title="團員名冊" sub={`${tourBatch(tour)} · ${list.length} 位團員`}>
      <div className="data-note"><Icon name="key" />帳號預設為 email；密碼預設為電話，無電話者由系統自訂</div>
      <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
        {list.length ? list.map((m) => (
          <div className="lrow" key={m.code} style={{ alignItems: 'flex-start' }}>
            <img className="lav" src={avatarUrl(m.nick || m.name)} alt="" loading="lazy" />
            <div className="lmain">
              <div className="tour-batch">{m.code}</div>
              <div className="lname">{m.name} <span style={{ fontSize: 11, color: 'var(--light)' }}>{m.nick}</span></div>
              <div className="lsub"><Icon name="mail" style={{ fontSize: 12 }} /> 帳號：{m.loginId}</div>
              <div className="lsub2"><Icon name="lock" style={{ fontSize: 12 }} /> 密碼：{m.loginPw} <span style={{ color: 'var(--light)' }}>（{m.pwSource}）</span></div>
            </div>
          </div>
        )) : <Empty text="此行程尚無團員資料（待 CRM 同步）" />}
      </div>
    </Modal>
  )
}

function TourModal({ tour, onClose }: { tour: Tour | null; onClose: () => void }) {
  const { data, create, update, toast } = useAdmin()
  const [title, setTitle] = useState(tour?.title || '')
  const [dest, setDest] = useState(tour?.dest || '')
  const [dates, setDates] = useState(tour?.dates_text || '')
  const [guideId, setGuideId] = useState(tour?.guide_id || '')
  const [places, setPlaces] = useState<string[]>(tour?.places || [])
  const [placeSel, setPlaceSel] = useState('')
  const [souvOf, setSouvOf] = useState<string | null>(null)

  const guides = data.users.filter((u) => u.roles.includes('guide'))
  const avail = data.places.filter((p) => !places.includes(p.id))
  const souvPlace = data.places.find((p) => p.id === souvOf)

  function addPlace() {
    const id = placeSel || avail[0]?.id
    if (id && !places.includes(id)) setPlaces([...places, id])
    setPlaceSel('')
  }

  function save() {
    if (!title.trim()) return toast('請輸入行程名稱', 'alert-circle')
    const guide_id = guideId || null
    const rec = {
      title: title.trim(), dest: dest.trim(), country: (dest.split(',').pop() || '').trim(), dates_text: dates.trim(),
      guide_id, guide_name: guides.find((g) => g.id === guide_id)?.full_name || '', places,
    }
    onClose()
    if (tour) {
      const status = computeTourStatus({ ...tour, ...rec })
      const wasPreparing = tour.status === 'preparing'
      update('tours', tour.id, { ...rec, status },
        wasPreparing && guide_id ? '已指派領隊導遊，狀態更新為「即將出發」' : '行程已儲存',
        wasPreparing && guide_id ? 'user-check' : undefined)
    } else {
      const t: Tour = { id: uid('t'), img_url: IMG.kyoto, published: false, source: '手動', batch_seq: 1, status: 'preparing', ...rec }
      create('tours', { ...t, status: computeTourStatus(t) }, '行程已儲存')
    }
  }

  return (
    <>
      <Modal onClose={onClose} title={tour ? '編輯行程' : '新增行程'} sub="行程資料">
        <Field label="行程名稱"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="京都文化深度六日" /></Field>
        <Field label="目的地"><input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="京都, 日本" /></Field>
        <Field label="日期（顯示）"><input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="2026/06/30 - 07/05" /></Field>
        <Field label="狀態">
          <select className="filt" style={{ width: '100%' }} value={tour?.status || 'preparing'} disabled>
            {(Object.keys(TOUR_STATUS_TW) as TourStatus[]).map((s) => <option key={s} value={s}>{TOUR_STATUS_TW[s]}</option>)}
          </select>
          <p className="hint">狀態由系統自動判定：未指派領隊＝準備中；指派後＝即將出發；出團首日 00:00＝進行中；結束隔日 00:00＝已完成</p>
        </Field>
        <Field label="領隊">
          <select className="filt" style={{ width: '100%' }} value={guideId} onChange={(e) => setGuideId(e.target.value)}>
            <option value="">（未指派）</option>
            {guides.map((g) => <option key={g.id} value={g.id}>{g.full_name}</option>)}
          </select>
        </Field>
        <Field label="旅遊地點" hint="勾選本行程的地點，可於地點下新增紀念商品">
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select className="filt" style={{ flex: 1 }} value={placeSel} onChange={(e) => setPlaceSel(e.target.value)}>
              {avail.length ? avail.map((p) => <option key={p.id} value={p.id}>{p.name}</option>) : <option value="">（已全部加入）</option>}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={addPlace}><Icon name="plus" />加入</button>
          </div>
          {places.length ? places.map((id) => {
            const p = data.places.find((x) => x.id === id); if (!p) return null
            return (
              <div className="lrow" key={id} style={{ marginBottom: '0.5rem' }}>
                <div className="lmain">
                  <div className="lname">{p.name}</div>
                  <div className="lsub2">{p.lat.toFixed(4)}, {p.lng.toFixed(4)} · 紀念商品 {p.souvenirs.length} 項</div>
                </div>
                <div className="lacts">
                  <button className="iconbtn-sm" onClick={() => setSouvOf(id)} title="紀念商品"><Icon name="gift" /></button>
                  <button className="iconbtn-sm del" onClick={() => setPlaces(places.filter((x) => x !== id))}><Icon name="x" /></button>
                </div>
              </div>
            )
          }) : <p className="hint">尚未選擇旅遊地點</p>}
        </Field>
        <button className="btn btn-primary btn-block btn-lg" onClick={save}><Icon name="device-floppy" />儲存行程</button>
      </Modal>

      {souvPlace && (
        <SouvPicker
          title={souvPlace.name} initial={souvPlace.souvenirs.map((s) => s.pid)} onClose={() => setSouvOf(null)}
          onApply={(chosen) => { update('places', souvPlace.id, { souvenirs: chosen }, `已串聯 ${chosen.length} 項紀念商品`, 'gift'); setSouvOf(null) }}
        />
      )}
    </>
  )
}

export default function Tours() {
  const { data, update, remove, toast } = useAdmin()
  const [q, setQ] = useState('')
  const [histQ, setHistQ] = useState('')
  const [status, setStatus] = useState<TourStatus | 'all'>('all')
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [editing, setEditing] = useState<Tour | 'new' | null>(null)
  const [roster, setRoster] = useState<Tour | null>(null)

  /* 狀態一律依日期與領隊指派自動推算 */
  const tours = data.tours.map((t) => ({ ...t, status: computeTourStatus(t) }))
  const active = tours.filter((t) => !isHistory(t))
  const list = active.filter((t) => (status === 'all' || t.status === status) && tourMatch(t, q))
  const unassigned = active.filter((t) => !t.guide_id).length
  const history = tours.filter(isHistory)
  const histList = history.filter((t) => tourMatch(t, histQ))
  const histBad = history.filter((t) => t.status !== 'completed').length

  /* 示範；實務由後端定時拉取 CRM API → upsert tours / tour_members / users */
  function syncFromCRM() {
    setLastSync(new Date().toLocaleString('zh-TW', { hour12: false }))
    toast('已與 CRM 同步行程／團編／團員', 'refresh')
  }

  /* 發佈後團員端才看得到該行程 */
  function publish(t: Tour) {
    if (!t.guide_id) return toast('請先於「修改」中指派領隊導遊', 'alert-circle')
    const n = rosterOf(t).length
    update('tours', t.id, { published: true }, `已發佈「${t.title}」給團員${n ? `（${n} 位）` : ''}`, 'send')
  }

  function del(t: Tour) {
    if (confirm('確定刪除此行程？')) remove('tours', t.id, '已刪除')
  }

  const row = (t: Tour, isHist: boolean) => (
    <TourRow
      key={t.id} t={t} q={isHist ? histQ : q} isHist={isHist}
      onRoster={() => setRoster(t)} onEdit={() => setEditing(t)} onPublish={() => publish(t)} onDelete={() => del(t)}
    />
  )

  return (
    <div className="pad">
      <PageHead icon="map-2" title="行程管理">
        <button className="btn btn-primary" onClick={syncFromCRM}><Icon name="cloud-download" />立即同步 CRM</button>
      </PageHead>
      <p className="page-desc">行程來源為旅行社 CRM／行程建立系統，經 API 同步取得</p>

      <div className="sync-bar">
        <div className="sync-info"><Icon name="refresh" /><div>
          <b>CRM 資料同步</b><span>{lastSync ? '最近同步：' + lastSync : '資料由 CRM 定時同步（示範資料）'}</span></div></div>
        <button className="btn btn-primary btn-sm" onClick={syncFromCRM}><Icon name="cloud-download" />立即同步</button>
      </div>

      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="全文檢索：行程 / 團編 / 目的地 / 日期 / 領隊" />
        <select className="filt" value={status} onChange={(e) => setStatus(e.target.value as TourStatus | 'all')}>
          <option value="all">全部狀態</option>
          {(Object.keys(TOUR_STATUS_TW) as TourStatus[]).map((s) => <option key={s} value={s}>{TOUR_STATUS_TW[s]}</option>)}
        </select>
      </div>
      <DataNote />
      {unassigned > 0 && <div className="dt-count" style={{ color: 'var(--danger)' }}><Icon name="alert-triangle" /> 有 {unassigned} 筆行程尚未指定領隊導遊</div>}
      <TourTable>{list.length ? list.map((t) => row(t, false)) : <TableEmpty cols={5} icon="map-2" text="查無行程" />}</TourTable>

      <div className="section-title" style={{ marginTop: '1.6rem' }}>
        <Icon name="history" />歷史行程
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--light)', fontWeight: 500 }}>結束 {HISTORY_AFTER_DAYS} 天後自動歸入</span>
      </div>
      <div className="filt-row"><SearchBox value={histQ} onChange={setHistQ} placeholder="全文檢索歷史行程" /></div>
      <div className="data-note">
        <Icon name="history" />共 {history.length} 筆 ·{' '}
        {histBad ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>⚠ {histBad} 筆狀態非「已完成」（資料異常）</span> : '狀態全部為「已完成」'}
      </div>
      <TourTable>{histList.length ? histList.map((t) => row(t, true)) : <TableEmpty cols={5} icon="history" text="查無歷史行程" />}</TourTable>

      {editing && <TourModal key={editing === 'new' ? 'new' : editing.id} tour={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {roster && <RosterModal tour={roster} onClose={() => setRoster(null)} />}
    </div>
  )
}
