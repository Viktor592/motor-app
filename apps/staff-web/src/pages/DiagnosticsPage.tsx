import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getSocket, joinOrder, leaveOrder } from '../services/socket';
import { StatusBadge } from '../components/StatusBadge';
import { useLocale } from '../services/i18n';
import s from './DiagnosticsPage.module.css';

interface PipelineStep {
  step:   number;
  name:   string;
  status: 'waiting' | 'running' | 'done' | 'error';
  data?:  Record<string, any>;
}

interface OrderData {
  id: string; orderNumber: string; status: string;
  complaintRaw: string; complaintParsed: any; aiDiagResult: any;
  totalRetail: number; totalCost: number; items: any[];
  vehicle: { brand: string; model: string; year: number };
}

export default function DiagnosticsPage() {
  const { t } = useLocale();
  const STEPS_INIT: PipelineStep[] = [
    { step: 1, name: t('diag.step.receptionist'),  status: 'waiting' },
    { step: 2, name: t('diag.step.diagnostician'),  status: 'waiting' },
    { step: 3, name: t('diag.step.estimator'),      status: 'waiting' },
  ];
  const URGENCY_LABEL: Record<string, { label: string; color: string }> = {
    critical: { label: `🔴 ${t('diag.urgency.critical')}`, color: 'var(--red)'   },
    high:     { label: `🟠 ${t('diag.urgency.high')}`,     color: 'var(--ore)'   },
    medium:   { label: `🟡 ${t('diag.urgency.medium')}`,   color: 'var(--gold)'  },
    low:      { label: `🟢 ${t('diag.urgency.low')}`,      color: 'var(--green)' },
  };
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
      alert(e.response?.data?.error ?? t('diag.err.pipeline_start'));
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
      alert(e.response?.data?.error ?? t('diag.err.payment'));
    } finally { setPaying(false); }
  };

  if (loading) return <div className={s.loading}>{t('common.loading')}</div>;
  if (!order)  return <div className={s.loading}>{t('diag.order_not_found')}</div>;

  const diag    = order.aiDiagResult;
  const parsed  = order.complaintParsed;
  const hasResult = !!diag;

  return (
    <div className={s.page}>
      <div className={s.back}><Link to={`/orders/${order.id}`}>← {order.orderNumber}</Link></div>

      <div className={s.header}>
        <div>
          <div className={s.eye}>// {t('diag.eyebrow')}</div>
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
                <div className={s.stepName}>{t('diag.agent_name', { name: step.name })}</div>
                {step.status === 'running' && <div className={s.stepStatus}>{t('diag.processing')}</div>}
                {step.status === 'done' && step.data && (
                  <div className={s.stepData}>
                    {Object.entries(step.data).map(([k, v]) => (
                      <span key={k} className={s.stepTag}>{v}</span>
                    ))}
                  </div>
                )}
                {step.status === 'error' && <div className={s.stepErr}>{t('diag.error')}</div>}
              </div>
            </div>
            {i < steps.length - 1 && <div className={`${s.arrow} ${step.status === 'done' ? s.arrowDone : ''}`}>→</div>}
          </React.Fragment>
        ))}
      </div>

      {/* Run button */}
      {!hasResult && (
        <div className={s.runWrap}>
          <p className={s.runHint}>{t('diag.complaint_label')}: <em>«{order.complaintRaw.slice(0, 120)}…»</em></p>
          <button className={s.runBtn} onClick={runPipeline} disabled={running}>
            {running ? `⏳ ${t('diag.agents_working')}` : `🚀 ${t('diag.run_btn')}`}
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
                {{ diag: `🔍 ${t('diag.tab.hypotheses')}`, items: `🔩 ${t('diag.tab.estimate')}`, payment: `💳 ${t('diag.tab.payment')}` }[tabKey]}
              </button>
            ))}
          </div>

          {/* Tab: Диагностика */}
          {activeTab === 'diag' && (
            <div className={s.tabContent}>
              {parsed && (
                <div className={s.parsedRow}>
                  <div className={s.parsedChip}>
                    <span>{t('diag.system_label')}</span><b>{parsed.affectedSystem}</b>
                  </div>
                  {parsed.urgency && (
                    <div className={s.parsedChip}>
                      <span>{t('diag.urgency_label')}</span>
                      <b style={{ color: URGENCY_LABEL[parsed.urgency]?.color }}>
                        {URGENCY_LABEL[parsed.urgency]?.label ?? parsed.urgency}
                      </b>
                    </div>
                  )}
                  <div className={s.parsedChip}>
                    <span>{t('diag.work_time_label')}</span><b>~{parsed.estimatedTime} {t('diag.min')}</b>
                  </div>
                </div>
              )}

              <div className={s.verd}>
                <div className={s.verdLabel}>{t('diag.verdict')}</div>
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
                      ⏱ {h.laborMin}–{h.laborMax} {t('diag.work_time_range')}
                    </div>
                  </div>
                ))}
              </div>

              <div className={s.estimateRange}>
                <span className={s.erLabel}>{t('diag.preliminary_estimate')}</span>
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
                  <span>{t('diag.th_name')}</span>
                  <span>{t('diag.th_article')}</span>
                  <span className={s.right}>{t('diag.th_qty')}</span>
                  <span className={s.right}>{t('diag.th_price')}</span>
                  <span className={s.right}>{t('diag.th_sum')}</span>
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
                  <span>{t('diag.total_due')}</span>
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
                <p className={s.paySub}>{t('diag.order_label', { num: order.orderNumber })}</p>

                {order.status === 'CLOSED' ? (
                  <div className={s.paidBadge}>✅ {t('diag.paid_badge')}</div>
                ) : order.status === 'CONFIRMED' ? (
                  <button className={s.payBtn} onClick={startPayment} disabled={paying}>
                    {paying ? t('diag.pay_redirect') : `💳 ${t('diag.pay_btn')}`}
                  </button>
                ) : (
                  <p className={s.payNote}>
                    {t('diag.pay_note')}
                    <br/>{t('diag.current_status')}: <StatusBadge status={order.status} />
                  </p>
                )}

                <div className={s.payMethods}>
                  <span>{t('diag.pay_method_card')}</span><span>СБП</span><span>ЮMoney</span><span>SberPay</span>
                </div>
                <p className={s.paySecure}>🔒 {t('diag.pay_secure')}</p>
              </div>
            </div>
          )}

          {/* Перезапустить */}
          <button className={s.rerunBtn} onClick={runPipeline} disabled={running}>
            {running ? `⏳ ${t('diag.rerun_working')}` : `↺ ${t('diag.rerun_btn')}`}
          </button>
        </>
      )}
    </div>
  );
}
