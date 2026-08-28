import { useState, useEffect, useCallback } from 'react';
import styles from './FinancePage.module.css';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';

// ── Types ─────────────────────────────────────────────────────
interface Shift {
  id: string; status: 'OPEN' | 'CLOSED';
  openCash: number; closeCash: number | null;
  expectedCash: number | null; diffCash: number | null;
  openedAt: string; closedAt: string | null;
  incCash: number; incCard: number; expense: number; totalIncome: number;
}
interface Transaction {
  id: string; type: string; category: string | null;
  amount: number; description: string | null; createdAt: string;
}
interface PnlData {
  summary: {
    revenueCash: number; revenueCard: number; revenueTotal: number;
    cogs: number; grossProfit: number; totalExpenses: number;
    netProfit: number; netMarginPct: number; closedOrders: number; avgCheck: number;
  };
  expenseStructure: { category: string; amount: number; pct: number }[];
  budgetAnalysis: { category: string; budget: number; actual: number; diff: number }[];
  weekly: { week: string; revenue: number; expenses: number; profit: number }[];
}
interface Budget { id: string; category: string; monthlyAmount: number; }

const TX_LABEL_KEYS: Record<string, string> = {
  INCOME_CASH: 'finance.tx.income_cash', INCOME_CARD: 'finance.tx.income_card',
  EXPENSE: 'finance.tx.expense', WITHDRAWAL: 'finance.tx.withdrawal', DEPOSIT: 'finance.tx.deposit',
};
const CAT_LABEL_KEYS: Record<string, string> = {
  SALARY: 'finance.cat.salary', RENT: 'finance.cat.rent', PARTS_PURCHASE: 'finance.cat.parts',
  UTILITIES: 'finance.cat.utilities', MARKETING: 'finance.cat.marketing', EQUIPMENT: 'finance.cat.equipment', OTHER: 'finance.cat.other',
};
const CAT_ICONS: Record<string, string> = {
  SALARY: '👷', RENT: '🏠', PARTS_PURCHASE: '🔩',
  UTILITIES: '💡', MARKETING: '📣', EQUIPMENT: '🔧', OTHER: '📦',
};
const TX_COLORS: Record<string, string> = {
  INCOME_CASH: '#16a34a', INCOME_CARD: '#2563eb',
  EXPENSE: '#dc2626', WITHDRAWAL: '#d97706', DEPOSIT: '#7c3aed',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

export default function FinancePage() {
  const { t } = useLocale();
  const [tab, setTab] = useState<'shift' | 'history' | 'pnl' | 'budget'>('shift');

  // ── Текущая смена ─────────────────────────────────────────
  const [currentShift, setCurrentShift] = useState<(Shift & { transactions: Transaction[] }) | null>(null);
  const [loadingShift, setLoadingShift] = useState(false);

  const loadCurrentShift = useCallback(async () => {
    setLoadingShift(true);
    try {
      const { data } = await api.get('/finance/shifts/current');
      setCurrentShift(data);
    } finally { setLoadingShift(false); }
  }, []);

  useEffect(() => { if (tab === 'shift') loadCurrentShift(); }, [tab, loadCurrentShift]);

  // Открыть смену
  const [openCash, setOpenCash]   = useState('0');
  const [openComment, setOpenComment] = useState('');
  const handleOpenShift = async () => {
    await api.post('/finance/shifts/open', { openCash: parseFloat(openCash), comment: openComment });
    loadCurrentShift();
  };

  // Закрыть смену
  const [closeCash, setCloseCash]   = useState('');
  const [closeComment, setCloseComment] = useState('');
  const [showClose, setShowClose]   = useState(false);
  const handleCloseShift = async () => {
    if (!currentShift) return;
    await api.post(`/finance/shifts/${currentShift.id}/close`, {
      closeCash: parseFloat(closeCash), comment: closeComment,
    });
    setShowClose(false);
    loadCurrentShift();
  };

  // Добавить транзакцию
  const [txForm, setTxForm] = useState({ type: 'INCOME_CASH', amount: '', category: 'OTHER', description: '' });
  const [showTxForm, setShowTxForm] = useState(false);
  const handleAddTx = async () => {
    await api.post('/finance/transactions', {
      type:        txForm.type,
      amount:      parseFloat(txForm.amount),
      category:    ['EXPENSE'].includes(txForm.type) ? txForm.category : undefined,
      description: txForm.description || undefined,
    });
    setShowTxForm(false);
    setTxForm({ type: 'INCOME_CASH', amount: '', category: 'OTHER', description: '' });
    loadCurrentShift();
  };

  // ── История смен ──────────────────────────────────────────
  const [shifts, setShifts]       = useState<Shift[]>([]);
  const [shiftsTotal, setShiftsTotal] = useState(0);
  const [shiftsPage, setShiftsPage]   = useState(1);

  const loadShifts = useCallback(async () => {
    const { data } = await api.get(`/finance/shifts?page=${shiftsPage}&limit=20`);
    setShifts(data.shifts);
    setShiftsTotal(data.total);
  }, [shiftsPage]);

  useEffect(() => { if (tab === 'history') loadShifts(); }, [tab, loadShifts]);

  // ── P&L ───────────────────────────────────────────────────
  const [pnl, setPnl]           = useState<PnlData | null>(null);
  const [pnlPeriod, setPnlPeriod] = useState('month');

  const loadPnl = useCallback(async () => {
    const { data } = await api.get(`/finance/pnl?period=${pnlPeriod}`);
    setPnl(data);
  }, [pnlPeriod]);

  useEffect(() => { if (tab === 'pnl') loadPnl(); }, [tab, loadPnl]);

  // ── Бюджет ────────────────────────────────────────────────
  const [budgets, setBudgets]     = useState<Budget[]>([]);
  const [editBudget, setEditBudget] = useState<Record<string, string>>({});

  const loadBudgets = async () => {
    const { data } = await api.get('/finance/budget');
    setBudgets(data);
    const map: Record<string, string> = {};
    data.forEach((b: Budget) => { map[b.category] = String(b.monthlyAmount); });
    setEditBudget(map);
  };

  useEffect(() => { if (tab === 'budget') loadBudgets(); }, [tab]);

  const saveBudget = async (category: string) => {
    await api.put(`/finance/budget/${category}`, { monthlyAmount: parseFloat(editBudget[category]) });
    alert(t('settings.saved'));
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('finance.title')}</h1>
        <div className={styles.tabs}>
          {(['shift', 'history', 'pnl', 'budget'] as const).map(tabKey => (
            <button key={tabKey} className={`${styles.tab} ${tab === tabKey ? styles.tabActive : ''}`} onClick={() => setTab(tabKey)}>
              {tabKey === 'shift' && t('finance.tab.shift')}
              {tabKey === 'history' && t('finance.tab.history')}
              {tabKey === 'pnl' && t('finance.tab.pnl')}
              {tabKey === 'budget' && t('finance.tab.budget')}
            </button>
          ))}
        </div>
      </div>

      {/* ── КАССА ── */}
      {tab === 'shift' && (
        <div className={styles.shiftLayout}>
          {loadingShift ? <div className={styles.loading}>{t('finance.loading')}</div> : !currentShift ? (
            // Нет открытой смены
            <div className={styles.openShiftCard}>
              <div className={styles.shiftIcon}>🔒</div>
              <h2>{t('finance.shift_closed_title')}</h2>
              <p>{t('finance.shift_closed_sub')}</p>
              <div className={styles.openForm}>
                <label className={styles.label}>{t('finance.open_cash_label')}</label>
                <input className={styles.input} type="number" min="0" value={openCash}
                  onChange={e => setOpenCash(e.target.value)} />
                <label className={styles.label}>{t('finance.comment_label')}</label>
                <input className={styles.input} placeholder="Утренняя смена…" value={openComment}
                  onChange={e => setOpenComment(e.target.value)} />
                <button className={styles.btnPrimary} onClick={handleOpenShift}>
                  🔓 {t('finance.open_shift')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Статус смены */}
              <div className={styles.shiftStatus}>
                <div className={styles.shiftOpen}>
                  <span className={styles.dot} />
                  {t('finance.shift_open_since')} {new Date(currentShift.openedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <button className={styles.btnDanger} onClick={() => setShowClose(true)}>🔒 {t('finance.close_shift')}</button>
              </div>

              {/* Итоги смены */}
              <div className={styles.shiftStats}>
                {[
                  { label: t('finance.stat.cash_income'),  value: currentShift.transactions.filter(tx => tx.type === 'INCOME_CASH').reduce((s, tx) => s + Number(tx.amount), 0), color: '#16a34a' },
                  { label: t('finance.stat.card_income'),   value: currentShift.transactions.filter(tx => tx.type === 'INCOME_CARD').reduce((s, tx) => s + Number(tx.amount), 0), color: '#2563eb' },
                  { label: t('finance.expenses'),           value: currentShift.transactions.filter(tx => tx.type === 'EXPENSE').reduce((s, tx) => s + Number(tx.amount), 0),     color: '#dc2626' },
                  { label: t('finance.stat.total_income'),  value: currentShift.transactions.filter(tx => ['INCOME_CASH','INCOME_CARD'].includes(tx.type)).reduce((s, tx) => s + Number(tx.amount), 0), color: '#7c3aed' },
                ].map(s => (
                  <div key={s.label} className={styles.statCard}>
                    <div className={styles.statLabel}>{s.label}</div>
                    <div className={styles.statValue} style={{ color: s.color }}>{fmt(s.value)}</div>
                  </div>
                ))}
              </div>

              {/* Кнопка добавить транзакцию */}
              <div className={styles.txToolbar}>
                <span className={styles.txTitle}>{t('finance.tx_title', { count: currentShift.transactions.length })}</span>
                <button className={styles.btnPrimary} onClick={() => setShowTxForm(true)}>{t('finance.add_btn')}</button>
              </div>

              {/* Список транзакций */}
              <div className={styles.txList}>
                {currentShift.transactions.map(tx => (
                  <div key={tx.id} className={styles.txRow}>
                    <span className={styles.txType} style={{ color: TX_COLORS[tx.type] }}>
                      {t(TX_LABEL_KEYS[tx.type])}
                    </span>
                    {tx.category && <span className={styles.txCat}>{t(CAT_LABEL_KEYS[tx.category])}</span>}
                    <span className={styles.txDesc}>{tx.description}</span>
                    <span className={styles.txTime}>
                      {new Date(tx.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={styles.txAmount} style={{ color: TX_COLORS[tx.type] }}>
                      {['INCOME_CASH','INCOME_CARD','DEPOSIT'].includes(tx.type) ? '+' : '-'}{fmt(Number(tx.amount))}
                    </span>
                  </div>
                ))}
                {currentShift.transactions.length === 0 && <div className={styles.empty}>{t('finance.no_tx')}</div>}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ИСТОРИЯ СМЕН ── */}
      {tab === 'history' && (
        <div className={styles.section}>
          <table className={styles.table}>
            <thead>
              <tr><th>{t('finance.th.date')}</th><th>{t('finance.th.status')}</th><th>{t('finance.stat.cash_income')}</th><th>{t('finance.stat.card_income')}</th><th>{t('finance.expenses')}</th><th>{t('finance.th.total')}</th><th>{t('finance.th.diff')}</th></tr>
            </thead>
            <tbody>
              {shifts.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.openedAt).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <span className={`${styles.badge} ${s.status === 'OPEN' ? styles.badgeOpen : styles.badgeClosed}`}>
                      {s.status === 'OPEN' ? t('finance.status.open') : t('finance.status.closed')}
                    </span>
                  </td>
                  <td className={styles.green}>{fmt(s.incCash)}</td>
                  <td className={styles.blue}>{fmt(s.incCard)}</td>
                  <td className={styles.red}>{fmt(s.expense)}</td>
                  <td><strong>{fmt(s.totalIncome)}</strong></td>
                  <td className={s.diffCash && s.diffCash < 0 ? styles.red : styles.green}>
                    {s.diffCash != null ? (s.diffCash >= 0 ? '+' : '') + fmt(s.diffCash) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.pagination}>
            <button disabled={shiftsPage === 1} onClick={() => setShiftsPage(p => p - 1)}>{t('finance.pagination.back')}</button>
            <span>{t('finance.pagination.page', { page: shiftsPage, total: Math.ceil(shiftsTotal / 20) })}</span>
            <button disabled={shifts.length < 20} onClick={() => setShiftsPage(p => p + 1)}>{t('finance.pagination.forward')}</button>
          </div>
        </div>
      )}

      {/* ── P&L ── */}
      {tab === 'pnl' && (
        <div className={styles.section}>
          <div className={styles.pnlToolbar}>
            {(['week','month','quarter','year'] as const).map(p => (
              <button key={p} className={`${styles.periodBtn} ${pnlPeriod === p ? styles.periodActive : ''}`}
                onClick={() => setPnlPeriod(p)}>
                {t(`finance.period.${p}`)}
              </button>
            ))}
          </div>

          {pnl && (
            <>
              {/* Ключевые метрики */}
              <div className={styles.pnlGrid}>
                {[
                  { label: t('finance.revenue'),        value: pnl.summary.revenueTotal,  color: '#2563eb', sub: t('finance.metric.revenue_sub', { cash: fmt(pnl.summary.revenueCash), card: fmt(pnl.summary.revenueCard) }) },
                  { label: t('finance.metric.cogs'),         value: pnl.summary.cogs,          color: '#6b7280', sub: t('finance.metric.cogs_sub') },
                  { label: t('finance.metric.gross_profit'), value: pnl.summary.grossProfit, color: '#16a34a', sub: '' },
                  { label: t('finance.expenses'),            value: pnl.summary.totalExpenses, color: '#dc2626', sub: '' },
                  { label: t('finance.metric.net_profit'),   value: pnl.summary.netProfit,     color: pnl.summary.netProfit >= 0 ? '#16a34a' : '#dc2626', sub: t('finance.metric.margin_sub', { pct: pnl.summary.netMarginPct }) },
                  { label: t('finance.metric.avg_check'),    value: pnl.summary.avgCheck,      color: '#7c3aed', sub: t('finance.metric.orders_sub', { count: pnl.summary.closedOrders }) },
                ].map(m => (
                  <div key={m.label} className={styles.pnlCard}>
                    <div className={styles.pnlLabel}>{m.label}</div>
                    <div className={styles.pnlValue} style={{ color: m.color }}>{fmt(m.value)}</div>
                    {m.sub && <div className={styles.pnlSub}>{m.sub}</div>}
                  </div>
                ))}
              </div>

              {/* Расходы по категориям */}
              <div className={styles.expenseSection}>
                <h3 className={styles.sectionTitle}>{t('finance.expense_structure_title')}</h3>
                <div className={styles.expenseList}>
                  {pnl.expenseStructure.map(e => (
                    <div key={e.category} className={styles.expenseRow}>
                      <span className={styles.expenseIcon}>{CAT_ICONS[e.category] ?? '📦'}</span>
                      <span className={styles.expenseName}>{t(CAT_LABEL_KEYS[e.category] ?? '') || e.category}</span>
                      <div className={styles.expenseBar}>
                        <div className={styles.expenseFill} style={{ width: `${e.pct}%` }} />
                      </div>
                      <span className={styles.expensePct}>{e.pct}%</span>
                      <span className={styles.expenseAmt}>{fmt(e.amount)}</span>
                    </div>
                  ))}
                  {pnl.expenseStructure.length === 0 && <div className={styles.empty}>{t('finance.no_expenses')}</div>}
                </div>
              </div>

              {/* Бюджет vs факт */}
              {pnl.budgetAnalysis.length > 0 && (
                <div className={styles.budgetSection}>
                  <h3 className={styles.sectionTitle}>{t('finance.budget_vs_actual_title')}</h3>
                  <table className={styles.table}>
                    <thead><tr><th>{t('finance.th.category')}</th><th>{t('finance.th.budget')}</th><th>{t('finance.th.actual')}</th><th>{t('finance.th.deviation')}</th></tr></thead>
                    <tbody>
                      {pnl.budgetAnalysis.map(b => (
                        <tr key={b.category}>
                          <td>{CAT_ICONS[b.category]} {t(CAT_LABEL_KEYS[b.category] ?? '') || b.category}</td>
                          <td>{fmt(b.budget)}</td>
                          <td>{fmt(b.actual)}</td>
                          <td className={b.diff > 0 ? styles.red : styles.green}>
                            {b.diff > 0 ? '+' : ''}{fmt(b.diff)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Динамика по неделям */}
              {pnl.weekly.length > 0 && (
                <div className={styles.weeklySection}>
                  <h3 className={styles.sectionTitle}>{t('finance.weekly_dynamics_title')}</h3>
                  <table className={styles.table}>
                    <thead><tr><th>{t('finance.period.week')}</th><th>{t('finance.revenue')}</th><th>{t('finance.expenses')}</th><th>{t('finance.profit')}</th></tr></thead>
                    <tbody>
                      {pnl.weekly.map(w => (
                        <tr key={w.week}>
                          <td>{new Date(w.week).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</td>
                          <td className={styles.blue}>{fmt(w.revenue)}</td>
                          <td className={styles.red}>{fmt(w.expenses)}</td>
                          <td className={w.profit >= 0 ? styles.green : styles.red}>{fmt(w.profit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── БЮДЖЕТ ── */}
      {tab === 'budget' && (
        <div className={styles.section}>
          <div className={styles.budgetInfo}>{t('finance.budget_info')}</div>
          <table className={styles.table}>
            <thead><tr><th>{t('finance.th.category')}</th><th>{t('finance.th.monthly_amount')}</th><th></th></tr></thead>
            <tbody>
              {budgets.map(b => (
                <tr key={b.category}>
                  <td>{CAT_ICONS[b.category]} {t(CAT_LABEL_KEYS[b.category] ?? '') || b.category}</td>
                  <td>
                    <input className={styles.budgetInput} type="number" min="0"
                      value={editBudget[b.category] ?? ''} onChange={e => setEditBudget(prev => ({ ...prev, [b.category]: e.target.value }))} />
                  </td>
                  <td>
                    <button className={styles.btnSm} onClick={() => saveBudget(b.category)}>{t('finance.save_btn')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── МОДАЛ ЗАКРЫТИЯ СМЕНЫ ── */}
      {showClose && (
        <div className={styles.overlay} onClick={() => setShowClose(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{t('finance.close_shift_modal_title')}</h3>
            <label className={styles.label}>{t('finance.actual_cash_label')}</label>
            <input className={styles.input} type="number" min="0" value={closeCash}
              onChange={e => setCloseCash(e.target.value)} />
            <label className={styles.label}>{t('finance.comment_label')}</label>
            <input className={styles.input} placeholder="Всё в порядке…" value={closeComment}
              onChange={e => setCloseComment(e.target.value)} />
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setShowClose(false)}>{t('finance.cancel_btn')}</button>
              <button className={styles.btnDanger} onClick={handleCloseShift}>🔒 {t('finance.close_shift')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── МОДАЛ ТРАНЗАКЦИИ ── */}
      {showTxForm && (
        <div className={styles.overlay} onClick={() => setShowTxForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{t('finance.add_tx_modal_title')}</h3>
            <label className={styles.label}>{t('finance.type_label')}</label>
            <select className={styles.select} value={txForm.type}
              onChange={e => setTxForm(f => ({ ...f, type: e.target.value }))}>
              {Object.entries(TX_LABEL_KEYS).map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}
            </select>
            {txForm.type === 'EXPENSE' && (
              <>
                <label className={styles.label}>{t('finance.category_label')}</label>
                <select className={styles.select} value={txForm.category}
                  onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))}>
                  {Object.entries(CAT_LABEL_KEYS).map(([v, k]) => <option key={v} value={v}>{CAT_ICONS[v]} {t(k)}</option>)}
                </select>
              </>
            )}
            <label className={styles.label}>{t('finance.amount_label')}</label>
            <input className={styles.input} type="number" min="0" value={txForm.amount}
              onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} />
            <label className={styles.label}>{t('finance.description_label')}</label>
            <input className={styles.input} placeholder="Зарплата Иванов…" value={txForm.description}
              onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} />
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setShowTxForm(false)}>{t('finance.cancel_btn')}</button>
              <button className={styles.btnPrimary} onClick={handleAddTx} disabled={!txForm.amount}>{t('finance.add_confirm_btn')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
