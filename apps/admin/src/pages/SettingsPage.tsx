import React, { useEffect, useState } from 'react';
import { useTheme } from '../services/theme';
import { useLocale } from '../services/i18n';
import { api } from '../services/api';
import s from './SettingsPage.module.css';

type Tab = 'service' | 'posts' | 'hours' | 'notifications' | 'export' | 'appearance';

interface ServiceSettings { name: string; city: string; phone: string; address: string; website: string; }
interface HoursSettings   { start: number; end: number; workDays: number[] }
interface NotifSettings   { newOrdersToTelegram: boolean; statusToClient: boolean; dailyReport: boolean; }
interface Post            { id: string; name: string; type: string; isActive: boolean; }

const TAB_LABEL_KEYS: Record<Tab, string> = {
  service:       'settings.tab.service',
  posts:         'settings.tab.posts',
  hours:         'settings.tab.hours',
  notifications: 'settings.tab.notifications',
  export:        'settings.tab.export',
  appearance:    'settings.tab.appearance',
};

const POST_TYPES = [
  { value: 'MECHANIC',    labelKey: 'settings.post_type.mechanic'    },
  { value: 'ELECTRICIAN', labelKey: 'settings.post_type.electrician' },
  { value: 'DIAGNOSTICS', labelKey: 'settings.post_type.diagnostics' },
];

const DAY_KEYS = ['settings.day.sun', 'settings.day.mon', 'settings.day.tue', 'settings.day.wed', 'settings.day.thu', 'settings.day.fri', 'settings.day.sat'];

