import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import s from './AdminPage.module.css';

export default function SuperAdminTenantDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/saas/admin/tenants/${id}`).then(r => setData(r.data));
  useEffect(() => { load(); }, [id]);

  const setStatus = async (status: string) => {
    setBusy(true);
    try { await api.patch(`/saas/admin/tenants/${id}/status`, { status }); await load(); }
    finally { setBusy(false); }
  };

  if (!data) return <div className={s.page}><div className={s.loading}>Загрузка…</div></div>;
  const { tenant, staff } = data;

  return (
    <div className={s.page}>
      <Link to="/" style={{ color: 'var(--dust)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <ArrowLeft size={14} /> Все автосервисы
      </Link>
      <div className={s.eye}>АВТОСЕРВИС</div>
      <h1 className={s.h1}>{tenant.name}</h1>
      <p style={{ color: 'var(--dust)', fontSize: 13, marginBottom: 20 }}>
        {tenant.slug} · ИНН {tenant.inn || '—'} · ОГРН {tenant.ogrn || '—'} · статус: <strong>{tenant.status}</strong>
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        <button className={s.tab} disabled={busy || tenant.status === 'ACTIVE'} onClick={() => setStatus('ACTIVE')}>✅ Активировать</button>
        <button className={s.tab} disabled={busy || tenant.status === 'SUSPENDED'} onClick={() => setStatus('SUSPENDED')}>⏸ Приостановить</button>
        <button className={s.tab} disabled={busy || tenant.status === 'CANCELLED'} onClick={() => setStatus('CANCELLED')}>🚫 Забанить</button>
      </div>

      <h3 style={{ color: 'var(--chalk)', fontSize: 15, marginBottom: 10 }}>Команда ({staff.length})</h3>
      <div className={s.rulesTable}>
        <div className={s.rulesHead} style={{ gridTemplateColumns: '1fr 1fr 140px' }}>
          <div>Имя</div><div>Телефон</div><div>Роль</div>
        </div>
        {staff.map((u: any) => (
          <div key={u.id} className={s.ruleRow} style={{ gridTemplateColumns: '1fr 1fr 140px' }}>
            <div>{u.name}</div><div>{u.phone}</div><div>{u.role}</div>
          </div>
        ))}
        {staff.length === 0 && <div style={{ padding: 20, color: 'var(--dust)' }}>Нет сотрудников</div>}
      </div>
    </div>
  );
}
