import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';
import s from './OtpPage.module.css';

type Step = 'phone' | 'code';

export default function OtpPage() {
  const { t } = useLocale();
  const [step,  setStep]  = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code,  setCode]  = useState(['', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const codeRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const dispatch  = useDispatch<AppDispatch>();
  const navigate  = useNavigate();

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(t => t - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const rawPhone = () => '+7' + phone.replace(/\D/g, '').slice(1);

  const fmtPhone = (v: string) => {
    const n = v.replace(/\D/g, '');
    if (!n) return '';
    let d = n.startsWith('7') ? n : '7' + n;
    d = d.slice(0, 11);
    let r = '+7';
    if (d.length > 1) r += ' (' + d.slice(1, 4);
    if (d.length >= 4) r += ') ' + d.slice(4, 7);
    if (d.length >= 7) r += '-' + d.slice(7, 9);
    if (d.length >= 9) r += '-' + d.slice(9, 11);
    return r;
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = rawPhone();
    if (p.length !== 12) { setError(t('otp.err.full_phone')); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/otp/send', { phone: p });
      setStep('code'); setTimer(60);
      setCode(['', '', '', '']);
      setTimeout(() => codeRefs[0].current?.focus(), 100);
    } catch (e: any) {
      setError(e.response?.data?.error ?? t('otp.err.send'));
    } finally { setLoading(false); }
  };

  const handleCodeInput = (val: string, idx: number) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[idx] = d;
    setCode(next);
    if (d && idx < 3) codeRefs[idx + 1].current?.focus();
    if (next.every(c => c !== '')) verify(next.join(''));
  };

  const handleCodeKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) codeRefs[idx - 1].current?.focus();
  };

  const verify = async (fullCode: string) => {
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/otp/verify', { phone: rawPhone(), code: fullCode });
      const { access, refresh, user } = res.data;
      localStorage.setItem('motor_access',  access);
      localStorage.setItem('motor_refresh', refresh);
      localStorage.setItem('motor_user_id',   user.id);
      localStorage.setItem('motor_user_name', user.name);
      localStorage.setItem('motor_user_role', user.role);
      // Reload store
      window.location.href = '/';
    } catch (e: any) {
      setError(e.response?.data?.error ?? t('otp.err.code'));
      setCode(['', '', '', '']);
      setTimeout(() => codeRefs[0].current?.focus(), 100);
    } finally { setLoading(false); }
  };

  const resend = async () => {
    if (timer > 0) return;
    setLoading(true); setError('');
    try {
      await api.post('/auth/otp/send', { phone: rawPhone() });
      setTimer(60); setCode(['', '', '', '']);
      setTimeout(() => codeRefs[0].current?.focus(), 100);
    } catch (e: any) { setError(e.response?.data?.error ?? t('otp.err.generic')); }
    finally { setLoading(false); }
  };

  return (
    <div className={s.wrap}>
      {step === 'phone' && (
        <form className={s.form} onSubmit={sendCode}>
          <h2 className={s.title}>{t('otp.title')}</h2>
          <p className={s.sub}>{t('otp.subtitle')}</p>
          {error && <div className={s.err}>{error}</div>}
          <div className={s.field}>
            <label className={s.label}>{t('otp.phone_label')}</label>
            <input
              className={s.input}
              type="tel"
              value={phone}
              onChange={e => setPhone(fmtPhone(e.target.value))}
              placeholder="+7 (999) 000-00-00"
              autoFocus
            />
          </div>
          <button className={s.btn} type="submit" disabled={loading}>
            {loading ? t('otp.sending') : t('otp.get_code')}
          </button>
          <p className={s.hint}>{t('otp.hint')}</p>
          <p className={s.or}>{t('otp.or')}</p>
          <Link to="/login" className={s.pwdLink}>{t('otp.password_login')}</Link>
        </form>
      )}

      {step === 'code' && (
        <div className={s.form}>
          <h2 className={s.title}>{t('otp.code_title')}</h2>
          <p className={s.sub}>{t('otp.code_subtitle')} <strong>{phone}</strong></p>
          {error && <div className={s.err}>{error}</div>}

          <div className={s.codeRow}>
            {code.map((c, i) => (
              <input
                key={i}
                ref={codeRefs[i]}
                className={`${s.codeBox} ${c ? s.codeBoxFilled : ''}`}
                value={c}
                onChange={e => handleCodeInput(e.target.value, i)}
                onKeyDown={e => handleCodeKey(e, i)}
                type="tel"
                maxLength={1}
                disabled={loading}
              />
            ))}
          </div>

          {loading && <p className={s.verifying}>{t('otp.verifying')}</p>}

          <button
            className={`${s.resend} ${timer > 0 ? s.resendDisabled : ''}`}
            onClick={resend}
            disabled={timer > 0 || loading}
            type="button"
          >
            {timer > 0 ? t('otp.resend_in', { sec: timer }) : t('otp.resend')}
          </button>

          <button className={s.backLink} onClick={() => setStep('phone')} type="button">
            {t('otp.change_number')}
          </button>
        </div>
      )}
    </div>
  );
}
