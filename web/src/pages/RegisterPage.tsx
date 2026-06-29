import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../slices/authSlice';
import { AppDispatch, RootState } from '../store';
import s from './Auth.module.css';

export default function RegisterPage() {
  const [phone, setPhone]   = useState('');
  const [name,  setName]    = useState('');
  const [pass,  setPass]    = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error } = useSelector((st: RootState) => st.auth);

  const fmt = (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (!digits) return '';
    const normalized = digits.startsWith('7') ? digits : digits.startsWith('8') ? '7' + digits.slice(1) : '7' + digits;
    return '+' + normalized.slice(0, 11);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(register({ phone, name, password: pass }));
    if (register.fulfilled.match(res)) navigate('/');
  };

  return (
    <form className={s.form} onSubmit={submit}>
      <h2 className={s.title}>РЕГИСТРАЦИЯ</h2>
      <p className={s.sub}>Создайте аккаунт клиента</p>

      {error && <div className={s.err}>{error}</div>}

      <div className={s.field}>
        <label className={s.label}>ИМЯ</label>
        <input className={s.input} placeholder="Алексей" value={name}
          onChange={e => setName(e.target.value)} required minLength={2} />
      </div>
      <div className={s.field}>
        <label className={s.label}>ТЕЛЕФОН</label>
        <input className={s.input} type="tel" placeholder="+79001234567"
          value={phone} onChange={e => setPhone(fmt(e.target.value))} required />
      </div>
      <div className={s.field}>
        <label className={s.label}>ПАРОЛЬ</label>
        <input className={s.input} type="password" placeholder="Минимум 6 символов"
          value={pass} onChange={e => setPass(e.target.value)} required minLength={6} />
      </div>

      <button className={s.btn} type="submit" disabled={loading}>
        {loading ? 'Создаём аккаунт…' : '→ ЗАРЕГИСТРИРОВАТЬСЯ'}
      </button>
      <p className={s.link}>Уже есть аккаунт? <Link to="/login">Войти →</Link></p>
    </form>
  );
}
