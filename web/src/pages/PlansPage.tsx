import { useState, useEffect } from 'react';
import styles from './PlansPage.module.css';
import { api } from '../services/api';

interface Plan {
  id: string; name: string; priceRub: number;
  maxMasters: number; maxOrdersPerMonth: number; features: string[];
}
interface TenantInfo {
  tenant: { plan: string; status: string; trialEndsAt: string | null; paidUntil: string | null; name: string };
  trialDaysLeft: number | null;
  usage: { masters: number; maxMasters: number; orders: number; maxOrders: number };
}

const PLAN_ICONS: Record<string, string> = { STARTER: '🚀', PRO: '⚡', BUSINESS: '🏆' };
const PLAN_COLORS: Record<string, string> = { STARTER: '#2563eb', PRO: '#7c3aed', BUSINESS: '#d97706' };

export default function PlansPage() {
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
      const data = await api.post('/saas/billing/upgrade', { plan: planId });
      if (data.confirmUrl) window.location.href = data.confirmUrl;
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    } finally { setUpgrading(''); }
  };

  if (loading) return <div className={styles.loading}>Загрузка…</div>;

  const currentPlan = info?.tenant.plan ?? 'TRIAL';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Тарифы</h1>
        <p className={styles.sub}>Выберите подходящий план для вашего автосервиса</p>
      </div>

      {/* Текущий статус */}
      {info && (
        <div className={styles.statusCard}>
          <div className={styles.statusLeft}>
            <span className={styles.statusLabel}>Текущий тариф</span>
            <span className={styles.statusPlan}>{currentPlan}</span>
            {info.trialDaysLeft !== null && (
              <span className={styles.trialBadge}>
                Пробный: {info.trialDaysLeft} {info.trialDaysLeft === 1 ? 'день' : info.trialDaysLeft < 5 ? 'дня' : 'дней'}
              </span>
            )}
            {info.tenant.paidUntil && (
              <span className={styles.paidBadge}>
                Оплачен до {new Date(info.tenant.paidUntil).toLocaleDateString('ru-RU')}
              </span>
            )}
          </div>
          <div className={styles.usageRow}>
            <div className={styles.usageItem}>
              <div className={styles.usageLabel}>Мастера</div>
              <div className={styles.usageBar}>
                <div className={styles.usageFill}
                  style={{ width: `${Math.min(100, info.usage.masters / info.usage.maxMasters * 100)}%` }} />
              </div>
              <div className={styles.usageVal}>{info.usage.masters} / {info.usage.maxMasters === 99 ? '∞' : info.usage.maxMasters}</div>
            </div>
            <div className={styles.usageItem}>
              <div className={styles.usageLabel}>Заказов в месяц</div>
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
              {isCurrent && <div className={styles.currentBadge} style={{ background: color }}>Текущий</div>}
              {plan.id === 'PRO' && !isCurrent && <div className={styles.popularBadge}>Популярный</div>}

              <div className={styles.planIcon}>{PLAN_ICONS[plan.id]}</div>
              <div className={styles.planName}>{plan.name}</div>
              <div className={styles.planPrice}>
                <span className={styles.planAmount}>{plan.priceRub.toLocaleString('ru-RU')}</span>
                <span className={styles.planPer}> ₽/мес</span>
              </div>

              <div className={styles.planLimits}>
                <span>{plan.maxMasters === 99 ? 'Без лимита' : `до ${plan.maxMasters}`} мастер{plan.maxMasters === 1 ? 'а' : 'ов'}</span>
                <span>·</span>
                <span>{plan.maxOrdersPerMonth === 9999 ? '∞' : plan.maxOrdersPerMonth} заказов/мес</span>
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
                {isCurrent ? 'Текущий тариф' : upgrading === plan.id ? 'Перенаправляю…' : 'Выбрать →'}
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <p>Оплата через ЮKassa. Автопродление. Отменить можно в любой момент.</p>
        <p>Вопросы? Пишите в Telegram: <a href="https://t.me/motor_app_support">@motor_app_support</a></p>
      </div>
    </div>
  );
}
