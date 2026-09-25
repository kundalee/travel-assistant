import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AsyncButton, confirmDialog, Empty, Field, Icon, Modal, QueryState, SearchBox, StatusGroups, toast } from '../../../components'
import { ostatusClass, type OrderStatus } from '../../../lib/orders'
import { fmt, includesQ } from '../../../lib/utils'
import { PageTitle, Screen } from '../components'
import { avatarFor, campaignBuyers, campaignMembers, pointName } from '../helpers'
import {
  useBoutique, useCallCampaign, useCampaigns, useDealOrders, useDeleteCampaign, useDeletePoint, useMembers, usePoints, useSaveCampaign,
  useSavePoint, useSetDealRecon, useTours,
} from '../queries'
import type { Campaign, DealOrder, GatherPoint } from '../../../api/types/guide'

type DealTab = 'mkt' | 'point' | 'order'
const TABS: [DealTab, string][] = [['mkt', '行銷作業'], ['point', '集結地點'], ['order', '訂單管理']]

/* ── 選擇呼叫對象：先前團員（不含進行中行程），可搜尋 / 全選 ── */
function RecipientsModal({ initial, onApply, onClose }: { initial: string[]; onApply: (codes: string[]) => void; onClose: () => void }) {
  const members = useMembers()
  const tours = useTours()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Set<string>>(() => new Set(initial))
  const list = (members.data && tours.data ? campaignMembers({ ...members.data, ...tours.data }) : []).filter((m) => includesQ([m.name, m.email, m.nick, m.code], q))
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
        }) : <QueryState queries={[members, tours]}>{() => <Empty icon="user-off" text="查無團員" />}</QueryState>}
      </div>
      <button className="btn btn-primary btn-block btn-lg" onClick={() => onApply([...sel])}><Icon name="check" />確定（{sel.size} 位）</button>
    </Modal>
  )
}

