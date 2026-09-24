import { useEffect, type ReactNode } from 'react'
import type { Role } from '../../api/auth'
import AuthModal from './AuthModal'
import { useAuth } from './AuthProvider'
import { rememberPortal } from './portals'

/* 入口守門：帳號具備該身分才進入，否則顯示共用的登入 / 註冊視窗 */
export default function PortalGate({ role, children }: { role: Role; children: ReactNode }) {
  const { ready, hasRole } = useAuth()
  const allowed = hasRole(role)

  useEffect(() => { if (allowed) rememberPortal(role) }, [allowed, role])

  if (!ready) return null
  return allowed ? <>{children}</> : <AuthModal role={role} />
}
