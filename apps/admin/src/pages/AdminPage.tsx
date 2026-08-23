import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { useLocale } from '../services/i18n';
import s from './AdminPage.module.css';

interface PriceRule { id: string; category: string; markupPct: number; updatedAt: string; }
interface Stats {
  orders: { total: number; new: number; inProgress: number; ready: number; today: number };
  revenue: { total: number };
  clients: { total: number };
}
interface PostLoad { id: string; name: string; type: string; total: number; booked: number; free: number; }
interface User { id: string; name: string; phoneMasked: string; role: string; isActive: boolean; createdAt: string; _count: { orders: number }; }

export default function AdminPage() {
  const { t } = useLocale();
  const CATEGORY_LABELS: Record<string, string> = {
    OIL_FILTERS: `🛢 ${t('admin_page.cat.oil_filters')}`,
    OEM:         `⭐ ${t('admin_page.cat.oem')}`,
    AFTERMARKET: `🔩 ${t('admin_page.cat.aftermarket')}`,
    BRAKES:      `🛑 ${t('admin_page.cat.brakes')}`,
    BODY:        `🚗 ${t('admin_page.cat.body')}`,
    CHEMICALS:   `🧪 ${t('admin_page.cat.chemicals')}`,
  };
  const ROLE_LABELS: Record<string, string> = {
    CLIENT: t('super_admin_users.role_client'), MASTER: t('super_admin_users.role_master'),
    RECEPTIONIST: t('super_admin_users.role_receptionist'), ADMIN: t('admin_page.role_admin'),
  };
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

  const loadTab = async (tabName: string) => {
    setLoading(true);
    try {
      if (tabName === 'stats') {
        const [s, p] = await Promise.all([api.get('/admin/stats'), api.get('/admin/posts/load')]);
        setStats(s.data); setPosts(p.data);
      } else if (tabName === 'prices') {
        const { data: r } = await api.get('/admin/price-rules');
        setRules(r);
        setEditPct(Object.fromEntries(r.map((x: PriceRule) => [x.category, x.markupPct])));
      } else if (tabName === 'users') {
        const { data: r } = await api.get('/admin/users');
        setUsers(r.users);
      } else if (tabName === 'posts') {
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
      <div className={s.eye}>// {t('admin_page.eyebrow')}</div>
      <h1 className={s.h1}>{t('admin_page.title')}</h1>

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
          ['stats',  `📊 ${t('admin_page.tab_stats')}`],
          ['prices', `💰 ${t('admin_page.tab_prices')}`],
          ['posts',  `🔧 ${t('admin_page.tab_posts')}`],
          ['users',  `👥 ${t('admin_page.tab_users')}`],
        ] as const).map(([tabId, l]) => (
          <button key={tabId} className={`${s.tab} ${tab === tabId ? s.tabActive : ''}`} onClick={() => setTab(tabId)}>{l}</button>
        ))}
      </div>

      <div style={{marginBottom:16}}>
        <Link to='/settings' style={{color:'var(--dust)',fontSize:13,textDecoration:'none'}}>⚙ {t('admin_page.settings_link')}</Link>
      </div>
      {loading && <div className={s.loading}>{t('common.loading')}</div>}

      {/* Stats */}
      {tab === 'stats' && stats && (
        <>
          <div className={s.statsGrid}>
            {[
              { label: t('admin_page.stat_total_orders'), val: stats.orders.total,      color: 'var(--chalk)' },
              { label: t('admin_page.stat_today'),        val: stats.orders.today,      color: 'var(--blue)' },
              { label: t('admin_page.stat_new'),          val: stats.orders.new,        color: 'var(--ore)' },
              { label: t('order.status.IN_PROGRESS'),     val: stats.orders.inProgress, color: 'var(--gold)' },
              { label: t('admin_page.stat_ready'),        val: stats.orders.ready,      color: 'var(--green)' },
              { label: t('admin_page.stat_clients'),      val: stats.clients.total,     color: 'var(--teal)' },
            ].map(({ label, val, color }) => (
              <div key={label} className={s.statCard}>
                <div className={s.statVal} style={{ color }}>{val.toLocaleString('ru')}</div>
                <div className={s.statLabel}>{label}</div>
              </div>
            ))}
          </div>
          <div className={s.revenueCard}>
            <div className={s.revenueLabel}>{t('admin_page.revenue_label')}</div>
            <div className={s.revenueVal}>{stats.revenue.total.toLocaleString('ru')} ₽</div>
          </div>
        </>
      )}

      {/* Prices */}
      {tab === 'prices' && (
        <div className={s.rulesTable}>
          <div className={s.rulesHead}>
            <span>{t('admin_page.th_category')}</span>
            <span>{t('admin_page.th_markup')}</span>
            <span>{t('admin_page.th_multiplier')}</span>
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
                {saving === r.category ? '…' : `✓ ${t('admin_page.save_btn')}`}
              </button>
            </div>
          ))}
          <div className={s.rulesHint}>
            {t('admin_page.rules_hint')}
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
                  <span style={{ color: 'var(--green)' }}>{p.free} {t('admin_page.free_label')}</span>
                  <span style={{ color: 'var(--dust)' }}>{p.booked}/{p.total} {t('admin_page.booked_label')}</span>
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
            placeholder={t('admin_page.search_placeholder')}
            value={userSearch}
            onChange={e => setSearch(e.target.value)}
          />
          <div className={s.usersTable}>
            <div className={s.usersHead}>
              <span>{t('admin_page.th_user')}</span>
              <span>{t('super_admin_users.th_role')}</span>
              <span>{t('admin_page.th_orders')}</span>
              <span>{t('super_admin_users.th_status')}</span>
              <span>{t('super_admin_tenants.th_actions')}</span>
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
                  {u.isActive ? `● ${t('admin_page.status_active')}` : `○ ${t('admin_page.status_blocked')}`}
                </span>
                <button className={s.toggleBtn} onClick={() => toggleUser(u.id)}>
                  {u.isActive ? t('admin_page.block_btn') : t('admin_page.activate_btn')}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
