import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../slices/authSlice';
import { AppDispatch, RootState } from '../store';
import s from './Auth.module.css';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const dispatch  = useDispatch<AppDispatch>();
  const navigate  = useNavigate();
  const { loading, error } = useSelector((st: RootState) => st.auth);

  const fmt = (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (!digits) return '';
    const normalized = digits.startsWith('7') ? digits : digits.startsWith('8') ? '7' + digits.slice(1) : '7' + digits;
    return '+' + normalized.slice(0, 11);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await dispatch(login({ phone, password }));
    if (login.fulfilled.match(res)) navigate('/');
  };

  return (
    <form className={s.form} onSubmit={submit}>
      <h2 className={s.title}>ВХОД</h2>
      <p className={s.sub}>Введите номер и пароль</p>

      {error && <div className={s.err}>{error}</div>}

      <div className={s.field}>
        <label className={s.label}>ТЕЛЕФОН</label>
        <input className={s.input} type="tel" placeholder="+79001234567"
          value={phone} onChange={e => setPhone(fmt(e.target.value))} required />
      </div>

      <div className={s.field}>
        <label className={s.label}>ПАРОЛЬ</label>
        <input className={s.input} type="password" placeholder="••••••"
          value={password} onChange={e => setPassword(e.target.value)} required />
      </div>

      <button className={s.btn} type="submit" disabled={loading}>
        {loading ? 'Вход…' : '→ ВОЙТИ'}
      </button>

      <p className={s.link}>Нет аккаунта? <Link to="/register">Зарегистрироваться →</Link></p>
    </form>
  );
}
