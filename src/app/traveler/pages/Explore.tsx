import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AsyncButton, Chips, Empty, Field, Icon, Modal, QueryState, SearchBox, Tabs, toast } from '../../../components'
import { fmt, includesQ } from '../../../lib/utils'
import { CatalogCard, PageTitle, RadioCards, Screen, SubHead } from '../components'
import { useBook, useCatalog, useProfile } from '../queries'
import type { CatalogTour, PayMethod, TravelerProfile } from '../../../api/types/traveler'

export default function Explore() {
  const catalog = useCatalog()
  return (
    <Screen>
      <div className="pad">
        <PageTitle>探索行程</PageTitle>
        <QueryState queries={[catalog]}>{() => <CatalogList catalog={catalog.data!} />}</QueryState>
      </div>
    </Screen>
  )
}

function CatalogList({ catalog }: { catalog: CatalogTour[] }) {
  const [q, setQ] = useState('')
  const [region, setRegion] = useState('全部')
  const [tag, setTag] = useState('全部')
  const regions = ['全部', ...new Set(catalog.map((t) => t.region))]
  const tags = ['全部', ...new Set(catalog.flatMap((t) => t.tags))]
  const list = catalog.filter((t) =>
    (region === '全部' || t.region === region) && (tag === '全部' || t.tags.includes(tag)) && includesQ([t.title, t.dest], q))

  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="搜尋目的地或行程名稱…" />
      <Chips value={region} onChange={setRegion} items={regions.map((r) => [r, r])} />
      <Chips value={tag} onChange={setTag} items={tags.map((t) => [t, t])} />
      <div className="stack">
        {list.length ? list.map((t) => <CatalogCard key={t.id} t={t} />) : <Empty icon="map-off" text="查無符合行程" hint="試試其他關鍵字或篩選條件" />}
      </div>
    </>
  )
}

type BookPay = Extract<PayMethod, 'card' | 'atm' | 'cvs'>
const BOOK_PAY: { key: BookPay; icon: 'credit-card' | 'building-bank' | 'building-store'; title: string; desc: string }[] = [
  { key: 'card', icon: 'credit-card', title: '信用卡', desc: 'VISA / Master / JCB 線上刷卡' },
  { key: 'atm', icon: 'building-bank', title: 'ATM 轉帳', desc: '取得虛擬帳號，3 日內完成轉帳' },
  { key: 'cvs', icon: 'building-store', title: '超商付款', desc: '四大超商代碼繳費' },
]

/* 表單以個人資料預填，需等個人資料載入後才顯示 */
function BookingModal({ tour, onClose }: { tour: CatalogTour; onClose: () => void }) {
  const profile = useProfile()
  return (
    <Modal onClose={onClose} title="線上報名" sub={`${tour.title} · ${tour.dates}`}>
      <QueryState queries={[profile]}>{() => <BookingForm tour={tour} p={profile.data!} onClose={onClose} />}</QueryState>
    </Modal>
  )
}

