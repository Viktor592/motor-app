import { useEffect, useState } from 'react';
import { api } from '../services/api';
import s from './AdminPage.module.css';

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Клиент', ADMIN: 'Владелец', MASTER: 'Мастер',
  RECEPTIONIST: 'Приёмщик', SUPERADMIN: 'Супер-админ',
};

export default function SuperAdminUsersPage() {
  const [users, setUsers]   = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (role: string) => {
    setLoading(true);
    try {
      const { data } = await api.get('/saas/admin/users', { params: role ? { role } : {} });
      setUsers(data.users);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(filter); }, [filter]);

  return (
    <div className={s.page}>
      <div className={s.eye}>SUPERADMIN</div>
      <h1 className={s.h1}>Пользователи платформы</h1>

      <div className={s.tabs} style={{ marginBottom: 20 }}>
        {['', 'CLIENT', 'ADMIN', 'MASTER', 'RECEPTIONIST'].map(r => (
          <button key={r} className={s.tab} data-active={filter === r}
            onClick={() => setFilter(r)}>{r ? ROLE_LABELS[r] : 'Все'}</button>
        ))}
      </div>

      {loading && <div className={s.loading}>Загрузка…</div>}
      {!loading && (
        <div className={s.rulesTable}>
          <div className={s.rulesHead} style={{ gridTemplateColumns: '1fr 1fr 140px 100px' }}>
            <div>Имя</div><div>Контакты</div><div>Роль</div><div>Статус</div>
          </div>
          {users.map(u => (
            <div key={u.id} className={s.ruleRow} style={{ gridTemplateColumns: '1fr 1fr 140px 100px' }}>
              <div>{u.name}</div>
              <div style={{ fontSize: 13 }}>{u.phoneMasked}{u.email ? <><br/>{u.email}</> : null}</div>
              <div style={{ fontSize: 12 }}>{ROLE_LABELS[u.role] ?? u.role}</div>
              <div style={{ fontSize: 12, color: u.isActive ? 'var(--green)' : 'var(--red)' }}>
                {u.isActive ? 'активен' : 'заблокирован'}
              </div>
            </div>
          ))}
          {users.length === 0 && <div style={{ padding: 20, color: 'var(--dust)' }}>Никого не найдено</div>}
        </div>
      )}
    </div>
  );
}
