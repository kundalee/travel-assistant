import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '../../components'
import { useAuth } from '../auth/AuthProvider'
import { useAdmin } from './store'

type NavItem = [path: string, icon: IconName, label: string]

const NAV: [group: string, items: NavItem[]][] = [
  ['主要', [
    ['', 'layout-dashboard', '總覽'],
    ['users', 'users', '使用者管理'],
    ['tours', 'map-2', '行程管理'],
    ['orders', 'receipt', '訂單管理'],
  ]],
  ['供應與商品', [
    ['vendors', 'building-warehouse', '支援店家管理'],
    ['products', 'package', '商品資料管理'],
    ['places', 'map-pin', '旅遊地點'],
  ]],
  ['營運', [
    ['announcements', 'speakerphone', '公告管理'],
    ['campaigns', 'discount', '行銷 / 團購'],
    ['bookings', 'clipboard-check', '報名審核'],
    ['reviews', 'star', '評價管理'],
    ['receivable', 'scale', '應收應付款'],
  ]],
  ['分析與系統', [
    ['stats', 'chart-bar', '統計分析報表'],
    ['tracking', 'radar', '及時團體追蹤'],
    ['sales', 'report-money', '月銷售額回傳'],
    ['ai', 'sparkles', 'AI 許願池'],
    ['password', 'lock', '修改密碼'],
  ]],
]

export default function Layout() {
  const { mock } = useAdmin()
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])

  return (
    <>
      <header className="topnav">
        <div className="brand" onClick={() => nav('/admin')}>
          <div className="brand-icon"><Icon name="shield-lock" /></div>
          <div className="brand-name">範例旅行社<small>TRAVELASSISTANT · 後台管理</small></div>
        </div>
        <div className="top-actions">
          <span className={`conn-chip ${mock ? '' : 'on'}`}>{mock ? '展示' : '已連線'}</span>
          <div className="top-user"><Icon name="user-circle" /><span>{user?.name}</span></div>
          <button className="icon-btn" onClick={logout} aria-label="登出"><Icon name="logout" /></button>
        </div>
      </header>

      <div className="shell">
        <aside className="sidebar">
          <nav className="side-nav">
            {NAV.map(([group, items]) => (
              <div key={group}>
                <div className="side-group">{group}</div>
                {items.map(([path, icon, label]) => (
                  <NavLink
                    key={path} to={path ? `/admin/${path}` : '/admin'} end={!path}
                    className={({ isActive }) => 'side-item' + (isActive ? ' active' : '')}
                  >
                    <Icon name={icon} /><span>{label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <main className="app">
          <Outlet />
        </main>
      </div>
    </>
  )
}
