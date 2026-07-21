import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout       from './layouts/AppLayout';
import HomePage        from './pages/HomePage';
import BookingPage     from './pages/BookingPage';
import OrdersPage      from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import PartsPage       from './pages/PartsPage';
import ChatPage        from './pages/ChatPage';
import ProfilePage     from './pages/ProfilePage';
import LoginPage       from './pages/LoginPage';

function Guard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('motor_access');
  const role  = localStorage.getItem('motor_user_role');
  if (!token || role !== 'CLIENT') { window.location.replace('/login'); return null; }
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
                <Route path="/"           element={<HomePage />} />
                <Route path="/booking"    element={<BookingPage />} />
                <Route path="/orders"     element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/parts"      element={<PartsPage />} />
                <Route path="/chat"       element={<ChatPage />} />
                <Route path="/chat/:orderId" element={<ChatPage />} />
                <Route path="/profile"    element={<ProfilePage />} />
                <Route path="*"           element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Guard>
        } />
      </Routes>
    </BrowserRouter>
  );
}
