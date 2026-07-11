import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Auth.module.css';

export default function ClientRegisterPage() {
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const fmtPhone = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (!d) return '';
    const n = d.startsWith('7') ? d : d.startsWith('8') ? '7' + d.slice(1) : '7' + d;
    return '+' + n.slice(0, 11);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 2 || !/^\+7\d{10}$/.test(phone) || password.length < 6) {
      setError('Заполните все поля корректно (пароль — минимум 6 символов)');
      return;
    }
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? data.message ?? 'Ошибка регистрации');
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const CLIENT_WEB = (import.meta as any).env?.VITE_CLIENT_WEB_URL ?? 'http://localhost:3001';

  if (done) return (
    <div className={styles.wrap}>
      <div className={styles.form}>
        <h2 className={styles.title}>Готово!</h2>
        <p className={styles.sub}>Аккаунт создан. Теперь войдите под своим телефоном и паролем.</p>
        <a className={styles.btn} href={`${CLIENT_WEB}/login`}>Войти →</a>
      </div>
    </div>
  );

  return (
    <div className={styles.wrap}>
      <form className={styles.form} onSubmit={submit}>
        <h2 className={styles.title}>Регистрация</h2>
        {error && <div className={styles.err}>{error}</div>}

        <label className={styles.label}>Имя</label>
        <input className={styles.input} value={name} onChange={e => setName(e.target.value)} autoFocus />

        <label className={styles.label}>Телефон</label>
        <input className={styles.input} type="tel" placeholder="+79001234567"
          value={phone} onChange={e => setPhone(fmtPhone(e.target.value))} />

        <label className={styles.label}>Пароль</label>
        <input className={styles.input} type="password"
          value={password} onChange={e => setPassword(e.target.value)} />

        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? '…' : 'Зарегистрироваться →'}
        </button>

        <p className={styles.link}>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
        <p className={styles.link}>Вы владелец автосервиса? <Link to="/owner/register">Регистрация бизнеса</Link></p>
      </form>
    </div>
  );
}
