import { useState } from 'react';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';
import s from './AdminPage.module.css';

export default function StaffPage() {
  const { t } = useLocale();
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState<'MASTER' | 'RECEPTIONIST'>('MASTER');
  const [commissionPct, setCommissionPct] = useState('');
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
      setError(t('staff_page.err_invalid'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/admin/staff', {
        name, phone, password, role,
        commissionPct: commissionPct ? Number(commissionPct) : undefined,
      });
      setOk(t('staff_page.created_msg', { name: data.name }));
      setName(''); setPhone(''); setPassword(''); setCommissionPct('');
    } catch (e: any) {
      setError(e.response?.data?.error ?? t('staff_page.err_create_failed'));
    } finally { setLoading(false); }
  };

  return (
    <div className={s.page}>
      <h1 className={s.h1}>{t('staff_page.title')}</h1>
      <p style={{ color: 'var(--dust)', fontSize: 13, marginBottom: 24 }}>
        {t('staff_page.subtitle')}
      </p>

      {error && <div style={{ color: '#e5484d', marginBottom: 12 }}>⚠️ {error}</div>}
      {ok    && <div style={{ color: '#30a46c', marginBottom: 12 }}>✅ {ok}</div>}

      <form onSubmit={submit} style={{ maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder={t('staff_page.name_placeholder')} value={name} onChange={e => setName(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)' }} />
        <input placeholder="+79001234567" type="tel" value={phone}
          onChange={e => setPhone(fmtPhone(e.target.value))}
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)' }} />
        <input placeholder={t('staff_page.password_placeholder')} type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)' }} />
        <select value={role} onChange={e => setRole(e.target.value as any)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)' }}>
          <option value="MASTER">{t('super_admin_users.role_master')}</option>
          <option value="RECEPTIONIST">{t('super_admin_users.role_receptionist')}</option>
        </select>
        <input placeholder={t('staff_page.commission_placeholder')} type="number" min="0" max="100"
          value={commissionPct} onChange={e => setCommissionPct(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)' }} />
        <button className={s.tab} disabled={loading} type="submit">
          {loading ? '…' : t('staff_page.add_btn')}
        </button>
      </form>
    </div>
  );
}