export default function SettingsPage() {
  const [tab,    setTab]   = useState<Tab>('service');
  const [saving, setSaving]= useState(false);
  const { theme, setTheme, isDark } = useTheme();
  const { locale, setLocale, locales, t } = useLocale();
  const [saved,  setSaved] = useState('');

  // Service
  const [svc, setSvc] = useState<ServiceSettings>({ name: '', city: '', phone: '', address: '', website: '' });
  // Hours
  const [hrs, setHrs] = useState<HoursSettings>({ start: 9, end: 20, workDays: [1,2,3,4,5,6] });
  // Notifications
  const [notif, setNotif] = useState<NotifSettings>({ newOrdersToTelegram: true, statusToClient: true, dailyReport: false });
  // Posts
  const [posts, setPosts]     = useState<Post[]>([]);
  const [newPost, setNewPost] = useState({ name: '', type: 'MECHANIC' });
  const [addingPost, setAddingPost] = useState(false);
  // Export
  const [expFrom, setExpFrom] = useState('');
  const [expTo,   setExpTo]   = useState('');

  useEffect(() => {
    api.get('/settings').then(r => {
      setSvc(r.data.service    ?? svc);
      setHrs(r.data.hours      ?? hrs);
      setNotif(r.data.notifications ?? notif);
    }).catch(() => {});
    api.get('/settings/posts').then(r => setPosts(r.data)).catch(() => {});
  }, []);

  const showSaved = (msg = t('settings.saved')) => { setSaved(msg); setTimeout(() => setSaved(''), 2500); };

  const saveService = async () => {
    setSaving(true);
    try { await api.patch('/settings/service', svc); showSaved(); }
    catch { showSaved(t('settings.error')); }
    finally { setSaving(false); }
  };

  const saveHours = async () => {
    setSaving(true);
    try { await api.patch('/settings/hours', hrs); showSaved(); }
    catch { showSaved(t('settings.error')); }
    finally { setSaving(false); }
  };

  const saveNotif = async () => {
    setSaving(true);
    try { await api.patch('/settings/notifications', notif); showSaved(); }
    catch { showSaved(t('settings.error')); }
    finally { setSaving(false); }
  };

  const addPost = async () => {
    if (!newPost.name.trim()) return;
    setAddingPost(true);
    try {
      const { data: r } = await api.post('/settings/posts', newPost);
      setPosts(p => [...p, r]);
      setNewPost({ name: '', type: 'MECHANIC' });
    } catch {}
    finally { setAddingPost(false); }
  };

  const togglePost = async (id: string, isActive: boolean) => {
    await api.patch(`/settings/posts/${id}`, { isActive: !isActive }).catch(() => {});
    setPosts(p => p.map(x => x.id === id ? { ...x, isActive: !isActive } : x));
  };

  const deletePost = async (id: string) => {
    if (!confirm(t('settings.posts.confirm_delete'))) return;
    try { await api.delete(`/settings/posts/${id}`); setPosts(p => p.filter(x => x.id !== id)); }
    catch (e: any) { alert(e.response?.data?.error ?? t('settings.error')); }
  };

  const toggleDay = (day: number) => {
    setHrs(h => ({
      ...h,
      workDays: h.workDays.includes(day)
        ? h.workDays.filter(d => d !== day)
        : [...h.workDays, day].sort(),
    }));
  };

  return (
    <div className={s.page}>
      <div className={s.eye}>// {t('settings.eyebrow')}</div>
      <h1 className={s.h1}>{t('settings.title')}</h1>

      <div className={s.layout}>
        {/* Sidebar tabs */}
        <div className={s.sidebar}>
          {(Object.keys(TAB_LABEL_KEYS) as Tab[]).map(tabKey => (
            <button key={tabKey}
              className={`${s.tabBtn} ${tab === tabKey ? s.tabActive : ''}`}
              onClick={() => setTab(tabKey)}
            >
              {t(TAB_LABEL_KEYS[tabKey])}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={s.content}>
          {saved && <div className={s.savedBanner}>{saved === t('settings.error') ? `❌ ${saved}` : `✅ ${saved}`}</div>}

          {/* ── Сервис ── */}
          {tab === 'service' && (
            <div className={s.section}>
              <h2 className={s.sectionTitle}>{t('settings.service.title')}</h2>
              {([
                { label: t('settings.service.field.name'),    key: 'name',    ph: 'Автосервис "Гараж"', req: true },
                { label: t('settings.service.field.city'),    key: 'city',    ph: 'Москва'              },
                { label: t('settings.service.field.phone'),   key: 'phone',   ph: '+7 (999) 000-00-00'  },
                { label: t('settings.service.field.address'), key: 'address', ph: 'ул. Гаражная, 1'     },
                { label: t('settings.service.field.website'), key: 'website', ph: 'https://motor-app.ru' },
              ] as any[]).map(f => (
                <div key={f.key} className={s.field}>
                  <label className={s.label}>{f.label}{f.req && <span className={s.req}> *</span>}</label>
                  <input className={s.input} value={(svc as any)[f.key] ?? ''}
                    onChange={e => setSvc(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.ph} />
                </div>
              ))}
              <button className={s.saveBtn} onClick={saveService} disabled={saving}>
                {saving ? t('settings.saving') : t('settings.save_btn')}
              </button>
            </div>
          )}

          {/* ── Посты ── */}
          {tab === 'posts' && (
            <div className={s.section}>
              <h2 className={s.sectionTitle}>{t('settings.posts.title')}</h2>
              <div className={s.postList}>
                {posts.map(p => {
                  const pType = POST_TYPES.find(pt => pt.value === p.type);
                  return (
                  <div key={p.id} className={`${s.postCard} ${!p.isActive ? s.postInactive : ''}`}>
                    <div className={s.postInfo}>
                      <div className={s.postName}>{p.name}</div>
                      <div className={s.postType}>{pType ? t(pType.labelKey) : p.type}</div>
                    </div>
                    <div className={s.postActions}>
                      <button className={s.toggleBtn} onClick={() => togglePost(p.id, p.isActive)}>
                        {p.isActive ? t('settings.posts.deactivate') : t('settings.posts.activate')}
                      </button>
                      <button className={s.delBtn} onClick={() => deletePost(p.id)}>✕</button>
                    </div>
                  </div>
                  );
                })}
              </div>
              <div className={s.addPostRow}>
                <input className={s.input} placeholder={t('settings.posts.new_name_ph')}
                  value={newPost.name} onChange={e => setNewPost(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addPost()} style={{ flex: 1 }} />
                <select className={s.select} value={newPost.type}
                  onChange={e => setNewPost(p => ({ ...p, type: e.target.value }))}>
                  {POST_TYPES.map(pt => <option key={pt.value} value={pt.value}>{t(pt.labelKey)}</option>)}
                </select>
                <button className={s.saveBtn} onClick={addPost} disabled={addingPost || !newPost.name.trim()}>
                  {addingPost ? '…' : t('settings.posts.add')}
                </button>
              </div>
            </div>
          )}

          {/* ── Часы работы ── */}
          {tab === 'hours' && (
            <div className={s.section}>
              <h2 className={s.sectionTitle}>{t('settings.hours.title')}</h2>
              <div className={s.hoursRow}>
                <div className={s.field} style={{ flex: 1 }}>
                  <label className={s.label}>{t('settings.hours.start')}</label>
                  <select className={s.select} value={hrs.start}
                    onChange={e => setHrs(h => ({ ...h, start: parseInt(e.target.value) }))}>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div className={s.field} style={{ flex: 1 }}>
                  <label className={s.label}>{t('settings.hours.end')}</label>
                  <select className={s.select} value={hrs.end}
                    onChange={e => setHrs(h => ({ ...h, end: parseInt(e.target.value) }))}>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={s.field}>
                <label className={s.label}>{t('settings.hours.work_days')}</label>
                <div className={s.daysRow}>
                  {DAY_KEYS.map((dKey, i) => (
                    <button key={i}
                      className={`${s.dayBtn} ${hrs.workDays.includes(i) ? s.dayActive : ''}`}
                      onClick={() => toggleDay(i)}
                    >
                      {t(dKey)}
                    </button>
                  ))}
                </div>
              </div>
              <button className={s.saveBtn} onClick={saveHours} disabled={saving}>
                {saving ? t('settings.saving') : t('settings.save_btn')}
              </button>
            </div>
          )}

          {/* ── Уведомления ── */}
          {tab === 'notifications' && (
            <div className={s.section}>
              <h2 className={s.sectionTitle}>{t('settings.notif.title')}</h2>
              <div className={s.telegramInfo}>
                <div className={s.telegramTitle}>{t('settings.notif.telegram_bot')}</div>
                <p className={s.telegramText}>
                  {t('settings.notif.telegram_intro')}
                </p>
                <ol className={s.telegramSteps}>
                  <li>{t('settings.notif.step_find_bot')} <code>@{import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'motor_service_bot'}</code></li>
                  <li>{t('settings.notif.step_start')}</li>
                  <li>{t('settings.notif.step_phone')}</li>
                </ol>
                <div className={s.envNote}>
                  {t('settings.notif.env_note')}
                </div>
              </div>
              <div className={s.toggleList}>
                {([
                  { key: 'newOrdersToTelegram', labelKey: 'settings.notif.new_orders_label', subKey: 'settings.notif.new_orders_sub' },
                  { key: 'statusToClient',       labelKey: 'settings.notif.status_label',     subKey: 'settings.notif.status_sub'     },
                  { key: 'dailyReport',          labelKey: 'settings.notif.daily_label',       subKey: 'settings.notif.daily_sub'       },
                ] as const).map(({ key, labelKey, subKey }) => (
                  <div key={key} className={s.toggleRow}>
                    <div>
                      <div className={s.toggleLabel}>{t(labelKey)}</div>
                      <div className={s.toggleSub}>{t(subKey)}</div>
                    </div>
                    <button
                      className={`${s.toggle} ${notif[key] ? s.toggleOn : ''}`}
                      onClick={() => setNotif(n => ({ ...n, [key]: !n[key] }))}
                    >
                      <div className={s.toggleKnob} />
                    </button>
                  </div>
                ))}
              </div>
              <button className={s.saveBtn} onClick={saveNotif} disabled={saving}>
                {saving ? t('settings.saving') : t('settings.save_btn')}
              </button>
            </div>
          )}

          {/* ── Экспорт ── */}
          {tab === 'appearance' && (
            <div className={s.section}>
              <h2 className={s.sectionTitle}>{t('settings.appearance.title')}</h2>

              <div className={s.field}>
                <label className={s.label}>{t('settings.appearance.theme_label')}</label>
                <div className={s.themeGrid}>
                  {([
                    { id: 'dark',   icon: '🌙', nameKey: 'settings.appearance.theme.dark'   },
                    { id: 'light',  icon: '☀️', nameKey: 'settings.appearance.theme.light'  },
                    { id: 'system', icon: '💻', nameKey: 'settings.appearance.theme.system' },
                  ] as const).map(th => (
                    <button
                      key={th.id}
                      className={`${s.themeCard} ${theme === th.id ? s.themeCardActive : ''}`}
                      onClick={() => setTheme(th.id)}
                    >
                      <span className={s.themeIcon}>{th.icon}</span>
                      <span className={s.themeName}>{t(th.nameKey)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={s.field}>
                <label className={s.label}>{t('settings.appearance.language_label')}</label>
                <div className={s.localeGrid}>
                  {locales.map(l => (
                    <button
                      key={l.code}
                      className={`${s.localeCard} ${locale === l.code ? s.localeCardActive : ''}`}
                      onClick={() => setLocale(l.code)}
                    >
                      <span className={s.localeFlag}>{l.flag}</span>
                      <span className={s.localeName}>{l.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Экспорт ── */}
          {tab === 'export' && (
            <div className={s.section}>
              <h2 className={s.sectionTitle}>{t('settings.export.title')}</h2>
              <div className={s.exportGrid}>
                <div className={s.exportCard}>
                  <div className={s.exportIcon}>👥</div>
                  <div className={s.exportTitle}>{t('settings.export.clients_title')}</div>
                  <div className={s.exportDesc}>{t('settings.export.clients_desc')}</div>
                  <a href="/api/v1/export/clients/xlsx" className={s.exportBtn} target="_blank" rel="noreferrer">
                    {t('settings.export.download_xlsx')}
                  </a>
                </div>
                <div className={s.exportCard}>
                  <div className={s.exportIcon}>📋</div>
                  <div className={s.exportTitle}>{t('settings.export.orders_title')}</div>
                  <div className={s.exportDesc}>{t('settings.export.orders_desc')}</div>
                  <div className={s.exportDates}>
                    <input type="date" className={s.dateInput} value={expFrom} onChange={e => setExpFrom(e.target.value)} />
                    <span className={s.dateSep}>—</span>
                    <input type="date" className={s.dateInput} value={expTo}   onChange={e => setExpTo(e.target.value)}   />
                  </div>
                  <a
                    href={"/api/v1/export/orders/xlsx?from=" + expFrom + "&to=" + expTo}
                    className={s.exportBtn}
                    target="_blank" rel="noreferrer"
                  >
                    {t('settings.export.download_xlsx')}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
