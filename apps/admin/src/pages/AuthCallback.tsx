import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

/** Принимает токены из URL (переданы с saas), сохраняет в свой localStorage и редиректит на главную */
export default function AuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const access = params.get('access');

  useEffect(() => {
    if (!access) return;
    localStorage.setItem('motor_access',  access);
    localStorage.setItem('motor_refresh', params.get('refresh') ?? '');
    localStorage.setItem('motor_user_id',   params.get('id')    ?? '');
    localStorage.setItem('motor_user_name', params.get('name')  ?? '');
    localStorage.setItem('motor_user_role', params.get('role')  ?? '');
    localStorage.setItem('motor_user_phone',params.get('phone') ?? '');
    window.location.replace('/');
  }, []);

  if (!access) return <Navigate to="/" replace />;
  return null;
}
