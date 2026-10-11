import { useState } from 'react'
import { AsyncButton, confirmDialog, Empty, Field, FileDrop, Hl, Icon, Modal, PageHead, QueryState, SearchBox, TableEmpty, toast, useBusy } from '../../../components'
import { DataNote } from '../components/DataNote'
import { HISTORY_AFTER_DAYS, TOUR_STATUS_TW } from '../../../api/mocks/admin'
import type { AdminData, ImportJob, ItineraryItem, PaymentStatus, Tour, TourCreate, TourItinerary, TourStatus, User } from '../../../api/types/admin'
import {
  downloadTourTemplate, useAdminData, useCrud, useItineraryItems, useTourActions, useTourBookings, useTourItineraries, useTourItineraryActions,
} from '../queries'
import { errMsg, includesQ, isHistoryTour, leadGuide, money } from '../utils'

/* 行程管理（後端 /tours）：行程資料、領隊、狀態、行程表（排入 /admin/places 的旅遊地點）、報名團員；
   只有「準備中」的行程可以刪除，其他狀態請改為「已取消」 */

const isHistory = (t: Tour) => isHistoryTour(t, HISTORY_AFTER_DAYS)
const tourMatch = (t: Tour, q: string) =>
  includesQ([t.code, t.name, t.destination, t.start_date, t.end_date, ...t.guides.map((g) => g.full_name), TOUR_STATUS_TW[t.status]], q)
const hm = (t: string | null) => t?.slice(0, 5) ?? ''
const dayNo = (t: Tour, date: string) => Math.round((Date.parse(date) - Date.parse(t.start_date)) / 86400000) + 1
const STATUSES = Object.keys(TOUR_STATUS_TW) as TourStatus[]
const PAY_TW: Record<PaymentStatus, [string, string]> = {
  unpaid: ['未付款', 'preparing'], deposit: ['已付訂金', 'upcoming'], paid: ['已付清', 'on'], refunded: ['已退款', 'off'],
}

interface RowProps {
  t: Tour
  q: string
  isHist: boolean
  onItinerary: () => void
  onBookings: () => void
  onEdit: () => void
  onCopy: () => void
  onDelete: () => unknown
  onCancel: () => unknown
}

function TourRow({ t, q, isHist, onItinerary, onBookings, onEdit, onCopy, onDelete, onCancel }: RowProps) {
  const lead = leadGuide(t)
  const needsGuide = !t.guides.length && t.status !== 'cancelled'
  return (
    <tr className={needsGuide && !isHist ? 'row-warn' : ''}>
      <td>
        <div className="tour-batch" style={{ fontSize: 11 }}><Hl text={t.code} q={q} /></div>
        <div className="t-title"><Hl text={t.name} q={q} /></div>
        <div className="t-sub"><Hl text={t.destination} q={q} /> · {t.start_date} – {t.end_date} · 每人 {money(t.price_per_person, t.currency)}</div>
      </td>
      <td className="t-sub">
        {lead
          ? <><Hl text={lead.full_name} q={q} />{t.guides.length > 1 && <> 等 {t.guides.length} 位</>}</>
          : <span className="unassigned"><Icon name="alert-triangle" style={{ fontSize: 12 }} />未指定</span>}
        <br />{t.min_size}–{t.max_size} 人
      </td>
      <td>
        <span className={`rbadge ${t.status}`}>{TOUR_STATUS_TW[t.status]}</span>
        {!t.auto_status && <div className="t-sub" style={{ marginTop: 4 }}>手動</div>}
      </td>
      <td>
        <div className="dt-acts">
          <button onClick={onItinerary} title="行程表"><Icon name="calendar" /></button>
          <button onClick={onBookings} title="報名團員"><Icon name="users" /></button>
          <button onClick={onEdit} title="修改"><Icon name="edit" /></button>
          <button onClick={onCopy} title="複製"><Icon name="copy" /></button>
          {t.status === 'preparing' && <button className="del" onClick={onDelete} title="刪除"><Icon name="trash" /></button>}
          {(t.status === 'upcoming' || t.status === 'ongoing') && <button className="del" onClick={onCancel} title="取消行程"><Icon name="ban" /></button>}
        </div>
      </td>
    </tr>
  )
}

function TourTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-wrap">
      <table className="dtable">
        <thead><tr><th>行程 / 團號</th><th style={{ width: 150 }}>領隊 / 人數</th><th style={{ width: 100 }}>狀態</th><th style={{ width: 170 }}>工具</th></tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

/* 行程資料、領隊與狀態：先儲存行程，再依變動設定領隊、狀態（每一步都以後端回應為準） */
function TourModal({ tour, users, onClose }: { tour: Tour | null; users: User[]; onClose: () => void }) {
  const { create, update } = useCrud()
  const { setGuides, setStatus } = useTourActions()
  const agents = users.filter((u) => u.roles.includes('agent'))
  const guides = users.filter((u) => u.roles.includes('guide') && u.is_active)
  const [f, setF] = useState({
    code: tour?.code ?? '', name: tour?.name ?? '', destination: tour?.destination ?? '', start_date: tour?.start_date ?? '', end_date: tour?.end_date ?? '',
    min_size: String(tour?.min_size ?? 10), max_size: String(tour?.max_size ?? 30), price: tour ? String(Number(tour.price_per_person)) : '',
    currency: tour?.currency ?? 'JPY', owner: String(tour?.owner_agent_id ?? agents[0]?.id ?? ''), description: tour?.description ?? '', notes: tour?.notes ?? '',
  })
  /* 主要領隊（下拉）＋ 其他領隊（下拉加入、可移除） */
  const [lead, setLead] = useState(String(tour ? leadGuide(tour)?.guide_id ?? '' : ''))
  const [others, setOthers] = useState<number[]>(tour ? tour.guides.map((g) => g.guide_id).filter((id) => String(id) !== lead) : [])
  const [otherSel, setOtherSel] = useState('')
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const nameOf = (id: number) => users.find((u) => u.id === id)?.full_name ?? `#${id}`
  const addable = guides.filter((g) => String(g.id) !== lead && !others.includes(g.id))
  function addOther() {
    const id = Number(otherSel || addable[0]?.id)
    if (id) setOthers([...others, id])
    setOtherSel('')
  }

  async function save() {
    const min = Number(f.min_size), max = Number(f.max_size), price = Number(f.price)
    if (!f.code.trim() || !f.name.trim() || !f.destination.trim()) return toast('請輸入團號、行程名稱與目的地', 'alert-circle')
    if (!f.start_date || !f.end_date) return toast('請選擇出發與結束日期', 'alert-circle')
    if (f.end_date < f.start_date) return toast('結束日期不能早於出發日期', 'alert-circle')
    if (!(Number.isInteger(min) && min >= 1 && Number.isInteger(max) && max >= min)) return toast('人數請輸入整數，且最少 ≤ 最多', 'alert-circle')
    if (f.price.trim() === '' || !(price >= 0)) return toast('請輸入每人團費', 'alert-circle')
    if (!/^[A-Za-z]{3}$/.test(f.currency.trim())) return toast('幣別請填 3 碼（例：JPY、TWD）', 'alert-circle')
    if (!f.owner) return toast('請選擇所屬旅行社', 'alert-circle')
    const body: TourCreate = {
      code: f.code.trim(), name: f.name.trim(), destination: f.destination.trim(), start_date: f.start_date, end_date: f.end_date,
      min_size: min, max_size: max, price_per_person: price, currency: f.currency.trim().toUpperCase(), owner_agent_id: Number(f.owner),
      description: f.description.trim() || null,
    }
    const saved = tour ? await update('tours', tour.id, { ...body, notes: f.notes.trim() || null }) : await create('tours', body)
    if (!saved) return
    /* 未選主要領隊時，其他領隊的第一位視為主要領隊 */
    const ids = [...(lead ? [Number(lead)] : []), ...others.filter((id) => String(id) !== lead)]
    const next = ids.map((id, i) => ({ guide_id: id, is_lead: i === 0 }))
    const guidesChanged = JSON.stringify(saved.guides.map((g) => [g.guide_id, g.is_lead]).sort()) !== JSON.stringify(next.map((g) => [g.guide_id, g.is_lead]).sort())
    if (guidesChanged) await setGuides.mutateAsync({ id: saved.id, guides: next })
    /* 指派主要領隊後：準備中 → 即將出發；移除所有領隊：即將出發 → 準備中（其餘由後端依日期自動更新） */
    if (saved.status === 'preparing' && ids.length) await setStatus.mutateAsync({ id: saved.id, status: 'upcoming' })
    else if (saved.status === 'upcoming' && !ids.length) await setStatus.mutateAsync({ id: saved.id, status: 'preparing' })
    toast(tour ? '行程已儲存' : `已新增行程 ${saved.code}`, 'map-pin-check')
    onClose()
  }

  return (
    <Modal onClose={onClose} title={tour ? '編輯行程' : '新增行程'} sub={tour ? tour.code : '行程資料 · 領隊'}>
      <div className="row-2">
        <Field label="團號" hint="不可重複"><input value={f.code} onChange={set('code')} placeholder="KYO-261020-1" /></Field>
        <Field label="目的地"><input value={f.destination} onChange={set('destination')} placeholder="京都, 日本" /></Field>
      </div>
      <Field label="行程名稱"><input value={f.name} onChange={set('name')} placeholder="京都文化深度六日" /></Field>
      <div className="row-2">
        <Field label="出發日期"><input type="date" value={f.start_date} onChange={set('start_date')} /></Field>
        <Field label="結束日期"><input type="date" value={f.end_date} min={f.start_date || undefined} onChange={set('end_date')} /></Field>
      </div>
      <div className="row-2">
        <Field label="最少人數"><input type="number" min={1} value={f.min_size} onChange={set('min_size')} /></Field>
        <Field label="最多人數"><input type="number" min={1} value={f.max_size} onChange={set('max_size')} /></Field>
      </div>
      <div className="row-2">
        <Field label="每人團費"><input type="number" min={0} value={f.price} onChange={set('price')} /></Field>
        <Field label="幣別" hint="3 碼"><input value={f.currency} maxLength={3} onChange={set('currency')} placeholder="JPY" /></Field>
      </div>
      <Field label="所屬旅行社">
        <select className="filt" style={{ width: '100%' }} value={f.owner} onChange={set('owner')}>
          {!agents.length && <option value="">（尚無旅行社帳號）</option>}
          {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}（{a.email}）</option>)}
        </select>
      </Field>
      <Field label="行程說明"><textarea value={f.description} onChange={set('description')} placeholder="行程特色、注意事項…" /></Field>
      {tour && <Field label="內部備註"><textarea value={f.notes} onChange={set('notes')} /></Field>}

      <Field label="主要領隊">
        <select className="filt" style={{ width: '100%' }} value={lead} onChange={(e) => { setLead(e.target.value); setOthers(others.filter((id) => String(id) !== e.target.value)) }}>
          <option value="">（未指派）</option>
          {guides.map((g) => <option key={g.id} value={g.id}>{g.full_name}（{g.email}）</option>)}
        </select>
      </Field>
      <Field label="其他領隊" hint="選填，可加入多位">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select className="filt" style={{ flex: 1 }} value={otherSel} disabled={!addable.length} onChange={(e) => setOtherSel(e.target.value)}>
            {addable.length ? addable.map((g) => <option key={g.id} value={g.id}>{g.full_name}（{g.email}）</option>) : <option value="">（沒有其他可加入的領隊）</option>}
          </select>
          <button className="btn btn-ghost btn-sm" disabled={!addable.length} onClick={addOther}><Icon name="plus" />加入</button>
        </div>
        {others.map((id) => (
          <div className="lrow" key={id} style={{ marginBottom: '0.5rem' }}>
            <div className="lmain"><div className="lname">{nameOf(id)}</div></div>
            <div className="lacts"><button className="iconbtn-sm del" onClick={() => setOthers(others.filter((x) => x !== id))} title="移除"><Icon name="x" /></button></div>
          </div>
        ))}
      </Field>

      <Field label="狀態">
        <select className="filt" style={{ width: '100%' }} value={tour?.status ?? 'preparing'} disabled>
          {STATUSES.map((s) => <option key={s} value={s}>{TOUR_STATUS_TW[s]}</option>)}
        </select>
        <p className="hint">狀態由系統自動判定：未指派領隊＝準備中；指派後＝即將出發；出團首日＝進行中；結束隔日＝已結束；取消請於列表按「取消行程」</p>
      </Field>
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={save}><Icon name="device-floppy" />儲存行程</AsyncButton>
    </Modal>
  )
}

