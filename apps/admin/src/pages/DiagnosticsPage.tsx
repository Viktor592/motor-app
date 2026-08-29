import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getSocket, joinOrder, leaveOrder } from '../services/socket';
import { StatusBadge } from '../components/StatusBadge';
import s from './DiagnosticsPage.module.css';
import { useLocale } from '../services/i18n';

interface PipelineStep {
  step:   number;
  nameKey: string;
  status: 'waiting' | 'running' | 'done' | 'error';
  data?:  Record<string, any>;
}

interface OrderData {
  id: string; orderNumber: string; status: string;
  complaintRaw: string; complaintParsed: any; aiDiagResult: any;
  totalRetail: number; totalCost: number; items: any[];
  vehicle: { brand: string; model: string; year: number };
}

const STEPS_INIT: PipelineStep[] = [
  { step: 1, nameKey: 'diagnostics.step.receptionist',  status: 'waiting' },
  { step: 2, nameKey: 'diagnostics.step.diagnostician',  status: 'waiting' },
  { step: 3, nameKey: 'diagnostics.step.appraiser',      status: 'waiting' },
];

const URGENCY_KEYS: Record<string, { labelKey: string; color: string }> = {
  critical: { labelKey: 'diagnostics.urgency.critical', color: 'var(--red)'   },
  high:     { labelKey: 'diagnostics.urgency.high',     color: 'var(--ore)'   },
  medium:   { labelKey: 'diagnostics.urgency.medium',   color: 'var(--gold)'  },
  low:      { labelKey: 'diagnostics.urgency.low',      color: 'var(--green)' },
};

