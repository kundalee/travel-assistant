import { Navigate, Route, Routes } from 'react-router-dom'
import { useTitle } from '../../lib/useTitle'
import PortalGate from '../auth/PortalGate'
import './admin.css'
import Layout from './Layout'
import { AdminProvider } from './store'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Tours from './pages/Tours'
import Orders from './pages/Orders'
import Vendors from './pages/Vendors'
import Products from './pages/Products'
import Places from './pages/Places'
import Announcements from './pages/Announcements'
import { Bookings, Campaigns, Reviews } from './pages/SimpleLists'
import Receivable from './pages/Receivable'
import Stats from './pages/Stats'
import Tracking from './pages/Tracking'
import Sales from './pages/Sales'
import AiChat from './pages/AiChat'
import Password from './pages/Password'

/* 後台管理入口：掛載於 /admin/* */
export default function AdminApp() {
  useTitle('TravelAssistant — 後台管理 Admin')
  return (
    <PortalGate role="admin">
      <div className="portal-admin">
        <AdminProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="tours" element={<Tours />} />
              <Route path="orders" element={<Orders />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="vendors/:vendorId/products" element={<Products />} />
              <Route path="products" element={<Products />} />
              <Route path="places" element={<Places />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="receivable" element={<Receivable />} />
              <Route path="stats" element={<Stats />} />
              <Route path="tracking" element={<Tracking />} />
              <Route path="sales" element={<Sales />} />
              <Route path="ai" element={<AiChat />} />
              <Route path="password" element={<Password />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
        </AdminProvider>
      </div>
    </PortalGate>
  )
}
