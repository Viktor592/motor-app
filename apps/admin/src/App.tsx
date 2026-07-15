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
import PromotionsPage  from './pages/PromotionsPage';
import OrdersPage      from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import DiagnosticsPage from './pages/DiagnosticsPage';
import ProfilePage     from './pages/ProfilePage';
import OwnerLoginPage      from './pages/OwnerLoginPage';
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import SuperAdminLayout    from './pages/SuperAdminLayout';
import SuperAdminTenantsPage from './pages/SuperAdminTenantsPage';
import SuperAdminTenantDetailPage from './pages/SuperAdminTenantDetailPage';
import SuperAdminUsersPage from './pages/SuperAdminUsersPage';
import SuperAdminPromotionsPage from './pages/SuperAdminPromotionsPage';

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
        <Route element={<SuperAdminLayout />}>
          <Route path="/"              element={<SuperAdminTenantsPage />} />
          <Route path="/tenants/:id"   element={<SuperAdminTenantDetailPage />} />
          <Route path="/users"         element={<SuperAdminUsersPage />} />
          <Route path="/promotions"    element={<SuperAdminPromotionsPage />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Route>
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
        <Route path="/promotions"               element={<PromotionsPage />} />
        <Route path="/orders"                   element={<OrdersPage />} />
        <Route path="/orders/:id"               element={<OrderDetailPage />} />
        <Route path="/orders/:id/diagnostics"   element={<DiagnosticsPage />} />
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
