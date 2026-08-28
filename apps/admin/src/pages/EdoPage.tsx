import { useState, useEffect, useCallback } from 'react';
import styles from './EdoPage.module.css';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';

type Tab = 'tax' | 'documents' | 'fiscal' | 'kudir' | 'settings' | 'deadlines';

interface TaxResult {
  system: string; systemName: string;
  taxBase: number; taxRate: number; taxAmount: number;
  deductions: number; finalTax: number;
  effectiveRate: number; netProfit: number; details: string[];
}
interface TaxAnalysis {
  results: TaxResult[]; bestSystem: string;
  savings: number; aiRecommendation: string;
  legalTips: string[]; warnings: string[];
}
interface EdoDoc {
  id: string; type: string; status: string; docNumber: string;
  docDate: string; totalAmount: number; counterpartyName: string | null;
}
interface Deadline {
  date: string; title: string; type: string; urgent: boolean;
}

const TAX_SYSTEM_KEYS: Record<string, string> = {
  USN_INCOME:       'edo.tax_system.usn_income',
  USN_INCOME_MINUS: 'edo.tax_system.usn_income_minus',
  PATENT:           'edo.tax_system.patent',
  NPD:              'edo.tax_system.npd',
  OSNO:             'edo.tax_system.osno',
};
const DOC_TYPE_KEYS: Record<string, string> = {
  INVOICE: 'edo.doc_type.invoice', ACT: 'edo.doc_type.act', UPD: 'edo.doc_type.upd', INVOICE_RETURN: 'edo.doc_type.invoice_return',
};
const STATUS_KEYS: Record<string, string> = {
  DRAFT: 'edo.status.draft', SENT: 'edo.status.sent', SIGNED: 'edo.status.signed',
  REJECTED: 'edo.status.rejected', CANCELLED: 'edo.status.cancelled',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6b7280', SENT: '#2563eb', SIGNED: '#16a34a',
  REJECTED: '#dc2626', CANCELLED: '#9ca3af',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

export default function EdoPage() {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>('tax');

  // ── Налоговый анализ ──────────────────────────────────────
  const [taxForm, setTaxForm] = useState({
    revenue: '', expenses: '', employees: '0',
    insuredAmount: '0', region: '77', period: 'year' as 'year' | 'quarter',
  });
  const [taxResult, setTaxResult] = useState<TaxAnalysis | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);

  const runTaxAnalysis = async () => {
    setTaxLoading(true);
    try {
      const { data } = await api.post('/edo/tax/analyze', {
        revenue:       parseFloat(taxForm.revenue) || 0,
        expenses:      parseFloat(taxForm.expenses) || 0,
        employees:     parseInt(taxForm.employees) || 0,
        insuredAmount: parseFloat(taxForm.insuredAmount) || 0,
        region:        taxForm.region,
        period:        taxForm.period,
      });
      setTaxResult(data);
    } finally { setTaxLoading(false); }
  };

  // ── Документы ────────────────────────────────────────────
  const [docs, setDocs]       = useState<EdoDoc[]>([]);
  const [docsTotal, setDocsTotal] = useState(0);
  const [docsLoading, setDocsLoading] = useState(false);

  const loadDocs = useCallback(async () => {
    setDocsLoading(true);
    try {
      const { data } = await api.get('/edo/documents?limit=30');
      setDocs(data.docs); setDocsTotal(data.total);
    } finally { setDocsLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'documents') loadDocs(); }, [tab, loadDocs]);

  // ── КУДиР ────────────────────────────────────────────────
  const [kudirYear, setKudirYear]   = useState(new Date().getFullYear());
  const [kudirData, setKudirData]   = useState<any>(null);
  const [kudirLoading, setKudirLoading] = useState(false);

  const loadKudir = async () => {
    setKudirLoading(true);
    try {
      const { data } = await api.get(`/edo/kudir?year=${kudirYear}`);
      setKudirData(data);
    } finally { setKudirLoading(false); }
  };

  useEffect(() => { if (tab === 'kudir') loadKudir(); }, [tab, kudirYear]);

  // ── Дедлайны ─────────────────────────────────────────────
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [taxSystem, setTaxSystem] = useState('');

  const loadDeadlines = async () => {
    const { data } = await api.get('/edo/deadlines');
    setDeadlines(data.deadlines); setTaxSystem(data.taxSystem);
  };
  useEffect(() => { if (tab === 'deadlines') loadDeadlines(); }, [tab]);

  // ── Настройки ────────────────────────────────────────────
  const [settings, setSettings] = useState<any>({});
  const [settingsSaving, setSettingsSaving] = useState(false);

  const loadSettings = async () => {
    const { data } = await api.get('/edo/settings'); setSettings(data);
  };
  const saveSettings = async () => {
    setSettingsSaving(true);
    try { await api.put('/edo/settings', settings); alert(`✅ ${t('settings.saved')}`); }
    finally { setSettingsSaving(false); }
  };
  useEffect(() => { if (tab === 'settings') loadSettings(); }, [tab]);

  const updS = (k: string, v: any) => setSettings((s: any) => ({ ...s, [k]: v }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('edo.title')}</h1>
          <p className={styles.sub}>{t('edo.subtitle')}</p>
        </div>
      </div>

      <div className={styles.tabs}>
        {([
          ['tax',       'edo.tab.tax'],
          ['deadlines', 'edo.tab.deadlines'],
          ['kudir',     'edo.tab.kudir'],
          ['documents', 'edo.tab.documents'],
          ['fiscal',    'edo.tab.fiscal'],
          ['settings',  'edo.tab.settings'],
        ] as const).map(([key, labelKey]) => (
          <button key={key} className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
            onClick={() => setTab(key)}>{t(labelKey)}</button>
        ))}
      </div>

      {/* ── AI-ОПТИМИЗАЦИЯ ── */}
      {tab === 'tax' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('edo.tax.title')}</h2>
          <p className={styles.sectionSub}>
            {t('edo.tax.subtitle')}
          </p>

          <div className={styles.taxForm}>
            <div className={styles.taxFormRow}>
              <div className={styles.field}>
                <label className={styles.label}>{t('edo.tax.field.revenue')}</label>
                <input className={styles.input} type="number" placeholder="3 000 000"
                  value={taxForm.revenue} onChange={e => setTaxForm(f => ({ ...f, revenue: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('edo.tax.field.expenses')}</label>
                <input className={styles.input} type="number" placeholder="1 500 000"
                  value={taxForm.expenses} onChange={e => setTaxForm(f => ({ ...f, expenses: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('edo.tax.field.employees')}</label>
                <input className={styles.input} type="number" min="0" value={taxForm.employees}
                  onChange={e => setTaxForm(f => ({ ...f, employees: e.target.value }))} />
              </div>
            </div>
            <div className={styles.taxFormRow}>
              <div className={styles.field}>
                <label className={styles.label}>{t('edo.tax.field.insured')}</label>
                <input className={styles.input} type="number" placeholder="49500"
                  value={taxForm.insuredAmount}
                  onChange={e => setTaxForm(f => ({ ...f, insuredAmount: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('edo.tax.field.region')}</label>
                <input className={styles.input} placeholder="77 (Москва), 78 (СПб)" maxLength={2}
                  value={taxForm.region} onChange={e => setTaxForm(f => ({ ...f, region: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t('edo.tax.field.period')}</label>
                <select className={styles.select} value={taxForm.period}
                  onChange={e => setTaxForm(f => ({ ...f, period: e.target.value as any }))}>
                  <option value="year">{t('edo.tax.period.year')}</option>
                  <option value="quarter">{t('edo.tax.period.quarter')}</option>
                </select>
              </div>
            </div>
            <button className={styles.btnPrimary} onClick={runTaxAnalysis} disabled={!taxForm.revenue || taxLoading}>
              {taxLoading ? t('edo.tax.analyzing') : t('edo.tax.calculate_btn')}
            </button>
          </div>

          {taxResult && (
            <>
              {/* Предупреждения */}
              {taxResult.warnings.length > 0 && (
                <div className={styles.warningBox}>
                  {taxResult.warnings.map((w, i) => <div key={i}>{w}</div>)}
                </div>
              )}

              {/* Сравнение режимов */}
              <div className={styles.taxGrid}>
                {taxResult.results.map(r => (
                  <div key={r.system}
                    className={`${styles.taxCard} ${r.system === taxResult.bestSystem ? styles.taxCardBest : ''}`}>
                    {r.system === taxResult.bestSystem && <div className={styles.bestBadge}>{t('edo.tax.best_badge')}</div>}
                    <div className={styles.taxCardName}>{r.systemName}</div>
                    <div className={styles.taxCardTax}>{fmt(r.finalTax)}</div>
                    <div className={styles.taxCardEff}>{t('edo.tax.rate_of_revenue', { rate: r.effectiveRate })}</div>
                    <div className={styles.taxCardProfit}>{t('edo.tax.net_profit')} {fmt(r.netProfit)}</div>
                    <div className={styles.taxCardDetails}>
                      {r.details.map((d, i) => <div key={i} className={styles.detail}>• {d}</div>)}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI-рекомендация */}
              <div className={styles.aiBox}>
                <div className={styles.aiBoxTitle}>
                  {t('edo.tax.ai_recommendation_prefix')} <strong>{fmt(taxResult.savings)}</strong>
                </div>
                <div className={styles.aiBoxText}>{taxResult.aiRecommendation}</div>
              </div>

              {/* Законные советы */}
              <div className={styles.tipsBox}>
                <div className={styles.tipsTitle}>{t('edo.tax.tips_title')}</div>
                {taxResult.legalTips.map((tip, i) => (
                  <div key={i} className={styles.tip}>✅ {tip}</div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── СРОКИ ФНС ── */}
      {tab === 'deadlines' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('edo.deadlines.title')}</h2>
          <div className={styles.sectionSub}>{t('edo.deadlines.mode_prefix')} {t(TAX_SYSTEM_KEYS[taxSystem] ?? '') || taxSystem}</div>
          <div className={styles.deadlineList}>
            {deadlines.map((d, i) => (
              <div key={i} className={`${styles.deadlineRow} ${d.urgent ? styles.deadlineUrgent : ''}`}>
                <div className={styles.deadlineDate}>
                  {new Date(d.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                </div>
                <div className={styles.deadlineInfo}>
                  <div className={styles.deadlineTitle}>{d.title}</div>
                  <div className={styles.deadlineType}>{d.type}</div>
                </div>
                {d.urgent && <span className={styles.urgentBadge}>{t('edo.deadlines.urgent_badge')}</span>}
              </div>
            ))}
            {deadlines.length === 0 && <div className={styles.empty}>{t('edo.deadlines.empty')}</div>}
          </div>
        </div>
      )}

      {/* ── КУДиР ── */}
      {tab === 'kudir' && (
        <div className={styles.section}>
          <div className={styles.kudirHeader}>
            <h2 className={styles.sectionTitle}>{t('edo.kudir.title')}</h2>
            <div className={styles.kudirActions}>
              <select className={styles.select}
                value={kudirYear} onChange={e => setKudirYear(parseInt(e.target.value))}>
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <a className={styles.btnSecondary} href={`/api/v1/edo/kudir/xml?year=${kudirYear}`}
                target="_blank" rel="noreferrer">{t('edo.kudir.xml_btn')}</a>
              <a className={styles.btnSecondary} href={`/api/v1/edo/declaration/usn?year=${kudirYear}`}
                target="_blank" rel="noreferrer">{t('edo.kudir.declaration_btn')}</a>
            </div>
          </div>

          {kudirLoading ? <div className={styles.loading}>{t('edo.loading')}</div> : kudirData && (
            <>
              <div className={styles.kudirTotals}>
                <div className={styles.kudirTotal}>
                  <span className={styles.kudirTotalLabel}>{t('edo.kudir.income_label', { year: kudirYear })}</span>
                  <span className={styles.kudirTotalVal} style={{ color: '#16a34a' }}>
                    {fmt(kudirData.totalIncome)}
                  </span>
                </div>
                <div className={styles.kudirTotal}>
                  <span className={styles.kudirTotalLabel}>{t('edo.kudir.expense_label', { year: kudirYear })}</span>
                  <span className={styles.kudirTotalVal} style={{ color: '#dc2626' }}>
                    {fmt(kudirData.totalExpense)}
                  </span>
                </div>
                {kudirData.autoAdded > 0 && (
                  <div className={styles.autoAdded}>{t('edo.kudir.auto_added', { n: kudirData.autoAdded })}</div>
                )}
              </div>

              <table className={styles.table}>
                <thead>
                  <tr><th>{t('edo.kudir.th_num')}</th><th>{t('edo.kudir.th_date')}</th><th>{t('edo.kudir.th_doc')}</th><th>{t('edo.kudir.th_operation')}</th><th>{t('edo.kudir.th_income')}</th><th>{t('edo.kudir.th_expense')}</th></tr>
                </thead>
                <tbody>
                  {kudirData.entries.map((e: any, i: number) => (
                    <tr key={e.id}>
                      <td>{i + 1}</td>
                      <td>{new Date(e.entryDate).toLocaleDateString('ru-RU')}</td>
                      <td><code>{e.docNumber}</code></td>
                      <td>{e.operation}</td>
                      <td className={styles.income}>{e.income ? fmt(Number(e.income)) : '—'}</td>
                      <td className={styles.expense}>{e.expense ? fmt(Number(e.expense)) : '—'}</td>
                    </tr>
                  ))}
                  {kudirData.entries.length === 0 && (
                    <tr><td colSpan={6} className={styles.empty}>{t('edo.kudir.empty')}</td></tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* ── ДОКУМЕНТЫ ЭДО ── */}
      {tab === 'documents' && (
        <div className={styles.section}>
          <div className={styles.docsHeader}>
            <h2 className={styles.sectionTitle}>{t('edo.docs.title', { total: docsTotal })}</h2>
          </div>
          {docsLoading ? <div className={styles.loading}>{t('edo.loading')}</div> : (
            <table className={styles.table}>
              <thead><tr><th>{t('edo.docs.th_number')}</th><th>{t('edo.docs.th_type')}</th><th>{t('edo.docs.th_date')}</th><th>{t('edo.docs.th_counterparty')}</th><th>{t('edo.docs.th_amount')}</th><th>{t('edo.docs.th_status')}</th></tr></thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id}>
                    <td><code>{d.docNumber}</code></td>
                    <td>{t(DOC_TYPE_KEYS[d.type] ?? '') || d.type}</td>
                    <td>{new Date(d.docDate).toLocaleDateString('ru-RU')}</td>
                    <td>{d.counterpartyName ?? '—'}</td>
                    <td className={styles.income}>{fmt(Number(d.totalAmount))}</td>
                    <td>
                      <span className={styles.statusBadge}
                        style={{ background: STATUS_COLORS[d.status] + '22', color: STATUS_COLORS[d.status] }}>
                        {t(STATUS_KEYS[d.status] ?? '') || d.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {docs.length === 0 && <tr><td colSpan={6} className={styles.empty}>{t('edo.docs.empty')}</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── ОНЛАЙН-КАССА ── */}
      {tab === 'fiscal' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('edo.fiscal.title')}</h2>
          <div className={styles.infoBox}>
            <strong>{t('edo.fiscal.info_strong')}</strong>{t('edo.fiscal.info_rest')}
          </div>
          <div className={styles.fiscalEnvBox}>
            <div className={styles.envTitle}>{t('edo.fiscal.env_title')}</div>
            {[
              ['ATOL_LOGIN',        t('edo.fiscal.env.login')],
              ['ATOL_PASSWORD',     t('edo.fiscal.env.password')],
              ['ATOL_GROUP',        t('edo.fiscal.env.group')],
              ['ATOL_INN',          t('edo.fiscal.env.inn')],
              ['ATOL_TAX_SYSTEM',   t('edo.fiscal.env.tax_system')],
              ['ATOL_ADDRESS',      t('edo.fiscal.env.address')],
              ['ATOL_COMPANY_EMAIL',t('edo.fiscal.env.email')],
            ].map(([k, v]) => (
              <div key={k} className={styles.envRow}>
                <code className={styles.envKey}>{k}</code>
                <span className={styles.envDesc}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── НАСТРОЙКИ ── */}
      {tab === 'settings' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('edo.settings.title')}</h2>

          <div className={styles.settingsBlock}>
            <h3 className={styles.blockTitle}>{t('edo.settings.tax_regime')}</h3>
            <div className={styles.taxSystemGrid}>
              {Object.entries(TAX_SYSTEM_KEYS).map(([key, labelKey]) => (
                <button key={key}
                  className={`${styles.taxSystemCard} ${settings.taxSystem === key ? styles.taxSystemActive : ''}`}
                  onClick={() => updS('taxSystem', key)}>
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.settingsBlock}>
            <h3 className={styles.blockTitle}>{t('edo.settings.org_requisites')}</h3>
            <div className={styles.formGrid}>
              {[
                ['orgName',     t('edo.settings.field.org_name')],
                ['orgInn',      t('edo.settings.field.org_inn')],
                ['orgKpp',      t('edo.settings.field.org_kpp')],
                ['orgOgrn',     t('edo.settings.field.org_ogrn')],
                ['orgAddress',  t('edo.settings.field.org_address')],
                ['orgDirector', t('edo.settings.field.org_director')],
              ].map(([key, label]) => (
                <div key={key} className={styles.field}>
                  <label className={styles.label}>{label}</label>
                  <input className={styles.input} value={settings[key] ?? ''}
                    onChange={e => updS(key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.settingsBlock}>
            <h3 className={styles.blockTitle}>{t('edo.settings.bank_requisites')}</h3>
            <div className={styles.formGrid}>
              {[
                ['bankName',    t('edo.settings.field.bank_name')],
                ['bankBik',     t('edo.settings.field.bank_bik')],
                ['bankAccount', t('edo.settings.field.bank_account')],
                ['bankCorr',    t('edo.settings.field.bank_corr')],
              ].map(([key, label]) => (
                <div key={key} className={styles.field}>
                  <label className={styles.label}>{label}</label>
                  <input className={styles.input} value={settings[key] ?? ''}
                    onChange={e => updS(key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.settingsBlock}>
            <h3 className={styles.blockTitle}>{t('edo.settings.edo_operator')}</h3>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>{t('edo.settings.field.provider')}</label>
                <select className={styles.select} value={settings.provider ?? 'MANUAL'}
                  onChange={e => updS('provider', e.target.value)}>
                  <option value="MANUAL">{t('edo.settings.provider.manual')}</option>
                  <option value="DIADOC">{t('edo.settings.provider.diadoc')}</option>
                  <option value="SBIS">{t('edo.settings.provider.sbis')}</option>
                  <option value="KONTUR">{t('edo.settings.provider.kontur')}</option>
                </select>
              </div>
              {settings.provider === 'DIADOC' && (
                <>
                  <div className={styles.field}>
                    <label className={styles.label}>{t('edo.settings.field.diadoc_token')}</label>
                    <input className={styles.input} type="password" value={settings.diadocToken ?? ''}
                      onChange={e => updS('diadocToken', e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>{t('edo.settings.field.diadoc_box_id')}</label>
                    <input className={styles.input} value={settings.diadocBoxId ?? ''}
                      onChange={e => updS('diadocBoxId', e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </div>

          <button className={styles.btnPrimary} onClick={saveSettings} disabled={settingsSaving}>
            {settingsSaving ? t('edo.settings.saving') : t('edo.settings.save_btn')}
          </button>
        </div>
      )}
    </div>
  );
}
