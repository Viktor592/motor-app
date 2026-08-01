import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../services/i18n';
import s from './Auth.module.css';

const ROLE_URLS: Record<string, string> = {
  CLIENT:       import.meta.env.VITE_CLIENT_WEB_URL ?? 'http://localhost:3001',
  ADMIN:        import.meta.env.VITE_ADMIN_URL      ?? 'http://localhost:3003',
  SUPERADMIN:   import.meta.env.VITE_ADMIN_URL      ?? 'http://localhost:3003',
  MASTER:       import.meta.env.VITE_STAFF_WEB_URL  ?? 'http://localhost:3002',
  RECEPTIONIST: import.meta.env.VITE_STAFF_WEB_URL  ?? 'http://localhost:3002',
};

export default function LoginPage() {
  const { t } = useLocale();
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
    if (!phone || !password) { setError(t('auth.err.fill_all')); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t('auth.err.login_failed'));

      // Редирект по роли — токены передаём через URL, т.к. localStorage
      // не общий между разными портами (разные origin для браузера)
      const url = ROLE_URLS[data.user.role];
      if (url) {
        const params = new URLSearchParams({
          access:  data.access,
          refresh: data.refresh,
          id:      data.user.id,
          name:    data.user.name,
          role:    data.user.role,
          phone:   data.user.phone ?? phone,
        });
        window.location.replace(`${url}/auth?${params.toString()}`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className={s.wrap}>
      <form className={s.form} onSubmit={submit}>
        <div className={s.logo} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/motor_logo.gif" alt="" style={{ width: 24, height: 24, borderRadius: 6 }} /> МОТОР
        </div>
        <h1 className={s.title}>{t('auth.title')}</h1>

        {error && <div className={s.err}>{error}</div>}

        <label className={s.label}>{t('auth.phone_label')}</label>
        <input className={s.input} type="tel" placeholder="+79001234567"
          value={phone} onChange={e => setPhone(fmtPhone(e.target.value))} autoFocus />

        <label className={s.label}>{t('auth.password_label')}</label>
        <input className={s.input} type="password" placeholder={t('auth.password_label')}
          value={password} onChange={e => setPassword(e.target.value)} />

        <button className={s.btn} type="submit" disabled={loading}>
          {loading ? '…' : t('auth.login_btn')}
        </button>

        <p className={s.hint}>
          {t('auth.no_account')} <Link to="/register">{t('auth.register_link')}</Link>
        </p>
      </form>
    </div>
  );
}
