import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';
import s from './MasterAnalyticsPage.module.css';

type Period = 'week' | 'month' | 'quarter';

interface MasterData {
  summary: {
    totalOrders: number; closedOrders: number; inProgress: number;
    totalRetail: number; margin: number; marginPct: number; avgCheck: number;
    commissionPct: number; salary: number;
  };
  bySpec:  Record<string, number>;
  daily:   { date: string; orders: number; revenue: number }[];
  topWork: { name: string; count: number }[];
}

export default function MasterAnalyticsPage() {
  const { t } = useLocale();
  const PERIOD_LABELS: Record<Period, string> = {
    week: t('analytics.period.week'), month: t('analytics.period.month'), quarter: t('analytics.period.quarter'),
  };
  const [period,  setPeriod]  = useState<Period>('month');
  const [data,    setData]    = useState<MasterData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/master/me?period=${period}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className={s.page}>
      <div className={s.topRow}>
        <div>
          <div className={s.eye}>// {t('analytics.eyebrow')}</div>
          <h1 className={s.h1}>{t('analytics.title')}</h1>
        </div>
        <div className={s.periods}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button key={p}
              className={`${s.pBtn} ${period === p ? s.pActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className={s.loading}>{t('common.loading')}</div>}

      {!loading && data && (
        <>
          {/* KPI строка */}
          <div className={s.kpiRow}>
            {[
              { label: t('analytics.kpi.orders'),     val: data.summary.totalOrders,                   color: 'var(--chalk)' },
              { label: t('analytics.kpi.closed'),      val: data.summary.closedOrders,                  color: 'var(--green)' },
              { label: t('order.status.IN_PROGRESS'),  val: data.summary.inProgress,                    color: 'var(--ore)' },
              { label: t('finance.revenue'),           val: data.summary.totalRetail.toLocaleString('ru') + ' ₽', color: 'var(--teal)' },
              { label: t('analytics.kpi.avg_check'),   val: data.summary.avgCheck.toLocaleString('ru') + ' ₽',   color: 'var(--blue)' },
              { label: t('analytics.kpi.salary'),      val: data.summary.salary.toLocaleString('ru') + ' ₽' + (data.summary.commissionPct ? ` (${data.summary.commissionPct}%)` : ''), color: 'var(--green)' },
            ].map(({ label, val, color }) => (
              <div key={label} className={s.kpi}>
                <div className={s.kpiVal} style={{ color }}>{val}</div>
                <div className={s.kpiLabel}>{label}</div>
              </div>
            ))}
          </div>

          <div className={s.grid}>
            {/* Топ видов работ */}
            <div className={s.card}>
              <div className={s.cardTitle}>🔩 {t('analytics.top_work')}</div>
              {data.topWork.length === 0
                ? <div className={s.empty}>{t('common.empty')}</div>
                : data.topWork.map((w, i) => {
                  const max = data.topWork[0]?.count || 1;
                  return (
                    <div key={i} className={s.workRow}>
                      <div className={s.workName}>{w.name}</div>
                      <div className={s.workBar}>
                        <div className={s.workFill} style={{ width: `${Math.round(w.count / max * 100)}%` }} />
                      </div>
                      <div className={s.workCnt}>{w.count}×</div>
                    </div>
                  );
                })
              }
            </div>

            {/* По специализации */}
            <div className={s.card}>
              <div className={s.cardTitle}>🗂 {t('analytics.by_type')}</div>
              {Object.entries(data.bySpec).map(([spec, cnt]) => {
                const labels: Record<string, string> = {
                  MECHANIC: `🔧 ${t('analytics.spec.mechanic')}`, ELECTRICIAN: `⚡ ${t('analytics.spec.electrician')}`, DIAGNOSTICS: `🔍 ${t('analytics.spec.diagnostics')}`,
                };
                const total = Object.values(data.bySpec).reduce((s, v) => s + v, 0) || 1;
                return (
                  <div key={spec} className={s.specRow}>
                    <div className={s.specLabel}>{labels[spec] ?? spec}</div>
                    <div className={s.specBar}>
                      <div className={s.specFill} style={{ width: `${Math.round(cnt / total * 100)}%` }} />
                    </div>
                    <div className={s.specCnt}>{cnt}</div>
                  </div>
                );
              })}
              {Object.keys(data.bySpec).length === 0 && <div className={s.empty}>{t('common.empty')}</div>}
            </div>
          </div>

          {/* Динамика по дням */}
          {data.daily.length > 0 && (
            <div className={s.card}>
              <div className={s.cardTitle}>📅 {t('analytics.daily_activity')}</div>
              <div className={s.dailyChart}>
                {data.daily.map((d, i) => {
                  const max = Math.max(...data.daily.map(x => x.revenue), 1);
                  return (
                    <div key={i} className={s.dayCol}>
                      <div className={s.dayRevenue} style={{ height: `${Math.round(d.revenue / max * 60)}px` }} />
                      <div className={s.dayLabel}>{d.date.slice(5)}</div>
                      <div className={s.dayCnt}>{d.orders}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