/* 複製：新團號與出發日，行程表日期一併平移（領隊不複製） */
function CopyModal({ tour, onClose }: { tour: Tour; onClose: () => void }) {
  const { duplicate } = useTourActions()
  const [code, setCode] = useState('')
  const [start, setStart] = useState('')
  const [name, setName] = useState('')

  async function save() {
    if (!code.trim() || !start) return toast('請輸入新團號與出發日期', 'alert-circle')
    const saved = await duplicate.mutateAsync({ id: tour.id, code: code.trim(), start_date: start, name: name.trim() || null })
    toast(`已複製為 ${saved.code}（${saved.start_date} – ${saved.end_date}）`, 'copy')
    onClose()
  }

  return (
    <Modal onClose={onClose} title="複製行程" sub={`${tour.code} · ${tour.name}`}>
      <p className="hint" style={{ marginBottom: '0.6rem' }}>行程資料與行程表一併複製，日期依新出發日平移；領隊需另行指派。</p>
      <div className="row-2">
        <Field label="新團號"><input value={code} onChange={(e) => setCode(e.target.value)} /></Field>
        <Field label="出發日期"><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
      </div>
      <Field label="行程名稱" hint="留空 = 原名稱 + (copy)"><input value={name} onChange={(e) => setName(e.target.value)} placeholder={tour.name} /></Field>
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={save}><Icon name="copy" />複製行程</AsyncButton>
    </Modal>
  )
}

