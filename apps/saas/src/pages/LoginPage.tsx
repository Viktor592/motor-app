import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import s from '../styles/Auth.module.css';

const APP_URLS: Record<string, string> = {
  CLIENT: import.meta.env.VITE_CLIENT_URL ?? 'http://localhost:3001',
  ADMIN:  import.meta.env.VITE_ADMIN_URL  ?? 'http://localhost:3003',
  MASTER: import.meta.env.VITE_STAFF_URL  ?? 'http://localhost:3002',
  STAFF:  import.meta.env.VITE_STAFF_URL  ?? 'http://localhost:3002',
};

export default function LoginPage() {
  const [phone, setPhone]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fmt = (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (!digits) return '';
    const n = digits.startsWith('7') ? digits : digits.startsWith('8') ? '7' + digits.slice(1) : '7' + digits;
    return '+' + n.slice(0, 11);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Ошибка входа');

      localStorage.setItem('access_token',  data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user_id',   data.user.id);
      localStorage.setItem('user_name', data.user.name);
      localStorage.setItem('user_role', data.user.role);

      // Редирект на нужное приложение по роли
      const url = APP_URLS[data.user.role];
      if (url && !url.includes('localhost')) {
        window.location.href = url;
      } else {
        navigate('/');
      }
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className={s.wrap}>
      <form className={s.form} onSubmit={submit}>
        <h2 className={s.title}>ВХОД В МОТОР</h2>
        <p className={s.sub}>Войдите в свой аккаунт</p>

        {error && <div className={s.err}>{error}</div>}

        <div className={s.field}>
          <label className={s.label}>ТЕЛЕФОН</label>
          <input className={s.input} type="tel" placeholder="+79001234567"
            value={phone} onChange={e => setPhone(fmt(e.target.value))} required />
        </div>
        <div className={s.field}>
          <label className={s.label}>ПАРОЛЬ</label>
          <input className={s.input} type="password" placeholder="Пароль"
            value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        <button className={s.btn} type="submit" disabled={loading}>
          {loading ? 'Входим…' : '→ ВОЙТИ'}
        </button>
        <p className={s.link}>Нет аккаунта? <Link to="/register">Зарегистрировать автосервис →</Link></p>
      </form>
    </div>
  );
}