function CampaignModal({ campaign, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  const points = usePoints()
  const save = useSaveCampaign()
  const nav = useNavigate()
  const [title, setTitle] = useState(campaign?.title || '')
  const [body, setBody] = useState(campaign?.body || '')
  const [pointId, setPointId] = useState(campaign?.pointId || '')
  const [rcpt, setRcpt] = useState<string[]>(campaign?.rcpt || [])
  const [picking, setPicking] = useState(false)

  /* 發佈時後端呼叫團員並寫入團購對話；成功後前往該對話 */
  async function submit(pub: boolean) {
    if (!title.trim()) return toast('請輸入主旨', 'alert-circle')
    if (pub && !rcpt.length) return toast('請先選擇呼叫對象', 'alert-circle')
    const broadcast = pub && !campaign?.pub
    const saved = await save.mutateAsync({ ...campaign, title: title.trim(), body: body.trim(), pub, pointId, rcpt })
    toast(broadcast ? `已呼叫 ${rcpt.length} 位團員 📣` : '已存為草稿', broadcast ? 'phone-call' : undefined)
    onClose()
    if (broadcast) nav(`/guide/deals/chat/${encodeURIComponent('dg_' + saved.id)}`)
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
            {points.data?.map((p) => <option key={p.id} value={p.id}>{p.name}{p.time ? ' · ' + p.time : ''}</option>)}
          </select>
        </Field>
        <div className="action-2">
          <AsyncButton className="btn btn-ghost" disabled={save.isPending} onClick={() => submit(false)}><Icon name="device-floppy" />存為草稿</AsyncButton>
          <AsyncButton className="btn btn-primary" disabled={save.isPending} onClick={() => submit(true)}><Icon name="phone-call" />發出呼叫</AsyncButton>
        </div>
      </Modal>
      {picking && (
        <RecipientsModal initial={rcpt} onClose={() => setPicking(false)}
          onApply={(codes) => { setRcpt(codes); setPicking(false); toast(`已選擇 ${codes.length} 位發送對象`, 'users') }} />
      )}
    </>
  )
}

function BuyersModal({ campaign, buyers, onClose }: { campaign: Campaign; buyers: DealOrder[]; onClose: () => void }) {
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
  const campaigns = useCampaigns()
  const points = usePoints()
  const boutique = useBoutique()
  const dealOrders = useDealOrders()
  const callCampaign = useCallCampaign()
  const del = useDeleteCampaign()
  const nav = useNavigate()
  const [editing, setEditing] = useState<Campaign | 'new' | null>(null)
  const [buyersOf, setBuyersOf] = useState<Campaign | null>(null)
  const buyersFor = (c: Campaign) => campaignBuyers({ boutique: boutique.data!, dealOrders: dealOrders.data! }, c)

  async function call(c: Campaign) {
    if (!c.rcpt.length) return toast('請先於「修改」中選擇呼叫對象', 'alert-circle')
    await callCampaign.mutateAsync({ campaignId: c.id, codes: c.rcpt })
    toast(`已呼叫 ${c.rcpt.length} 位團員 📣`, 'phone-call')
    nav(`/guide/deals/chat/${encodeURIComponent('dg_' + c.id)}`)
  }

  const remove = (c: Campaign) => confirmDialog({
    title: '刪除呼叫訊息？',
    message: c.pub ? `「${c.title}」已呼叫過團員。刪除後已送出的訊息不會收回。` : `「${c.title}」（草稿）將被刪除。`,
    confirmLabel: '刪除', danger: true,
    onConfirm: async () => { await del.mutateAsync(c.id); toast('已刪除呼叫訊息', 'trash') },
  })

  return (
    <>
      <button className="btn btn-primary btn-block" style={{ marginBottom: '1rem' }} onClick={() => setEditing('new')}><Icon name="plus" />新增呼叫訊息</button>
      <QueryState queries={[campaigns, points, boutique, dealOrders]}>{() => campaigns.data!.map((c) => (
        <div className="crud-card" key={c.id}>
          <div className="crud-top"><span className="crud-badge"><Icon name="phone-call" /> 呼叫</span><div className="crud-title">{c.title}</div></div>
          <div className="crud-body">{c.body}</div>
          <div className="crud-meta">
            <Icon name="clock" />{c.time} · {c.pub ? '已呼叫' : '草稿'}{c.rcpt.length ? ` · ${c.rcpt.length} 位團員` : ''}{c.pointId ? ' · ' + pointName({ points: points.data! }, c.pointId) : ''}
          </div>
          <div className="crud-acts">
            {!c.pub && <AsyncButton className="oact pay" onClick={() => call(c)}><Icon name="phone-call" />呼叫</AsyncButton>}
            <button className="oact" onClick={() => setEditing(c)}><Icon name="edit" />修改</button>
            <button className="oact del" onClick={() => remove(c)}><Icon name="trash" />刪除</button>
            <button className="oact buyers" onClick={() => setBuyersOf(c)}><Icon name="users" />選購 ({buyersFor(c).length})</button>
          </div>
        </div>
      ))}</QueryState>
      {editing && <CampaignModal key={editing === 'new' ? 'new' : editing.id} campaign={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {buyersOf && <BuyersModal campaign={buyersOf} buyers={buyersFor(buyersOf)} onClose={() => setBuyersOf(null)} />}
    </>
  )
}

function PointModal({ point, onClose }: { point: GatherPoint | null; onClose: () => void }) {
  const save = useSavePoint()
  const [name, setName] = useState(point?.name || '')
  const [time, setTime] = useState(point?.time || '')
  const [note, setNote] = useState(point?.note || '')

  async function submit() {
    if (!name.trim()) return toast('請輸入地點名稱', 'alert-circle')
    await save.mutateAsync({ ...point, name: name.trim(), time: time.trim(), note: note.trim() })
    toast('集結地點已儲存', 'map-pin-check')
    onClose()
  }

  return (
    <Modal onClose={onClose} title={point ? '修改集結地點' : '新增集結地點'} sub="團購集結地點">
      <Field label="地點名稱"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：飯店大廳 · 一樓服務台" /></Field>
      <Field label="集結時間"><input value={time} onChange={(e) => setTime(e.target.value)} placeholder="例：每日 20:00 - 21:00" /></Field>
      <Field label="備註"><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="其他說明（選填）" /></Field>
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={submit}><Icon name="map-pin-plus" />儲存地點</AsyncButton>
    </Modal>
  )
}

function PointsPane() {
  const points = usePoints()
  const del = useDeletePoint()
  const [editing, setEditing] = useState<GatherPoint | 'new' | null>(null)
  const remove = (p: GatherPoint) => confirmDialog({
    title: '刪除集結地點？', message: `「${p.name}」將被刪除。`, confirmLabel: '刪除', danger: true,
    onConfirm: async () => { await del.mutateAsync(p.id); toast('已刪除集結地點', 'trash') },
  })

  return (
    <>
      <button className="btn btn-primary btn-block" style={{ marginBottom: '1rem' }} onClick={() => setEditing('new')}><Icon name="map-pin-plus" />新增集結地點</button>
      <QueryState queries={[points]}>{() => points.data!.length ? points.data!.map((p) => (
        <div className="crud-card" key={p.id}>
          <div className="crud-top"><span className="crud-badge"><Icon name="map-pin" /></span><div className="crud-title">{p.name}</div></div>
          <div className="crud-meta" style={{ marginTop: 6 }}><Icon name="clock" />{p.time}</div>
          {p.note && <div className="crud-body" style={{ marginTop: 6 }}>{p.note}</div>}
          <div className="crud-acts">
            <button className="oact" onClick={() => setEditing(p)}><Icon name="edit" />修改</button>
            <button className="oact del" onClick={() => remove(p)}><Icon name="trash" />刪除</button>
          </div>
        </div>
      )) : <Empty icon="map-pin" text="尚無集結地點" />}</QueryState>
      {editing && <PointModal key={editing === 'new' ? 'new' : editing.id} point={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function OrdersPane() {
  const dealOrders = useDealOrders()
  const points = usePoints()
  const recon = useSetDealRecon()
  const nav = useNavigate()
  const [status, setStatus] = useState<OrderStatus | '全部'>('全部')
  const [point, setPoint] = useState('全部')

  const toggleRecon = async (o: DealOrder) => {
    await recon.mutateAsync({ orderId: o.id, recon: !o.recon })
    toast(!o.recon ? '已完成勾稽 ✓' : '已取消勾稽')
  }

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
          {points.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <QueryState queries={[dealOrders, points]}>{() => (
      <StatusGroups rows={dealOrders.data!.filter((o) => point === '全部' || o.pointId === point)} filter={status} onFilter={setStatus} people={(g) => new Set(g.map((o) => o.code)).size}
        render={(o) => (
          <div className={`order-row top ${o.status === '已取消' ? 'cancelled' : ''}`} key={o.id}>
            <div className="order-main">
              <div className="order-name">{o.product}</div>
              <div className="order-sub">{o.member} · 數量 {o.qty} · NT$ {fmt(o.amount)}</div>
              <div className="order-sub"><Icon name="calendar" /> {o.date} · {o.tour}</div>
              <div className="order-sub"><Icon name="map-pin" /> {pointName({ points: points.data! }, o.pointId)}</div>
            </div>
            <div className="order-side">
              <span className={`ostatus ${ostatusClass(o.status)}`}>{o.status}</span>
              <AsyncButton className={`recon ${o.recon ? 'done' : ''}`} onClick={() => toggleRecon(o)}><Icon name={o.recon ? 'checkbox' : 'square'} />{o.recon ? '已勾稽' : '勾稽'}</AsyncButton>
              <button className="oact pay" onClick={() => callMember(o)}><Icon name="phone-call" />呼叫團員</button>
            </div>
          </div>
        )} />
      )}</QueryState>
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
