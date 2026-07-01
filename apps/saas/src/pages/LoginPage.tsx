import { useState } from 'react';
import { Link } from 'react-router-dom';
import s from './Auth.module.css';

const ROLE_URLS: Record<string, string> = {
  CLIENT: import.meta.env.VITE_CLIENT_WEB_URL ?? 'http://localhost:3001',
  ADMIN:  import.meta.env.VITE_ADMIN_URL      ?? 'http://localhost:3003',
  MASTER: import.meta.env.VITE_STAFF_WEB_URL  ?? 'http://localhost:3002',
  STAFF:  import.meta.env.VITE_STAFF_WEB_URL  ?? 'http://localhost:3002',
};

export default function LoginPage() {
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const fmtPhone = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (!d) return '';
    const n = d.startsWith('7') ? d : d.startsWith('8') ? '7' + d.slice(1) : '7' + d;
    return '+' + n.slice(0, 11);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) { setError('Введите телефон и пароль'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Ошибка входа');

      // Сохраняем токены
      localStorage.setItem('motor_access',    data.access);
      localStorage.setItem('motor_refresh',   data.refresh);
      localStorage.setItem('motor_user_id',   data.user.id);
      localStorage.setItem('motor_user_name', data.user.name);
      localStorage.setItem('motor_user_role', data.user.role);
      localStorage.setItem('motor_user_phone',data.user.phone ?? phone);

      // Редирект по роли в нужное приложение
      const url = ROLE_URLS[data.user.role];
      if (url) window.location.replace(url);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className={s.wrap}>
      <form className={s.form} onSubmit={submit}>
        <div className={s.logo}>⬡ МОТОР</div>
        <h1 className={s.title}>Вход</h1>

        {error && <div className={s.err}>{error}</div>}

        <label className={s.label}>Телефон</label>
        <input className={s.input} type="tel" placeholder="+79001234567"
          value={phone} onChange={e => setPhone(fmtPhone(e.target.value))} autoFocus />

        <label className={s.label}>Пароль</label>
        <input className={s.input} type="password" placeholder="Пароль"
          value={password} onChange={e => setPassword(e.target.value)} />

        <button className={s.btn} type="submit" disabled={loading}>
          {loading ? '…' : 'Войти →'}
        </button>

        <p className={s.hint}>
          Нет аккаунта? <Link to="/register">Зарегистрировать автосервис</Link>
        </p>
      </form>
    </div>
  );
}
