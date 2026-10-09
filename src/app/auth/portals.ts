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

/* 身分（後端的 Role）→ 入口；member = 團員、agent = 支援店家 */
export const PORTALS: Record<Role, PortalMeta> = {
  admin: { role: 'admin', path: '/admin', label: '後台管理', en: 'Admin Console', icon: 'shield-lock', allowRegister: false },
  guide: { role: 'guide', path: '/guide', label: '領隊導遊', en: 'Guide Console', icon: 'compass', allowRegister: false },
  member: { role: 'member', path: '/traveler', label: '團員', en: 'Traveler', icon: 'plane-tilt', allowRegister: true },
  agent: { role: 'agent', path: '/partner', label: '支援店家', en: 'Partner Store', icon: 'building-store', allowRegister: true },
}

/* 上次進入的入口（「/」依此導向） */
const LAST_KEY = 'last_portal'

export function rememberPortal(role: Role) {
  try { localStorage.setItem(LAST_KEY, role) } catch { /* ignore */ }
}

export function lastPortal(): Role | null {
  /* 舊版存的身分名稱（traveler / partner）已不存在，視為沒有 */
  try {
    const r = localStorage.getItem(LAST_KEY)
    return r && r in PORTALS ? (r as Role) : null
  } catch {
    return null
  }
}
