import { Navigate, Route, Routes } from 'react-router-dom'
import { useTitle } from '../../lib/useTitle'
import { ConfirmHost, ModalStyle, Toaster } from '../../components'
import PortalGate from '../auth/PortalGate'
import './guide.css'
import Layout from './Layout'
import { DealChat, TourChat } from './pages/Chat'
import Deals from './pages/Deals'
import Home from './pages/Home'
import Income from './pages/Income'
import Manage from './pages/Manage'
import Me from './pages/Me'
import { PastMembers, Roster } from './pages/Members'
import Notifications from './pages/Notifications'
import Tours from './pages/Tours'

/* 領隊導遊入口：掛載於 /guide/* */
export default function GuideApp() {
  useTitle('TravelAssistant — 領隊導遊 Guide')
  return (
    <PortalGate role="guide">
      <div className="portal-guide">
        {/* 領隊的表單與視窗一律置中顯示 */}
        <ModalStyle center>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="tours" element={<Tours />} />
              <Route path="tours/:tourId/manage" element={<Manage />} />
              <Route path="roster/:tourId" element={<Roster />} />
              <Route path="chat/:key" element={<TourChat />} />
              <Route path="deals" element={<Deals />} />
              <Route path="deals/chat/:key" element={<DealChat />} />
              <Route path="income" element={<Income />} />
              <Route path="me" element={<Me />} />
              <Route path="past-members" element={<PastMembers />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="*" element={<Navigate to="/guide" replace />} />
            </Route>
          </Routes>
          <Toaster />
          <ConfirmHost />
        </ModalStyle>
      </div>
    </PortalGate>
  )
}
