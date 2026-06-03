import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import './styles/global.css';

// Layouts
import AuthLayout  from './layouts/AuthLayout';
import AppLayout   from './layouts/AppLayout';

// Pages
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage     from './pages/HomePage';
import BookingPage  from './pages/BookingPage';
import OrdersPage   from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ChatPage     from './pages/ChatPage';
import ProfilePage  from './pages/ProfilePage';
import ExecOrdersPage   from './pages/ExecOrdersPage';
import DiagnosticsPage  from './pages/DiagnosticsPage';
import AdminPage           from './pages/AdminPage';
import PnlPage            from './pages/PnlPage';
import MasterAnalyticsPage from './pages/MasterAnalyticsPage';
import OnboardingPage      from './pages/OnboardingPage';
import SettingsPage        from './pages/SettingsPage';
import WarehousePage      from './pages/WarehousePage';
import FinancePage        from './pages/FinancePage';

function OnboardingGuard() {
  const navigate = useNavigate();
  React.useEffect(() => {
    fetch('/api/v1/onboarding/status')
      .then(r => r.json())
      .then(d => { if (d.needsOnboarding) navigate('/setup', { replace: true }); })
      .catch(() => {});
  }, []);
  return null;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useSelector((s: RootState) => s.auth.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const token = useSelector((s: RootState) => s.auth.token);
  return !token ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <OnboardingGuard />
      <Routes>
        {/* Онбординг */}
        <Route path='/setup'    element={<OnboardingPage />} />
        <Route path='/settings' element={<SettingsPage />} />
        <Route path='/warehouse' element={<WarehousePage />} />
        <Route path='/finance' element={<FinancePage />} />

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/otp"      element={<RequireGuest><OtpPage /></RequireGuest>} />
          <Route path="/login"    element={<RequireGuest><LoginPage /></RequireGuest>} />
          <Route path="/register" element={<RequireGuest><RegisterPage /></RequireGuest>} />
        </Route>

        {/* App */}
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index                    element={<HomePage />} />
          <Route path="/booking"          element={<BookingPage />} />
          <Route path="/orders"           element={<OrdersPage />} />
          <Route path="/orders/:id"       element={<OrderDetailPage />} />
          <Route path="/chat"             element={<ChatPage />} />
          <Route path="/chat/:orderId"    element={<ChatPage />} />
          <Route path="/profile"          element={<ProfilePage />} />
          <Route path="/exec/orders"           element={<ExecOrdersPage />} />
          <Route path="/orders/:id/diagnostics" element={<DiagnosticsPage />} />
          <Route path="/admin"            element={<AdminPage />} />
          <Route path="/analytics/pnl"   element={<PnlPage />} />
          <Route path="/analytics/master" element={<MasterAnalyticsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
