import { useState, useEffect } from 'react';
import styles from './IntegrationPage.module.css';
import { api } from '../services/api';

type System = 'NONE' | 'ONS_1C' | 'OPTIM_GARAGE';

interface Settings {
  system:      System;
  oneC_url?:   string;
  oneC_user?:  string;
  oneC_pass?:  string;
  optimUrl?:   string;
  optimApiKey?:string;
  autoSync:    boolean;
  lastSyncAt?: string;
}
interface SyncLog {
  id: string; system: string; entityType: string;
  entityId: string; status: string; message: string | null; createdAt: string;
}

const SYSTEMS = [
  {
    id:    'NONE' as System,
    name:  'Не подключено',
    icon:  '🔌',
    desc:  'Работаем без внешней системы учёта',
    color: '#6b7280',
  },
  {
    id:    'ONS_1C' as System,
    name:  '1С:Предприятие',
    icon:  '🏢',
    desc:  'Интеграция через HTTP-сервис 1С. Передача заказов, клиентов, платежей.',
    color: '#d97706',
    badge: '1С',
  },
  {
    id:    'OPTIM_GARAGE' as System,
    name:  'Оптим Гараж',
    icon:  '🔧',
    desc:  'Российская система управления автосервисом. Синхронизация заказов и клиентов.',
    color: '#2563eb',
    badge: 'OG',
  },
];

