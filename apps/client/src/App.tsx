import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage      from './pages/HomePage';
import BookingPage   from './pages/BookingPage';
import OrdersPage    from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ChatPage      from './pages/ChatPage';
import ProfilePage   from './pages/ProfilePage';

const SAAS_URL = import.meta.env.VITE_SAAS_URL ?? 'http://localhost:3004';

function RequireClient({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  const role  = localStorage.getItem('user_role');
  if (!token) { window.location.href = SAAS_URL; return null; }
  if (role !== 'CLIENT') { window.location.href = SAAS_URL; return null; }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RequireClient><div /></RequireClient>} />
        <Route path="/"              element={<RequireClient><HomePage /></RequireClient>} />
        <Route path="/booking"       element={<RequireClient><BookingPage /></RequireClient>} />
        <Route path="/orders"        element={<RequireClient><OrdersPage /></RequireClient>} />
        <Route path="/orders/:id"    element={<RequireClient><OrderDetailPage /></RequireClient>} />
        <Route path="/chat"          element={<RequireClient><ChatPage /></RequireClient>} />
        <Route path="/chat/:orderId" element={<RequireClient><ChatPage /></RequireClient>} />
        <Route path="/profile"       element={<RequireClient><ProfilePage /></RequireClient>} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
