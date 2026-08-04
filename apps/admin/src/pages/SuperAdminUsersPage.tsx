import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';
import s from './AdminPage.module.css';

export default function SuperAdminUsersPage() {
  const { t } = useLocale();
  const ROLE_LABELS: Record<string, string> = {
    CLIENT: t('super_admin_users.role_client'), ADMIN: t('super_admin_users.role_owner'), MASTER: t('super_admin_users.role_master'),
    RECEPTIONIST: t('super_admin_users.role_receptionist'), SUPERADMIN: t('super_admin.name_fallback'),
  };
  const [users, setUsers]   = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = async (role: string) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/saas/admin/users', { params: role ? { role } : {} });
      setUsers(data.users);
    } catch (e: any) {
      setError(e.response?.status
        ? t('super_admin_users.err_status', { status: e.response.status, msg: e.response.data?.error ?? t('super_admin_users.err_default') })
        : t('super_admin_users.err_no_response', { msg: e.message }));
      setUsers([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(filter); }, [filter]);

  return (
    <div className={s.page}>
      <div className={s.eye}>SUPERADMIN</div>
      <h1 className={s.h1}>{t('super_admin_users.title')}</h1>

      <div className={s.tabs} style={{ marginBottom: 20 }}>
        {['', 'CLIENT', 'ADMIN', 'MASTER', 'RECEPTIONIST'].map(r => (
          <button key={r} className={s.tab} data-active={filter === r}
            onClick={() => setFilter(r)}>{r ? ROLE_LABELS[r] : t('super_admin_users.all')}</button>
        ))}
      </div>

      {error && <div style={{ color: '#e5484d', marginBottom: 16 }}>⚠️ {error}</div>}
      {loading && <div className={s.loading}>{t('common.loading')}</div>}
      {!loading && (
        <div className={s.rulesTable}>
          <div className={s.rulesHead} style={{ gridTemplateColumns: '1fr 1fr 140px 100px' }}>
            <div>{t('super_admin_users.th_name')}</div><div>{t('super_admin_users.th_contacts')}</div><div>{t('super_admin_users.th_role')}</div><div>{t('super_admin_users.th_status')}</div>
          </div>
          {users.map(u => (
            <div key={u.id} className={s.ruleRow} style={{ gridTemplateColumns: '1fr 1fr 140px 100px' }}>
              <div>{u.name}</div>
              <div style={{ fontSize: 13 }}>{u.phoneMasked}{u.email ? <><br/>{u.email}</> : null}</div>
              <div style={{ fontSize: 12 }}>{ROLE_LABELS[u.role] ?? u.role}</div>
              <div style={{ fontSize: 12, color: u.isActive ? 'var(--green)' : 'var(--red)' }}>
                {u.isActive ? t('super_admin_users.active') : t('super_admin_users.blocked')}
              </div>
            </div>
          ))}
          {users.length === 0 && <div style={{ padding: 20, color: 'var(--dust)' }}>{t('super_admin_users.not_found')}</div>}
        </div>
      )}
    </div>
  );
}
