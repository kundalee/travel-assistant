import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Empty, Field, Icon, Modal, SearchBox, StatusGroups, toast } from '../../../components'
import { ostatusClass, type OrderStatus } from '../../../lib/orders'
import { fmt, includesQ, uid } from '../../../lib/utils'
import { PageTitle, Screen } from '../components'
import { avatarFor, campaignBuyers, campaignMembers, pointName } from '../helpers'
import { useGuide } from '../store'
import type { Campaign, DealOrder, GatherPoint, GuideData } from '../../../api/types/guide'

type DealTab = 'mkt' | 'point' | 'order'
const TABS: [DealTab, string][] = [['mkt', '行銷作業'], ['point', '集結地點'], ['order', '訂單管理']]

/* 一對多呼叫：建立「全體」對話串，並寫入各團員個別對話串 */
function applyBroadcast(d: GuideData, c: Campaign, avatar: string) {
  const text = `【${c.title}】${c.body}${c.pointId ? '　集結地點：' + pointName(d, c.pointId) : ''}`
  const msg = { self: true, name: '我 (領隊)', av: avatar, text, time: '剛剛' }
  const gkey = 'dg_' + c.id
  d.dealChats[gkey] ??= { name: c.title + ' · 全體', group: true, msgs: [] }
  d.dealChats[gkey].msgs.push(msg)
  const members = campaignMembers(d)
  c.rcpt.forEach((code) => {
    const m = members.find((x) => x.code === code)
    if (!m) return
    d.dealChats[code] ??= { name: m.name, group: false, msgs: [] }
    d.dealChats[code].msgs.push(msg)
  })
}

/* ── 選擇呼叫對象：先前團員（不含進行中行程），可搜尋 / 全選 ── */
function RecipientsModal({ initial, onApply, onClose }: { initial: string[]; onApply: (codes: string[]) => void; onClose: () => void }) {
  const { data } = useGuide()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Set<string>>(() => new Set(initial))
  const list = campaignMembers(data).filter((m) => includesQ([m.name, m.email, m.nick, m.code], q))
  const allOn = list.length > 0 && list.every((m) => sel.has(m.code))

  const toggle = (code: string) => setSel((s) => { const n = new Set(s); if (n.has(code)) n.delete(code); else n.add(code); return n })
  const toggleAll = (on: boolean) => setSel((s) => { const n = new Set(s); list.forEach((m) => (on ? n.add(m.code) : n.delete(m.code))); return n })

  return (
    <Modal onClose={onClose} title="選擇呼叫對象" sub="先前團員（不含進行中行程）">
      <div className="filt-row"><SearchBox value={q} onChange={setQ} placeholder="搜尋姓名 / email / 暱稱 / 團編號" /></div>
      <label className="selectall-row">
        <input type="checkbox" checked={allOn} onChange={(e) => toggleAll(e.target.checked)} /><span>全選</span><span className="selN">已選 {sel.size}</span>
      </label>
      <div className="scroll-list">
        {list.length ? list.map((m) => {
          const on = sel.has(m.code)
          return (
            <div key={m.code} className={`rcpt-item ${on ? 'on' : ''}`} onClick={() => toggle(m.code)}>
              <div className="rk">{on && <Icon name="check" />}</div>
              <div className="rmain">
                <div className="rname">{m.name} <span className="nick">{m.nick}</span></div>
                <div className="rmeta">{m.code} · {m.email}</div>
              </div>
            </div>
          )
        }) : <Empty icon="user-off" text="查無團員" />}
      </div>
      <button className="btn btn-primary btn-block btn-lg" onClick={() => onApply([...sel])}><Icon name="check" />確定（{sel.size} 位）</button>
    </Modal>
  )
}

