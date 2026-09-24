import { useState } from 'react'
import { Icon, MapEmbed, PageHead, Tabs } from '../../../components'
import { VITALS, ZONES } from '../../../api/mocks/admin'
import { useAdmin } from '../store'

type Tab = 'groups' | 'vitals' | 'zones'

export default function Tracking() {
  const { data, patch, toast } = useAdmin()
  const [tab, setTab] = useState<Tab>('groups')
  const [idx, setIdx] = useState(0)
  const groups = data.trackingGroups
  const g = groups[idx] || groups[0]

  /* 示範；實務由領隊公司手機定期回傳 GPS 至後端 */
  function refreshLoc() {
    if (!g) return
    patch('trackingGroups', (l) => l.map((x, i) => (i === idx
      ? { ...x, lat: x.lat + (Math.random() - 0.5) * 0.004, lng: x.lng + (Math.random() - 0.5) * 0.004, updated: '剛剛' }
      : x)))
    toast(`已更新 ${g.guide} 的手機定位`, 'current-location')
  }

  return (
    <div className="pad">
      <PageHead icon="radar" title="及時團體追蹤" />
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[['groups', '旅遊團追蹤'], ['vitals', '體溫警示管理'], ['zones', '警戒區域']]} />

      {tab === 'groups' && (
        <>
          <div className="filt-row">
            <select className="filt" style={{ flex: 1 }} value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
              {groups.map((x, i) => <option key={x.tour} value={i}>{x.tour}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={refreshLoc}><Icon name="refresh" />更新定位</button>
          </div>
          {g && (
            <div className="crud-card">
              <div className="crud-top"><span className="crud-badge"><Icon name="device-mobile" /></span><div className="crud-title">{g.tour}</div></div>
              <div className="crud-body">全團位置以<b>領隊／導遊公司手機</b>的 GPS 座標為準，代表整團所在位址。</div>
              <MapEmbed lat={g.lat} lng={g.lng} h={200} />
              <div className="info-grid" style={{ marginTop: 11 }}>
                <div className="info-cell"><div className="k"><Icon name="user" />領隊／導遊</div><div className="v">{g.guide}</div></div>
                <div className="info-cell"><div className="k"><Icon name="phone" />公司手機</div><div className="v" style={{ fontSize: 13 }}>{g.guidePhone}</div></div>
                <div className="info-cell"><div className="k"><Icon name="map-pin" />目前位置</div><div className="v" style={{ fontSize: 13 }}>{g.spot}</div></div>
                <div className="info-cell"><div className="k"><Icon name="world-latitude" />座標</div><div className="v" style={{ fontSize: 12.5 }}>{g.lat.toFixed(5)}, {g.lng.toFixed(5)}</div></div>
              </div>
              <div className="crud-meta" style={{ marginTop: 10 }}><Icon name="clock" />最後回報：{g.updated} · {g.members} 位團員 · {g.continent} / {g.city}</div>
              <div className="crud-acts">
                <a className="oact" href={`https://www.google.com/maps?q=${g.lat},${g.lng}`} target="_blank" rel="noopener"><Icon name="external-link" />在 Google 地圖開啟</a>
                <button className="oact" onClick={() => toast('已匯出 TOCC 格式資料', 'file-export')}><Icon name="file-export" />匯出 TOCC</button>
              </div>
            </div>
          )}
          <div className="section-title sm" style={{ marginTop: '1.1rem' }}><Icon name="list" />所有旅遊團</div>
          {groups.map((x, i) => (
            <div key={x.tour} className={`lrow pick-row ${i === idx ? 'on' : ''}`} onClick={() => setIdx(i)}>
              <div className="lmain">
                <div className="lname">{x.tour}</div>
                <div className="lsub">{x.guide} · {x.spot}</div>
                <div className="lsub2">{x.continent} · {x.city} · {x.members} 人 · {x.dates}</div>
              </div>
              <span className={`rbadge ${x.alert ? 'off' : 'on'}`}>{x.alert ? '警示' : '正常'}</span>
            </div>
          ))}
        </>
      )}

      {tab === 'vitals' && (
        <>
          {VITALS.map((v) => (
            <div className={`lrow ${v.ok ? '' : 'warn-row'}`} key={v.name}>
              <div className="lmain"><div className="lname">{v.name}</div><div className="lsub">體溫 {v.temp}°C · 血壓 {v.bp} mmHg</div></div>
              <span className={`rbadge ${v.ok ? 'on' : 'off'}`}>{v.ok ? '正常' : '體溫警示'}</span>
            </div>
          ))}
          <p className="hint" style={{ marginTop: '0.6rem' }}>團員體溫血壓資訊由團員端回傳（無網路時暫存後補傳）。</p>
        </>
      )}

      {tab === 'zones' && ZONES.map((z) => (
        <div className={`lrow ${z.level === 'warn' ? 'warn-row' : ''}`} key={z.name}>
          <div className="lmain"><div className="lname">{z.name}</div><div className="lsub">{z.note}</div></div>
          <span className={`rbadge ${z.level === 'warn' ? 'off' : 'on'}`}>{z.level === 'warn' ? '警戒' : '安全'}</span>
        </div>
      ))}
    </div>
  )
}
