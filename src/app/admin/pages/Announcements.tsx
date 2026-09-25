import { useState } from 'react'
import { AsyncButton, confirmDialog, Field, Hl, Icon, Modal, PageHead, QueryState, SearchBox, TableEmpty, toast, useBusy } from '../../../components'
import { ANN_TYPES } from '../../../api/mocks/admin'
import { useAdminData, useCrud } from '../queries'
import type { AdminData } from '../../../api/types/admin'
import type { AnnCat, Announcement, AnnTarget } from '../../../api/types/admin'
import { includesQ } from '../utils'

const SEARCH_FIELDS = ['全文', '依公告類別', '依團名', '依行程', '依關鍵字'] as const
type SearchField = (typeof SEARCH_FIELDS)[number]
const TARGETS: AnnTarget[] = ['依團名', '依行程', '依關鍵字']

function annMatch(a: Announcement, q: string, field: SearchField) {
  const parts =
    field === '全文' ? [a.headline, a.body, a.cat, a.type, a.tour_title, a.target, a.targetVal, a.pubFrom, a.pubTo]
      : field === '依團名' ? [a.tour_title]
        : field === '依行程' ? [a.targetVal]
          : field === '依公告類別' ? [a.cat, a.type]
            : [a.headline, a.body]
  return includesQ(parts, q)
}

