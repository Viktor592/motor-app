import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminPage       from './pages/AdminPage';
import PnlPage         from './pages/PnlPage';
import WarehousePage   from './pages/WarehousePage';
import FinancePage     from './pages/FinancePage';
import BookingsPage    from './pages/BookingsPage';
import ReportPage      from './pages/ReportPage';
import IntegrationPage from './pages/IntegrationPage';
import SettingsPage    from './pages/SettingsPage';
import EdoPage         from './pages/EdoPage';
import PlansPage       from './pages/PlansPage';
import OrdersPage      from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ChatPage        from './pages/ChatPage';
import ProfilePage     from './pages/ProfilePage';
import DiagnosticsPage from './pages/DiagnosticsPage';

const SAAS_URL = import.meta.env.VITE_SAAS_URL ?? 'http://localhost:3004';

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  const role  = localStorage.getItem('user_role');
  if (!token || role !== 'ADMIN') { window.location.href = SAAS_URL; return null; }
  return <>{children}</>;
}

const wrap = (el: React.ReactNode) => <RequireAdmin>{el}</RequireAdmin>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                         element={wrap(<AdminPage />)} />
        <Route path="/admin"                    element={wrap(<AdminPage />)} />
        <Route path="/analytics/pnl"            element={wrap(<PnlPage />)} />
        <Route path="/warehouse"                element={wrap(<WarehousePage />)} />
        <Route path="/finance"                  element={wrap(<FinancePage />)} />
        <Route path="/bookings"                 element={wrap(<BookingsPage />)} />
        <Route path="/report"                   element={wrap(<ReportPage />)} />
        <Route path="/integration"              element={wrap(<IntegrationPage />)} />
        <Route path="/settings"                 element={wrap(<SettingsPage />)} />
        <Route path="/edo"                      element={wrap(<EdoPage />)} />
        <Route path="/plans"                    element={wrap(<PlansPage />)} />
        <Route path="/orders"                   element={wrap(<OrdersPage />)} />
        <Route path="/orders/:id"               element={wrap(<OrderDetailPage />)} />
        <Route path="/orders/:id/diagnostics"   element={wrap(<DiagnosticsPage />)} />
        <Route path="/chat"                     element={wrap(<ChatPage />)} />
        <Route path="/profile"                  element={wrap(<ProfilePage />)} />
        <Route path="*"                         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
