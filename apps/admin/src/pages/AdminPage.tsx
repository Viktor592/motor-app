import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import s from './AdminPage.module.css';

interface PriceRule { id: string; category: string; markupPct: number; updatedAt: string; }
interface Stats {
  orders: { total: number; new: number; inProgress: number; ready: number; today: number };
  revenue: { total: number };
  clients: { total: number };
}
interface PostLoad { id: string; name: string; type: string; total: number; booked: number; free: number; }
interface User { id: string; name: string; phoneMasked: string; role: string; isActive: boolean; createdAt: string; _count: { orders: number }; }

const CATEGORY_LABELS: Record<string, string> = {
  OIL_FILTERS: '🛢 Масло и фильтры',
  OEM:         '⭐ Оригинал OEM',
  AFTERMARKET: '🔩 Аналоги',
  BRAKES:      '🛑 Тормоза',
  BODY:        '🚗 Кузов',
  CHEMICALS:   '🧪 Химия / расходники',
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Клиент', MASTER: 'Мастер', RECEPTIONIST: 'Приёмщик', ADMIN: 'Администратор',
};

export default function AdminPage() {
  const [tab,        setTab]     = useState<'stats'|'prices'|'users'|'posts'>('stats');
  const [stats,      setStats]   = useState<Stats | null>(null);
  const [rules,      setRules]   = useState<PriceRule[]>([]);
  const [posts,      setPosts]   = useState<PostLoad[]>([]);
  const [users,      setUsers]   = useState<User[]>([]);
  const [editPct,    setEditPct] = useState<Record<string, number>>({});
  const [saving,     setSaving]  = useState<string | null>(null);
  const [ownerPromos, setOwnerPromos] = useState<any[]>([]);

  useEffect(() => { api.get('/saas/promotions/owners').then(r => setOwnerPromos(r.data.promotions)).catch(() => {}); }, []);
  const [userSearch, setSearch]  = useState('');
  const [loading,    setLoading] = useState(false);

  useEffect(() => { loadTab(tab); }, [tab]);

  const loadTab = async (t: string) => {
    setLoading(true);
    try {
      if (t === 'stats') {
        const [s, p] = await Promise.all([api.get('/admin/stats'), api.get('/admin/posts/load')]);
        setStats(s.data); setPosts(p.data);
      } else if (t === 'prices') {
        const { data: r } = await api.get('/admin/price-rules');
        setRules(r);
        setEditPct(Object.fromEntries(r.map((x: PriceRule) => [x.category, x.markupPct])));
      } else if (t === 'users') {
        const { data: r } = await api.get('/admin/users');
        setUsers(r.users);
      } else if (t === 'posts') {
        const { data: r } = await api.get('/admin/posts/load');
        setPosts(r);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const saveRule = async (category: string) => {
    setSaving(category);
    try {
      await api.patch(`/admin/price-rules/${category}`, { markupPct: editPct[category] });
      setRules(prev => prev.map(r => r.category === category ? { ...r, markupPct: editPct[category] } : r));
    } catch {}
    finally { setSaving(null); }
  };

  const toggleUser = async (id: string) => {
    try {
      const { data: r } = await api.patch(`/admin/users/${id}/toggle`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: r.isActive } : u));
    } catch {}
  };

  const changeRole = async (id: string, role: string) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } catch {}
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phoneMasked.includes(userSearch)
  );

  return (
    <div className={s.page}>
      <div className={s.eye}>// Администрирование</div>
      <h1 className={s.h1}>ADMIN-ПАНЕЛЬ</h1>

      {ownerPromos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0' }}>
          {ownerPromos.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center',
              padding: '12px 16px', borderRadius: 10, border: '1px solid var(--wire)',
              background: 'linear-gradient(135deg, var(--ore-d), var(--plate))' }}>
              {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
              <div>
                <div style={{ fontWeight: 700, color: 'var(--chalk)', fontSize: 13 }}>📣 {p.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ash)' }}>{p.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className={s.tabs}>
        {([
          ['stats',  '📊 Статистика'],
          ['prices', '💰 Наценки'],
          ['posts',  '🔧 Загрузка постов'],
          ['users',  '👥 Пользователи'],
        ] as const).map(([t, l]) => (
          <button key={t} className={`${s.tab} ${tab === t ? s.tabActive : ''}`} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      <div style={{marginBottom:16}}>
        <Link to='/settings' style={{color:'var(--dust)',fontSize:13,textDecoration:'none'}}>⚙ Настройки сервиса →</Link>
      </div>
      {loading && <div className={s.loading}>Загрузка…</div>}

      {/* Stats */}
      {tab === 'stats' && stats && (
        <>
          <div className={s.statsGrid}>
            {[
              { label: 'Всего заказов',  val: stats.orders.total,      color: 'var(--chalk)' },
              { label: 'Сегодня',        val: stats.orders.today,      color: 'var(--blue)' },
              { label: 'Новых',          val: stats.orders.new,        color: 'var(--ore)' },
              { label: 'В работе',       val: stats.orders.inProgress, color: 'var(--gold)' },
              { label: 'Готово',         val: stats.orders.ready,      color: 'var(--green)' },
              { label: 'Клиентов',       val: stats.clients.total,     color: 'var(--teal)' },
            ].map(({ label, val, color }) => (
              <div key={label} className={s.statCard}>
                <div className={s.statVal} style={{ color }}>{val.toLocaleString('ru')}</div>
                <div className={s.statLabel}>{label}</div>
              </div>
            ))}
          </div>
          <div className={s.revenueCard}>
            <div className={s.revenueLabel}>Выручка (закрытые заказы)</div>
            <div className={s.revenueVal}>{stats.revenue.total.toLocaleString('ru')} ₽</div>
          </div>
        </>
      )}

      {/* Prices */}
      {tab === 'prices' && (
        <div className={s.rulesTable}>
          <div className={s.rulesHead}>
            <span>Категория</span>
            <span>Наценка %</span>
            <span>Итог. множитель</span>
            <span></span>
          </div>
          {rules.map(r => (
            <div key={r.category} className={s.ruleRow}>
              <span className={s.ruleCategory}>{CATEGORY_LABELS[r.category] ?? r.category}</span>
              <div className={s.ruleInput}>
                <input
                  type="number" min={0} max={500}
                  value={editPct[r.category] ?? r.markupPct}
                  onChange={e => setEditPct(p => ({ ...p, [r.category]: parseInt(e.target.value) || 0 }))}
                  className={s.pctInput}
                />
                <span className={s.pctSign}>%</span>
              </div>
              <span className={s.ruleMult}>×{(1 + (editPct[r.category] ?? r.markupPct) / 100).toFixed(2)}</span>
              <button
                className={s.saveBtn}
                onClick={() => saveRule(r.category)}
                disabled={saving === r.category || editPct[r.category] === r.markupPct}
              >
                {saving === r.category ? '…' : '✓ Сохранить'}
              </button>
            </div>
          ))}
          <div className={s.rulesHint}>
            Изменения применяются к новым сметам. Существующие заказы не пересчитываются автоматически.
          </div>
        </div>
      )}

      {/* Posts load */}
      {tab === 'posts' && (
        <div className={s.postsGrid}>
          {posts.map(p => {
            const pct = p.total > 0 ? Math.round(p.booked / p.total * 100) : 0;
            return (
              <div key={p.id} className={s.postCard}>
                <div className={s.postName}>{p.name}</div>
                <div className={s.postBar}>
                  <div className={s.postBarFill} style={{ width: pct + '%', background: pct > 80 ? 'var(--red)' : pct > 50 ? 'var(--gold)' : 'var(--green)' }} />
                </div>
                <div className={s.postMeta}>
                  <span style={{ color: 'var(--green)' }}>{p.free} свободно</span>
                  <span style={{ color: 'var(--dust)' }}>{p.booked}/{p.total} занято</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <>
          <input
            className={s.search}
            placeholder="Поиск по имени или телефону…"
            value={userSearch}
            onChange={e => setSearch(e.target.value)}
          />
          <div className={s.usersTable}>
            <div className={s.usersHead}>
              <span>Пользователь</span>
              <span>Роль</span>
              <span>Заказов</span>
              <span>Статус</span>
              <span>Действия</span>
            </div>
            {filteredUsers.map(u => (
              <div key={u.id} className={`${s.userRow} ${!u.isActive ? s.userInactive : ''}`}>
                <div>
                  <div className={s.userName}>{u.name}</div>
                  <div className={s.userPhone}>{u.phoneMasked}</div>
                </div>
                <select
                  className={s.roleSelect}
                  value={u.role}
                  onChange={e => changeRole(u.id, e.target.value)}
                >
                  {Object.entries(ROLE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <span className={s.userOrders}>{u._count.orders}</span>
                <span className={`${s.userStatus} ${u.isActive ? s.userActive : s.userBlocked}`}>
                  {u.isActive ? '● Активен' : '○ Заблокирован'}
                </span>
                <button className={s.toggleBtn} onClick={() => toggleUser(u.id)}>
                  {u.isActive ? 'Заблокировать' : 'Активировать'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
