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

const TAB_LABELS: Record<Tab, string> = {
  service:       '🏢 Сервис',
  posts:         '🔧 Посты',
  hours:         '🕘 Часы работы',
  notifications: '🔔 Уведомления',
  export:        '📤 Экспорт',
  appearance:    '🎨 Внешний вид',
};

const POST_TYPES = [
  { value: 'MECHANIC',    label: '🔧 Слесарный'   },
  { value: 'ELECTRICIAN', label: '⚡ Электрик'     },
  { value: 'DIAGNOSTICS', label: '🔍 Диагностика'  },
];

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export default function SettingsPage() {
  const [tab,    setTab]   = useState<Tab>('service');
  const [saving, setSaving]= useState(false);
  const { theme, setTheme, isDark } = useTheme();
  const { locale, setLocale, locales } = useLocale();
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

  const showSaved = (msg = 'Сохранено') => { setSaved(msg); setTimeout(() => setSaved(''), 2500); };

  const saveService = async () => {
    setSaving(true);
    try { await api.patch('/settings/service', svc); showSaved(); }
    catch { showSaved('Ошибка'); }
    finally { setSaving(false); }
  };

  const saveHours = async () => {
    setSaving(true);
    try { await api.patch('/settings/hours', hrs); showSaved(); }
    catch { showSaved('Ошибка'); }
    finally { setSaving(false); }
  };

  const saveNotif = async () => {
    setSaving(true);
    try { await api.patch('/settings/notifications', notif); showSaved(); }
    catch { showSaved('Ошибка'); }
    finally { setSaving(false); }
  };

  const addPost = async () => {
    if (!newPost.name.trim()) return;
    setAddingPost(true);
    try {
      const r = await api.post('/settings/posts', newPost);
      setPosts(p => [...p, r.data]);
      setNewPost({ name: '', type: 'MECHANIC' });
    } catch {}
    finally { setAddingPost(false); }
  };

  const togglePost = async (id: string, isActive: boolean) => {
    await api.patch(`/settings/posts/${id}`, { isActive: !isActive }).catch(() => {});
    setPosts(p => p.map(x => x.id === id ? { ...x, isActive: !isActive } : x));
  };

  const deletePost = async (id: string) => {
    if (!confirm('Удалить пост? Все незабронированные слоты будут удалены.')) return;
    try { await api.delete(`/settings/posts/${id}`); setPosts(p => p.filter(x => x.id !== id)); }
    catch (e: any) { alert(e.response?.data?.error ?? 'Ошибка'); }
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
      <div className={s.eye}>// Администрирование</div>
      <h1 className={s.h1}>НАСТРОЙКИ</h1>

      <div className={s.layout}>
        {/* Sidebar tabs */}
        <div className={s.sidebar}>
          {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
            <button key={t}
              className={`${s.tabBtn} ${tab === t ? s.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={s.content}>
          {saved && <div className={s.savedBanner}>{saved === 'Ошибка' ? `❌ ${saved}` : `✅ ${saved}`}</div>}

          {/* ── Сервис ── */}
          {tab === 'service' && (
            <div className={s.section}>
              <h2 className={s.sectionTitle}>Данные автосервиса</h2>
              {([
                { label: 'Название',  key: 'name',    ph: 'Автосервис "Гараж"', req: true },
                { label: 'Город',     key: 'city',    ph: 'Москва'              },
                { label: 'Телефон',   key: 'phone',   ph: '+7 (999) 000-00-00'  },
                { label: 'Адрес',     key: 'address', ph: 'ул. Гаражная, 1'     },
                { label: 'Сайт',      key: 'website', ph: 'https://motor-app.ru' },
              ] as any[]).map(f => (
                <div key={f.key} className={s.field}>
                  <label className={s.label}>{f.label}{f.req && <span className={s.req}> *</span>}</label>
                  <input className={s.input} value={(svc as any)[f.key] ?? ''}
                    onChange={e => setSvc(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.ph} />
                </div>
              ))}
              <button className={s.saveBtn} onClick={saveService} disabled={saving}>
                {saving ? 'Сохраняем…' : '✓ Сохранить'}
              </button>
            </div>
          )}

          {/* ── Посты ── */}
          {tab === 'posts' && (
            <div className={s.section}>
              <h2 className={s.sectionTitle}>Рабочие посты</h2>
              <div className={s.postList}>
                {posts.map(p => (
                  <div key={p.id} className={`${s.postCard} ${!p.isActive ? s.postInactive : ''}`}>
                    <div className={s.postInfo}>
                      <div className={s.postName}>{p.name}</div>
                      <div className={s.postType}>{POST_TYPES.find(t => t.value === p.type)?.label ?? p.type}</div>
                    </div>
                    <div className={s.postActions}>
                      <button className={s.toggleBtn} onClick={() => togglePost(p.id, p.isActive)}>
                        {p.isActive ? 'Деактивировать' : 'Активировать'}
                      </button>
                      <button className={s.delBtn} onClick={() => deletePost(p.id)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className={s.addPostRow}>
                <input className={s.input} placeholder="Название нового поста"
                  value={newPost.name} onChange={e => setNewPost(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addPost()} style={{ flex: 1 }} />
                <select className={s.select} value={newPost.type}
                  onChange={e => setNewPost(p => ({ ...p, type: e.target.value }))}>
                  {POST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <button className={s.saveBtn} onClick={addPost} disabled={addingPost || !newPost.name.trim()}>
                  {addingPost ? '…' : '+ Добавить'}
                </button>
              </div>
            </div>
          )}

          {/* ── Часы работы ── */}
          {tab === 'hours' && (
            <div className={s.section}>
              <h2 className={s.sectionTitle}>Режим работы</h2>
              <div className={s.hoursRow}>
                <div className={s.field} style={{ flex: 1 }}>
                  <label className={s.label}>Начало работы</label>
                  <select className={s.select} value={hrs.start}
                    onChange={e => setHrs(h => ({ ...h, start: parseInt(e.target.value) }))}>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div className={s.field} style={{ flex: 1 }}>
                  <label className={s.label}>Конец работы</label>
                  <select className={s.select} value={hrs.end}
                    onChange={e => setHrs(h => ({ ...h, end: parseInt(e.target.value) }))}>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={s.field}>
                <label className={s.label}>Рабочие дни</label>
                <div className={s.daysRow}>
                  {DAY_NAMES.map((d, i) => (
                    <button key={i}
                      className={`${s.dayBtn} ${hrs.workDays.includes(i) ? s.dayActive : ''}`}
                      onClick={() => toggleDay(i)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <button className={s.saveBtn} onClick={saveHours} disabled={saving}>
                {saving ? 'Сохраняем…' : '✓ Сохранить'}
              </button>
            </div>
          )}

          {/* ── Уведомления ── */}
          {tab === 'notifications' && (
            <div className={s.section}>
              <h2 className={s.sectionTitle}>Уведомления</h2>
              <div className={s.telegramInfo}>
                <div className={s.telegramTitle}>🤖 Telegram-бот</div>
                <p className={s.telegramText}>
                  Для получения уведомлений в Telegram:
                </p>
                <ol className={s.telegramSteps}>
                  <li>Найдите бота: <code>@{process.env.TELEGRAM_BOT_USERNAME || 'motor_service_bot'}</code></li>
                  <li>Нажмите /start</li>
                  <li>Введите номер телефона в формате +79001234567</li>
                </ol>
                <div className={s.envNote}>
                  Задайте TELEGRAM_BOT_TOKEN в .env для активации бота
                </div>
              </div>
              <div className={s.toggleList}>
                {([
                  { key: 'newOrdersToTelegram', label: 'Новые заказы → Telegram персоналу',   sub: 'Мастера и приёмщики получают уведомление'    },
                  { key: 'statusToClient',       label: 'Статусы заказа → клиенту',           sub: 'Push или Telegram при смене статуса'         },
                  { key: 'dailyReport',          label: 'Ежедневный отчёт администратору',    sub: 'Итоги дня в 21:00 в Telegram'                },
                ] as const).map(({ key, label, sub }) => (
                  <div key={key} className={s.toggleRow}>
                    <div>
                      <div className={s.toggleLabel}>{label}</div>
                      <div className={s.toggleSub}>{sub}</div>
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
                {saving ? 'Сохраняем…' : '✓ Сохранить'}
              </button>
            </div>
          )}

          {/* ── Экспорт ── */}
          {tab === 'appearance' && (
            <div className={s.section}>
              <h2 className={s.sectionTitle}>🎨 Внешний вид</h2>

              <div className={s.field}>
                <label className={s.label}>Тема оформления</label>
                <div className={s.themeGrid}>
                  {([
                    { id: 'dark',   icon: '🌙', name: 'Тёмная'   },
                    { id: 'light',  icon: '☀️', name: 'Светлая'  },
                    { id: 'system', icon: '💻', name: 'Системная' },
                  ] as const).map(t => (
                    <button
                      key={t.id}
                      className={`${s.themeCard} ${theme === t.id ? s.themeCardActive : ''}`}
                      onClick={() => setTheme(t.id)}
                    >
                      <span className={s.themeIcon}>{t.icon}</span>
                      <span className={s.themeName}>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={s.field}>
                <label className={s.label}>Язык интерфейса</label>
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

            <div className={s.section}>
              <h2 className={s.sectionTitle}>Экспорт данных</h2>
              <div className={s.exportGrid}>
                <div className={s.exportCard}>
                  <div className={s.exportIcon}>👥</div>
                  <div className={s.exportTitle}>Клиентская база</div>
                  <div className={s.exportDesc}>Все клиенты с автомобилями, историей заказов и выручкой</div>
                  <a href="/api/v1/export/clients/xlsx" className={s.exportBtn} target="_blank" rel="noreferrer">
                    📥 Скачать .xlsx
                  </a>
                </div>
                <div className={s.exportCard}>
                  <div className={s.exportIcon}>📋</div>
                  <div className={s.exportTitle}>Заказы за период</div>
                  <div className={s.exportDesc}>Заказы с суммами, мастерами, прибылью</div>
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
                    📥 Скачать .xlsx
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