function BookingForm({ tour, p, onClose }: { tour: CatalogTour; p: TravelerProfile; onClose: () => void }) {
  const book = useBook()
  const nav = useNavigate()
  const [f, setF] = useState({ name: p.name, phone: p.phone, nationalId: '', passport: p.passport, needs: '' })
  const [pay, setPay] = useState<BookPay>('card')
  const [err, setErr] = useState('')
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  /* 行程由後端建立（報名編號、QR、集合資訊） */
  async function submit() {
    if (!f.name.trim() || !f.phone.trim()) return setErr('請填寫姓名與手機。')
    await book.mutateAsync({ tourId: tour.id, ...f, pay })
    toast('報名成功！付款方式：' + BOOK_PAY.find((x) => x.key === pay)!.title)
    onClose()
    nav('/traveler/my-tours?tab=upcoming')
  }

  return (
    <>
      {err && <div className="alert err show"><Icon name="alert-circle" /><span>{err}</span></div>}
      <div className="section-title sm"><Icon name="user" />旅客資料</div>
      <div className="row-2">
        <Field label={<>姓名 <span className="req">*</span></>}><input value={f.name} onChange={set('name')} /></Field>
        <Field label={<>手機 <span className="req">*</span></>}><input type="tel" value={f.phone} onChange={set('phone')} /></Field>
      </div>
      <div className="row-2">
        <Field label="身分證字號"><input value={f.nationalId} onChange={set('nationalId')} /></Field>
        <Field label="護照號碼"><input value={f.passport} onChange={set('passport')} /></Field>
      </div>
      <Field label="特殊需求 / 飲食"><textarea value={f.needs} onChange={set('needs')} placeholder="素食、行動不便、過敏原…" /></Field>
      <div className="section-title sm"><Icon name="credit-card" />付款方式</div>
      <RadioCards options={BOOK_PAY} value={pay} onChange={setPay} />
      <div className="total-row"><span>應付金額</span><b>NT$ {fmt(tour.price)}</b></div>
      <AsyncButton className="btn btn-primary btn-block btn-lg" onClick={submit}><Icon name="check" />確認報名</AsyncButton>
      <p className="hint" style={{ textAlign: 'center', marginTop: '0.75rem' }}>送出後可於「我的行程」查看，此為報名流程展示，未進行實際扣款。</p>
    </>
  )
}

type DetailTab = 'feat' | 'itin' | 'incl'

/* 行程詳情：/traveler/tours/:id */
export function TourDetail() {
  const { id } = useParams()
  const catalog = useCatalog()
  return (
    <QueryState queries={[catalog]}>{() => {
      const t = catalog.data!.find((x) => x.id === id)
      return t ? <TourDetailView t={t} /> : <Navigate to="/traveler/explore" replace />
    }}</QueryState>
  )
}

function TourDetailView({ t }: { t: CatalogTour }) {
  const [tab, setTab] = useState<DetailTab>('feat')
  const [booking, setBooking] = useState(false)

  return (
    <Screen>
      <SubHead title={t.title} back="/traveler/explore" />
      <div className="detail-hero"><img src={t.img} alt={t.title} /><span className="region">{t.region}</span></div>
      <div className="pad">
        <h2 className="detail-title">{t.title}</h2>
        <div className="meta-row"><Icon name="map-pin" />{t.dest}</div>
        <div className="meta-row"><Icon name="calendar" />{t.dates}</div>
        <div className="meta-row"><Icon name="user-star" />領隊導遊：{t.guide}</div>
        <div className="tags" style={{ margin: '12px 0 16px' }}>{t.tags.map((x) => <span className="tag" key={x}>{x}</span>)}</div>

        <Tabs<DetailTab> value={tab} onChange={setTab} tabs={[['feat', '特色'], ['itin', '行程表'], ['incl', '費用說明']]} />
        {tab === 'feat' && t.highlights.map((h) => <div className="incl-item" key={h}><Icon name="circle-check" className="yes" />{h}</div>)}
        {tab === 'itin' && t.itin.map(([day, text]) => (
          <div className="itin-item" key={day}>
            <div className="itin-day">{day.replace('Day ', 'D')}</div>
            <div><strong className="itin-label">{day}</strong><p className="itin-text">{text}</p></div>
          </div>
        ))}
        {tab === 'incl' && t.incl.map((i) => (
          <div className="incl-item" key={i.text}>
            <Icon name={i.included ? 'circle-check' : 'circle-x'} className={i.included ? 'yes' : 'no'} />
            <span style={{ flex: 1 }}>{i.text}</span>
            <span className={i.included ? 'incl-yes' : 'demo-tag'}>{i.included ? '含' : '不含'}</span>
          </div>
        ))}

        <div className="price-bar">
          <div><span className="muted" style={{ fontSize: 12 }}>每人</span><div className="price-big">NT$ {fmt(t.price)}</div></div>
          <button className="btn btn-primary btn-lg" onClick={() => setBooking(true)}><Icon name="writing-sign" />立即報名</button>
        </div>
      </div>
      {booking && <BookingModal tour={t} onClose={() => setBooking(false)} />}
    </Screen>
  )
}
