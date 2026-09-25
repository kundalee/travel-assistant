import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addLine, Icon, QueryState, toast, type IconName } from '../../../components'
import { AlbumModal, BoutiqueCard, CatalogCard, GroupBuyCard, NoticeCard, Screen, SectionTitle } from '../components'
import { useBoutique, useCatalog, useGroupBuy, useHistoryTours, useNotices, useProfile, useTrips } from '../queries'
import { useGbCart } from '../store'
import type { GroupBuyItem, TravelerData } from '../../../api/types/traveler'
import { MyTourCard } from './MyTours'

export default function Home() {
  const profile = useProfile()
  const trips = useTrips()
  const notices = useNotices()
  const boutique = useBoutique()
  const groupbuy = useGroupBuy()
  const catalog = useCatalog()
  const historyTours = useHistoryTours()
  return (
    <Screen>
      <QueryState queries={[profile, trips, notices, boutique, groupbuy, catalog, historyTours]}>{() => (
        <HomeView data={{
          name: profile.data!.name, upcoming: trips.data!.upcoming, notices: notices.data!, boutique: boutique.data!,
          groupbuy: groupbuy.data!, catalog: catalog.data!, historyTours: historyTours.data!,
        }} />
      )}</QueryState>
    </Screen>
  )
}

function HomeView({ data }: { data: { name: string } & Pick<TravelerData, 'upcoming' | 'notices' | 'boutique' | 'groupbuy' | 'catalog' | 'historyTours'> }) {
  const [, setGbCart] = useGbCart()
  const nav = useNavigate()
  const [album, setAlbum] = useState<string | null>(null)
  const upcoming = data.upcoming[0]
  const daily = data.notices.filter((n) => n.type === '每日公告').slice(0, 2)
  const general = data.notices.filter((n) => n.type === '一般公告').slice(0, 1)

  const quick: [IconName, string, () => void][] = [
    ['map-search', '探索行程', () => nav('/traveler/explore')],
    ['messages', '團員聊天', () => nav('/traveler/chat')],
    ['speakerphone', '公告', () => nav('/traveler/notices')],
    ['discount', '團購搶好康', () => nav('/traveler/groupbuy')],
    ['shield-check', '防疫監控', () => nav('/traveler/epidemic')],
    ['history', '歷史行程', () => nav('/traveler/history')],
    ['photo', '團員相簿', () => setAlbum(data.historyTours[0]?.title || '團員相簿')],
  ]

  function addGroupBuy(g: GroupBuyItem) {
    setGbCart((c) => addLine(c, { id: g.id, name: g.name, price: g.price }))
    toast('已加入購物車：' + g.name, 'shopping-cart-plus')
    nav('/traveler/groupbuy')
  }

  return (
    <>
      <div className="pad">
        <div style={{ marginBottom: '1.25rem' }}>
          <p className="muted" style={{ fontSize: 13 }}>歡迎回來 👋</p>
          <h2 className="page-title" style={{ fontSize: '1.5rem', marginBottom: 0 }}>{data.name || '團員'}</h2>
        </div>

        <SectionTitle icon="plane-departure" more="我的行程" onMore={() => nav('/traveler/my-tours')}>即將出發</SectionTitle>
        <div className="stack" style={{ marginBottom: '1.5rem' }}>
          {upcoming ? <MyTourCard kind="upcoming" trip={upcoming} /> : (
            <div className="card empty-card">
              <Icon name="plane-off" /><p>尚無即將出發的行程</p>
              <button className="btn btn-primary btn-sm" onClick={() => nav('/traveler/explore')}>探索行程</button>
            </div>
          )}
        </div>

        <SectionTitle icon="bolt">快速功能</SectionTitle>
        <div className="quick-grid">
          {quick.map(([icon, label, go]) => (
            <button key={label} className="card tap quick-btn" onClick={go}><Icon name={icon} /><span>{label}</span></button>
          ))}
        </div>

        <SectionTitle icon="speakerphone" more="全部" onMore={() => nav('/traveler/notices')}>公告</SectionTitle>
        <div className="stack" style={{ marginBottom: '1.5rem' }}>
          <div className="notice-group accent"><Icon name="speakerphone" />每日公告 · 領隊導遊發佈</div>
          {daily.map((n) => <NoticeCard key={n.title} n={n} />)}
          <div className="notice-group"><Icon name="building" />一般公告 · 旅行社發佈</div>
          {general.map((n) => <NoticeCard key={n.title} n={n} />)}
        </div>

        <SectionTitle icon="diamond" more="看更多" onMore={() => nav('/traveler/boutique')}>精品好物</SectionTitle>
        <div className="stack" style={{ marginBottom: '1.5rem' }}>{data.boutique.slice(0, 2).map((b) => <BoutiqueCard key={b.name} b={b} />)}</div>

        <SectionTitle icon="discount" more="看更多" onMore={() => nav('/traveler/groupbuy')}>團購搶好康</SectionTitle>
        <div className="stack" style={{ marginBottom: '1.5rem' }}>{data.groupbuy.slice(0, 2).map((g) => <GroupBuyCard key={g.id} g={g} onAdd={() => addGroupBuy(g)} />)}</div>

        <SectionTitle icon="sparkles" more="看更多" onMore={() => nav('/traveler/explore')}>推薦行程</SectionTitle>
        <div className="stack">{data.catalog.slice(0, 3).map((t) => <CatalogCard key={t.id} t={t} />)}</div>
      </div>
      {album && <AlbumModal name={album} onClose={() => setAlbum(null)} />}
    </>
  )
}
