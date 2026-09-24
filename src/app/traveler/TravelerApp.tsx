import { Navigate, Route, Routes } from 'react-router-dom'
import { useTitle } from '../../lib/useTitle'
import PortalGate from '../auth/PortalGate'
import './traveler.css'
import Layout from './Layout'
import { TravelerProvider } from './store'
import Chat from './pages/Chat'
import Explore, { TourDetail } from './pages/Explore'
import { BoutiquePage, Epidemic, GroupBuy, History, Notices, Orders } from './pages/Extras'
import Home from './pages/Home'
import Me, { Password, Profile } from './pages/Me'
import MyTours from './pages/MyTours'
import Ongoing from './pages/Ongoing'

/* 團員入口：掛載於 /traveler/* */
export default function TravelerApp() {
  useTitle('TravelAssistant — 團員 Traveler')
  return (
    <PortalGate role="traveler">
      <div className="portal-traveler">
        <TravelerProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="explore" element={<Explore />} />
              <Route path="tours/:id" element={<TourDetail />} />
              <Route path="my-tours" element={<MyTours />} />
              <Route path="my-tours/:tourId" element={<Ongoing />} />
              <Route path="chat" element={<Chat />} />
              <Route path="me" element={<Me />} />
              <Route path="profile" element={<Profile />} />
              <Route path="password" element={<Password />} />
              <Route path="notices" element={<Notices />} />
              <Route path="epidemic" element={<Epidemic />} />
              <Route path="groupbuy" element={<GroupBuy />} />
              <Route path="boutique" element={<BoutiquePage />} />
              <Route path="orders" element={<Orders />} />
              <Route path="history" element={<History />} />
              <Route path="*" element={<Navigate to="/traveler" replace />} />
            </Route>
          </Routes>
        </TravelerProvider>
      </div>
    </PortalGate>
  )
}
