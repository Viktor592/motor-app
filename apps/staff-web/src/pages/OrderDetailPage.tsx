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
  const { role } = useSelector((st: RootState) => st.auth);
  const [masters, setMasters]     = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName]       = useState('');
  const [price, setPrice]     = useState('');
  const [qty, setQty]         = useState('1');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [shiftBusy, setShiftBusy] = useState(false);
  const [shiftMsg, setShiftMsg]   = useState('');

  useEffect(() => { if (id) dispatch(fetchOrder(id)); }, [id]);
  useEffect(() => {
    if (role !== 'RECEPTIONIST' && role !== 'ADMIN') return;
    api.get('/admin/users', { params: { role: 'MASTER' } }).then(r => setMasters(r.data.users)).catch(() => {});
  }, [role]);

  const assignMaster = async (staffId: string) => {
    if (!id) return;
    setAssigning(true);
    try { await api.patch(`/orders/${id}/assign`, { staffId: staffId || null }); dispatch(fetchOrder(id)); }
    finally { setAssigning(false); }
  };

  const addItem = async () => {
    if (!id || name.length < 2 || !price) { setError(t('order_detail.err.fill_name_price')); return; }
    setSaving(true); setError('');
    try {
      await api.post(`/orders/${id}/items`, { name, retailPrice: Number(price), qty: Number(qty) || 1 });
      setName(''); setPrice(''); setQty('1'); setShowAdd(false);
      dispatch(fetchOrder(id));
    } catch (e: any) {
      setError(e.response?.data?.error ?? t('order_detail.err.add_item_failed'));
    } finally { setSaving(false); }
  };

  if (!current) return <div className={s.loading}>{t('common.loading')}</div>;
  const o = current as any;

  const shiftSlot = async (minutes: number) => {
    if (!o.slot) return;
    setShiftBusy(true); setShiftMsg('');
    try {
      await api.patch(`/booking/slots/${o.slot.id}/shift`, { minutes });
      setShiftMsg(t('order_detail.shift_done', { mins: minutes > 0 ? `+${minutes}` : `${minutes}` }));
      if (id) dispatch(fetchOrder(id));
    } catch (e: any) {
      setShiftMsg(e.response?.data?.error ?? t('order_detail.err.shift_failed'));
    } finally { setShiftBusy(false); }
  };

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
        {/* Мастер (назначение — только приёмщик/владелец) */}
        {(role === 'RECEPTIONIST' || role === 'ADMIN') && (
          <div className={s.card}>
            <div className={s.cardTitle}>🧑‍🔧 {t('order_detail.master_title')}</div>
            <select
              value={o.staffId ?? ''}
              disabled={assigning}
              onChange={e => assignMaster(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--wire)', background: 'var(--cage)', color: 'var(--chalk)' }}
            >
              <option value="">— {t('order_detail.not_assigned')} —</option>
              {masters.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name} ({m.phoneMasked})</option>
              ))}
            </select>
          </div>
        )}

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
            <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--dust)' }}>{t('order_detail.work_delayed')}</span>
              <button className={s.actBtn} disabled={shiftBusy} onClick={() => shiftSlot(15)}>+15 {t('order_detail.min')}</button>
              <button className={s.actBtn} disabled={shiftBusy} onClick={() => shiftSlot(30)}>+30 {t('order_detail.min')}</button>
              <button className={s.actBtn} disabled={shiftBusy} onClick={() => shiftSlot(60)}>+60 {t('order_detail.min')}</button>
              {shiftMsg && <span style={{ fontSize: 12, color: 'var(--ore)' }}>{shiftMsg}</span>}
            </div>
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

      {o.status === 'IN_PROGRESS' && (
        <div className={s.items} style={{ marginTop: 12 }}>
          {!showAdd ? (
            <button className={s.actBtn} onClick={() => setShowAdd(true)}>+ {t('order_detail.add_item_btn')}</button>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--dust)', marginBottom: 4 }}>{t('order_detail.th_name')}</div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder={t('order_detail.item_name_placeholder')}
                  style={{ padding: 8, borderRadius: 6, border: '1px solid var(--wire)', minWidth: 240 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--dust)', marginBottom: 4 }}>{t('order_detail.th_qty')}</div>
                <input value={qty} onChange={e => setQty(e.target.value)} type="number" min="1"
                  style={{ padding: 8, borderRadius: 6, border: '1px solid var(--wire)', width: 70 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--dust)', marginBottom: 4 }}>{t('order_detail.price_rub')}</div>
                <input value={price} onChange={e => setPrice(e.target.value)} type="number" min="0"
                  style={{ padding: 8, borderRadius: 6, border: '1px solid var(--wire)', width: 110 }} />
              </div>
              <button className={s.actBtn} disabled={saving} onClick={addItem}>{saving ? '…' : t('common.add')}</button>
              <button className={s.actBtn} onClick={() => setShowAdd(false)}>{t('common.cancel')}</button>
              {error && <div style={{ color: '#e5484d', fontSize: 13, width: '100%' }}>{error}</div>}
            </div>
          )}
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
