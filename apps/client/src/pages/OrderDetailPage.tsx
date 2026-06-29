import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrder } from '../slices/ordersSlice';
import { AppDispatch, RootState } from '../store';
import { StatusBadge } from '../components/common/StatusBadge';
import s from './OrderDetailPage.module.css';

export default function OrderDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const dispatch  = useDispatch<AppDispatch>();
  const { current } = useSelector((st: RootState) => st.orders);

  useEffect(() => { if (id) dispatch(fetchOrder(id)); }, [id]);

  if (!current) return <div className={s.loading}>Загрузка…</div>;
  const o = current as any;

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

      {/* Действия */}
      <div className={s.actions}>
        <Link to={`/orders/${o.id}/diagnostics`} className={s.actBtn}>🤖 AI-диагностика и смета</Link>
        <Link to={`/chat/${o.id}`} className={s.actBtn}>💬 AI-чат по заказу</Link>
        <a href={`/api/v1/export/orders/${o.id}/pdf`} target='_blank' rel='noreferrer' className={s.actBtn}>📄 Скачать PDF</a>
      </div>
    </div>
  );
}
