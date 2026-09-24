import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Empty, Icon, SearchBox } from '../../../components'
import { includesQ } from '../../../lib/utils'
import { MemberRow, SubHead } from '../components'
import { allPastMembers, rosterOf, tourCount, tourTitle } from '../helpers'
import { useGuide } from '../store'

type Field = '全部' | '依行程' | '依團名'

/* 我的歷史團員：/guide/past-members */
export function PastMembers() {
  const { data } = useGuide()
  const [q, setQ] = useState('')
  const [field, setField] = useState<Field>('全部')
  const [value, setValue] = useState('')

  let list = allPastMembers(data)
  if (field === '依行程' && value) list = list.filter((m) => m.tourId === value)
  if (field === '依團名' && value) list = list.filter((m) => m.batch === value)
  list = list.filter((m) => includesQ([m.name, m.email, m.nick, m.code, m.tourTitle, m.batch], q))

  return (
    <section className="screen active">
      <SubHead title="我的歷史團員" back="/guide/me" />
      <div className="pad">
        <div className="filt-row"><SearchBox value={q} onChange={setQ} placeholder="全文檢索：姓名 / email / 暱稱 / 團編號" /></div>
        <div className="filt-row">
          <select className="filt" value={field} onChange={(e) => { setField(e.target.value as Field); setValue('') }}>
            <option value="全部">查詢：全部</option><option value="依行程">依行程</option><option value="依團名">依團名</option>
          </select>
          {field !== '全部' && (
            <select className="filt" value={value} onChange={(e) => setValue(e.target.value)}>
              <option value="">全部{field === '依行程' ? '行程' : '團名'}</option>
              {data.pastTours.map((t) => field === '依行程'
                ? <option key={t.tourId} value={t.tourId}>{t.title}</option>
                : <option key={t.batch} value={t.batch}>{t.title} · {t.batch}</option>)}
            </select>
          )}
        </div>
        <div className="data-note"><Icon name="users" />共 {list.length} 位團員</div>
        <div className="stack">{list.length ? list.map((m) => <MemberRow key={m.code} m={m} q={q} />) : <Empty icon="user-off" text="查無團員" />}</div>
      </div>
    </section>
  )
}

/* 單一行程團員名冊：/guide/roster/:tourId */
export function Roster() {
  const { tourId = '' } = useParams()
  const { data } = useGuide()
  const [q, setQ] = useState('')
  const title = tourTitle(data, tourId)
  if (!title) return <Navigate to="/guide/tours" replace />

  const list = rosterOf(data, tourId, tourCount(data, tourId)).filter((m) => includesQ([m.name, m.email, m.nick, m.code], q))

  return (
    <section className="screen active">
      <SubHead title={`${title} · 團員名冊`} back="/guide/tours" />
      <div className="pad">
        <div className="filt-row"><SearchBox value={q} onChange={setQ} placeholder="搜尋姓名 / email / 暱稱 / 團編號" /></div>
        <div className="data-note"><Icon name="users" />共 {list.length} 位團員</div>
        <div className="stack">{list.length ? list.map((m) => <MemberRow key={m.code} m={m} q={q} />) : <Empty icon="user-off" text="查無團員" />}</div>
      </div>
    </section>
  )
}
