import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon, type IconName } from '../../components'
import { useAuth } from '../auth/AuthProvider'
import { useProfile } from './queries'

/* path '' = 首頁（/partner） */
const NAV: [path: string, icon: IconName, label: string][] = [
  ['', 'home', '首頁'],
  ['income', 'coins', '我的收入'],
  ['cancelled', 'receipt-off', '已取消'],
]

export default function Layout() {
  const { user, logout } = useAuth()
  const profile = useProfile()
  const name = profile.data?.name || user?.name || ''
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])


  const closeMenu = () => setMenuOpen(false)
  const navItem = ({ isActive }: { isActive: boolean }) => 'nav-item' + (isActive ? ' active' : '')
  const links = (onClick?: () => void) => NAV.map(([path, icon, label]) => (
    <NavLink key={path} to={path ? `/partner/${path}` : '/partner'} end={!path} className={navItem} onClick={onClick}><Icon name={icon} />{label}</NavLink>
  ))

  return (
    <>
      <nav>
        <Link className="nav-brand" to="/partner">
          <div className="nav-brand-icon"><Icon name="building-store" /></div>
          <div>支援店家<small>TravelAssistant · Partner</small></div>
        </Link>

        <div className="nav-links">
          {links()}
          <Link className="nav-user" to="/partner/profile">
            <div className="avatar">{(name || user?.email || '店')[0]}</div>
            <span className="name">{name || '店家'}</span>
          </Link>
          <button className="nav-btn ghost" onClick={logout} aria-label="登出"><Icon name="logout" /></button>
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="選單"><Icon name="menu-2" /></button>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="mm-backdrop" onClick={closeMenu} />
        <div className="mm-panel">
          <button className="mm-close" onClick={closeMenu} aria-label="關閉"><Icon name="x" /></button>
          {links(closeMenu)}
          <NavLink to="/partner/profile" className={navItem} onClick={closeMenu}><Icon name="settings" />設定</NavLink>
          <hr />
          <button className="nav-item" onClick={() => { closeMenu(); logout() }}><Icon name="logout" />會員登出</button>
        </div>
      </div>

      <Outlet />
    </>
  )
}