export default function DiagnosticsPage() {
  const { t } = useLocale();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate    = useNavigate();

  const [order,    setOrder]    = useState<OrderData | null>(null);
  const [steps,    setSteps]    = useState<PipelineStep[]>(STEPS_INIT);
  const [running,  setRunning]  = useState(false);
  const [paying,   setPaying]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setTab]     = useState<'diag' | 'items' | 'payment'>('diag');

  // Загрузить заказ
  useEffect(() => {
    if (!orderId) return;
    api.get(`/pipeline/${orderId}/status`)
      .then(r => {
        setOrder(r.data);
        // Если уже есть результат — показать сразу
        if (r.data.aiDiagResult) {
          setSteps(STEPS_INIT.map(s => ({ ...s, status: 'done' })));
        }
      })
      .finally(() => setLoading(false));

    // Socket
    joinOrder(orderId);
    const socket = getSocket();

    socket?.on('pipeline:step', (e: any) => {
      setSteps(prev => prev.map(s =>
        s.step === e.step ? { ...s, status: e.status, data: e.data } :
        s.step === e.step + 1 ? { ...s, status: 'running' } : s
      ));
      if (e.step === 3 && e.status === 'done') {
        // Перезагрузить заказ после завершения
        api.get(`/pipeline/${orderId}/status`).then(r => setOrder(r.data));
        setRunning(false);
      }
    });

    socket?.on('pipeline:error', () => {
      setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error' } : s));
      setRunning(false);
    });

    return () => {
      leaveOrder(orderId!);
      socket?.off('pipeline:step');
      socket?.off('pipeline:error');
    };
  }, [orderId]);

  const runPipeline = async () => {
    if (!orderId || running) return;
    setRunning(true);
    setSteps(STEPS_INIT.map((s, i) => ({ ...s, status: i === 0 ? 'running' : 'waiting' })));
    try {
      await api.post(`/pipeline/${orderId}/run`);
    } catch (e: any) {
      setRunning(false);
      alert(e.response?.data?.error ?? t('diagnostics.pipeline_error'));
    }
  };

  const startPayment = async () => {
    if (!orderId || paying) return;
    setPaying(true);
    try {
      const r = await api.post(`/payments/${orderId}/create`, {
        returnUrl: window.location.origin + `/orders/${orderId}`,
      });
      window.location.href = r.data.confirmationUrl;
    } catch (e: any) {
      alert(e.response?.data?.error ?? t('diagnostics.payment_error'));
    } finally { setPaying(false); }
  };

  if (loading) return <div className={s.loading}>{t('edo.loading')}</div>;
  if (!order)  return <div className={s.loading}>{t('diagnostics.order_not_found')}</div>;

  const diag    = order.aiDiagResult;
  const parsed  = order.complaintParsed;
  const hasResult = !!diag;

  return (
    <div className={s.page}>
      <div className={s.back}><Link to={`/orders/${order.id}`}>← {order.orderNumber}</Link></div>

      <div className={s.header}>
        <div>
          <div className={s.eye}>{t('diagnostics.eyebrow')}</div>
          <h1 className={s.h1}>{order.vehicle.brand} {order.vehicle.model} <em>{order.vehicle.year}</em></h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Pipeline steps */}
      <div className={s.pipeline}>
        {steps.map((step, i) => (
          <React.Fragment key={step.step}>
            <div className={`${s.step} ${s['step_' + step.status]}`}>
              <div className={s.stepCircle}>
                {step.status === 'done'    && '✓'}
                {step.status === 'waiting' && step.step}
                {step.status === 'running' && <span className={s.spinner} />}
                {step.status === 'error'   && '✕'}
              </div>
              <div className={s.stepInfo}>
                <div className={s.stepName}>{t('diagnostics.agent_label', { name: t(step.nameKey) })}</div>
                {step.status === 'running' && <div className={s.stepStatus}>{t('diagnostics.processing')}</div>}
                {step.status === 'done' && step.data && (
                  <div className={s.stepData}>
                    {Object.entries(step.data).map(([k, v]) => (
                      <span key={k} className={s.stepTag}>{v}</span>
                    ))}
                  </div>
                )}
                {step.status === 'error' && <div className={s.stepErr}>{t('settings.error')}</div>}
              </div>
            </div>
            {i < steps.length - 1 && <div className={`${s.arrow} ${step.status === 'done' ? s.arrowDone : ''}`}>→</div>}
          </React.Fragment>
        ))}
      </div>

      {/* Run button */}
      {!hasResult && (
        <div className={s.runWrap}>
          <p className={s.runHint}>{t('diagnostics.complaint_label')} <em>«{order.complaintRaw.slice(0, 120)}…»</em></p>
          <button className={s.runBtn} onClick={runPipeline} disabled={running}>
            {running ? t('diagnostics.agents_working') : t('diagnostics.start_btn')}
          </button>
        </div>
      )}

      {/* Results */}
      {hasResult && (
        <>
          {/* Tabs */}
          <div className={s.tabs}>
            {(['diag', 'items', 'payment'] as const).map(tabKey => (
              <button key={tabKey} className={`${s.tab} ${activeTab === tabKey ? s.tabActive : ''}`}
                onClick={() => setTab(tabKey)}>
                {{ diag: t('diagnostics.tab.diag'), items: t('diagnostics.tab.items'), payment: t('diagnostics.tab.payment') }[tabKey]}
              </button>
            ))}
          </div>

          {/* Tab: Диагностика */}
          {activeTab === 'diag' && (
            <div className={s.tabContent}>
              {parsed && (
                <div className={s.parsedRow}>
                  <div className={s.parsedChip}>
                    <span>{t('diagnostics.system_label')}</span><b>{parsed.affectedSystem}</b>
                  </div>
                  {parsed.urgency && (
                    <div className={s.parsedChip}>
                      <span>{t('diagnostics.urgency_label')}</span>
                      <b style={{ color: URGENCY_KEYS[parsed.urgency]?.color }}>
                        {URGENCY_KEYS[parsed.urgency] ? t(URGENCY_KEYS[parsed.urgency].labelKey) : parsed.urgency}
                      </b>
                    </div>
                  )}
                  <div className={s.parsedChip}>
                    <span>{t('diagnostics.work_time_label')}</span><b>~{parsed.estimatedTime} {t('diagnostics.min_suffix')}</b>
                  </div>
                </div>
              )}

              <div className={s.verd}>
                <div className={s.verdLabel}>{t('diagnostics.verdict')}</div>
                <p className={s.verdText}>{diag.totalProbable}</p>
              </div>

              <div className={s.hypoList}>
                {diag.hypotheses.map((h: any) => (
                  <div key={h.rank} className={`${s.hypo} ${h.rank === 1 ? s.hypoTop : ''}`}>
                    <div className={s.hypoHead}>
                      <div className={s.hypoRank}>#{h.rank}</div>
                      <div className={s.hypoTitle}>{h.title}</div>
                      <div className={s.hypoPct}>{h.probability}%</div>
                    </div>
                    <div className={s.hypoBar}>
                      <div className={s.hypoBarFill} style={{ width: h.probability + '%' }} />
                    </div>
                    <p className={s.hypoDesc}>{h.description}</p>
                    {h.partsNeeded?.length > 0 && (
                      <div className={s.hypoPartsRow}>
                        {h.partsNeeded.map((p: any) => (
                          <span key={p.oemNumber} className={s.partChip}>
                            {p.name} <em>×{p.qty}</em>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={s.hypoTime}>
                      ⏱ {h.laborMin}–{h.laborMax} {t('diagnostics.work_time_suffix')}
                    </div>
                  </div>
                ))}
              </div>

              <div className={s.estimateRange}>
                <span className={s.erLabel}>{t('diagnostics.estimate_label')}</span>
                <span className={s.erVal}>
                  {diag.minEstimate.toLocaleString('ru')} – {diag.maxEstimate.toLocaleString('ru')} ₽
                </span>
              </div>
            </div>
          )}

          {/* Tab: Смета */}
          {activeTab === 'items' && (
            <div className={s.tabContent}>
              <div className={s.itemsTable}>
                <div className={s.itemsHead}>
                  <span>{t('diagnostics.th.name')}</span>
                  <span>{t('diagnostics.th.article')}</span>
                  <span className={s.right}>{t('diagnostics.th.qty')}</span>
                  <span className={s.right}>{t('diagnostics.th.price')}</span>
                  <span className={s.right}>{t('diagnostics.th.sum')}</span>
                </div>
                {order.items.map((item: any, i: number) => (
                  <div key={i} className={s.itemRow}>
                    <span>{item.type === 'WORK' ? '🔧' : '📦'} {item.name}</span>
                    <span className={s.itemArticle}>{item.article ?? '—'}</span>
                    <span className={s.right}>{item.qty}</span>
                    <span className={s.right}>{Number(item.retailPrice).toLocaleString('ru')} ₽</span>
                    <span className={s.right}>{(item.qty * Number(item.retailPrice)).toLocaleString('ru')} ₽</span>
                  </div>
                ))}
              </div>
              {order.totalRetail && (
                <div className={s.total}>
                  <span>{t('diagnostics.total_due')}</span>
                  <span className={s.totalVal}>{Number(order.totalRetail).toLocaleString('ru')} ₽</span>
                </div>
              )}
            </div>
          )}

          {/* Tab: Оплата */}
          {activeTab === 'payment' && (
            <div className={s.tabContent}>
              <div className={s.payCard}>
                <div className={s.payAmount}>
                  {Number(order.totalRetail).toLocaleString('ru')} ₽
                </div>
                <p className={s.paySub}>{t('diagnostics.order_prefix', { number: order.orderNumber })}</p>

                {order.status === 'CLOSED' ? (
                  <div className={s.paidBadge}>{t('diagnostics.paid_badge')}</div>
                ) : order.status === 'CONFIRMED' ? (
                  <button className={s.payBtn} onClick={startPayment} disabled={paying}>
                    {paying ? t('diagnostics.pay_transition') : t('diagnostics.pay_btn')}
                  </button>
                ) : (
                  <p className={s.payNote}>
                    {t('diagnostics.pay_note')}
                    <br/>{t('diagnostics.current_status')} <StatusBadge status={order.status} />
                  </p>
                )}

                <div className={s.payMethods}>
                  <span>{t('diagnostics.pay_method_card')}</span><span>СБП</span><span>ЮMoney</span><span>SberPay</span>
                </div>
                <p className={s.paySecure}>{t('diagnostics.pay_secure')}</p>
              </div>
            </div>
          )}

          {/* Перезапустить */}
          <button className={s.rerunBtn} onClick={runPipeline} disabled={running}>
            {running ? t('diagnostics.agents_running_short') : t('diagnostics.rerun_btn')}
          </button>
        </>
      )}
    </div>
  );
}
