import { useState } from 'react';
import { api } from '../services/api';
import s from './AdminPage.module.css';

export default function StaffPage() {
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState<'MASTER' | 'RECEPTIONIST'>('MASTER');
  const [error, setError]       = useState('');
  const [ok, setOk]             = useState('');
  const [loading, setLoading]   = useState(false);

  const fmtPhone = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (!d) return '';
    const n = d.startsWith('7') ? d : d.startsWith('8') ? '7' + d.slice(1) : '7' + d;
    return '+' + n.slice(0, 11);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setOk('');
    if (name.length < 2 || !/^\+7\d{10}$/.test(phone) || password.length < 6) {
      setError('Заполните все поля корректно (пароль — минимум 6 символов)');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/admin/staff', { name, phone, password, role });
      setOk(`Сотрудник «${data.name}» создан. Сообщите ему телефон и пароль для входа.`);
      setName(''); setPhone(''); setPassword('');
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Не удалось создать сотрудника');
    } finally { setLoading(false); }
  };

  return (
    <div className={s.page}>
      <h1 className={s.h1}>Сотрудники</h1>
      <p style={{ color: 'var(--dust)', fontSize: 13, marginBottom: 24 }}>
        Заведите мастера или приёмщика — они войдут по телефону и паролю в приложении для персонала.
      </p>

      {error && <div style={{ color: '#e5484d', marginBottom: 12 }}>⚠️ {error}</div>}
      {ok    && <div style={{ color: '#30a46c', marginBottom: 12 }}>✅ {ok}</div>}

      <form onSubmit={submit} style={{ maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Имя" value={name} onChange={e => setName(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)' }} />
        <input placeholder="+79001234567" type="tel" value={phone}
          onChange={e => setPhone(fmtPhone(e.target.value))}
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)' }} />
        <input placeholder="Пароль (минимум 6 символов)" type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)' }} />
        <select value={role} onChange={e => setRole(e.target.value as any)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)' }}>
          <option value="MASTER">Мастер</option>
          <option value="RECEPTIONIST">Приёмщик</option>
        </select>
        <button className={s.tab} disabled={loading} type="submit">
          {loading ? '…' : '+ Добавить сотрудника'}
        </button>
      </form>
    </div>
  );
}
