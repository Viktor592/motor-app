import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage           from './pages/HomePage';
import ClientRegisterPage from './pages/ClientRegisterPage';
import OwnerRegisterPage  from './pages/OwnerRegisterPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<HomePage />} />
        <Route path="/register"      element={<ClientRegisterPage />} />
        <Route path="/owner/register" element={<OwnerRegisterPage />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