function CampaignModal({ campaign, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  const { data, user, commit } = useGuide()
  const nav = useNavigate()
  const [title, setTitle] = useState(campaign?.title || '')
  const [body, setBody] = useState(campaign?.body || '')
  const [pointId, setPointId] = useState(campaign?.pointId || '')
  const [rcpt, setRcpt] = useState<string[]>(campaign?.rcpt || [])
  const [picking, setPicking] = useState(false)

  function save(pub: boolean) {
    if (!title.trim()) return toast('請輸入主旨', 'alert-circle')
    if (pub && !rcpt.length) return toast('請先選擇呼叫對象', 'alert-circle')
    const c: Campaign = { id: campaign?.id || uid('c'), title: title.trim(), body: body.trim(), pub, time: pub ? '剛剛' : '草稿', pointId, rcpt }
    onClose()
    commit((d) => {
      const i = d.campaigns.findIndex((x) => x.id === c.id)
      if (i >= 0) d.campaigns[i] = c
      else d.campaigns.unshift(c)
      if (pub) applyBroadcast(d, c, user!.profile.avatar)
    }, { type: 'saveCampaign', campaign: c }, pub ? `已呼叫 ${rcpt.length} 位團員 📣` : '已存為草稿', pub ? 'phone-call' : undefined)
    if (pub) nav(`/guide/deals/chat/${encodeURIComponent('dg_' + c.id)}`)
  }

  return (
    <>
      <Modal onClose={onClose} title={campaign ? '修改呼叫訊息' : '新增呼叫訊息'} sub="行銷作業 · 一對多呼叫">
        <Field label="發送方式">
          <div className="ch-fixed"><Icon name="phone-call" />呼叫團員<span className="ch-tag">領隊導遊 → 團員（一對多）</span></div>
        </Field>
        <Field label="主旨"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：京都限定 · 抹茶禮盒團購" /></Field>
        <Field label="訊息內容"><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="輸入呼叫訊息…" /></Field>
        <Field label="呼叫對象" hint="先前團員（不含進行中行程）">
          <button className="btn btn-ghost btn-block btn-sm" onClick={() => setPicking(true)}><Icon name="users" />{rcpt.length ? `已選 ${rcpt.length} 位團員` : '選擇團員'}</button>
        </Field>
        <Field label="集結地點">
          <select className="filt full" value={pointId} onChange={(e) => setPointId(e.target.value)}>
            <option value="">（不指定）</option>
            {data.points.map((p) => <option key={p.id} value={p.id}>{p.name}{p.time ? ' · ' + p.time : ''}</option>)}
          </select>
        </Field>
        <div className="action-2">
          <button className="btn btn-ghost" onClick={() => save(false)}><Icon name="device-floppy" />存為草稿</button>
          <button className="btn btn-primary" onClick={() => save(true)}><Icon name="phone-call" />發出呼叫</button>
        </div>
      </Modal>
      {picking && (
        <RecipientsModal initial={rcpt} onClose={() => setPicking(false)}
          onApply={(codes) => { setRcpt(codes); setPicking(false); toast(`已選擇 ${codes.length} 位發送對象`, 'users') }} />
      )}
    </>
  )
}

function BuyersModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const { data } = useGuide()
  const buyers = campaignBuyers(data, campaign)
  return (
    <Modal onClose={onClose} title="選購團員" sub={`${campaign.title} · 共 ${buyers.length} 位`}>
      <div className="stack">
        {buyers.length ? buyers.map((o) => (
          <div className="mem-row" key={o.code}>
            <img className="mav" src={avatarFor(o.nick || o.member)} alt="" />
            <div className="mmain">
              <div className="mcode accent">{o.code}</div>
              <div className="mname">{o.member} <span className="nick">{o.nick}</span></div>
              <div className="mmeta">{o.product} ×{o.qty} · NT$ {fmt(o.amount)}</div>
              <div className="mnick"><Icon name="mail" /> {o.email}</div>
            </div>
            <span className={`ostatus ${ostatusClass(o.status)}`}>{o.status}</span>
          </div>
        )) : <Empty icon="user-off" text="尚無團員選購" />}
      </div>
    </Modal>
  )
}

