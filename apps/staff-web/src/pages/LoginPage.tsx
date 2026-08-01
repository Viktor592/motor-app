import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';
import s from './Auth.module.css';

const STAFF_ROLES = ['MASTER', 'RECEPTIONIST'];

export default function LoginPage() {
  const { t } = useLocale();
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
    if (!phone) { setError(t('auth.err.enter_phone')); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/password/forgot', { phone });
      setMode('reset'); setInfo(t('auth.code_sent'));
    } catch (e: any) {
      setError(e.response?.data?.error ?? t('auth.err.send_code'));
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (code.length !== 4 || newPwd.length < 6) { setError(t('auth.err.code_and_pwd')); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/password/reset', { phone, code, newPassword: newPwd });
      setMode('login'); setPassword(''); setCode(''); setNewPwd('');
      setInfo(t('auth.pwd_changed'));
    } catch (e: any) {
      setError(e.response?.data?.error ?? t('auth.err.change_pwd'));
    } finally { setLoading(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) { setError(t('auth.err.fill_all')); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/login', { phone, password });
      if (!STAFF_ROLES.includes(data.user.role)) {
        setError(t('auth.err.staff_only'));
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
      setError(e.response?.data?.error ?? t('auth.err.bad_creds'));
    } finally { setLoading(false); }
  };

  return (
    <div className={s.wrap}>
      <form className={s.form} onSubmit={submit} style={{ display: mode === 'login' ? undefined : 'none' }}>
        <h2 className={s.title}>{t('auth.login_title')}</h2>
        <p className={s.sub}>{t('auth.login_sub')}</p>
        {error && mode === 'login' && <div className={s.err}>{error}</div>}
        {info && <div className={s.link} style={{ color: 'var(--green)' }}>{info}</div>}

        <div className={s.field}>
          <label className={s.label}>{t('auth.phone_label')}</label>
          <input className={s.input} type="tel" placeholder="+79001234567"
            value={phone} onChange={e => setPhone(fmtPhone(e.target.value))} autoFocus />
        </div>

        <div className={s.field}>
          <label className={s.label}>{t('auth.password_label')}</label>
          <input className={s.input} type="password"
            value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        <button className={s.btn} type="submit" disabled={loading}>
          {loading ? '…' : t('auth.login_btn')}
        </button>
        <p className={s.link}><a href="#" onClick={e => { e.preventDefault(); setMode('forgot'); setError(''); setInfo(''); }}>{t('auth.forgot_link')}</a></p>
      </form>

      {mode === 'forgot' && (
        <div className={s.form}>
          <h2 className={s.title}>{t('auth.recovery_title')}</h2>
          {error && <div className={s.err}>{error}</div>}
          <div className={s.field}>
            <label className={s.label}>{t('auth.phone_label')}</label>
            <input className={s.input} type="tel" placeholder="+79001234567"
              value={phone} onChange={e => setPhone(fmtPhone(e.target.value))} autoFocus />
          </div>
          <button className={s.btn} onClick={sendForgotCode} disabled={loading}>
            {loading ? '…' : t('auth.send_code_btn')}
          </button>
          <p className={s.link}><a href="#" onClick={e => { e.preventDefault(); setMode('login'); setError(''); }}>{t('auth.back_to_login')}</a></p>
        </div>
      )}

      {mode === 'reset' && (
        <div className={s.form}>
          <h2 className={s.title}>{t('auth.new_password_title')}</h2>
          {error && <div className={s.err}>{error}</div>}
          <div className={s.field}>
            <label className={s.label}>{t('auth.sms_code_label')}</label>
            <input className={s.input} inputMode="numeric" maxLength={4} placeholder="0000"
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
          </div>
          <div className={s.field}>
            <label className={s.label}>{t('auth.new_password_label')}</label>
            <input className={s.input} type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
          </div>
          <button className={s.btn} onClick={resetPassword} disabled={loading}>
            {loading ? '…' : t('auth.save_btn')}
          </button>
          <p className={s.link}><a href="#" onClick={e => { e.preventDefault(); setMode('login'); setError(''); }}>{t('auth.back_to_login')}</a></p>
        </div>
      )}
    </div>
  );
}
