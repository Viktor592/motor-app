import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../slices/ordersSlice';
import { AppDispatch, RootState } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import s from './HomePage.module.css';

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { name }  = useSelector((st: RootState) => st.auth);
  const { list, loading } = useSelector((st: RootState) => st.orders);

  useEffect(() => { dispatch(fetchOrders()); }, []);

  const active = list.filter(o => !['CLOSED','CANCELLED'].includes(o.status));
  const closed = list.filter(o => o.status === 'CLOSED').slice(0, 3);

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroText}>
          <div className={s.eye}>// ДАШБОРД КЛИЕНТА</div>
          <h1 className={s.h1}>Привет, <em>{name?.split(' ')[0] ?? 'клиент'}</em></h1>
          <p className={s.sub}>Управляйте заказами и общайтесь с AI-агентами МОТОР.</p>
        </div>
        <div className={s.livePill}>
          <span className={s.liveDot} />
          AI-агенты онлайн
        </div>
      </div>

      {/* Quick actions */}
      <div className={s.qaGrid}>
        <Link to="/booking" className={`${s.qa} ${s.qaOre}`}>
          <span className={s.qaIco}>📅</span>
          <span className={s.qaLabel}>Записаться</span>
          <span className={s.qaSub}>Слесарь · Электрик · Диагност</span>
        </Link>
        <Link to="/chat" className={s.qa}>
          <span className={s.qaIco}>🤖</span>
          <span className={s.qaLabel}>AI-чат</span>
          <span className={s.qaSub}>Агент «Приёмщик» онлайн</span>
        </Link>
        <Link to="/orders" className={s.qa}>
          <span className={s.qaIco}>📋</span>
          <span className={s.qaLabel}>Все заказы</span>
          <span className={s.qaSub}>{list.length} заказов в истории</span>
        </Link>
      </div>

      {/* Active orders */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>АКТИВНЫЕ ЗАКАЗЫ</h2>
        {loading && <p className={s.loading}>Загрузка…</p>}
        {!loading && active.length === 0 && (
          <div className={s.empty}>
            <p>Нет активных заказов</p>
            <Link to="/booking" className={s.emptyLink}>Записаться →</Link>
          </div>
        )}
        <div className={s.orderGrid}>
          {active.map(o => (
            <Link to={`/orders/${o.id}`} key={o.id} className={s.card}>
              <div className={s.cardTop}>
                <span className={s.cardNum}>{o.orderNumber}</span>
                <StatusBadge status={o.status} />
              </div>
              <p className={s.cardCar}>{o.vehicle.brand} {o.vehicle.model} · {o.vehicle.year}</p>
              {o.slot && (
                <p className={s.cardSlot}>
                  📅 {new Date(o.slot.startAt).toLocaleString('ru',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                  {' · '}{o.slot.post.name}
                </p>
              )}
              {o.totalRetail && (
                <p className={s.cardPrice}>Смета: {Number(o.totalRetail).toLocaleString('ru')} ₽</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* History */}
      {closed.length > 0 && (
        <section className={s.section}>
          <h2 className={s.sectionTitle}>ИСТОРИЯ</h2>
          <div className={s.orderGrid}>
            {closed.map(o => (
              <Link to={`/orders/${o.id}`} key={o.id} className={`${s.card} ${s.cardClosed}`}>
                <div className={s.cardTop}>
                  <span className={`${s.cardNum} ${s.cardNumDim}`}>{o.orderNumber}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className={s.cardCar}>{o.vehicle.brand} {o.vehicle.model}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