/* 匯入：下載範本 → 填寫 → 上傳；全部正確才寫入，否則列出每一列的問題 */
function ImportModal({ title, sub, hint, tourId, onImport, onClose }: {
  title: string; sub: string; hint: string; tourId?: number; onImport: (file: File) => Promise<ImportJob>; onClose: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [job, setJob] = useState<ImportJob | null>(null)
  const [downloading, run] = useBusy()

  const template = (format: 'csv' | 'xlsx') => run(() => downloadTourTemplate(format, tourId).catch((e) => toast('範本下載失敗：' + errMsg(e), 'alert-circle')))

  async function submit() {
    if (!file) return toast('請先選擇檔案', 'alert-circle')
    const result = await onImport(file)
    setJob(result)
    if (result.status !== 'failed') {
      toast(`「${result.file_name}」匯入完成`, 'file-check')
      onClose()
    }
  }

  return (
    <Modal onClose={onClose} title={title} sub={sub}>
      <div className="section-title sm"><Icon name="download" />1. 下載範本</div>
      <p className="hint" style={{ marginBottom: '0.6rem' }}>{hint}</p>
      <div className="action-2" style={{ marginTop: 0 }}>
        <button className="btn btn-ghost" disabled={downloading} onClick={() => template('csv')}><Icon name="file-text" />CSV 範本</button>
        <button className="btn btn-ghost" disabled={downloading} onClick={() => template('xlsx')}><Icon name="table" />Excel 範本</button>
      </div>

      <div className="section-title sm" style={{ marginTop: '1.1rem' }}><Icon name="upload" />2. 上傳填好的檔案</div>
      <FileDrop accept=".csv,.xlsx" onFiles={([f]) => { setFile(f); setJob(null) }}>
        <Icon name="file-upload" />
        <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>{file ? <><b>{file.name}</b>（點擊或拖曳以更換）</> : '拖曳 CSV 或 Excel 檔到這裡，或點擊選擇'}</p>
      </FileDrop>

      {job?.status === 'failed' && (
        <div className="alert err show" style={{ marginTop: '0.9rem', display: 'block' }}>
          <b>匯入失敗，沒有寫入任何資料。</b>請修正以下問題後重新上傳：
          <ul style={{ margin: '6px 0 0 1.1rem', maxHeight: 220, overflowY: 'auto' }}>
            {(job.error_report ?? []).map((e, i) => <li key={i}>第 {e.row} 列{e.field ? ` · ${e.field}` : ''}：{e.message}</li>)}
          </ul>
        </div>
      )}
      <AsyncButton className="btn btn-primary btn-block btn-lg" style={{ marginTop: '1rem' }} disabled={!file} onClick={submit}><Icon name="upload" />匯入</AsyncButton>
    </Modal>
  )
}

/* 行程表的一項：選旅遊地點（或直接新增一個地點）、日期、時間與當天順序 */
function ItineraryRowModal({ tour, row, items, onClose }: { tour: Tour; row: TourItinerary | null; items: ItineraryItem[]; onClose: () => void }) {
  const { save } = useTourItineraryActions(tour.id)
  const [itemId, setItemId] = useState(row ? String(row.itinerary_item_id) : String(items[0]?.id ?? 'new'))
  const [newName, setNewName] = useState('')
  const [f, setF] = useState({
    visit_date: row?.visit_date ?? tour.start_date, sequence: row ? String(row.sequence) : '', start_time: hm(row?.start_time ?? null),
    end_time: hm(row?.end_time ?? null), notes: row?.notes ?? '',
  })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  async function submit() {
    if (itemId === 'new' && !newName.trim()) return toast('請輸入新地點名稱', 'alert-circle')
    if (!f.visit_date) return toast('請選擇日期', 'alert-circle')
    if (f.start_time && f.end_time && f.end_time < f.start_time) return toast('結束時間不能早於開始時間', 'alert-circle')
    const seq = f.sequence ? Number(f.sequence) : null
    const common = { visit_date: f.visit_date, start_time: f.start_time || null, end_time: f.end_time || null, notes: f.notes.trim() || null }
    if (row) {
      /* 只在地點 / 順序有變動才送出（同一天的順序不可重複） */
      await save.mutateAsync({ id: row.id, body: {
        ...common, ...(Number(itemId) !== row.itinerary_item_id && { itinerary_item_id: Number(itemId) }), ...(seq && seq !== row.sequence && { sequence: seq }),
      } })
    } else {
      await save.mutateAsync({ body: {
        ...common, sequence: seq, ...(itemId === 'new' ? { itinerary_item: { name: newName.trim() } } : { itinerary_item_id: Number(itemId) }),
      } })
    }
    toast('行程表已儲存', 'calendar')
    onClose()
  }

  return (
    <Modal onClose={onClose} title={row ? '修改行程表' : '加入行程表'} sub={`${tour.code} · ${tour.name}`}>
      <Field label="旅遊地點" hint="地點與商品於「旅遊地點」頁管理">
        <select className="filt" style={{ width: '100%' }} value={itemId} onChange={(e) => setItemId(e.target.value)}>
          {items.map((it) => <option key={it.id} value={it.id}>{it.name}{it.city ? `（${it.city}）` : ''}</option>)}
          {!row && <option value="new">＋ 新增地點…</option>}
        </select>
        {itemId === 'new' && <input style={{ marginTop: 8 }} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="新地點名稱（同時新增到旅遊地點）" />}
      </Field>
      <div className="row-2">
        <Field label="日期"><input type="date" value={f.visit_date} min={tour.start_date} max={tour.end_date} onChange={set('visit_date')} /></Field>
        <Field label="當天順序" hint={row ? '同一天不可重複' : '留空 = 排在最後'}><input type="number" min={1} value={f.sequence} onChange={set('sequence')} /></Field>
      </div>
      <div className="row-2">
        <Field label="開始時間"><input type="time" value={f.start_time} onChange={set('start_time')} /></Field>
        <Field label="結束時間"><input type="time" value={f.end_time} onChange={set('end_time')} /></Field>
      </div>
      <Field label="備註"><textarea value={f.notes} onChange={set('notes')} placeholder="導覽重點、自由活動時間…" /></Field>
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={submit}><Icon name="device-floppy" />儲存</AsyncButton>
    </Modal>
  )
}

/* 行程表：依日期分組，每天依順序排列 */
function ItineraryModal({ tour, onClose }: { tour: Tour; onClose: () => void }) {
  const rows = useTourItineraries(tour.id)
  const items = useItineraryItems()
  const { remove, importFile } = useTourItineraryActions(tour.id)
  const [editing, setEditing] = useState<TourItinerary | 'new' | null>(null)
  const [importing, setImporting] = useState(false)

  function del(r: TourItinerary) {
    return confirmDialog({
      title: '自行程表移除？', message: `「${r.name}」（${r.visit_date}）將自行程表移除；旅遊地點本身不會刪除。`, confirmLabel: '移除', danger: true,
      onConfirm: async () => { await remove.mutateAsync(r.id); toast('已自行程表移除', 'trash') },
    })
  }

  return (
    <>
      <Modal onClose={onClose} title="行程表" sub={`${tour.code} · ${tour.name}（${tour.start_date} – ${tour.end_date}）`}>
        <div className="action-2" style={{ marginTop: 0, marginBottom: '0.9rem' }}>
          <button className="btn btn-ghost" onClick={() => setImporting(true)}><Icon name="file-upload" />匯入</button>
          <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="map-pin-plus" />加入地點</button>
        </div>
        <QueryState queries={[rows, items]}>{() => {
          const list = rows.data!
          const days = [...new Set(list.map((r) => r.visit_date))]
          return days.length ? (
            <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
              {days.map((d) => (
                <div key={d}>
                  <div className="section-title sm"><Icon name="calendar" />第 {dayNo(tour, d)} 天 · {d}</div>
                  {list.filter((r) => r.visit_date === d).map((r) => (
                    <div className="lrow" key={r.id} style={{ alignItems: 'flex-start' }}>
                      <span className="crud-badge" style={{ flexShrink: 0 }}>{r.sequence}</span>
                      <div className="lmain">
                        <div className="lname">{r.name}</div>
                        <div className="lsub">
                          <Icon name="clock" style={{ fontSize: 12 }} /> {r.start_time ? `${hm(r.start_time)}${r.end_time ? ` – ${hm(r.end_time)}` : ''}` : '未定時間'}
                          {r.city && <> · {r.city}</>}{r.meeting_point && <> · 集合：{r.meeting_point}</>}
                        </div>
                        {r.notes && <div className="lsub2">{r.notes}</div>}
                        {!!r.products.length && <div className="lsub2"><Icon name="gift" style={{ fontSize: 12 }} /> {r.products.map((p) => p.product_name).join('、')}</div>}
                      </div>
                      <div className="lacts">
                        <button className="iconbtn-sm" onClick={() => setEditing(r)} title="修改"><Icon name="edit" /></button>
                        <button className="iconbtn-sm del" onClick={() => del(r)} title="移除"><Icon name="x" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : <Empty icon="calendar" text="尚未安排行程表" hint="點「加入地點」，或下載範本後一次匯入" />
        }}</QueryState>
      </Modal>

      {editing && items.data && (
        <ItineraryRowModal key={editing === 'new' ? 'new' : editing.id} tour={tour} row={editing === 'new' ? null : editing} items={items.data} onClose={() => setEditing(null)} />
      )}
      {importing && (
        <ImportModal
          title="匯入行程表" sub={`${tour.code} · ${tour.name}`} tourId={tour.id} onImport={(file) => importFile.mutateAsync(file)} onClose={() => setImporting(false)}
          hint={`每列一個地點：填 itinerary_item_id（既有地點）或 name 等欄位（同時新增地點）；visit_date 必填，須在 ${tour.start_date} – ${tour.end_date} 之間；時間 HH:MM；sequence 留空 = 排在當天最後。`}
        />
      )}
    </>
  )
}

/* 報名團員（唯讀）：團員與付款狀態 */
function BookingsModal({ tour, onClose }: { tour: Tour; onClose: () => void }) {
  const bookings = useTourBookings(tour.id)
  return (
    <Modal onClose={onClose} title="報名團員" sub={`${tour.code} · ${tour.name}`}>
      <QueryState queries={[bookings]}>{() => {
        const list = bookings.data!
        return list.length ? (
          <>
            <div className="data-note"><Icon name="users" />共 {list.length} 位 · 人數上限 {tour.max_size} 位</div>
            <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
              {list.map((b) => (
                <div className="lrow" key={b.id}>
                  <div className="lmain">
                    <div className="lname">{b.member_name}</div>
                    <div className="lsub">已付 {money(b.amount_paid, b.currency)} / 應付 {money(b.amount_due, b.currency)}</div>
                    <div className="lsub2">報名：{b.booked_at.slice(0, 10)}{b.notes && <> · {b.notes}</>}</div>
                  </div>
                  <span className={`rbadge ${PAY_TW[b.payment_status][1]}`}>{PAY_TW[b.payment_status][0]}</span>
                </div>
              ))}
            </div>
          </>
        ) : <Empty icon="users" text="此行程尚無報名" />
      }}</QueryState>
    </Modal>
  )
}

export default function Tours() {
  const { queries, data } = useAdminData('tours', 'users')
  return <QueryState queries={queries}>{() => <ToursView data={data!} />}</QueryState>
}

function ToursView({ data }: { data: Pick<AdminData, 'tours' | 'users'> }) {
  const { remove } = useCrud()
  const { importFile, setStatus: changeStatus } = useTourActions()
  const [q, setQ] = useState('')
  const [histQ, setHistQ] = useState('')
  const [status, setStatus] = useState<TourStatus | 'all'>('all')
  const [editing, setEditing] = useState<Tour | 'new' | null>(null)
  const [copying, setCopying] = useState<Tour | null>(null)
  const [itinerary, setItinerary] = useState<Tour | null>(null)
  const [bookings, setBookings] = useState<Tour | null>(null)
  const [importing, setImporting] = useState(false)

  const active = data.tours.filter((t) => !isHistory(t))
  const list = active.filter((t) => (status === 'all' || t.status === status) && tourMatch(t, q))
  const unassigned = active.filter((t) => !t.guides.length).length
  const history = data.tours.filter(isHistory)
  const histList = history.filter((t) => tourMatch(t, histQ))
  const histBad = history.filter((t) => t.status !== 'closed' && t.status !== 'cancelled').length

  function del(t: Tour) {
    return confirmDialog({
      title: '刪除行程？', message: `「${t.code} ${t.name}」及其行程表將被刪除。`, confirmLabel: '刪除', danger: true,
      onConfirm: () => remove('tours', t.id, '已刪除行程'),
    })
  }

  /* 取消後歸入歷史行程（取消只能手動設定，無法自動恢復） */
  function cancel(t: Tour) {
    return confirmDialog({
      title: '取消行程？', message: `「${t.code} ${t.name}」將設為「已取消」並歸入歷史行程。`, confirmLabel: '取消行程', danger: true,
      onConfirm: async () => { await changeStatus.mutateAsync({ id: t.id, status: 'cancelled' }); toast('已取消行程', 'ban') },
    })
  }

  const row = (t: Tour, isHist: boolean) => (
    <TourRow
      key={t.id} t={t} q={isHist ? histQ : q} isHist={isHist}
      onItinerary={() => setItinerary(t)} onBookings={() => setBookings(t)} onEdit={() => setEditing(t)} onCopy={() => setCopying(t)} onDelete={() => del(t)} onCancel={() => cancel(t)}
    />
  )

  return (
    <div className="pad">
      <PageHead icon="map-2" title="行程管理">
        <button className="btn btn-ghost" onClick={() => setImporting(true)}><Icon name="file-upload" />匯入</button>
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" />新增行程</button>
      </PageHead>

      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="全文檢索：團號 / 行程 / 目的地 / 日期 / 領隊" />
        <select className="filt" value={status} onChange={(e) => setStatus(e.target.value as TourStatus | 'all')}>
          <option value="all">全部狀態</option>
          {STATUSES.map((s) => <option key={s} value={s}>{TOUR_STATUS_TW[s]}</option>)}
        </select>
      </div>
      <DataNote group="admin.tours" />
      {unassigned > 0 && <div className="dt-count" style={{ color: 'var(--danger)' }}><Icon name="alert-triangle" /> 有 {unassigned} 筆行程尚未指定領隊</div>}
      <TourTable>{list.length ? list.map((t) => row(t, false)) : <TableEmpty cols={4} icon="map-2" text={data.tours.length ? '查無行程' : '尚無行程，點右上角新增或匯入'} />}</TourTable>

      <div className="section-title" style={{ marginTop: '1.6rem' }}>
        <Icon name="history" />歷史行程
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--light)', fontWeight: 500 }}>已取消，或結束 {HISTORY_AFTER_DAYS} 天後自動歸入</span>
      </div>
      <div className="filt-row"><SearchBox value={histQ} onChange={setHistQ} placeholder="全文檢索歷史行程" /></div>
      <div className="data-note">
        <Icon name="history" />共 {history.length} 筆 ·{' '}
        {histBad ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>⚠ {histBad} 筆狀態非「已結束 / 已取消」（資料異常）</span> : '狀態全部為「已結束 / 已取消」'}
      </div>
      <TourTable>{histList.length ? histList.map((t) => row(t, true)) : <TableEmpty cols={4} icon="history" text="查無歷史行程" />}</TourTable>

      {editing && <TourModal key={editing === 'new' ? 'new' : editing.id} tour={editing === 'new' ? null : editing} users={data.users} onClose={() => setEditing(null)} />}
      {copying && <CopyModal tour={copying} onClose={() => setCopying(null)} />}
      {itinerary && <ItineraryModal tour={itinerary} onClose={() => setItinerary(null)} />}
      {bookings && <BookingsModal tour={bookings} onClose={() => setBookings(null)} />}
      {importing && (
        <ImportModal
          title="匯入行程" sub="一次建立多個行程" onImport={(file) => importFile.mutateAsync(file)} onClose={() => setImporting(false)}
          hint="欄位：code、name、destination、start_date、end_date、min_size、max_size、price_per_person、currency 必填；owner_agent_email 為所屬旅行社的帳號 email；日期 YYYY-MM-DD；auto_status 為 true / false。"
        />
      )}
    </div>
  )
}
