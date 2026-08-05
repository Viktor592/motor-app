import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';
import s from './AdminPage.module.css';

export default function SuperAdminTenantDetailPage() {
  const { t } = useLocale();
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get(`/saas/admin/tenants/${id}`).then(r => setData(r.data)).catch((e: any) => {
    setError(e.response?.status
      ? t('super_admin_users.err_status', { status: e.response.status, msg: e.response.data?.error ?? t('super_admin_users.err_default') })
      : t('super_admin_users.err_no_response', { msg: e.message }));
  });
  useEffect(() => { load(); }, [id]);

  const setStatus = async (status: string) => {
    setBusy(true);
    try { await api.patch(`/saas/admin/tenants/${id}/status`, { status }); await load(); }
    finally { setBusy(false); }
  };

  if (!data) return (
    <div className={s.page}>
      {error ? <div style={{ color: '#e5484d' }}>⚠️ {error}</div> : <div className={s.loading}>{t('common.loading')}</div>}
    </div>
  );
  const { tenant, staff } = data;

  return (
    <div className={s.page}>
      <Link to="/" style={{ color: 'var(--dust)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <ArrowLeft size={14} /> {t('tenant_detail.back_all')}
      </Link>
      <div className={s.eye}>{t('tenant_detail.eyebrow')}</div>
      <h1 className={s.h1}>{tenant.name}</h1>
      <p style={{ color: 'var(--dust)', fontSize: 13, marginBottom: 20 }}>
        {tenant.slug} · {t('tenant_detail.inn_label')} {tenant.inn || '—'} · {t('tenant_detail.ogrn_label')} {tenant.ogrn || '—'} · {t('tenant_detail.status_label')} <strong>{tenant.status}</strong>
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        <button className={s.tab} disabled={busy || tenant.status === 'ACTIVE'} onClick={() => setStatus('ACTIVE')}>{t('tenant_detail.activate')}</button>
        <button className={s.tab} disabled={busy || tenant.status === 'SUSPENDED'} onClick={() => setStatus('SUSPENDED')}>{t('tenant_detail.suspend')}</button>
        <button className={s.tab} disabled={busy || tenant.status === 'CANCELLED'} onClick={() => setStatus('CANCELLED')}>{t('tenant_detail.ban')}</button>
      </div>

      <h3 style={{ color: 'var(--chalk)', fontSize: 15, marginBottom: 10 }}>{t('tenant_detail.team')} ({staff.length})</h3>
      <div className={s.rulesTable}>
        <div className={s.rulesHead} style={{ gridTemplateColumns: '1fr 1fr 140px' }}>
          <div>{t('super_admin_users.th_name')}</div><div>{t('tenant_detail.th_phone')}</div><div>{t('super_admin_users.th_role')}</div>
        </div>
        {staff.map((u: any) => (
          <div key={u.id} className={s.ruleRow} style={{ gridTemplateColumns: '1fr 1fr 140px' }}>
            <div>{u.name}</div><div>{u.phone}</div><div>{u.role}</div>
          </div>
        ))}
        {staff.length === 0 && <div style={{ padding: 20, color: 'var(--dust)' }}>{t('tenant_detail.no_staff')}</div>}
      </div>
    </div>
  );
}
