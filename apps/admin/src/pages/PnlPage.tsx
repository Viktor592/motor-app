import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import s from './PnlPage.module.css';

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

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Неделя', month: 'Месяц', quarter: 'Квартал', year: 'Год',
};

const SPEC_LABELS: Record<string, string> = {
  MECHANIC: '🔧 Слесарь', ELECTRICIAN: '⚡ Электрик', DIAGNOSTICS: '🔍 Диагност',
};

export default function PnlPage() {
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
      <div className={s.eye}>// P&L Дашборд</div>
      <h1 className={s.h1}>АНАЛИТИКА</h1>
      <div className={s.loading}>Загрузка…</div>
    </div>
  );

  const { summary, bySpec, byMaster, weekly, statusCounts } = data;
  const maxRevenue = Math.max(...weekly.map(w => w.revenue), 1);

  return (
    <div className={s.page}>
      <div className={s.topRow}>
        <div>
          <div className={s.eye}>// P&L · Управленческий дашборд</div>
          <h1 className={s.h1}>АНАЛИТИКА</h1>
        </div>
        <div className={s.periodBtns}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button key={p}
              className={`${s.periodBtn} ${period === p ? s.periodActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI карточки */}
      <div className={s.kpiGrid}>
        <div className={`${s.kpi} ${s.kpiGreen}`}>
          <div className={s.kpiLabel}>Выручка</div>
          <div className={s.kpiVal}>{summary.revenue.toLocaleString('ru')} ₽</div>
          <div className={s.kpiSub}>{summary.closedOrders} закрытых заказов</div>
        </div>
        <div className={`${s.kpi} ${s.kpiTeal}`}>
          <div className={s.kpiLabel}>Прибыль</div>
          <div className={s.kpiVal}>{summary.profit.toLocaleString('ru')} ₽</div>
          <div className={s.kpiSub}>маржа {summary.marginPct}%</div>
        </div>
        <div className={`${s.kpi} ${s.kpiOre}`}>
          <div className={s.kpiLabel}>Средний чек</div>
          <div className={s.kpiVal}>{summary.avgCheck.toLocaleString('ru')} ₽</div>
          <div className={s.kpiSub}>{summary.totalOrders} заказов всего</div>
        </div>
        <div className={`${s.kpi} ${s.kpiBlue}`}>
          <div className={s.kpiLabel}>Конверсия</div>
          <div className={s.kpiVal}>{summary.conversion}%</div>
          <div className={s.kpiSub}>заявки → оплата</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>Новых клиентов</div>
          <div className={s.kpiVal}>{summary.newClients}</div>
          <div className={s.kpiSub}>всего {summary.totalClients}</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiLabel}>Себестоимость</div>
          <div className={s.kpiVal}>{summary.cost.toLocaleString('ru')} ₽</div>
          <div className={s.kpiSub}>запчасти + нормо-часы</div>
        </div>
      </div>

      <div className={s.grid2}>
        {/* График выручки по неделям */}
        <div className={s.card}>
          <div className={s.cardTitle}>📈 Динамика выручки</div>
          {weekly.length === 0 ? (
            <div className={s.empty}>Нет данных за период</div>
          ) : (
            <div className={s.chart}>
              {weekly.map((w, i) => (
                <div key={i} className={s.bar}>
                  <div className={s.barTooltip}>
                    <b>{w.revenue.toLocaleString('ru')} ₽</b>
                    <span>{w.orders} заказов</span>
                    <span>прибыль {w.profit.toLocaleString('ru')} ₽</span>
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
          <div className={s.cardTitle}>🔽 Воронка заказов</div>
          {[
            { key: 'NEW',         label: 'Новых',          color: 'var(--blue)'  },
            { key: 'CONFIRMED',   label: 'Подтверждено',   color: 'var(--teal)'  },
            { key: 'IN_PROGRESS', label: 'В работе',       color: 'var(--ore)'   },
            { key: 'READY',       label: 'Готово',         color: 'var(--green)' },
            { key: 'CLOSED',      label: 'Оплачено',       color: 'var(--green)' },
            { key: 'CANCELLED',   label: 'Отменено',       color: 'var(--red)'   },
          ].map(({ key, label, color }) => {
            const cnt    = statusCounts[key] ?? 0;
            const total  = summary.totalOrders || 1;
            const pct    = Math.round(cnt / total * 100);
            return (
              <div key={key} className={s.funnelRow}>
                <div className={s.funnelLabel}>{label}</div>
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
          <div className={s.cardTitle}>🔧 Выручка по специализации</div>
          {Object.entries(bySpec).length === 0 ? (
            <div className={s.empty}>Нет данных</div>
          ) : (
            Object.entries(bySpec)
              .sort((a, b) => b[1].revenue - a[1].revenue)
              .map(([spec, v]) => {
                const maxSpec = Math.max(...Object.values(bySpec).map(x => x.revenue), 1);
                return (
                  <div key={spec} className={s.specRow}>
                    <div className={s.specLabel}>{SPEC_LABELS[spec] ?? spec}</div>
                    <div className={s.specBar}>
                      <div className={s.specFill} style={{ width: `${Math.round(v.revenue / maxSpec * 100)}%` }} />
                    </div>
                    <div className={s.specRight}>
                      <span className={s.specRevenue}>{v.revenue.toLocaleString('ru')} ₽</span>
                      <span className={s.specOrders}>{v.orders} заказов</span>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Рейтинг мастеров */}
        <div className={s.card}>
          <div className={s.cardTitle}>🏆 Рейтинг мастеров</div>
          {byMaster.length === 0 ? (
            <div className={s.empty}>Нет данных</div>
          ) : (
            byMaster.map((m, i) => (
              <div key={m.id} className={s.masterRow}>
                <div className={s.masterRank} style={{ color: i === 0 ? 'var(--gold)' : i === 1 ? 'var(--dust)' : 'var(--soot)' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : `#${i + 1}`}
                </div>
                <div className={s.masterName}>{m.name}</div>
                <div className={s.masterStats}>
                  <span className={s.masterRevenue}>{m.revenue.toLocaleString('ru')} ₽</span>
                  <span className={s.masterOrders}>{m.orders} зак.</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
