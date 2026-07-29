import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../slices/ordersSlice';
import { AppDispatch, RootState } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import { useLocale } from '../services/i18n';
import s from './OrdersPage.module.css';

const STATUS_FILTERS = ['NEW','IN_PROGRESS','READY','CLOSED','CANCELLED'];
const INTL: Record<string, string> = { ru: 'ru', kk: 'kk-KZ', en: 'en-US' };

export default function OrdersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { t, locale } = useLocale();
  const intl = INTL[locale] ?? 'ru';
  const { list, loading } = useSelector((st: RootState) => st.orders);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => { dispatch(fetchOrders()); }, []);

  const shown = list.filter(o => {
    const matchStatus = filter === 'ALL' || o.status === filter;
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
          <div className={s.eye}>{t('orders.eyebrow')}</div>
          <h1 className={s.h1}>{t('orders.title')}</h1>
        </div>
        <Link to="/booking" className={s.newBtn}>{t('orders.new_booking')}</Link>
      </div>

      <input className={s.search} placeholder={t('orders.search')} value={search} onChange={e => setSearch(e.target.value)} />
      <div className={s.filters}>
        <button className={`${s.fBtn} ${filter === 'ALL' ? s.fActive : ''}`} onClick={() => setFilter('ALL')}>
          {t('orders.filter_all')}
          <span className={s.fCount}>{list.length}</span>
        </button>
        {STATUS_FILTERS.map(f => (
          <button key={f} className={`${s.fBtn} ${filter === f ? s.fActive : ''}`}
            onClick={() => setFilter(f)}>
            <StatusBadge status={f} />
          </button>
        ))}
      </div>

      {loading && <p className={s.loading}>{t('common.loading')}</p>}

      {!loading && shown.length === 0 && (
        <div className={s.empty}>
          <p>{t('orders.empty')}{filter !== 'ALL' ? t('orders.empty_status') : ''}</p>
          <Link to="/booking">{t('orders.book_link')}</Link>
        </div>
      )}

      <div className={s.table}>
        {shown.map(o => (
          <Link to={`/orders/${o.id}`} key={o.id} className={s.row}>
            <div className={s.rowNum}>{o.orderNumber}</div>
            <div className={s.rowCar}>{o.vehicle.brand} {o.vehicle.model} <span>{o.vehicle.year}</span></div>
            <div className={s.rowSpec}>{t(`specialist.${o.specialistType}`)}</div>
            {o.slot
              ? <div className={s.rowDate}>{new Date(o.slot.startAt).toLocaleDateString(intl,{day:'2-digit',month:'short'})}</div>
              : <div className={s.rowDate} />
            }
            <div><StatusBadge status={o.status} /></div>
            {o.totalRetail
              ? <div className={s.rowPrice}>{Number(o.totalRetail).toLocaleString(intl)} ₽</div>
              : <div className={s.rowPrice} />
            }
            <div className={s.rowArr}>→</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
