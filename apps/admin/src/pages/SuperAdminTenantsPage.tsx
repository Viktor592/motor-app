import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';
import s from './AdminPage.module.css';

interface Tenant {
  id: string; slug: string; name: string; status: string;
  ownerEmail: string; ownerPhone?: string; inn?: string; ogrn?: string;
  createdAt: string;
}

export default function SuperAdminTenantsPage() {
  const { t } = useLocale();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [mrr, setMrr]         = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState<string | null>(null);
  const [error, setError]     = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/saas/admin/tenants');
      setTenants(data.tenants); setMrr(data.mrr);
    } catch (e: any) {
      setError(e.response?.status
        ? t('super_admin_users.err_status', { status: e.response.status, msg: e.response.data?.error ?? t('super_admin_users.err_default') })
        : t('super_admin_users.err_no_response', { msg: e.message }));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, approve: boolean) => {
    setBusyId(id);
    try {
      await api.patch(`/saas/admin/tenants/${id}/approve`, { approve });
      await load();
    } finally { setBusyId(null); }
  };

  const setStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await api.patch(`/saas/admin/tenants/${id}/status`, { status });
      await load();
    } finally { setBusyId(null); }
  };

  const name = localStorage.getItem('motor_user_name');

  return (
    <div className={s.page}>
      <div className={s.eye}>SUPERADMIN</div>
      <h1 className={s.h1}>{t('super_admin_tenants.title')}</h1>
      <p style={{ color: 'var(--dust)', fontSize: 13, marginBottom: 24 }}>
        {t('super_admin_tenants.greeting', { name, mrr: mrr.toLocaleString('ru-RU') })}
      </p>

      {error && <div style={{ color: '#e5484d', marginBottom: 16 }}>⚠️ {error}</div>}
      {loading && <div className={s.loading}>{t('common.loading')}</div>}

      {!loading && (
        <div className={s.rulesTable}>
          <div className={s.rulesHead} style={{ gridTemplateColumns: '1fr 1fr 140px 200px' }}>
            <div>{t('super_admin_tenants.th_service')}</div><div>{t('super_admin_tenants.th_owner')}</div><div>{t('super_admin_users.th_status')}</div><div>{t('super_admin_tenants.th_actions')}</div>
          </div>
          {tenants.map(t2 => (
            <div key={t2.id} className={s.ruleRow} style={{ gridTemplateColumns: '1fr 1fr 140px 200px' }}>
              <div>
                <Link to={`/tenants/${t2.id}`} className={s.ruleCategory} style={{ textDecoration: 'none' }}>{t2.name}</Link>
                <div style={{ fontSize: 12, color: 'var(--dust)' }}>{t2.slug} · {t('tenant_detail.inn_label')} {t2.inn || '—'}</div>
              </div>
              <div style={{ fontSize: 13 }}>{t2.ownerEmail}<br/>{t2.ownerPhone}</div>
              <div style={{ fontSize: 12 }}>{t2.status}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {t2.status === 'PENDING_VERIFICATION' && (
                  <>
                    <button className={s.tab} disabled={busyId === t2.id}
                      onClick={() => decide(t2.id, true)}>{t('super_admin_tenants.approve')}</button>
                    <button className={s.tab} disabled={busyId === t2.id}
                      onClick={() => decide(t2.id, false)}>{t('super_admin_tenants.reject')}</button>
                  </>
                )}
                {t2.status === 'ACTIVE' && (
                  <button className={s.tab} disabled={busyId === t2.id}
                    onClick={() => setStatus(t2.id, 'SUSPENDED')}>{t('tenant_detail.suspend')}</button>
                )}
                {t2.status === 'SUSPENDED' && (
                  <button className={s.tab} disabled={busyId === t2.id}
                    onClick={() => setStatus(t2.id, 'ACTIVE')}>{t('super_admin_tenants.restore')}</button>
                )}
                <Link to={`/tenants/${t2.id}`} className={s.tab} style={{ textDecoration: 'none', display: 'inline-block' }}>{t('super_admin_tenants.details_link')}</Link>
              </div>
            </div>
          ))}
          {tenants.length === 0 && <div style={{ padding: 20, color: 'var(--dust)' }}>{t('super_admin_tenants.empty')}</div>}
        </div>
      )}
    </div>
  );
}
