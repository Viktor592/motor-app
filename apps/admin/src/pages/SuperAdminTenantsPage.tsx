import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import s from './AdminPage.module.css';

interface Tenant {
  id: string; slug: string; name: string; status: string;
  ownerEmail: string; ownerPhone?: string; inn?: string; ogrn?: string;
  createdAt: string;
}

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [mrr, setMrr]         = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/saas/admin/tenants');
      setTenants(data.tenants); setMrr(data.mrr);
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
      <h1 className={s.h1}>Автосервисы платформы</h1>
      <p style={{ color: 'var(--dust)', fontSize: 13, marginBottom: 24 }}>
        Здравствуйте, {name}. MRR: {mrr.toLocaleString('ru-RU')} ₽
      </p>

      {loading && <div className={s.loading}>Загрузка…</div>}

      {!loading && (
        <div className={s.rulesTable}>
          <div className={s.rulesHead} style={{ gridTemplateColumns: '1fr 1fr 140px 200px' }}>
            <div>Автосервис</div><div>Владелец</div><div>Статус</div><div>Действия</div>
          </div>
          {tenants.map(t => (
            <div key={t.id} className={s.ruleRow} style={{ gridTemplateColumns: '1fr 1fr 140px 200px' }}>
              <div>
                <Link to={`/tenants/${t.id}`} className={s.ruleCategory} style={{ textDecoration: 'none' }}>{t.name}</Link>
                <div style={{ fontSize: 12, color: 'var(--dust)' }}>{t.slug} · ИНН {t.inn || '—'}</div>
              </div>
              <div style={{ fontSize: 13 }}>{t.ownerEmail}<br/>{t.ownerPhone}</div>
              <div style={{ fontSize: 12 }}>{t.status}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {t.status === 'PENDING_VERIFICATION' && (
                  <>
                    <button className={s.tab} disabled={busyId === t.id}
                      onClick={() => decide(t.id, true)}>✅ Одобрить</button>
                    <button className={s.tab} disabled={busyId === t.id}
                      onClick={() => decide(t.id, false)}>❌ Отклонить</button>
                  </>
                )}
                {t.status === 'ACTIVE' && (
                  <button className={s.tab} disabled={busyId === t.id}
                    onClick={() => setStatus(t.id, 'SUSPENDED')}>⏸ Приостановить</button>
                )}
                {t.status === 'SUSPENDED' && (
                  <button className={s.tab} disabled={busyId === t.id}
                    onClick={() => setStatus(t.id, 'ACTIVE')}>✅ Вернуть</button>
                )}
                <Link to={`/tenants/${t.id}`} className={s.tab} style={{ textDecoration: 'none', display: 'inline-block' }}>Детали →</Link>
              </div>
            </div>
          ))}
          {tenants.length === 0 && <div style={{ padding: 20, color: 'var(--dust)' }}>Пока нет автосервисов</div>}
        </div>
      )}
    </div>
  );
}
