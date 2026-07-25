import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { api } from '../services/api';
import { syncFromStorage } from '../slices/authSlice';
import s from './Auth.module.css';

const SAAS = import.meta.env.VITE_SAAS_URL ?? 'http://localhost:3000';

export default function LoginPage() {
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState<'login' | 'forgot' | 'reset'>('login');
  const [code, setCode]         = useState('');
  const [newPwd, setNewPwd]     = useState('');
  const [info, setInfo]         = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
      if (data.user.role !== 'CLIENT') {
        setError('Этот вход только для клиентов');
        return;
      }
      localStorage.setItem('motor_access',     data.access);
      localStorage.setItem('motor_refresh',    data.refresh);
      localStorage.setItem('motor_user_id',    data.user.id);
      localStorage.setItem('motor_user_name',  data.user.name);
      localStorage.setItem('motor_user_role',  data.user.role);
      localStorage.setItem('motor_user_phone', data.user.phone ?? phone);
      dispatch(syncFromStorage());
      navigate('/');
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Неверный телефон или пароль');
    } finally { setLoading(false); }
  };

  return (
    <div className={s.wrap}>
      <form className={s.form} onSubmit={submit} style={{ display: mode === 'login' ? undefined : 'none' }}>
        <h2 className={s.title}>ВХОД</h2>
        {error && mode === 'login' && <div className={s.err}>{error}</div>}
        {info && <div className={s.link} style={{ color: 'var(--green)' }}>{info}</div>}

        <div className={s.field}>
          <label className={s.label}>ТЕЛЕФОН</label>
          <input className={s.input} type="tel" placeholder="+79001234567"
            value={phone} onChange={e => setPhone(fmtPhone(e.target.value))} autoFocus />
        </div>

        <div className={s.field}>
          <label className={s.label}>ПАРОЛЬ</label>
          <input className={s.input} type="password"
            value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        <button className={s.btn} type="submit" disabled={loading}>
          {loading ? '…' : 'Войти →'}
        </button>

        <p className={s.link}>Нет аккаунта? <a href={`${SAAS}/register`}>Зарегистрироваться</a></p>
        <p className={s.link}><a href="#" onClick={e => { e.preventDefault(); setMode('forgot'); setError(''); setInfo(''); }}>Забыли пароль?</a></p>
      </form>

      {mode === 'forgot' && (
        <div className={s.form}>
          <h2 className={s.title}>ВОССТАНОВЛЕНИЕ</h2>
          {error && <div className={s.err}>{error}</div>}
          <div className={s.field}>
            <label className={s.label}>ТЕЛЕФОН</label>
            <input className={s.input} type="tel" placeholder="+79001234567"
              value={phone} onChange={e => setPhone(fmtPhone(e.target.value))} autoFocus />
          </div>
          <button className={s.btn} onClick={sendForgotCode} disabled={loading}>
            {loading ? '…' : 'Отправить код →'}
          </button>
          <p className={s.link}><a href="#" onClick={e => { e.preventDefault(); setMode('login'); setError(''); }}>← Назад ко входу</a></p>
        </div>
      )}

      {mode === 'reset' && (
        <div className={s.form}>
          <h2 className={s.title}>НОВЫЙ ПАРОЛЬ</h2>
          {error && <div className={s.err}>{error}</div>}
          <div className={s.field}>
            <label className={s.label}>КОД ИЗ SMS</label>
            <input className={s.input} inputMode="numeric" maxLength={4} placeholder="0000"
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
          </div>
          <div className={s.field}>
            <label className={s.label}>НОВЫЙ ПАРОЛЬ</label>
            <input className={s.input} type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
          </div>
          <button className={s.btn} onClick={resetPassword} disabled={loading}>
            {loading ? '…' : 'Сохранить →'}
          </button>
          <p className={s.link}><a href="#" onClick={e => { e.preventDefault(); setMode('login'); setError(''); }}>← Назад ко входу</a></p>
        </div>
      )}
    </div>
  );
}
