import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrder } from '../slices/ordersSlice';
import { AppDispatch, RootState } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';
import s from './OrderDetailPage.module.css';

const CANCELLABLE = ['NEW', 'ASSESSED', 'CONFIRMED'];
const INTL: Record<string, string> = { ru: 'ru', kk: 'kk-KZ', en: 'en-US' };

export default function OrderDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const dispatch  = useDispatch<AppDispatch>();
  const { t, locale } = useLocale();
  const intl = INTL[locale] ?? 'ru';
  const { current } = useSelector((st: RootState) => st.orders);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => { if (id) dispatch(fetchOrder(id)); }, [id]);

  const cancelOrder = async () => {
    if (!id) return;
    if (!confirm(t('orderDetail.confirm_cancel'))) return;
    setCancelling(true); setCancelError('');
    try {
      await api.patch(`/orders/${id}/cancel`);
      dispatch(fetchOrder(id));
    } catch (e: any) {
      setCancelError(e.response?.data?.error ?? t('orderDetail.cancel_error'));
    } finally { setCancelling(false); }
  };

  if (!current) return <div className={s.loading}>{t('common.loading')}</div>;
  const o = current as any;

  return (
    <div className={s.page}>
      <div className={s.back}><Link to="/orders">{t('orderDetail.back')}</Link></div>

      <div className={s.header}>
        <div>
          <div className={s.eye}>{t('orderDetail.eyebrow')}</div>
          <h1 className={s.h1}>{o.orderNumber}</h1>
          <p className={s.sub}>{new Date(o.createdAt).toLocaleString(intl)}</p>
        </div>
        <StatusBadge status={o.status} />
      </div>

      <div className={s.grid}>
        {/* Авто */}
        <div className={s.card}>
          <div className={s.cardTitle}>{t('orderDetail.car_title')}</div>
          <div className={s.cardRow}><span>{t('orderDetail.brand_model')}</span><b>{o.vehicle?.brand} {o.vehicle?.model}</b></div>
          <div className={s.cardRow}><span>{t('orderDetail.year')}</span><b>{o.vehicle?.year}</b></div>
          {o.vehicle?.mileage && <div className={s.cardRow}><span>{t('orderDetail.mileage')}</span><b>{o.vehicle.mileage.toLocaleString(intl)} {t('unit.km')}</b></div>}
        </div>

        {/* Запись */}
        {o.slot && (
          <div className={s.card}>
            <div className={s.cardTitle}>{t('orderDetail.booking_title')}</div>
            <div className={s.cardRow}><span>{t('orderDetail.datetime')}</span><b>{new Date(o.slot.startAt).toLocaleString(intl, { day:'2-digit', month:'long', hour:'2-digit', minute:'2-digit' })}</b></div>
            <div className={s.cardRow}><span>{t('orderDetail.post')}</span><b>{o.slot.post?.name}</b></div>
            {o.slot.master && <div className={s.cardRow}><span>{t('orderDetail.master')}</span><b>{o.slot.master.name}</b></div>}
          </div>
        )}

        {/* Специалист */}
        <div className={s.card}>
          <div className={s.cardTitle}>{t('orderDetail.spec_title')}</div>
          <div className={s.specPill}>{t(`specialistFull.${o.specialistType}`)}</div>
        </div>

        {/* Сумма */}
        {o.totalRetail && (
          <div className={s.card}>
            <div className={s.cardTitle}>{t('orderDetail.estimate_title')}</div>
            <div className={s.priceVal}>{Number(o.totalRetail).toLocaleString(intl)} ₽</div>
            <p className={s.priceNote}>{t('orderDetail.estimate_note')}</p>
          </div>
        )}
      </div>

      {/* Жалоба */}
      <div className={s.complaint}>
        <div className={s.complaintTitle}>{t('orderDetail.complaint_title')}</div>
        <p className={s.complaintText}>{o.complaintRaw}</p>
      </div>

      {/* Позиции */}
      {o.items?.length > 0 && (
        <div className={s.items}>
          <div className={s.itemsTitle}>{t('orderDetail.items_title')}</div>
          <div className={s.itemsTable}>
            <div className={s.itemsHead}>
              <span>{t('orderDetail.items.name')}</span><span>{t('orderDetail.items.qty')}</span><span>{t('orderDetail.items.price')}</span><span>{t('orderDetail.items.sum')}</span>
            </div>
            {o.items.map((item: any) => (
              <div key={item.id} className={s.itemRow}>
                <span>{item.type === 'WORK' ? '🔧' : '📦'} {item.name}</span>
                <span>{item.qty}</span>
                <span>{Number(item.retailPrice).toLocaleString(intl)} ₽</span>
                <span>{(item.qty * Number(item.retailPrice)).toLocaleString(intl)} ₽</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Действия */}
      <div className={s.actions}>
        <Link to={`/orders/${o.id}/diagnostics`} className={s.actBtn}>{t('orderDetail.ai_diag')}</Link>
        <Link to={`/chat/${o.id}`} className={s.actBtn}>{t('orderDetail.ai_chat')}</Link>
        <a href={`/api/v1/export/orders/${o.id}/pdf`} target='_blank' rel='noreferrer' className={s.actBtn}>{t('orderDetail.pdf')}</a>
        {CANCELLABLE.includes(o.status) && (
          <button
            className={s.actBtn}
            disabled={cancelling}
            style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
            onClick={cancelOrder}
          >
            {cancelling ? '…' : t('orderDetail.cancel')}
          </button>
        )}
      </div>
      {cancelError && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>{cancelError}</p>}
    </div>
  );
}
