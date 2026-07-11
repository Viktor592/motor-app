import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout       from './layouts/AppLayout';
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
import StaffPage       from './pages/StaffPage';
import OrdersPage      from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import DiagnosticsPage from './pages/DiagnosticsPage';
import ChatPage        from './pages/ChatPage';
import ProfilePage     from './pages/ProfilePage';
import OwnerLoginPage      from './pages/OwnerLoginPage';
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import SuperAdminTenantsPage from './pages/SuperAdminTenantsPage';

function Guard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('motor_access');
  const role  = localStorage.getItem('motor_user_role');
  if (!token || (role !== 'ADMIN' && role !== 'SUPERADMIN')) { window.location.replace('/owner/login'); return null; }
  return <>{children}</>;
}

function RoleRouter() {
  const role = localStorage.getItem('motor_user_role');
  if (role === 'SUPERADMIN') {
    return (
      <Routes>
        <Route path="/" element={<SuperAdminTenantsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/"                         element={<AdminPage />} />
        <Route path="/pnl"                      element={<PnlPage />} />
        <Route path="/warehouse"                element={<WarehousePage />} />
        <Route path="/finance"                  element={<FinancePage />} />
        <Route path="/bookings"                 element={<BookingsPage />} />
        <Route path="/report"                   element={<ReportPage />} />
        <Route path="/integration"              element={<IntegrationPage />} />
        <Route path="/settings"                 element={<SettingsPage />} />
        <Route path="/edo"                      element={<EdoPage />} />
        <Route path="/plans"                    element={<PlansPage />} />
        <Route path="/staff"                    element={<StaffPage />} />
        <Route path="/orders"                   element={<OrdersPage />} />
        <Route path="/orders/:id"               element={<OrderDetailPage />} />
        <Route path="/orders/:id/diagnostics"   element={<DiagnosticsPage />} />
        <Route path="/chat"                     element={<ChatPage />} />
        <Route path="/profile"                  element={<ProfilePage />} />
        <Route path="*"                         element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/owner/login" element={<OwnerLoginPage />} />
        <Route path="/admin/login" element={<SuperAdminLoginPage />} />
        <Route path="/*" element={<Guard><RoleRouter /></Guard>} />
      </Routes>
    </BrowserRouter>
  );
}