const toInputDate = (s?: string) => (s || '').replace(/\//g, '-')
const toSlashDate = (s: string) => s.replace(/-/g, '/')

/* 內容撰寫 → 發佈日期 → 發佈對象 */
function AnnModal({ ann, onClose }: { ann: Announcement | null; onClose: () => void }) {
  const data = useAdminData('tours').data!
  const { create, update } = useCrud()
  const [cat, setCat] = useState<AnnCat>(ann?.cat || '每日公告')
  const [type, setType] = useState(ann?.type || ANN_TYPES['每日公告'][0])
  const [headline, setHeadline] = useState(ann?.headline || '')
  const [body, setBody] = useState(ann?.body || '')
  const [mode, setMode] = useState<Announcement['mode']>(ann?.mode || 'now')
  const [from, setFrom] = useState(toInputDate(ann?.pubFrom))
  const [to, setTo] = useState(toInputDate(ann?.pubTo))
  const [target, setTarget] = useState<AnnTarget>(ann?.target || '依團名')
  const [targetVal, setTargetVal] = useState(ann?.targetVal || data.tours[0]?.title || '')
  const isKw = target === '依關鍵字'
  const tourTitles = [...new Set(data.tours.map((t) => t.title))]

  function changeCat(c: AnnCat) { setCat(c); setType(ANN_TYPES[c][0]) }
  function changeTarget(t: AnnTarget) {
    setTarget(t)
    setTargetVal(t === '依關鍵字' ? '' : tourTitles[0] || '')
  }

  /* 兩個送出按鈕共用：任一執行中時兩者皆停用 */
  const [saving, run] = useBusy()
  async function save(published: boolean) {
    if (!headline.trim()) return toast('請輸入標題', 'alert-circle')
    const rec = {
      cat, type, headline: headline.trim(), body: body.trim(), target, targetVal, tour_title: isKw ? '' : targetVal,
      mode, pubFrom: toSlashDate(from || new Date().toISOString().slice(0, 10)), pubTo: toSlashDate(to), published,
    }
    const msg = published ? (mode === 'now' ? '公告已發佈 📢' : '已排定預約發佈') : '已存為草稿'
    const saved = ann ? await update('announcements', ann.id, rec, msg) : await create('announcements', rec, msg)
    if (saved) onClose()
  }

  return (
    <Modal onClose={onClose} title={ann ? '修改公告' : '新增公告'} sub="內容撰寫 · 發佈設定 · 發佈對象">
      <div className="section-title sm"><Icon name="pencil" />內容撰寫</div>
      <Field label="公告類別">
        <select className="filt" style={{ width: '100%' }} value={cat} onChange={(e) => changeCat(e.target.value as AnnCat)}>
          {(Object.keys(ANN_TYPES) as AnnCat[]).map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="類型">
        <select className="filt" style={{ width: '100%' }} value={type} onChange={(e) => setType(e.target.value)}>
          {ANN_TYPES[cat].map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="標題"><input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="例：明日 06:30 晨喚" /></Field>
      <Field label="內容"><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="輸入公告內容…" /></Field>

      <div className="section-title sm"><Icon name="calendar-event" />發佈日期</div>
      <div className="seg" style={{ marginBottom: '0.7rem' }}>
        <button className={mode === 'now' ? 'on' : ''} onClick={() => setMode('now')}>及時發佈</button>
        <button className={mode === 'schedule' ? 'on' : ''} onClick={() => setMode('schedule')}>預約發佈</button>
      </div>
      {mode === 'schedule' && (
        <div className="filt-row">
          <Field label="起" style={{ flex: 1, margin: 0 }}><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="迄" style={{ flex: 1, margin: 0 }}><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
      )}

      <div className="section-title sm"><Icon name="target" />發佈對象</div>
      <Field label="對象方式">
        <select className="filt" style={{ width: '100%' }} value={target} onChange={(e) => changeTarget(e.target.value as AnnTarget)}>
          {TARGETS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label={isKw ? '關鍵字' : target === '依團名' ? '團名' : '行程'}>
        {isKw
          ? <input value={targetVal} onChange={(e) => setTargetVal(e.target.value)} placeholder="輸入關鍵字" />
          : (
            <select className="filt" style={{ width: '100%' }} value={targetVal} onChange={(e) => setTargetVal(e.target.value)}>
              {tourTitles.map((t) => <option key={t}>{t}</option>)}
            </select>
          )}
      </Field>

      <div className="action-2">
        <AsyncButton className="btn btn-ghost" disabled={saving} onClick={() => run(() => save(false))}><Icon name="device-floppy" />存為草稿</AsyncButton>
        <AsyncButton className="btn btn-primary" disabled={saving} onClick={() => run(() => save(true))}><Icon name="speakerphone" />發佈公告</AsyncButton>
      </div>
    </Modal>
  )
}

export default function Announcements() {
  const { queries, data } = useAdminData('announcements', 'tours')
  return <QueryState queries={queries}>{() => <AnnouncementsView data={data!} />}</QueryState>
}

function AnnouncementsView({ data }: { data: Pick<AdminData, 'announcements' | 'tours'> }) {
  const { remove } = useCrud()
  const [q, setQ] = useState('')
  const [field, setField] = useState<SearchField>('全文')
  const [cat, setCat] = useState<AnnCat | '全部'>('全部')
  const [editing, setEditing] = useState<Announcement | 'new' | null>(null)

  const list = data.announcements.filter((a) => (cat === '全部' || a.cat === cat) && annMatch(a, q, field))

  function del(a: Announcement) {
    return confirmDialog({ title: '刪除公告？', message: `「${a.headline}」將被刪除。`, confirmLabel: '刪除', danger: true, onConfirm: () => remove('announcements', a.id, '已刪除公告') })
  }

  return (
    <div className="pad">
      <PageHead icon="speakerphone" title="公告管理">
        <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" />新增公告</button>
      </PageHead>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="全文檢索：標題 / 內容 / 團名 / 行程 / 日期" />
        <select className="filt" value={field} onChange={(e) => setField(e.target.value as SearchField)}>
          {SEARCH_FIELDS.map((f) => <option key={f} value={f}>查詢：{f}</option>)}
        </select>
        <select className="filt" value={cat} onChange={(e) => setCat(e.target.value as AnnCat | '全部')}>
          {['全部', '每日公告', '一般公告'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="dt-count">符合 {list.length} 筆</div>
      <div className="card-wrap">
        <table className="dtable">
          <thead><tr>
            <th style={{ width: 110 }}>類別</th><th>公告標題</th><th style={{ width: 190 }}>對象 / 發佈</th>
            <th style={{ width: 100 }}>狀態</th><th style={{ width: 96 }}>工具</th>
          </tr></thead>
          <tbody>
            {list.length ? list.map((a) => (
              <tr key={a.id}>
                <td><span className="st-badge off">{a.cat}</span></td>
                <td>
                  <div className="t-title"><Hl text={a.headline} q={q} /></div>
                  <div className="t-sub"><Hl text={(a.body || '').slice(0, 60)} q={q} />{(a.body || '').length > 60 ? '…' : ''}</div>
                </td>
                <td className="t-sub">{a.type} · {a.target}：{a.targetVal || '—'}<br />{a.mode === 'now' ? '及時發佈' : '預約 ' + a.pubFrom}</td>
                <td><span className={`st-badge ${a.published ? 'on' : 'warn'}`}>{a.published ? '已發佈' : '草稿'}</span></td>
                <td>
                  <div className="dt-acts">
                    <button onClick={() => setEditing(a)} title="編輯"><Icon name="edit" /></button>
                    <button className="del" onClick={() => del(a)} title="刪除"><Icon name="trash" /></button>
                  </div>
                </td>
              </tr>
            )) : <TableEmpty cols={5} icon="speakerphone" text="查無符合的公告" />}
          </tbody>
        </table>
      </div>

      {editing && <AnnModal key={editing === 'new' ? 'new' : editing.id} ann={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
