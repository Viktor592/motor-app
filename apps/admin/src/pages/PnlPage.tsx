import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import s from './PnlPage.module.css';
import { useLocale } from '../services/i18n';

type Period = 'week' | 'month' | 'quarter' | 'year';

interface PnlData {
  period: string;
  summary: {
    revenue: number; cost: number; profit: number; marginPct: number;
    avgCheck: number; totalOrders: number; closedOrders: number;
    conversion: number; newClients: number; totalClients: number;
  };
  statusCounts: Record<string, number>;
  bySpec:  Record<string, { revenue: number; orders: number }>;
  byMaster: { id: string; name: string; orders: number; revenue: number }[];
  weekly:  { week: string; revenue: number; orders: number; profit: number }[];
}

const PERIOD_KEYS: Record<Period, string> = {
  week: 'finance.period.week', month: 'finance.period.month', quarter: 'finance.period.quarter', year: 'finance.period.year',
};

const SPEC_KEYS: Record<string, string> = {
  MECHANIC: 'pnl.spec.mechanic', ELECTRICIAN: 'pnl.spec.electrician', DIAGNOSTICS: 'pnl.spec.diagnostics',
};

export default function PnlPage() {
  const { t } = useLocale();
  const [period,  setPeriod]  = useState<Period>('month');
  const [data,    setData]    = useState<PnlData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/pnl?period=${period}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading || !data) return (
    <div className={s.page}>
      <div className={s.eye}>{t('pnl.eyebrow')}</div>
      <h1 className={s.h1}>{t('pnl.title')}</h1>
      <div className={s.loading}>{t('edo.loading')}</div>
    </div>
  );

  const { summary, bySpec, byMaster, weekly, statusCounts } = data;
  const maxRevenue = Math.max(...weekly.map(w => w.revenue), 1);

  return (
    <div className={s.page}>
      <div className={s.topRow}>
        <div>
          <div className={s.eye}>{t('pnl.eyebrow_full')}</div>
          <h1 className={s.h1}>{t('pnl.title')}</h1>
        </div>
        <div className={s.periodBtns}>
          {(Object.keys(PERIOD_KEYS) as Period[]).map(p => (
            <button key={p}
              className={`${s.periodBtn} ${period === p ? s.periodActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {t(PERIOD_KEYS[p])}
            </button>
          ))}
        </div>
      </div>

      {/* KPI карточки */}
      <div className={s.kpiGrid}>
        <div className={`${s.kpi} ${s.kpiGreen}`}>
          <div className={s.kpiLabel}>{t('finance.revenue')}</div>
          <div className={s.kpiVal}>{summary.revenue.toLocaleString('ru')} ₽</div>
          <div className={s.kpiSub}>{t('pnl.kpi.revenue_sub', { count: summary.closedOrders })}</div>
        </div>
        <div className={`${s.kpi} ${s.kpiTeal}`}>
          <div className={s.kpiLabel}>{t('finance.profit')}</div>
          <div className={s.kpiVal}>{summary.profit.toLocaleString('ru')} ₽</div>
          <div className={s.kpiSub}>{t('pnl.kpi.margin_sub', { pct: summary.marginPct })}</div>
        </div>
        <div className={`${s.kpi} ${s.kpiOre}`}>
          <div className={s.kpiLabel}>{t('pnl.kpi.avg_check')}</div>
          <div className={s.kpiVal}>{summary.avgCheck.toLocaleString('ru')} ₽</div>
          <div className={s.kpiSub}>{t('pnl.kpi.avg_check_sub', { count: summary.totalOrders })}</div>
        </div>
        <div className={`${s.kpi} ${s.kpiBlue}`}>
          <div className={s.kpiLabel}>{t('pnl.kpi.conversion')}</div>
          <div className={s.kpiVal}>{summary.conversion}%</div>
          <div className={s.kpiSub}>{t('pnl.kpi.conversion_sub')}</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>{t('pnl.kpi.new_clients')}</div>
          <div className={s.kpiVal}>{summary.newClients}</div>
          <div className={s.kpiSub}>{t('pnl.kpi.new_clients_sub', { count: summary.totalClients })}</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>{t('pnl.kpi.cost')}</div>
          <div className={s.kpiVal}>{summary.cost.toLocaleString('ru')} ₽</div>
          <div className={s.kpiSub}>{t('pnl.kpi.cost_sub')}</div>
        </div>
      </div>

      <div className={s.grid2}>
        {/* График выручки по неделям */}
        <div className={s.card}>
          <div className={s.cardTitle}>{t('pnl.chart.revenue_title')}</div>
          {weekly.length === 0 ? (
            <div className={s.empty}>{t('pnl.no_data_period')}</div>
          ) : (
            <div className={s.chart}>
              {weekly.map((w, i) => (
                <div key={i} className={s.bar}>
                  <div className={s.barTooltip}>
                    <b>{w.revenue.toLocaleString('ru')} ₽</b>
                    <span>{t('finance.metric.orders_sub', { count: w.orders })}</span>
                    <span>{t('pnl.chart.profit_label')} {w.profit.toLocaleString('ru')} ₽</span>
                  </div>
                  <div className={s.barFill} style={{ height: `${Math.round(w.revenue / maxRevenue * 100)}%` }} />
                  <div className={s.barProfitFill} style={{ height: `${Math.round(w.profit / maxRevenue * 100)}%` }} />
                  <div className={s.barLabel}>{w.week.slice(5)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Воронка статусов */}
        <div className={s.card}>
          <div className={s.cardTitle}>{t('pnl.funnel.title')}</div>
          {[
            { key: 'NEW',         labelKey: 'pnl.funnel.new',         color: 'var(--blue)'  },
            { key: 'CONFIRMED',   labelKey: 'pnl.funnel.confirmed',   color: 'var(--teal)'  },
            { key: 'IN_PROGRESS', labelKey: 'pnl.funnel.in_progress', color: 'var(--ore)'   },
            { key: 'READY',       labelKey: 'pnl.funnel.ready',       color: 'var(--green)' },
            { key: 'CLOSED',      labelKey: 'pnl.funnel.closed',      color: 'var(--green)' },
            { key: 'CANCELLED',   labelKey: 'pnl.funnel.cancelled',   color: 'var(--red)'   },
          ].map(({ key, labelKey, color }) => {
            const cnt    = statusCounts[key] ?? 0;
            const total  = summary.totalOrders || 1;
            const pct    = Math.round(cnt / total * 100);
            return (
              <div key={key} className={s.funnelRow}>
                <div className={s.funnelLabel}>{t(labelKey)}</div>
                <div className={s.funnelBar}>
                  <div className={s.funnelFill} style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className={s.funnelCount}>{cnt}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={s.grid2}>
        {/* По специализации */}
        <div className={s.card}>
          <div className={s.cardTitle}>{t('pnl.spec.title')}</div>
          {Object.entries(bySpec).length === 0 ? (
            <div className={s.empty}>{t('pnl.no_data')}</div>
          ) : (
            Object.entries(bySpec)
              .sort((a, b) => b[1].revenue - a[1].revenue)
              .map(([spec, v]) => {
                const maxSpec = Math.max(...Object.values(bySpec).map(x => x.revenue), 1);
                return (
                  <div key={spec} className={s.specRow}>
                    <div className={s.specLabel}>{t(SPEC_KEYS[spec] ?? '') || spec}</div>
                    <div className={s.specBar}>
                      <div className={s.specFill} style={{ width: `${Math.round(v.revenue / maxSpec * 100)}%` }} />
                    </div>
                    <div className={s.specRight}>
                      <span className={s.specRevenue}>{v.revenue.toLocaleString('ru')} ₽</span>
                      <span className={s.specOrders}>{t('finance.metric.orders_sub', { count: v.orders })}</span>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Рейтинг мастеров */}
        <div className={s.card}>
          <div className={s.cardTitle}>{t('pnl.masters.title')}</div>
          {byMaster.length === 0 ? (
            <div className={s.empty}>{t('pnl.no_data')}</div>
          ) : (
            byMaster.map((m, i) => (
              <div key={m.id} className={s.masterRow}>
                <div className={s.masterRank} style={{ color: i === 0 ? 'var(--gold)' : i === 1 ? 'var(--dust)' : 'var(--soot)' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : `#${i + 1}`}
                </div>
                <div className={s.masterName}>{m.name}</div>
                <div className={s.masterStats}>
                  <span className={s.masterRevenue}>{m.revenue.toLocaleString('ru')} ₽</span>
                  <span className={s.masterOrders}>{t('pnl.masters.orders_short', { count: m.orders })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
