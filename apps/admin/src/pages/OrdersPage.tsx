import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../slices/ordersSlice';
import { AppDispatch, RootState } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import s from './OrdersPage.module.css';

const FILTERS = ['Все','NEW','IN_PROGRESS','READY','CLOSED','CANCELLED'];

export default function OrdersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { list, loading } = useSelector((st: RootState) => st.orders);
  const [filter, setFilter] = useState('Все');
  const [search, setSearch] = useState('');

  useEffect(() => { dispatch(fetchOrders()); }, []);

  const shown = list.filter(o => {
    const matchStatus = filter === 'Все' || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.vehicle.brand.toLowerCase().includes(q) ||
      o.vehicle.model.toLowerCase().includes(q) ||
      (o as any).client?.name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <div className={s.eye}>// Мои заказы</div>
          <h1 className={s.h1}>ЗАКАЗЫ</h1>
        </div>
      </div>

      <input className={s.search} placeholder='Поиск по номеру, марке, клиенту…' value={search} onChange={e => setSearch(e.target.value)} />
      <div className={s.filters}>
        {FILTERS.map(f => (
          <button key={f} className={`${s.fBtn} ${filter === f ? s.fActive : ''}`}
            onClick={() => setFilter(f)}>
            {f === 'Все' ? 'Все' : <StatusBadge status={f} />}
            {f === 'Все' && <span className={s.fCount}>{list.length}</span>}
          </button>
        ))}
      </div>

      {loading && <p className={s.loading}>Загрузка…</p>}

      {!loading && shown.length === 0 && (
        <div className={s.empty}>
          <p>Нет заказов{filter !== 'Все' ? ' с этим статусом' : ''}</p>
          <Link to="/booking">Записаться →</Link>
        </div>
      )}

      <div className={s.table}>
        {shown.map(o => (
          <Link to={`/orders/${o.id}`} key={o.id} className={s.row}>
            <div className={s.rowNum}>{o.orderNumber}</div>
            <div className={s.rowCar}>{o.vehicle.brand} {o.vehicle.model} <span>{o.vehicle.year}</span></div>
            <div className={s.rowSpec}>{
              { MECHANIC: '🔧 Слесарь', ELECTRICIAN: '⚡ Электрик', DIAGNOSTICS: '🔍 Диагност' }[o.specialistType] ?? o.specialistType
            }</div>
            {o.slot
              ? <div className={s.rowDate}>{new Date(o.slot.startAt).toLocaleDateString('ru',{day:'2-digit',month:'short'})}</div>
              : <div className={s.rowDate} />
            }
            <div><StatusBadge status={o.status} /></div>
            {o.totalRetail
              ? <div className={s.rowPrice}>{Number(o.totalRetail).toLocaleString('ru')} ₽</div>
              : <div className={s.rowPrice} />
            }
            <div className={s.rowArr}>→</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
