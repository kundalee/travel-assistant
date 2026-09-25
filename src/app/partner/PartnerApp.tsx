import { Navigate, Route, Routes } from 'react-router-dom'
import { useTitle } from '../../lib/useTitle'
import { ConfirmHost, Toaster } from '../../components'
import PortalGate from '../auth/PortalGate'
import './partner.css'
import Layout from './Layout'
import Cancelled from './pages/Cancelled'
import Home from './pages/Home'
import Income from './pages/Income'
import Profile from './pages/Profile'

/* 支援店家入口：掛載於 /partner/* */
export default function PartnerApp() {
  useTitle('TravelAssistant — 支援店家 Partner')
  return (
    <PortalGate role="partner">
      <div className="portal-partner">
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="income" element={<Income />} />
            <Route path="cancelled" element={<Cancelled />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/partner" replace />} />
          </Route>
        </Routes>
        <Toaster />
        <ConfirmHost />
      </div>
    </PortalGate>
  )
}
