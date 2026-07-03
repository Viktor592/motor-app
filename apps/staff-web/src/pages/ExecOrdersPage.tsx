import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../slices/ordersSlice';
import { AppDispatch, RootState } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import s from './ExecOrdersPage.module.css';

const COLUMNS = [
  { status: 'NEW',         label: 'Новые',      color: 'var(--blue)' },
  { status: 'CONFIRMED',   label: 'Подтверждены', color: 'var(--teal)' },
  { status: 'IN_PROGRESS', label: 'В работе',   color: 'var(--ore)' },
  { status: 'READY',       label: 'Готовы',     color: 'var(--green)' },
];

const SPEC_ICO: Record<string, string> = {
  MECHANIC: '🔧', ELECTRICIAN: '⚡', DIAGNOSTICS: '🔍',
};

export default function ExecOrdersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { list, loading } = useSelector((st: RootState) => st.orders);

  useEffect(() => { dispatch(fetchOrders()); }, []);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.eye}>// Исполнительская панель</div>
        <h1 className={s.h1}>КАНБАН ЗАКАЗОВ</h1>
      </div>

      {loading && <p className={s.loading}>Загрузка…</p>}

      <div className={s.board}>
        {COLUMNS.map(col => {
          const orders = list.filter(o => o.status === col.status);
          return (
            <div key={col.status} className={s.column}>
              <div className={s.colHeader} style={{ borderTopColor: col.color }}>
                <span className={s.colLabel} style={{ color: col.color }}>{col.label}</span>
                <span className={s.colCount}>{orders.length}</span>
              </div>
              <div className={s.colCards}>
                {orders.length === 0 && (
                  <div className={s.colEmpty}>Нет заказов</div>
                )}
                {orders.map(o => (
                  <Link to={`/orders/${o.id}`} key={o.id} className={s.card}>
                    <div className={s.cardTop}>
                      <span className={s.cardNum}>{o.orderNumber}</span>
                      <span className={s.cardSpec}>{SPEC_ICO[o.specialistType]}</span>
                    </div>
                    <p className={s.cardCar}>{o.vehicle.brand} {o.vehicle.model}</p>
                    {o.slot && (
                      <p className={s.cardTime}>
                        {new Date(o.slot.startAt).toLocaleString('ru', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {(o as any).client && (
                      <p className={s.cardClient}>👤 {(o as any).client.name}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
