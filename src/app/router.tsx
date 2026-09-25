import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { USE_FAKE } from '../api/client'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { lastPortal, PORTALS } from './auth/portals'
import { queryClient } from './queryClient'

/* 各入口按需載入（程式碼與樣式各自分包）；每個入口自行檢查身分並顯示登入視窗 */
const AdminApp = lazy(() => import('./admin/AdminApp'))
const GuideApp = lazy(() => import('./guide/GuideApp'))
const TravelerApp = lazy(() => import('./traveler/TravelerApp'))
const PartnerApp = lazy(() => import('./partner/PartnerApp'))
/* 開發用：假後端模式才載入 API 面板 */
const ApiPanel = lazy(() => import('./dev/ApiPanel'))

/* 「/」：已登入 → 上次使用（或第一個）具備身分的入口；未登入 → 團員入口 */
function RootRedirect() {
  const { user, ready } = useAuth()
  if (!ready) return null
  const last = lastPortal()
  const role = user ? (last && user.roles.includes(last) ? last : user.roles[0]) : 'traveler'
  return <Navigate to={PORTALS[role].path} replace />
}

export default function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="/guide/*" element={<GuideApp />} />
            <Route path="/traveler/*" element={<TravelerApp />} />
            <Route path="/partner/*" element={<PartnerApp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {USE_FAKE && <ApiPanel />}
        </Suspense>
      </AuthProvider>
    </QueryClientProvider>
  )
}
