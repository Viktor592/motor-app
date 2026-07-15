import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout            from './layouts/AppLayout';
import ExecOrdersPage       from './pages/ExecOrdersPage';
import MasterAnalyticsPage  from './pages/MasterAnalyticsPage';
import ProfilePage          from './pages/ProfilePage';
import OrderDetailPage      from './pages/OrderDetailPage';
import DiagnosticsPage      from './pages/DiagnosticsPage';
import LoginPage            from './pages/LoginPage';

const STAFF_ROLES = ['MASTER', 'RECEPTIONIST'];

function Guard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('motor_access');
  const role  = localStorage.getItem('motor_user_role') ?? '';
  if (!token || !STAFF_ROLES.includes(role)) { window.location.replace('/login'); return null; }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <Guard>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/"                       element={<ExecOrdersPage />} />
                <Route path="/orders"                 element={<ExecOrdersPage />} />
                <Route path="/orders/:id"             element={<OrderDetailPage />} />
                <Route path="/orders/:id/diagnostics" element={<DiagnosticsPage />} />
                <Route path="/analytics"              element={<MasterAnalyticsPage />} />
                <Route path="/profile"                element={<ProfilePage />} />
                <Route path="*"                       element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Guard>
        } />
      </Routes>
    </BrowserRouter>
  );
}
