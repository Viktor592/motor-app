import { useState, useEffect } from 'react';
import styles from './PlansPage.module.css';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';

interface Plan {
  id: string; name: string; priceRub: number;
  maxMasters: number; maxOrdersPerMonth: number; features: string[];
}
interface TenantInfo {
  tenant: { plan: string; status: string; trialEndsAt: string | null; paidUntil: string | null; name: string };
  trialDaysLeft: number | null;
  usage: { masters: number; maxMasters: number; orders: number; maxOrders: number };
}

const PLAN_ICONS: Record<string, string> = {
  STARTER: '🚀', PRO: '⚡', BUSINESS: '🏆', ENTERPRISE: '💎',
};
const PLAN_COLORS: Record<string, string> = {
  STARTER: '#2563eb', PRO: '#7c3aed', BUSINESS: '#d97706', ENTERPRISE: '#0891b2',
};

export default function PlansPage() {
  const { t } = useLocale();
  const [plans, setPlans]   = useState<Plan[]>([]);
  const [info, setInfo]     = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/saas/billing/plans'),
      api.get('/saas/me'),
    ]).then(([p, i]) => { setPlans(p); setInfo(i); }).finally(() => setLoading(false));
  }, []);

  const upgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      const { data } = await api.post('/saas/billing/upgrade', { plan: planId });
      if (data.confirmUrl) window.location.href = data.confirmUrl;
    } catch (e: any) {
      alert(t('plans_page.err_prefix') + e.message);
    } finally { setUpgrading(''); }
  };

  if (loading) return <div className={styles.loading}>{t('common.loading')}</div>;

  const currentPlan = info?.tenant.plan ?? 'TRIAL';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('plans_page.title')}</h1>
        <p className={styles.sub}>{t('plans_page.subtitle')}</p>
      </div>

      {/* Текущий статус */}
      {info && (
        <div className={styles.statusCard}>
          <div className={styles.statusLeft}>
            <span className={styles.statusLabel}>{t('plans_page.current_plan_label')}</span>
            <span className={styles.statusPlan}>{currentPlan}</span>
            {info.trialDaysLeft !== null && (
              <span className={styles.trialBadge}>
                {t('plans_page.trial_prefix')} {info.trialDaysLeft} {info.trialDaysLeft === 1 ? t('plans_page.trial.day') : info.trialDaysLeft < 5 ? t('plans_page.trial.days_few') : t('plans_page.trial.days_many')}
              </span>
            )}
            {info.tenant.paidUntil && (
              <span className={styles.paidBadge}>
                {t('plans_page.paid_until', { date: new Date(info.tenant.paidUntil).toLocaleDateString('ru-RU') })}
              </span>
            )}
          </div>
          <div className={styles.usageRow}>
            <div className={styles.usageItem}>
              <div className={styles.usageLabel}>{t('plans_page.usage_masters')}</div>
              <div className={styles.usageBar}>
                <div className={styles.usageFill}
                  style={{ width: `${Math.min(100, info.usage.masters / info.usage.maxMasters * 100)}%` }} />
              </div>
              <div className={styles.usageVal}>{info.usage.masters} / {info.usage.maxMasters === 99 ? '∞' : info.usage.maxMasters}</div>
            </div>
            <div className={styles.usageItem}>
              <div className={styles.usageLabel}>{t('plans_page.usage_orders_month')}</div>
              <div className={styles.usageBar}>
                <div className={styles.usageFill}
                  style={{ width: `${Math.min(100, info.usage.orders / info.usage.maxOrders * 100)}%` }} />
              </div>
              <div className={styles.usageVal}>{info.usage.orders} / {info.usage.maxOrders === 9999 ? '∞' : info.usage.maxOrders}</div>
            </div>
          </div>
        </div>
      )}

      {/* Карточки тарифов */}
      <div className={styles.plansGrid}>
        {plans.map(plan => {
          const isCurrent = plan.id === currentPlan;
          const color     = PLAN_COLORS[plan.id] ?? '#6b7280';
          return (
            <div key={plan.id} className={`${styles.planCard} ${isCurrent ? styles.planCurrent : ''}`}
              style={isCurrent ? { borderColor: color } : {}}>
              {isCurrent && <div className={styles.currentBadge} style={{ background: color }}>{t('plans_page.current_badge')}</div>}
              {plan.id === 'BUSINESS' && !isCurrent && <div className={styles.popularBadge}>{t('plans_page.popular_badge')}</div>}

              <div className={styles.planIcon}>{PLAN_ICONS[plan.id]}</div>
              <div className={styles.planName}>{plan.name}</div>
              <div className={styles.planPrice}>
                <span className={styles.planAmount}>{plan.priceRub.toLocaleString('ru-RU')}</span>
                <span className={styles.planPer}> {t('plans_page.price_per_month')}</span>
              </div>

              <div className={styles.planLimits}>
                <span>{plan.maxMasters === 99 ? t('plans_page.unlimited') : t('plans_page.up_to', { n: plan.maxMasters })} {plan.maxMasters === 1 ? t('plans_page.master_singular') : t('plans_page.master_plural')}</span>
                <span>·</span>
                <span>{plan.maxOrdersPerMonth === 9999 ? '∞' : plan.maxOrdersPerMonth} {t('plans_page.orders_month_suffix')}</span>
              </div>

              <ul className={styles.featureList}>
                {plan.features.map(f => (
                  <li key={f} className={styles.feature}><span className={styles.featureCheck}>✓</span>{f}</li>
                ))}
              </ul>

              <button
                className={`${styles.planBtn} ${isCurrent ? styles.planBtnCurrent : ''}`}
                style={!isCurrent ? { background: color } : {}}
                disabled={isCurrent || upgrading === plan.id}
                onClick={() => upgrade(plan.id)}
              >
                {isCurrent ? t('plans_page.current_plan_label') : upgrading === plan.id ? t('plans_page.redirecting') : t('plans_page.choose_btn')}
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <p>{t('plans_page.payment_note')}</p>
        <p>{t('plans_page.questions_note')} <a href="https://t.me/motor_app_support">@motor_app_support</a></p>
      </div>
    </div>
  );
}
