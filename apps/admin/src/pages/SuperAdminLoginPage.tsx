import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import s from './Auth.module.css';

export default function SuperAdminLoginPage() {
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

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
      const { data } = await api.post('/auth/login', { phone, password });
      if (data.user.role !== 'SUPERADMIN') {
        setError('Недостаточно прав для входа');
        return;
      }
      localStorage.setItem('motor_access',     data.access);
      localStorage.setItem('motor_refresh',    data.refresh);
      localStorage.setItem('motor_user_id',    data.user.id);
      localStorage.setItem('motor_user_name',  data.user.name);
      localStorage.setItem('motor_user_role',  data.user.role);
      localStorage.setItem('motor_user_phone', data.user.phone ?? phone);
      navigate('/');
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Неверный телефон или пароль');
    } finally { setLoading(false); }
  };

  return (
    <div className={s.wrap}>
      <form className={s.form} onSubmit={submit}>
        <div className={s.logo}>⬡ МОТОР · PLATFORM</div>
        <h1 className={s.title}>Вход супер-админа</h1>
        {error && <div className={s.err}>{error}</div>}

        <label className={s.label}>Телефон</label>
        <input className={s.input} type="tel" placeholder="+79001234567"
          value={phone} onChange={e => setPhone(fmtPhone(e.target.value))} autoFocus />

        <label className={s.label}>Пароль</label>
        <input className={s.input} type="password"
          value={password} onChange={e => setPassword(e.target.value)} />

        <button className={s.btn} type="submit" disabled={loading}>
          {loading ? '…' : 'Войти →'}
        </button>
      </form>
    </div>
  );
}
