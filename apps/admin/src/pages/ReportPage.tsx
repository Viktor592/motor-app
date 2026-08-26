import { useState, useEffect, useCallback } from 'react';
import styles from './ReportPage.module.css';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';

// ── Types ──────────────────────────────────────────────────────
interface Kpi {
  today:  { orders: number; revenue: number };
  week:   { orders: number; revenue: number };
  month:  { orders: number; revenue: number };
  active: number;
  pendingBookings: number;
  shiftOpen: boolean;
}
interface Report {
  summary: {
    revenue: number; cogs: number; expenses: number; netProfit: number;
    grossMarginPct: number; netMarginPct: number;
    totalOrders: number; avgCheck: number;
    growthPct: number | null; prevRevenue: number;
  };
  topServices: { name: string; count: number; revenue: number }[];
  topMasters:  { id: string; name: string; orders: number; revenue: number; avgCheck: number }[];
  byWeekday:   { day: string; orders: number; revenue: number }[];
  daily:       { date: string; orders: number; revenue: number }[];
}

const fmt  = (n: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
const fmtN = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

// ── Mini bar chart ─────────────────────────────────────────────
function MiniBar({ data, valueKey, labelKey, color = 'var(--accent)' }: {
  data: any[]; valueKey: string; labelKey: string; color?: string;
}) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className={styles.miniBar}>
      {data.map((d, i) => (
        <div key={i} className={styles.miniBarCol}>
          <div className={styles.miniBarFill} style={{ height: `${Math.round(d[valueKey] / max * 100)}%`, background: color }} />
          <div className={styles.miniBarLabel}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
}

// ── Sparkline ──────────────────────────────────────────────────
function Sparkline({ data, valueKey, color = 'var(--accent)' }: {
  data: any[]; valueKey: string; color?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const min = Math.min(...data.map(d => d[valueKey]));
  const w = 200; const h = 50;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d[valueKey] - min) / (max - min || 1)) * (h - 8) - 4;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.sparkline}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ReportPage() {
  const { t } = useLocale();
  const [kpi, setKpi]       = useState<Kpi | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(false);

  const loadKpi = useCallback(async () => {
    const { data } = await api.get('/analytics/kpi');
    setKpi(data);
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/analytics/report?period=${period}`);
      setReport(data);
    } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { loadKpi(); }, [loadKpi]);
  useEffect(() => { loadReport(); }, [loadReport]);

  const PERIOD_LABELS: Record<string, string> = {
    week: t('report.period.week'), month: t('report.period.month'),
    quarter: t('report.period.quarter'), year: t('report.period.year'),
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('report.title')}</h1>
          <p className={styles.sub}>{t('report.sub')}</p>
        </div>
        <div className={styles.periodRow}>
          {(['week','month','quarter','year'] as const).map(p => (
            <button key={p} className={`${styles.pBtn} ${period === p ? styles.pBtnActive : ''}`}
              onClick={() => setPeriod(p)}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      {kpi && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t('report.kpi.today_orders')}</div>
            <div className={styles.kpiValue}>{kpi.today.orders}</div>
            <div className={styles.kpiSub}>{fmt(kpi.today.revenue)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t('report.kpi.week')}</div>
            <div className={styles.kpiValue}>{fmt(kpi.week.revenue)}</div>
            <div className={styles.kpiSub}>{kpi.week.orders} {t('report.kpi.week_orders')}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t('report.kpi.month')}</div>
            <div className={styles.kpiValue}>{fmt(kpi.month.revenue)}</div>
            <div className={styles.kpiSub}>{kpi.month.orders} {t('report.kpi.week_orders')}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t('report.kpi.active')}</div>
            <div className={styles.kpiValue} style={{ color: '#2563eb' }}>{kpi.active}</div>
            <div className={styles.kpiSub}>{t('report.kpi.active_sub')}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t('report.kpi.pending')}</div>
            <div className={styles.kpiValue} style={{ color: '#d97706' }}>{kpi.pendingBookings}</div>
            <div className={styles.kpiSub}>{t('report.kpi.pending_sub')}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t('report.kpi.cashbox')}</div>
            <div className={styles.kpiValue} style={{ color: kpi.shiftOpen ? '#16a34a' : '#dc2626' }}>
              {kpi.shiftOpen ? t('report.kpi.shift_open') : t('report.kpi.shift_closed')}
            </div>
            <div className={styles.kpiSub}>{t('report.kpi.shift_sub')}</div>
          </div>
        </div>
      )}

      {loading ? <div className={styles.loading}>{t('report.loading')}</div> : report && (
        <>
          {/* Финансы */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('report.finance_title')}</h2>
              {report.summary.growthPct !== null && (
                <span className={`${styles.growthBadge} ${report.summary.growthPct >= 0 ? styles.growthPos : styles.growthNeg}`}>
                  {report.summary.growthPct >= 0 ? '↑' : '↓'} {Math.abs(report.summary.growthPct)}% {t('report.vs_prev')}
                </span>
              )}
            </div>
            <div className={styles.finGrid}>
              {[
                { label: t('report.fin.revenue'),   value: report.summary.revenue,                               color: '#2563eb', sub: `${t('report.fin.prev')} ${fmt(report.summary.prevRevenue)}` },
                { label: t('report.fin.cogs'),      value: report.summary.cogs,                                  color: '#6b7280', sub: '' },
                { label: t('report.fin.gross'),     value: report.summary.revenue - report.summary.cogs,         color: '#16a34a', sub: `${t('report.fin.margin_pct')} ${report.summary.grossMarginPct}%` },
                { label: t('report.fin.expenses'),  value: report.summary.expenses,                              color: '#dc2626', sub: '' },
                { label: t('report.fin.net'),       value: report.summary.netProfit,                             color: report.summary.netProfit >= 0 ? '#16a34a' : '#dc2626', sub: `${t('report.fin.margin_pct')} ${report.summary.netMarginPct}%` },
                { label: t('report.fin.avg_check'), value: report.summary.avgCheck,                              color: '#7c3aed', sub: `${fmtN(report.summary.totalOrders)} ${t('report.fin.orders_count')}` },
              ].map(m => (
                <div key={m.label} className={styles.finCard}>
                  <div className={styles.finLabel}>{m.label}</div>
                  <div className={styles.finValue} style={{ color: m.color }}>{fmt(m.value)}</div>
                  {m.sub && <div className={styles.finSub}>{m.sub}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Динамика выручки */}
          {report.daily.length > 1 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('report.revenue_dynamics')}</h2>
              <div className={styles.sparkWrap}>
                <Sparkline data={report.daily} valueKey="revenue" />
                <div className={styles.sparkMeta}>
                  <span className={styles.sparkMax}>{t('report.max')} {fmt(Math.max(...report.daily.map(d => d.revenue)))}</span>
                  <span className={styles.sparkMin}>{t('report.min')} {fmt(Math.min(...report.daily.map(d => d.revenue)))}</span>
                </div>
              </div>
              <div className={styles.dailyTable}>
                <table className={styles.table}>
                  <thead><tr><th>{t('report.th_date')}</th><th>{t('report.th_orders')}</th><th>{t('report.th_revenue')}</th></tr></thead>
                  <tbody>
                    {report.daily.slice(-14).reverse().map(d => (
                      <tr key={d.date}>
                        <td>{new Date(d.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' })}</td>
                        <td className={styles.center}>{d.orders}</td>
                        <td className={styles.revenue}>{fmt(d.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Загрузка по дням */}
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('report.weekday_load')}</h2>
              <MiniBar data={report.byWeekday} valueKey="orders" labelKey="day" color="#2563eb" />
              <table className={styles.table} style={{ marginTop: 12 }}>
                <thead><tr><th>{t('report.th_day')}</th><th>{t('report.th_orders')}</th><th>{t('report.th_revenue')}</th></tr></thead>
                <tbody>
                  {report.byWeekday.map(d => (
                    <tr key={d.day}>
                      <td>{d.day}</td>
                      <td className={styles.center}>{d.orders}</td>
                      <td>{fmt(d.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Топ услуги */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t('report.top_services')}</h2>
              <div className={styles.topList}>
                {report.topServices.map((svc, i) => (
                  <div key={svc.name} className={styles.topRow}>
                    <span className={styles.topRank}>#{i + 1}</span>
                    <div className={styles.topInfo}>
                      <div className={styles.topName}>{svc.name}</div>
                      <div className={styles.topBar}>
                        <div className={styles.topBarFill}
                          style={{ width: `${Math.round(svc.revenue / (report.topServices[0]?.revenue || 1) * 100)}%` }} />
                      </div>
                    </div>
                    <div className={styles.topNums}>
                      <div className={styles.topRevenue}>{fmt(svc.revenue)}</div>
                      <div className={styles.topCount}>{svc.count} {t('report.times')}</div>
                    </div>
                  </div>
                ))}
                {report.topServices.length === 0 && <div className={styles.empty}>{t('report.no_data')}</div>}
              </div>
            </div>
          </div>

          {/* Топ мастера */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('report.top_masters')}</h2>
            <table className={styles.table}>
              <thead>
                <tr><th>#</th><th>{t('report.th_master')}</th><th>{t('report.th_orders')}</th><th>{t('report.th_revenue')}</th><th>{t('report.th_avg_check')}</th><th>{t('report.th_share')}</th></tr>
              </thead>
              <tbody>
                {report.topMasters.map((m, i) => {
                  const pct = report.summary.revenue > 0 ? Math.round(m.revenue / report.summary.revenue * 100) : 0;
                  return (
                    <tr key={m.id}>
                      <td><span className={styles.rank}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span></td>
                      <td className={styles.masterName}>{m.name}</td>
                      <td className={styles.center}>{m.orders}</td>
                      <td className={styles.revenue}>{fmt(m.revenue)}</td>
                      <td>{fmt(m.avgCheck)}</td>
                      <td>
                        <div className={styles.shareWrap}>
                          <div className={styles.shareBar}><div className={styles.shareFill} style={{ width: `${pct}%` }} /></div>
                          <span className={styles.sharePct}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {report.topMasters.length === 0 && <tr><td colSpan={6} className={styles.empty}>{t('report.no_data')}</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
