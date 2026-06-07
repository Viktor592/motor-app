import { useState, useEffect, useCallback } from 'react';
import styles from './EdoPage.module.css';
import { api } from '../services/api';

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

const TAX_SYSTEM_LABELS: Record<string, string> = {
  USN_INCOME:       'УСН «Доходы» 6%',
  USN_INCOME_MINUS: 'УСН «Доходы − Расходы» 15%',
  PATENT:           'Патент (ПСН)',
  NPD:              'Самозанятый (НПД)',
  OSNO:             'ОСНО',
};
const DOC_TYPE_LABELS: Record<string, string> = {
  INVOICE: '📄 Счёт', ACT: '✅ Акт', UPD: '📋 УПД', INVOICE_RETURN: '↩️ Корр. акт',
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик', SENT: 'Отправлен', SIGNED: 'Подписан',
  REJECTED: 'Отклонён', CANCELLED: 'Отменён',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6b7280', SENT: '#2563eb', SIGNED: '#16a34a',
  REJECTED: '#dc2626', CANCELLED: '#9ca3af',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

export default function EdoPage() {
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
      const data = await api.post('/edo/tax/analyze', {
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
      const data = await api.get('/edo/documents?limit=30');
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
      const data = await api.get(`/edo/kudir?year=${kudirYear}`);
      setKudirData(data);
    } finally { setKudirLoading(false); }
  };

  useEffect(() => { if (tab === 'kudir') loadKudir(); }, [tab, kudirYear]);

  // ── Дедлайны ─────────────────────────────────────────────
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [taxSystem, setTaxSystem] = useState('');

  const loadDeadlines = async () => {
    const data = await api.get('/edo/deadlines');
    setDeadlines(data.deadlines); setTaxSystem(data.taxSystem);
  };
  useEffect(() => { if (tab === 'deadlines') loadDeadlines(); }, [tab]);

  // ── Настройки ────────────────────────────────────────────
  const [settings, setSettings] = useState<any>({});
  const [settingsSaving, setSettingsSaving] = useState(false);

  const loadSettings = async () => {
    const data = await api.get('/edo/settings'); setSettings(data);
  };
  const saveSettings = async () => {
    setSettingsSaving(true);
    try { await api.put('/edo/settings', settings); alert('✅ Сохранено'); }
    finally { setSettingsSaving(false); }
  };
  useEffect(() => { if (tab === 'settings') loadSettings(); }, [tab]);

  const updS = (k: string, v: any) => setSettings((s: any) => ({ ...s, [k]: v }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>ЭДО и Налоги</h1>
          <p className={styles.sub}>Электронный документооборот, КУДиР, отчётность ФНС, онлайн-касса</p>
        </div>
      </div>

      <div className={styles.tabs}>
        {([
          ['tax',       '🤖 AI-оптимизация'],
          ['deadlines', '📅 Сроки ФНС'],
          ['kudir',     '📒 КУДиР'],
          ['documents', '📄 Документы ЭДО'],
          ['fiscal',    '🏛️ Онлайн-касса'],
          ['settings',  '⚙️ Настройки'],
        ] as const).map(([key, label]) => (
          <button key={key} className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
            onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* ── AI-ОПТИМИЗАЦИЯ ── */}
      {tab === 'tax' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🤖 AI-агент налоговой оптимизации</h2>
          <p className={styles.sectionSub}>
            Введите данные — агент сравнит все режимы и порекомендует оптимальный
          </p>

          <div className={styles.taxForm}>
            <div className={styles.taxFormRow}>
              <div className={styles.field}>
                <label className={styles.label}>Выручка за период, ₽</label>
                <input className={styles.input} type="number" placeholder="3 000 000"
                  value={taxForm.revenue} onChange={e => setTaxForm(f => ({ ...f, revenue: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Расходы, ₽</label>
                <input className={styles.input} type="number" placeholder="1 500 000"
                  value={taxForm.expenses} onChange={e => setTaxForm(f => ({ ...f, expenses: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Сотрудников</label>
                <input className={styles.input} type="number" min="0" value={taxForm.employees}
                  onChange={e => setTaxForm(f => ({ ...f, employees: e.target.value }))} />
              </div>
            </div>
            <div className={styles.taxFormRow}>
              <div className={styles.field}>
                <label className={styles.label}>Страховые взносы ИП, ₽ (0 = авто)</label>
                <input className={styles.input} type="number" placeholder="49500"
                  value={taxForm.insuredAmount}
                  onChange={e => setTaxForm(f => ({ ...f, insuredAmount: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Код региона</label>
                <input className={styles.input} placeholder="77 (Москва), 78 (СПб)" maxLength={2}
                  value={taxForm.region} onChange={e => setTaxForm(f => ({ ...f, region: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Период</label>
                <select className={styles.select} value={taxForm.period}
                  onChange={e => setTaxForm(f => ({ ...f, period: e.target.value as any }))}>
                  <option value="year">Год</option>
                  <option value="quarter">Квартал</option>
                </select>
              </div>
            </div>
            <button className={styles.btnPrimary} onClick={runTaxAnalysis} disabled={!taxForm.revenue || taxLoading}>
              {taxLoading ? '🤖 Анализирую…' : '🤖 Рассчитать и оптимизировать'}
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
                    {r.system === taxResult.bestSystem && <div className={styles.bestBadge}>⭐ Оптимальный</div>}
                    <div className={styles.taxCardName}>{r.systemName}</div>
                    <div className={styles.taxCardTax}>{fmt(r.finalTax)}</div>
                    <div className={styles.taxCardEff}>Ставка {r.effectiveRate}% от выручки</div>
                    <div className={styles.taxCardProfit}>Чистая прибыль: {fmt(r.netProfit)}</div>
                    <div className={styles.taxCardDetails}>
                      {r.details.map((d, i) => <div key={i} className={styles.detail}>• {d}</div>)}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI-рекомендация */}
              <div className={styles.aiBox}>
                <div className={styles.aiBoxTitle}>
                  🤖 AI-рекомендация · Экономия vs худшего варианта: <strong>{fmt(taxResult.savings)}</strong>
                </div>
                <div className={styles.aiBoxText}>{taxResult.aiRecommendation}</div>
              </div>

              {/* Законные советы */}
              <div className={styles.tipsBox}>
                <div className={styles.tipsTitle}>💡 Законные способы снизить налог</div>
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
          <h2 className={styles.sectionTitle}>📅 Сроки отчётности и платежей</h2>
          <div className={styles.sectionSub}>Режим: {TAX_SYSTEM_LABELS[taxSystem] ?? taxSystem}</div>
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
                {d.urgent && <span className={styles.urgentBadge}>⚠️ Скоро!</span>}
              </div>
            ))}
            {deadlines.length === 0 && <div className={styles.empty}>Ближайших дедлайнов нет</div>}
          </div>
        </div>
      )}

      {/* ── КУДиР ── */}
      {tab === 'kudir' && (
        <div className={styles.section}>
          <div className={styles.kudirHeader}>
            <h2 className={styles.sectionTitle}>📒 Книга учёта доходов и расходов</h2>
            <div className={styles.kudirActions}>
              <select className={styles.select}
                value={kudirYear} onChange={e => setKudirYear(parseInt(e.target.value))}>
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <a className={styles.btnSecondary} href={`/api/v1/edo/kudir/xml?year=${kudirYear}`}
                target="_blank" rel="noreferrer">📥 XML для ФНС</a>
              <a className={styles.btnSecondary} href={`/api/v1/edo/declaration/usn?year=${kudirYear}`}
                target="_blank" rel="noreferrer">📋 Декларация УСН</a>
            </div>
          </div>

          {kudirLoading ? <div className={styles.loading}>Загрузка…</div> : kudirData && (
            <>
              <div className={styles.kudirTotals}>
                <div className={styles.kudirTotal}>
                  <span className={styles.kudirTotalLabel}>Доходы {kudirYear}</span>
                  <span className={styles.kudirTotalVal} style={{ color: '#16a34a' }}>
                    {fmt(kudirData.totalIncome)}
                  </span>
                </div>
                <div className={styles.kudirTotal}>
                  <span className={styles.kudirTotalLabel}>Расходы {kudirYear}</span>
                  <span className={styles.kudirTotalVal} style={{ color: '#dc2626' }}>
                    {fmt(kudirData.totalExpense)}
                  </span>
                </div>
                {kudirData.autoAdded > 0 && (
                  <div className={styles.autoAdded}>✅ Автоматически добавлено {kudirData.autoAdded} записей из закрытых заказов</div>
                )}
              </div>

              <table className={styles.table}>
                <thead>
                  <tr><th>№</th><th>Дата</th><th>Документ</th><th>Операция</th><th>Доход</th><th>Расход</th></tr>
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
                    <tr><td colSpan={6} className={styles.empty}>Записей нет</td></tr>
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
            <h2 className={styles.sectionTitle}>📄 Документы ЭДО ({docsTotal})</h2>
          </div>
          {docsLoading ? <div className={styles.loading}>Загрузка…</div> : (
            <table className={styles.table}>
              <thead><tr><th>Номер</th><th>Тип</th><th>Дата</th><th>Контрагент</th><th>Сумма</th><th>Статус</th></tr></thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id}>
                    <td><code>{d.docNumber}</code></td>
                    <td>{DOC_TYPE_LABELS[d.type] ?? d.type}</td>
                    <td>{new Date(d.docDate).toLocaleDateString('ru-RU')}</td>
                    <td>{d.counterpartyName ?? '—'}</td>
                    <td className={styles.income}>{fmt(Number(d.totalAmount))}</td>
                    <td>
                      <span className={styles.statusBadge}
                        style={{ background: STATUS_COLORS[d.status] + '22', color: STATUS_COLORS[d.status] }}>
                        {STATUS_LABELS[d.status] ?? d.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {docs.length === 0 && <tr><td colSpan={6} className={styles.empty}>Документов нет</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── ОНЛАЙН-КАССА ── */}
      {tab === 'fiscal' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🏛️ Онлайн-касса 54-ФЗ (Атол)</h2>
          <div className={styles.infoBox}>
            <strong>Фискализация чеков</strong> происходит автоматически при закрытии заказа (если настроен Атол).
            Здесь можно пробить чек вручную или проверить статус.
          </div>
          <div className={styles.fiscalEnvBox}>
            <div className={styles.envTitle}>Переменные окружения для Атол:</div>
            {[
              ['ATOL_LOGIN',        'Логин из личного кабинета Атол'],
              ['ATOL_PASSWORD',     'Пароль'],
              ['ATOL_GROUP',        'Код группы (groupCode)'],
              ['ATOL_INN',          'ИНН организации'],
              ['ATOL_TAX_SYSTEM',   'Система налогообложения: usn_income'],
              ['ATOL_ADDRESS',      'Адрес расчётов'],
              ['ATOL_COMPANY_EMAIL','Email организации'],
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
          <h2 className={styles.sectionTitle}>⚙️ Настройки ЭДО и реквизиты</h2>

          <div className={styles.settingsBlock}>
            <h3 className={styles.blockTitle}>Налоговый режим</h3>
            <div className={styles.taxSystemGrid}>
              {Object.entries(TAX_SYSTEM_LABELS).map(([key, label]) => (
                <button key={key}
                  className={`${styles.taxSystemCard} ${settings.taxSystem === key ? styles.taxSystemActive : ''}`}
                  onClick={() => updS('taxSystem', key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.settingsBlock}>
            <h3 className={styles.blockTitle}>Реквизиты организации</h3>
            <div className={styles.formGrid}>
              {[
                ['orgName',     'Наименование организации'],
                ['orgInn',      'ИНН'],
                ['orgKpp',      'КПП'],
                ['orgOgrn',     'ОГРН'],
                ['orgAddress',  'Юридический адрес'],
                ['orgDirector', 'ФИО директора'],
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
            <h3 className={styles.blockTitle}>Банковские реквизиты</h3>
            <div className={styles.formGrid}>
              {[
                ['bankName',    'Банк'],
                ['bankBik',     'БИК'],
                ['bankAccount', 'Расчётный счёт'],
                ['bankCorr',    'Корр. счёт'],
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
            <h3 className={styles.blockTitle}>ЭДО-оператор</h3>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Провайдер</label>
                <select className={styles.select} value={settings.provider ?? 'MANUAL'}
                  onChange={e => updS('provider', e.target.value)}>
                  <option value="MANUAL">Ручной (PDF)</option>
                  <option value="DIADOC">Контур.Диадок</option>
                  <option value="SBIS">СБИС</option>
                  <option value="KONTUR">Контур.ЭДО</option>
                </select>
              </div>
              {settings.provider === 'DIADOC' && (
                <>
                  <div className={styles.field}>
                    <label className={styles.label}>API-токен Диадок</label>
                    <input className={styles.input} type="password" value={settings.diadocToken ?? ''}
                      onChange={e => updS('diadocToken', e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>BoxId организации</label>
                    <input className={styles.input} value={settings.diadocBoxId ?? ''}
                      onChange={e => updS('diadocBoxId', e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </div>

          <button className={styles.btnPrimary} onClick={saveSettings} disabled={settingsSaving}>
            {settingsSaving ? 'Сохраняю…' : '💾 Сохранить'}
          </button>
        </div>
      )}
    </div>
  );
}
