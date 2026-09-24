import { useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '../../components'
import { useGuide } from './store'

/* 底部分頁；match 為該分頁涵蓋的子畫面路徑前綴 */
const TABS: { path: string; icon: IconName; label: string; match: string[] }[] = [
  { path: '/guide', icon: 'home', label: '首頁', match: [] },
  { path: '/guide/tours', icon: 'calendar', label: '行程', match: ['/guide/tours', '/guide/roster', '/guide/chat'] },
  { path: '/guide/deals', icon: 'discount', label: '團購', match: ['/guide/deals'] },
  { path: '/guide/income', icon: 'wallet', label: '收入', match: ['/guide/income'] },
  { path: '/guide/me', icon: 'user', label: '我的', match: ['/guide/me', '/guide/past-members'] },
]

export default function Layout() {
  const { user, ready, data } = useGuide()
  const nav = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])

  if (!ready || !user) return null
  const unread = data.notis.filter((n) => !n.read).length
  const isActive = (t: (typeof TABS)[number]) =>
    t.match.length ? t.match.some((m) => pathname.startsWith(m)) : pathname === '/guide' || pathname === '/guide/'

  return (
    <>
      <header className="topnav">
        <div className="brand" onClick={() => nav('/guide')}>
          <div className="brand-icon"><Icon name="compass" /></div>
          <div className="brand-name">領隊導遊<small>TRAVELASSISTANT</small></div>
        </div>
        <div className="top-actions">
          <button className="icon-btn" onClick={() => nav('/guide/notifications')} aria-label="通知">
            <Icon name="bell" />{unread > 0 && <span className="badge-dot">{unread}</span>}
          </button>
          <img className="g-avatar" src={user.profile.avatar} alt="我" onClick={() => nav('/guide/me')} />
        </div>
      </header>

      <main className="app"><Outlet /></main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <Link key={t.path} to={t.path} className={`tab ${isActive(t) ? 'active' : ''}`}>
            <Icon name={t.icon} />{t.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
