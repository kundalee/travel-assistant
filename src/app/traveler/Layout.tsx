import { useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '../../components'
import { useTraveler } from './store'

/* 底部分頁；match 為該分頁涵蓋的子畫面路徑前綴 */
const TABS: { path: string; icon: IconName; label: string; match: string[] }[] = [
  { path: '/traveler', icon: 'home', label: '首頁', match: [] },
  { path: '/traveler/explore', icon: 'map-search', label: '探索', match: ['/traveler/explore', '/traveler/tours/'] },
  { path: '/traveler/my-tours', icon: 'calendar', label: '我的行程', match: ['/traveler/my-tours'] },
  { path: '/traveler/chat', icon: 'messages', label: '聊天', match: ['/traveler/chat'] },
  { path: '/traveler/me', icon: 'user', label: '我的', match: ['/traveler/me', '/traveler/profile', '/traveler/orders', '/traveler/history', '/traveler/password'] },
]

export default function Layout() {
  const { user, ready, data } = useTraveler()
  const nav = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])

  if (!ready || !user) return null

  const unread = data.notis.filter((n) => !n.read).length
  const isActive = (t: (typeof TABS)[number]) =>
    t.match.length ? t.match.some((m) => pathname.startsWith(m)) : pathname === '/traveler' || pathname === '/traveler/'

  return (
    <>
      <div className="topnav">
        <div className="brand" onClick={() => nav('/traveler')}>
          <div className="brand-icon"><Icon name="plane-tilt" /></div>
          <div className="brand-name">團員<small>TravelAssistant</small></div>
        </div>
        <div className="top-actions">
          <button className="icon-btn" onClick={() => nav('/traveler/notices')} aria-label="公告">
            <Icon name="bell" />{unread > 0 && <span className="badge-dot">{unread}</span>}
          </button>
          <button className="icon-btn" onClick={() => nav('/traveler/me')} aria-label="我的"><Icon name="user-circle" /></button>
        </div>
      </div>

      <main className="app"><Outlet /></main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <Link key={t.path} to={t.path} className={`tab ${isActive(t) ? 'active' : ''}`}><Icon name={t.icon} />{t.label}</Link>
        ))}
      </nav>
    </>
  )
}