export default function IntegrationPage() {
  const [settings, setSettings]   = useState<Settings>({ system: 'NONE', autoSync: false });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [testing, setTesting]     = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [logs, setLogs]           = useState<SyncLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [tab, setTab]             = useState<'settings' | 'logs'>('settings');
  const [syncing, setSyncing]     = useState(false);

  useEffect(() => { loadSettings(); }, []);
  useEffect(() => { if (tab === 'logs') loadLogs(); }, [tab]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/integration/settings');
      setSettings(data);
    } finally { setLoading(false); }
  };

  const loadLogs = async () => {
    const { data } = await api.get('/integration/logs?limit=30');
    setLogs(data.logs);
    setLogsTotal(data.total);
  };

  const save = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      await api.put('/integration/settings', settings);
      alert('✅ Настройки сохранены');
    } finally { setSaving(false); }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await api.post('/integration/test', {});
      setTestResult({ ok: data.ok, msg: data.ok ? 'Соединение успешно' : 'Соединение не установлено' });
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.message ?? 'Ошибка соединения' });
    } finally { setTesting(false); }
  };

  const syncBulk = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post('/integration/sync/bulk', {});
      alert(`✅ Синхронизировано: ${data.synced} заказов. Ошибок: ${data.errors}`);
      loadLogs();
    } catch (e: any) {
      alert(`❌ Ошибка: ${e.message}`);
    } finally { setSyncing(false); }
  };

  const syncPriceList = async () => {
    try {
      const { data } = await api.get('/integration/price-list');
      alert(`✅ Обновлено ${data.updated} позиций прайс-листа`);
    } catch (e: any) {
      alert(`❌ ${e.message}`);
    }
  };

  const upd = (key: keyof Settings, val: any) => setSettings(s => ({ ...s, [key]: val }));

  if (loading) return <div className={styles.loading}>Загрузка…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Интеграции</h1>
          <p className={styles.sub}>Подключение к системам учёта</p>
        </div>
        <div className={styles.tabs}>
          {(['settings', 'logs'] as const).map(t => (
            <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}>
              {t === 'settings' ? '⚙️ Настройки' : '📋 Журнал синхронизации'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'settings' && (
        <>
          {/* Выбор системы */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Система учёта</h2>
            <div className={styles.systemGrid}>
              {SYSTEMS.map(sys => (
                <div
                  key={sys.id}
                  className={`${styles.systemCard} ${settings.system === sys.id ? styles.systemActive : ''}`}
                  onClick={() => upd('system', sys.id)}
                  style={settings.system === sys.id ? { borderColor: sys.color } : {}}
                >
                  <div className={styles.systemTop}>
                    <span className={styles.systemIcon}>{sys.icon}</span>
                    {sys.badge && (
                      <span className={styles.systemBadge} style={{ background: sys.color }}>{sys.badge}</span>
                    )}
                    {settings.system === sys.id && <span className={styles.checkmark}>✓</span>}
                  </div>
                  <div className={styles.systemName}>{sys.name}</div>
                  <div className={styles.systemDesc}>{sys.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Настройки 1С */}
          {settings.system === 'ONS_1C' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>🏢 Настройки 1С:Предприятие</h2>
              <div className={styles.infoBox}>
                <strong>Как настроить:</strong> В конфигураторе 1С создайте HTTP-сервис с именем <code>motor</code>.
                Добавьте методы: <code>POST /order</code>, <code>POST /client</code>, <code>GET /price-list</code>.
                Опубликуйте на веб-сервере. URL будет вида <code>http://server/base/hs/motor/</code>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>URL HTTP-сервиса 1С</label>
                  <input className={styles.input} placeholder="http://192.168.1.10/Автосервис/hs/motor/"
                    value={settings.oneC_url ?? ''} onChange={e => upd('oneC_url', e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Пользователь 1С</label>
                  <input className={styles.input} placeholder="Администратор"
                    value={settings.oneC_user ?? ''} onChange={e => upd('oneC_user', e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Пароль</label>
                  <input className={styles.input} type="password" placeholder="••••••"
                    value={settings.oneC_pass ?? ''} onChange={e => upd('oneC_pass', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Настройки Оптим Гараж */}
          {settings.system === 'OPTIM_GARAGE' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>🔧 Настройки Оптим Гараж</h2>
              <div className={styles.infoBox}>
                <strong>Как получить API-ключ:</strong> Войдите в Оптим Гараж → Настройки → API-интеграции → Создать ключ.
                URL оставьте пустым для облачной версии.
              </div>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>API-ключ Оптим Гараж</label>
                  <input className={styles.input} placeholder="og_live_xxxxxxxxxxxxxxxx"
                    value={settings.optimApiKey ?? ''} onChange={e => upd('optimApiKey', e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>URL (для self-hosted, необязательно)</label>
                  <input className={styles.input} placeholder="https://api.optimgarage.ru/v1"
                    value={settings.optimUrl ?? ''} onChange={e => upd('optimUrl', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Общие настройки */}
          {settings.system !== 'NONE' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Параметры синхронизации</h2>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={settings.autoSync}
                  onChange={e => upd('autoSync', e.target.checked)} />
                <span>Автоматическая синхронизация при закрытии заказа</span>
              </label>
              {settings.lastSyncAt && (
                <div className={styles.lastSync}>
                  Последняя синхронизация: {new Date(settings.lastSyncAt).toLocaleString('ru-RU')}
                </div>
              )}
            </div>
          )}

          {/* Кнопки */}
          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={save} disabled={saving}>
              {saving ? 'Сохраняю…' : '💾 Сохранить настройки'}
            </button>
            {settings.system !== 'NONE' && (
              <>
                <button className={styles.btnSecondary} onClick={testConnection} disabled={testing}>
                  {testing ? 'Проверяю…' : '🔌 Тест соединения'}
                </button>
                <button className={styles.btnSecondary} onClick={syncBulk} disabled={syncing}>
                  {syncing ? 'Синхронизирую…' : '🔄 Синхронизировать заказы'}
                </button>
                <button className={styles.btnSecondary} onClick={syncPriceList}>
                  📋 Обновить прайс-лист
                </button>
              </>
            )}
          </div>

          {testResult && (
            <div className={`${styles.testResult} ${testResult.ok ? styles.testOk : styles.testErr}`}>
              {testResult.ok ? '✅' : '❌'} {testResult.msg}
            </div>
          )}
        </>
      )}

      {tab === 'logs' && (
        <div className={styles.section}>
          <div className={styles.logsHeader}>
            <span className={styles.logsTotal}>Записей: {logsTotal}</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>Время</th><th>Система</th><th>Тип</th><th>Статус</th><th>Сообщение</th></tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td className={styles.logTime}>
                    {new Date(l.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <span className={styles.systemTag}>
                      {l.system === 'ONS_1C' ? '🏢 1С' : l.system === 'OPTIM_GARAGE' ? '🔧 Оптим' : l.system}
                    </span>
                  </td>
                  <td>{l.entityType}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${l.status === 'OK' ? styles.statusOk : styles.statusErr}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className={styles.logMsg}>{l.message ?? '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className={styles.empty}>Синхронизаций не было</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
