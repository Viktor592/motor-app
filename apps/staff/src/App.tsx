import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ExecOrdersPage      from './pages/ExecOrdersPage';
import MasterAnalyticsPage from './pages/MasterAnalyticsPage';
import ChatPage            from './pages/ChatPage';
import ProfilePage         from './pages/ProfilePage';
import OrderDetailPage     from './pages/OrderDetailPage';

const SAAS_URL = import.meta.env.VITE_SAAS_URL ?? 'http://localhost:3004';
const STAFF_ROLES = ['MASTER', 'STAFF'];

function RequireStaff({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  const role  = localStorage.getItem('user_role');
  if (!token || !STAFF_ROLES.includes(role ?? '')) {
    window.location.href = SAAS_URL;
    return null;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<RequireStaff><ExecOrdersPage /></RequireStaff>} />
        <Route path="/orders"         element={<RequireStaff><ExecOrdersPage /></RequireStaff>} />
        <Route path="/orders/:id"     element={<RequireStaff><OrderDetailPage /></RequireStaff>} />
        <Route path="/analytics"      element={<RequireStaff><MasterAnalyticsPage /></RequireStaff>} />
        <Route path="/chat"           element={<RequireStaff><ChatPage /></RequireStaff>} />
        <Route path="/chat/:orderId"  element={<RequireStaff><ChatPage /></RequireStaff>} />
        <Route path="/profile"        element={<RequireStaff><ProfilePage /></RequireStaff>} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
