import type { Role } from '../../api/auth'
import type { IconName } from '../../components'

export interface PortalMeta {
  role: Role
  path: string
  label: string
  en: string
  icon: IconName
  /** 是否開放自行註冊（領隊導遊、後台由管理員建立帳號） */
  allowRegister: boolean
}

export const PORTALS: Record<Role, PortalMeta> = {
  admin: { role: 'admin', path: '/admin', label: '後台管理', en: 'Admin Console', icon: 'shield-lock', allowRegister: false },
  guide: { role: 'guide', path: '/guide', label: '領隊導遊', en: 'Guide Console', icon: 'compass', allowRegister: false },
  traveler: { role: 'traveler', path: '/traveler', label: '團員', en: 'Traveler', icon: 'plane-tilt', allowRegister: true },
  partner: { role: 'partner', path: '/partner', label: '支援店家', en: 'Partner Store', icon: 'building-store', allowRegister: true },
}

/* 上次進入的入口（「/」依此導向） */
const LAST_KEY = 'last_portal'

export function rememberPortal(role: Role) {
  try { localStorage.setItem(LAST_KEY, role) } catch { /* ignore */ }
}

export function lastPortal(): Role | null {
  try { return localStorage.getItem(LAST_KEY) as Role | null } catch { return null }
}
