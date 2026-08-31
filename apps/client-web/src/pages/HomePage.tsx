import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../slices/ordersSlice';
import { AppDispatch, RootState } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';
import s from './HomePage.module.css';

const INTL: Record<string, string> = { ru: 'ru', kk: 'kk-KZ', en: 'en-US' };

export default function HomePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { t, locale } = useLocale();
  const intl = INTL[locale] ?? 'ru';
  const { name }  = useSelector((st: RootState) => st.auth);
  const { list, loading } = useSelector((st: RootState) => st.orders);
  const [promos, setPromos] = useState<{ id: string; title: string; body: string; imageUrl?: string }[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);

  useEffect(() => { dispatch(fetchOrders({})); }, []);
  useEffect(() => { api.get('/saas/promotions').then(r => setPromos(r.data.promotions)).catch(() => {}); }, []);
  useEffect(() => { api.get('/booking/mine').then(r => setMyBookings(r.data.bookings)).catch(() => {}); }, []);

  const active = list.filter(o => !['CLOSED','CANCELLED'].includes(o.status));
  const closed = list.filter(o => o.status === 'CLOSED').slice(0, 3);

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroText}>
          <div className={s.eye}>{t('home.eyebrow')}</div>
          <h1 className={s.h1}>{t('home.greeting')} <em>{name?.split(' ')[0] ?? t('home.greeting_fallback')}</em></h1>
          <p className={s.sub}>{t('home.subtitle')}</p>
        </div>
        <div className={s.livePill}>
          <span className={s.liveDot} />
          {t('home.ai_online')}
        </div>
      </div>

      {promos.length > 0 && (
        <div className={s.promoWrap}>
          {promos.map(p => (
            <div key={p.id} className={s.promo}>
              {p.imageUrl && <img src={p.imageUrl} alt="" className={s.promoImg} />}
              <div>
                <div className={s.promoBadge}>{t('home.promo_badge')}</div>
                <div className={s.promoTitle}>{p.title}</div>
                <div className={s.promoBody}>{p.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {myBookings.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dust)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            {t('home.my_bookings')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myBookings.slice(0, 3).map(b => {
              const statusColor: Record<string, string> = {
                PENDING: 'var(--gold)', CONFIRMED: 'var(--green)',
                COMPLETED: 'var(--dust)', CANCELLED: 'var(--red)', NO_SHOW: 'var(--red)',
              };
              return (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: 10, border: '1px solid var(--wire)', background: 'var(--plate)' }}>
                  <div>
                    <div style={{ fontSize: 13.5, color: 'var(--chalk)', fontWeight: 600 }}>
                      {new Date(b.scheduledAt).toLocaleString(intl, { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--dust)' }}>{b.vehicleMake ?? ''}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: statusColor[b.status] ?? 'var(--dust)' }}>
                    {t(`booking.status.${b.status}`)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className={s.qaGrid}>
        <Link to="/booking" className={`${s.qa} ${s.qaOre}`}>
          <span className={s.qaIco}>📅</span>
          <span className={s.qaLabel}>{t('home.qa.book')}</span>
          <span className={s.qaSub}>{t('home.qa.book_sub')}</span>
        </Link>
        <Link to="/chat" className={s.qa}>
          <span className={s.qaIco}>🤖</span>
          <span className={s.qaLabel}>{t('home.qa.chat')}</span>
          <span className={s.qaSub}>{t('home.qa.chat_sub')}</span>
        </Link>
        <Link to="/orders" className={s.qa}>
          <span className={s.qaIco}>📋</span>
          <span className={s.qaLabel}>{t('home.qa.orders')}</span>
          <span className={s.qaSub}>{t('home.qa.orders_sub', { count: list.length })}</span>
        </Link>
      </div>

      {/* Active orders */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>{t('home.active_orders')}</h2>
        {loading && <p className={s.loading}>{t('common.loading')}</p>}
        {!loading && active.length === 0 && (
          <div className={s.empty}>
            <p>{t('home.no_active')}</p>
            <Link to="/booking" className={s.emptyLink}>{t('home.book_link')}</Link>
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
                  📅 {new Date(o.slot.startAt).toLocaleString(intl,{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                  {' · '}{o.slot.post.name}
                </p>
              )}
              {o.totalRetail && (
                <p className={s.cardPrice}>{t('home.estimate')} {Number(o.totalRetail).toLocaleString(intl)} ₽</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* History */}
      {closed.length > 0 && (
        <section className={s.section}>
          <h2 className={s.sectionTitle}>{t('home.history')}</h2>
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
