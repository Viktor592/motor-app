import { useState, useEffect } from 'react';
import styles from './IntegrationPage.module.css';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';

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
    id:      'NONE' as System,
    nameKey: 'integration.system.none.name',
    icon:    '🔌',
    descKey: 'integration.system.none.desc',
    color:   '#6b7280',
  },
  {
    id:      'ONS_1C' as System,
    nameKey: 'integration.system.onec.name',
    icon:    '🏢',
    descKey: 'integration.system.onec.desc',
    color:   '#d97706',
    badge:   '1С',
  },
  {
    id:      'OPTIM_GARAGE' as System,
    nameKey: 'integration.system.optim.name',
    icon:    '🔧',
    descKey: 'integration.system.optim.desc',
    color:   '#2563eb',
    badge:   'OG',
  },
];

export default function IntegrationPage() {
  const { t } = useLocale();
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
      alert(`✅ ${t('integration.settings_saved')}`);
    } finally { setSaving(false); }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await api.post('/integration/test', {});
      setTestResult({ ok: data.ok, msg: data.ok ? t('integration.test_success') : t('integration.test_failed') });
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.message ?? t('integration.connection_error') });
    } finally { setTesting(false); }
  };

  const syncBulk = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post('/integration/sync/bulk', {});
      alert(`✅ ${t('integration.sync_result', { synced: data.synced, errors: data.errors })}`);
      loadLogs();
    } catch (e: any) {
      alert(`❌ ${t('integration.sync_error', { msg: e.message })}`);
    } finally { setSyncing(false); }
  };

  const syncPriceList = async () => {
    try {
      const { data } = await api.get('/integration/price-list');
      alert(`✅ ${t('integration.pricelist_updated', { count: data.updated })}`);
    } catch (e: any) {
      alert(`❌ ${e.message}`);
    }
  };

  const upd = (key: keyof Settings, val: any) => setSettings(s => ({ ...s, [key]: val }));

  if (loading) return <div className={styles.loading}>{t('edo.loading')}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('integration.title')}</h1>
          <p className={styles.sub}>{t('integration.subtitle')}</p>
        </div>
        <div className={styles.tabs}>
          {(['settings', 'logs'] as const).map(tabKey => (
            <button key={tabKey} className={`${styles.tab} ${tab === tabKey ? styles.tabActive : ''}`}
              onClick={() => setTab(tabKey)}>
              {tabKey === 'settings' ? t('integration.tab.settings') : t('integration.tab.logs')}
            </button>
          ))}
        </div>
      </div>

      {tab === 'settings' && (
        <>
          {/* Выбор системы */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('integration.section.system_title')}</h2>
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
                  <div className={styles.systemName}>{t(sys.nameKey)}</div>
                  <div className={styles.systemDesc}>{t(sys.descKey)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Настройки 1С */}
          {settings.system === 'ONS_1C' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('integration.section.onec_title')}</h2>
              <div className={styles.infoBox}>
                <strong>{t('integration.onec_info_strong')}</strong> {t('integration.onec_info_step1')} <code>motor</code>
                {t('integration.onec_info_step2')} <code>POST /order</code>, <code>POST /client</code>, <code>GET /price-list</code>
                {t('integration.onec_info_step3')} <code>http://server/base/hs/motor/</code>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>{t('integration.field.onec_url')}</label>
                  <input className={styles.input} placeholder="http://192.168.1.10/Автосервис/hs/motor/"
                    value={settings.oneC_url ?? ''} onChange={e => upd('oneC_url', e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{t('integration.field.onec_user')}</label>
                  <input className={styles.input} placeholder="Администратор"
                    value={settings.oneC_user ?? ''} onChange={e => upd('oneC_user', e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{t('integration.field.onec_pass')}</label>
                  <input className={styles.input} type="password" placeholder="••••••"
                    value={settings.oneC_pass ?? ''} onChange={e => upd('oneC_pass', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Настройки Оптим Гараж */}
          {settings.system === 'OPTIM_GARAGE' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('integration.section.optim_title')}</h2>
              <div className={styles.infoBox}>
                <strong>{t('integration.optim_info_strong')}</strong>{t('integration.optim_info_rest')}
              </div>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label}>{t('integration.field.optim_key')}</label>
                  <input className={styles.input} placeholder="og_live_xxxxxxxxxxxxxxxx"
                    value={settings.optimApiKey ?? ''} onChange={e => upd('optimApiKey', e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{t('integration.field.optim_url')}</label>
                  <input className={styles.input} placeholder="https://api.optimgarage.ru/v1"
                    value={settings.optimUrl ?? ''} onChange={e => upd('optimUrl', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Общие настройки */}
          {settings.system !== 'NONE' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('integration.section.sync_params')}</h2>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={settings.autoSync}
                  onChange={e => upd('autoSync', e.target.checked)} />
                <span>{t('integration.auto_sync_label')}</span>
              </label>
              {settings.lastSyncAt && (
                <div className={styles.lastSync}>
                  {t('integration.last_sync')} {new Date(settings.lastSyncAt).toLocaleString('ru-RU')}
                </div>
              )}
            </div>
          )}

          {/* Кнопки */}
          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={save} disabled={saving}>
              {saving ? t('integration.saving') : t('integration.save_btn')}
            </button>
            {settings.system !== 'NONE' && (
              <>
                <button className={styles.btnSecondary} onClick={testConnection} disabled={testing}>
                  {testing ? t('integration.testing') : t('integration.test_btn')}
                </button>
                <button className={styles.btnSecondary} onClick={syncBulk} disabled={syncing}>
                  {syncing ? t('integration.syncing') : t('integration.sync_orders_btn')}
                </button>
                <button className={styles.btnSecondary} onClick={syncPriceList}>
                  {t('integration.update_pricelist_btn')}
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
            <span className={styles.logsTotal}>{t('integration.logs_count', { count: logsTotal })}</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>{t('integration.th.time')}</th><th>{t('integration.th.system')}</th><th>{t('integration.th.type')}</th><th>{t('integration.th.status')}</th><th>{t('integration.th.message')}</th></tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td className={styles.logTime}>
                    {new Date(l.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <span className={styles.systemTag}>
                      {l.system === 'ONS_1C' ? t('integration.system_tag.onec') : l.system === 'OPTIM_GARAGE' ? t('integration.system_tag.optim') : l.system}
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
              {logs.length === 0 && <tr><td colSpan={5} className={styles.empty}>{t('integration.no_syncs')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
