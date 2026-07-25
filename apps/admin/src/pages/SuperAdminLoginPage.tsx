import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import s from './Auth.module.css';

export default function SuperAdminLoginPage() {
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState<'login' | 'forgot' | 'reset'>('login');
  const [code, setCode]         = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [info, setInfo]         = useState('');
  const navigate = useNavigate();

  const fmtPhone = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (!d) return '';
    const n = d.startsWith('7') ? d : d.startsWith('8') ? '7' + d.slice(1) : '7' + d;
    return '+' + n.slice(0, 11);
  };

  const sendForgotCode = async () => {
    if (!phone) { setError('Введите телефон'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/password/forgot', { phone });
      setMode('reset'); setInfo('Код отправлен по SMS');
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Не удалось отправить код');
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (code.length !== 4 || newPwd.length < 6) { setError('Введите код (4 цифры) и новый пароль (от 6 символов)'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/password/reset', { phone, code, newPassword: newPwd });
      setMode('login'); setPassword(''); setCode(''); setNewPwd('');
      setInfo('Пароль изменён — теперь войдите с ним');
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Не удалось сменить пароль');
    } finally { setLoading(false); }
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
      <form className={s.form} onSubmit={submit} style={{ display: mode === 'login' ? undefined : 'none' }}>
        <div className={s.logo} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/motor_logo.gif" alt="" style={{ width: 24, height: 24, borderRadius: 6 }} /> МОТОР · PLATFORM
        </div>
        <h1 className={s.title}>Вход супер-админа</h1>
        {error && mode === 'login' && <div className={s.err}>{error}</div>}
        {info && <div className={s.link} style={{ color: 'var(--green)' }}>{info}</div>}

        <label className={s.label}>Телефон</label>
        <input className={s.input} type="tel" placeholder="+79001234567"
          value={phone} onChange={e => setPhone(fmtPhone(e.target.value))} autoFocus />

        <label className={s.label}>Пароль</label>
        <input className={s.input} type="password"
          value={password} onChange={e => setPassword(e.target.value)} />

        <button className={s.btn} type="submit" disabled={loading}>
          {loading ? '…' : 'Войти →'}
        </button>
        <p className={s.link}><a href="#" onClick={e => { e.preventDefault(); setMode('forgot'); setError(''); setInfo(''); }}>Забыли пароль?</a></p>
      </form>

      {mode === 'forgot' && (
        <div className={s.form}>
          <h1 className={s.title}>Восстановление</h1>
          {error && <div className={s.err}>{error}</div>}
          <label className={s.label}>Телефон</label>
          <input className={s.input} type="tel" placeholder="+79001234567"
            value={phone} onChange={e => setPhone(fmtPhone(e.target.value))} autoFocus />
          <button className={s.btn} onClick={sendForgotCode} disabled={loading}>
            {loading ? '…' : 'Отправить код →'}
          </button>
          <p className={s.link}><a href="#" onClick={e => { e.preventDefault(); setMode('login'); setError(''); }}>← Назад ко входу</a></p>
        </div>
      )}

      {mode === 'reset' && (
        <div className={s.form}>
          <h1 className={s.title}>Новый пароль</h1>
          {error && <div className={s.err}>{error}</div>}
          <label className={s.label}>Код из SMS</label>
          <input className={s.input} inputMode="numeric" maxLength={4} placeholder="0000"
            value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
          <label className={s.label}>Новый пароль</label>
          <input className={s.input} type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
          <button className={s.btn} onClick={resetPassword} disabled={loading}>
            {loading ? '…' : 'Сохранить →'}
          </button>
          <p className={s.link}><a href="#" onClick={e => { e.preventDefault(); setMode('login'); setError(''); }}>← Назад ко входу</a></p>
        </div>
      )}
    </div>
  );
}