function MarketingPane() {
  const { data, user, commit } = useGuide()
  const nav = useNavigate()
  const [editing, setEditing] = useState<Campaign | 'new' | null>(null)
  const [buyersOf, setBuyersOf] = useState<Campaign | null>(null)

  function call(c: Campaign) {
    if (!c.rcpt.length) return toast('請先於「修改」中選擇呼叫對象', 'alert-circle')
    commit((d) => {
      const x = d.campaigns.find((y) => y.id === c.id)!
      x.pub = true; x.time = '剛剛'
      applyBroadcast(d, x, user!.profile.avatar)
    }, { type: 'callMembers', campaignId: c.id, codes: c.rcpt }, `已呼叫 ${c.rcpt.length} 位團員 📣`, 'phone-call')
    nav(`/guide/deals/chat/${encodeURIComponent('dg_' + c.id)}`)
  }

  const remove = (id: string) =>
    commit((d) => { d.campaigns = d.campaigns.filter((x) => x.id !== id) }, { type: 'deleteCampaign', id }, '已刪除呼叫訊息', 'trash')

  return (
    <>
      <button className="btn btn-primary btn-block" style={{ marginBottom: '1rem' }} onClick={() => setEditing('new')}><Icon name="plus" />新增呼叫訊息</button>
      {data.campaigns.map((c) => (
        <div className="crud-card" key={c.id}>
          <div className="crud-top"><span className="crud-badge"><Icon name="phone-call" /> 呼叫</span><div className="crud-title">{c.title}</div></div>
          <div className="crud-body">{c.body}</div>
          <div className="crud-meta">
            <Icon name="clock" />{c.time} · {c.pub ? '已呼叫' : '草稿'}{c.rcpt.length ? ` · ${c.rcpt.length} 位團員` : ''}{c.pointId ? ' · ' + pointName(data, c.pointId) : ''}
          </div>
          <div className="crud-acts">
            {!c.pub && <button className="oact pay" onClick={() => call(c)}><Icon name="phone-call" />呼叫</button>}
            <button className="oact" onClick={() => setEditing(c)}><Icon name="edit" />修改</button>
            <button className="oact del" onClick={() => remove(c.id)}><Icon name="trash" />刪除</button>
            <button className="oact buyers" onClick={() => setBuyersOf(c)}><Icon name="users" />選購 ({campaignBuyers(data, c).length})</button>
          </div>
        </div>
      ))}
      {editing && <CampaignModal key={editing === 'new' ? 'new' : editing.id} campaign={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {buyersOf && <BuyersModal campaign={buyersOf} onClose={() => setBuyersOf(null)} />}
    </>
  )
}

function PointModal({ point, onClose }: { point: GatherPoint | null; onClose: () => void }) {
  const { commit } = useGuide()
  const [name, setName] = useState(point?.name || '')
  const [time, setTime] = useState(point?.time || '')
  const [note, setNote] = useState(point?.note || '')

  function save() {
    if (!name.trim()) return toast('請輸入地點名稱', 'alert-circle')
    const p: GatherPoint = { id: point?.id || uid('p'), name: name.trim(), time: time.trim(), note: note.trim() }
    onClose()
    commit((d) => {
      const i = d.points.findIndex((x) => x.id === p.id)
      if (i >= 0) d.points[i] = p
      else d.points.push(p)
    }, { type: 'savePoint', point: p }, '集結地點已儲存', 'map-pin-check')
  }

  return (
    <Modal onClose={onClose} title={point ? '修改集結地點' : '新增集結地點'} sub="團購集結地點">
      <Field label="地點名稱"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：飯店大廳 · 一樓服務台" /></Field>
      <Field label="集結時間"><input value={time} onChange={(e) => setTime(e.target.value)} placeholder="例：每日 20:00 - 21:00" /></Field>
      <Field label="備註"><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="其他說明（選填）" /></Field>
      <button className="btn btn-primary btn-block btn-lg" onClick={save}><Icon name="map-pin-plus" />儲存地點</button>
    </Modal>
  )
}

function PointsPane() {
  const { data, commit } = useGuide()
  const [editing, setEditing] = useState<GatherPoint | 'new' | null>(null)
  const remove = (id: string) =>
    commit((d) => { d.points = d.points.filter((x) => x.id !== id) }, { type: 'deletePoint', id }, '已刪除集結地點', 'trash')

  return (
    <>
      <button className="btn btn-primary btn-block" style={{ marginBottom: '1rem' }} onClick={() => setEditing('new')}><Icon name="map-pin-plus" />新增集結地點</button>
      {data.points.length ? data.points.map((p) => (
        <div className="crud-card" key={p.id}>
          <div className="crud-top"><span className="crud-badge"><Icon name="map-pin" /></span><div className="crud-title">{p.name}</div></div>
          <div className="crud-meta" style={{ marginTop: 6 }}><Icon name="clock" />{p.time}</div>
          {p.note && <div className="crud-body" style={{ marginTop: 6 }}>{p.note}</div>}
          <div className="crud-acts">
            <button className="oact" onClick={() => setEditing(p)}><Icon name="edit" />修改</button>
            <button className="oact del" onClick={() => remove(p.id)}><Icon name="trash" />刪除</button>
          </div>
        </div>
      )) : <Empty icon="map-pin" text="尚無集結地點" />}
      {editing && <PointModal key={editing === 'new' ? 'new' : editing.id} point={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function OrdersPane() {
  const { data, commit } = useGuide()
  const nav = useNavigate()
  const [status, setStatus] = useState<OrderStatus | '全部'>('全部')
  const [point, setPoint] = useState('全部')
  const rows = data.dealOrders.filter((o) => point === '全部' || o.pointId === point)

  const toggleRecon = (o: DealOrder) => commit((d) => {
    const x = d.dealOrders.find((y) => y.id === o.id)
    if (x) x.recon = !x.recon
  }, { type: 'setDealRecon', orderId: o.id, recon: !o.recon }, !o.recon ? '已完成勾稽 ✓' : '已取消勾稽')

  /* 團購範圍的呼叫（與行程內呼叫分開記錄） */
  function callMember(o: DealOrder) {
    nav(`/guide/deals/chat/${encodeURIComponent(o.code)}`)
    toast('團購呼叫：' + o.member, 'phone-call')
  }

  return (
    <>
      <div className="filt-row">
        <select className="filt" value={point} onChange={(e) => setPoint(e.target.value)}>
          <option value="全部">依集結地點：全部</option>
          {data.points.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <StatusGroups rows={rows} filter={status} onFilter={setStatus} people={(g) => new Set(g.map((o) => o.code)).size}
        render={(o) => (
          <div className={`order-row top ${o.status === '已取消' ? 'cancelled' : ''}`} key={o.id}>
            <div className="order-main">
              <div className="order-name">{o.product}</div>
              <div className="order-sub">{o.member} · 數量 {o.qty} · NT$ {fmt(o.amount)}</div>
              <div className="order-sub"><Icon name="calendar" /> {o.date} · {o.tour}</div>
              <div className="order-sub"><Icon name="map-pin" /> {pointName(data, o.pointId)}</div>
            </div>
            <div className="order-side">
              <span className={`ostatus ${ostatusClass(o.status)}`}>{o.status}</span>
              <button className={`recon ${o.recon ? 'done' : ''}`} onClick={() => toggleRecon(o)}><Icon name={o.recon ? 'checkbox' : 'square'} />{o.recon ? '已勾稽' : '勾稽'}</button>
              <button className="oact pay" onClick={() => callMember(o)}><Icon name="phone-call" />呼叫團員</button>
            </div>
          </div>
        )} />
    </>
  )
}

export default function Deals() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as DealTab) || 'mkt'
  return (
    <Screen>
      <div className="pad">
        <PageTitle sub="行銷作業、集結地點與訂單勾稽管理">團購搶好康</PageTitle>
        <div className="dtabs scroll">
          {TABS.map(([k, label]) => <button key={k} className={`dtab ${tab === k ? 'active' : ''}`} onClick={() => setParams({ tab: k }, { replace: true })}>{label}</button>)}
        </div>
        <div className="dl-pane">
          {tab === 'mkt' && <MarketingPane />}
          {tab === 'point' && <PointsPane />}
          {tab === 'order' && <OrdersPane />}
        </div>
      </div>
    </Screen>
  )
}
