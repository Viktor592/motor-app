import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrder } from '../slices/ordersSlice';
import { AppDispatch, RootState } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';
import s from './OrderDetailPage.module.css';

export default function OrderDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const dispatch  = useDispatch<AppDispatch>();
  const { current } = useSelector((st: RootState) => st.orders);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName]       = useState('');
  const [price, setPrice]     = useState('');
  const [qty, setQty]         = useState('1');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [shiftBusy, setShiftBusy] = useState(false);
  const [shiftMsg, setShiftMsg]   = useState('');

  useEffect(() => { if (id) dispatch(fetchOrder(id)); }, [id]);

  const addItem = async () => {
    if (!id || name.length < 2 || !price) { setError('Заполните название и цену'); return; }
    setSaving(true); setError('');
    try {
      await api.post(`/orders/${id}/items`, { name, retailPrice: Number(price), qty: Number(qty) || 1 });
      setName(''); setPrice(''); setQty('1'); setShowAdd(false);
      dispatch(fetchOrder(id));
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Не удалось добавить позицию');
    } finally { setSaving(false); }
  };

  if (!current) return <div className={s.loading}>Загрузка…</div>;
  const o = current as any;

  const shiftSlot = async (minutes: number) => {
    if (!o.slot) return;
    setShiftBusy(true); setShiftMsg('');
    try {
      await api.patch(`/booking/slots/${o.slot.id}/shift`, { minutes });
      setShiftMsg(minutes > 0 ? `Сдвинуто на +${minutes} мин` : `Сдвинуто на ${minutes} мин`);
      if (id) dispatch(fetchOrder(id));
    } catch (e: any) {
      setShiftMsg(e.response?.data?.error ?? 'Не удалось сдвинуть время');
    } finally { setShiftBusy(false); }
  };

  return (
    <div className={s.page}>
      <div className={s.back}><Link to="/orders">← Все заказы</Link></div>

      <div className={s.header}>
        <div>
          <div className={s.eye}>// ЗАКАЗ-НАРЯД</div>
          <h1 className={s.h1}>{o.orderNumber}</h1>
          <p className={s.sub}>{new Date(o.createdAt).toLocaleString('ru')}</p>
        </div>
        <StatusBadge status={o.status} />
      </div>

      <div className={s.grid}>
        {/* Авто */}
        <div className={s.card}>
          <div className={s.cardTitle}>🚗 Автомобиль</div>
          <div className={s.cardRow}><span>Марка / Модель</span><b>{o.vehicle?.brand} {o.vehicle?.model}</b></div>
          <div className={s.cardRow}><span>Год</span><b>{o.vehicle?.year}</b></div>
          {o.vehicle?.mileage && <div className={s.cardRow}><span>Пробег</span><b>{o.vehicle.mileage.toLocaleString('ru')} км</b></div>}
        </div>

        {/* Запись */}
        {o.slot && (
          <div className={s.card}>
            <div className={s.cardTitle}>📅 Запись</div>
            <div className={s.cardRow}><span>Дата и время</span><b>{new Date(o.slot.startAt).toLocaleString('ru', { day:'2-digit', month:'long', hour:'2-digit', minute:'2-digit' })}</b></div>
            <div className={s.cardRow}><span>Пост</span><b>{o.slot.post?.name}</b></div>
            {o.slot.master && <div className={s.cardRow}><span>Мастер</span><b>{o.slot.master.name}</b></div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--dust)' }}>Работа затянулась?</span>
              <button className={s.actBtn} disabled={shiftBusy} onClick={() => shiftSlot(15)}>+15 мин</button>
              <button className={s.actBtn} disabled={shiftBusy} onClick={() => shiftSlot(30)}>+30 мин</button>
              <button className={s.actBtn} disabled={shiftBusy} onClick={() => shiftSlot(60)}>+60 мин</button>
              {shiftMsg && <span style={{ fontSize: 12, color: 'var(--ore)' }}>{shiftMsg}</span>}
            </div>
          </div>
        )}

        {/* Специалист */}
        <div className={s.card}>
          <div className={s.cardTitle}>🔧 Специализация</div>
          <div className={s.specPill}>
            {{ MECHANIC:'🔧 Автослесарь', ELECTRICIAN:'⚡ Автоэлектрик', DIAGNOSTICS:'🔍 Диагност' }[o.specialistType as string] ?? o.specialistType}
          </div>
        </div>

        {/* Сумма */}
        {o.totalRetail && (
          <div className={s.card}>
            <div className={s.cardTitle}>💰 Смета</div>
            <div className={s.priceVal}>{Number(o.totalRetail).toLocaleString('ru')} ₽</div>
            <p className={s.priceNote}>Розничная стоимость работ и запчастей</p>
          </div>
        )}
      </div>

      {/* Жалоба */}
      <div className={s.complaint}>
        <div className={s.complaintTitle}>📝 Описание проблемы</div>
        <p className={s.complaintText}>{o.complaintRaw}</p>
      </div>

      {/* Позиции */}
      {o.items?.length > 0 && (
        <div className={s.items}>
          <div className={s.itemsTitle}>Позиции заказа</div>
          <div className={s.itemsTable}>
            <div className={s.itemsHead}>
              <span>Наименование</span><span>Кол-во</span><span>Цена</span><span>Сумма</span>
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
            <button className={s.actBtn} onClick={() => setShowAdd(true)}>+ Добавить работу/запчасть</button>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--dust)', marginBottom: 4 }}>Наименование</div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Например: Замена тормозных колодок"
                  style={{ padding: 8, borderRadius: 6, border: '1px solid var(--wire)', minWidth: 240 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--dust)', marginBottom: 4 }}>Кол-во</div>
                <input value={qty} onChange={e => setQty(e.target.value)} type="number" min="1"
                  style={{ padding: 8, borderRadius: 6, border: '1px solid var(--wire)', width: 70 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--dust)', marginBottom: 4 }}>Цена, ₽</div>
                <input value={price} onChange={e => setPrice(e.target.value)} type="number" min="0"
                  style={{ padding: 8, borderRadius: 6, border: '1px solid var(--wire)', width: 110 }} />
              </div>
              <button className={s.actBtn} disabled={saving} onClick={addItem}>{saving ? '…' : 'Добавить'}</button>
              <button className={s.actBtn} onClick={() => setShowAdd(false)}>Отмена</button>
              {error && <div style={{ color: '#e5484d', fontSize: 13, width: '100%' }}>{error}</div>}
            </div>
          )}
        </div>
      )}

      {/* Действия */}
      <div className={s.actions}>
        <Link to={`/orders/${o.id}/diagnostics`} className={s.actBtn}>🤖 AI-диагностика и смета</Link>
        <a href={`/api/v1/export/orders/${o.id}/pdf`} target='_blank' rel='noreferrer' className={s.actBtn}>📄 Скачать PDF</a>
      </div>
    </div>
  );
}
