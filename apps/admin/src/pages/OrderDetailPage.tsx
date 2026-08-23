import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrder } from '../slices/ordersSlice';
import { AppDispatch, RootState } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';
import s from './OrderDetailPage.module.css';

export default function OrderDetailPage() {
  const { t } = useLocale();
  const { id }    = useParams<{ id: string }>();
  const dispatch  = useDispatch<AppDispatch>();
  const { current } = useSelector((st: RootState) => st.orders);
  const [masters, setMasters]   = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => { if (id) dispatch(fetchOrder(id)); }, [id]);
  useEffect(() => { api.get('/admin/users', { params: { role: 'MASTER' } }).then(r => setMasters(r.data.users)).catch(() => {}); }, []);

  const assign = async (staffId: string) => {
    if (!id) return;
    setAssigning(true);
    try { await api.patch(`/orders/${id}/assign`, { staffId: staffId || null }); dispatch(fetchOrder(id)); }
    finally { setAssigning(false); }
  };

  if (!current) return <div className={s.loading}>{t('common.loading')}</div>;
  const o = current as any;

  return (
    <div className={s.page}>
      <div className={s.back}><Link to="/orders">← {t('order_detail.back_all_orders')}</Link></div>

      <div className={s.header}>
        <div>
          <div className={s.eye}>// {t('order_detail.eyebrow')}</div>
          <h1 className={s.h1}>{o.orderNumber}</h1>
          <p className={s.sub}>{new Date(o.createdAt).toLocaleString('ru')}</p>
        </div>
        <StatusBadge status={o.status} />
      </div>

      <div className={s.grid}>
        {/* Клиент */}
        {o.client && (
          <div className={s.card}>
            <div className={s.cardTitle}>👤 {t('order_detail.client_title')}</div>
            <div className={s.cardRow}><span>{t('super_admin_users.th_name')}</span><b>{o.client.name}</b></div>
            <div className={s.cardRow}><span>{t('tenant_detail.th_phone')}</span><b>{o.client.phoneMasked}</b></div>
          </div>
        )}

        {/* Мастер */}
        <div className={s.card}>
          <div className={s.cardTitle}>🧑‍🔧 {t('order_detail.master_title')}</div>
          <select
            value={o.staffId ?? ''}
            disabled={assigning}
            onChange={e => assign(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--wire)', background: 'var(--cage)', color: 'var(--chalk)' }}
          >
            <option value="">— {t('order_detail.not_assigned')} —</option>
            {masters.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name} ({m.phoneMasked})</option>
            ))}
          </select>
        </div>

        {/* Авто */}
        <div className={s.card}>
          <div className={s.cardTitle}>🚗 {t('order_detail.vehicle_title')}</div>
          <div className={s.cardRow}><span>{t('order_detail.brand_model')}</span><b>{o.vehicle?.brand} {o.vehicle?.model}</b></div>
          <div className={s.cardRow}><span>{t('order_detail.year')}</span><b>{o.vehicle?.year}</b></div>
          {o.vehicle?.mileage && <div className={s.cardRow}><span>{t('order_detail.mileage')}</span><b>{o.vehicle.mileage.toLocaleString('ru')} {t('order_detail.km')}</b></div>}
        </div>

        {/* Запись */}
        {o.slot && (
          <div className={s.card}>
            <div className={s.cardTitle}>📅 {t('order_detail.booking_title')}</div>
            <div className={s.cardRow}><span>{t('order_detail.date_time')}</span><b>{new Date(o.slot.startAt).toLocaleString('ru', { day:'2-digit', month:'long', hour:'2-digit', minute:'2-digit' })}</b></div>
            <div className={s.cardRow}><span>{t('order_detail.post')}</span><b>{o.slot.post?.name}</b></div>
            {o.slot.master && <div className={s.cardRow}><span>{t('order_detail.master_title')}</span><b>{o.slot.master.name}</b></div>}
          </div>
        )}

        {/* Специалист */}
        <div className={s.card}>
          <div className={s.cardTitle}>🔧 {t('order_detail.specialization_title')}</div>
          <div className={s.specPill}>
            {{ MECHANIC:`🔧 ${t('order_detail.spec.mechanic')}`, ELECTRICIAN:`⚡ ${t('order_detail.spec.electrician')}`, DIAGNOSTICS:`🔍 ${t('order_detail.spec.diagnostics')}`, PARTS:`📦 ${t('order_detail.spec.parts')}` }[o.specialistType as string] ?? o.specialistType}
          </div>
        </div>

        {/* Сумма */}
        {o.totalRetail && (
          <div className={s.card}>
            <div className={s.cardTitle}>💰 {t('order_detail.estimate_title')}</div>
            <div className={s.priceVal}>{Number(o.totalRetail).toLocaleString('ru')} ₽</div>
            <p className={s.priceNote}>{t('order_detail.retail_note')}</p>
          </div>
        )}
      </div>

      {/* Жалоба */}
      <div className={s.complaint}>
        <div className={s.complaintTitle}>📝 {t('order_detail.complaint_title')}</div>
        <p className={s.complaintText}>{o.complaintRaw}</p>
      </div>

      {/* Позиции */}
      {o.items?.length > 0 && (
        <div className={s.items}>
          <div className={s.itemsTitle}>{t('order_detail.items_title')}</div>
          <div className={s.itemsTable}>
            <div className={s.itemsHead}>
              <span>{t('order_detail.th_name')}</span><span>{t('order_detail.th_qty')}</span><span>{t('order_detail.th_price')}</span><span>{t('order_detail.th_sum')}</span>
            </div>
            {o.items.map((item: any) => (
              <div key={item.id} className={s.itemRow}>
                <span>{item.type === 'WORK' ? '🔧' : '📦'} {item.name}</span>
                <span>{item.qty}</span>
                <span>{Number(item.retailPrice).toLocaleString('ru')} ₽</span>
                <span>{(item.qty * Number(item.retailPrice)).toLocaleString('ru')} ₽</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Действия */}
      <div className={s.actions}>
        <Link to={`/orders/${o.id}/diagnostics`} className={s.actBtn}>🤖 {t('order_detail.ai_diagnostics_link')}</Link>
        <a href={`/api/v1/export/orders/${o.id}/pdf`} target='_blank' rel='noreferrer' className={s.actBtn}>📄 {t('order_detail.download_pdf')}</a>
      </div>
    </div>
  );
}
