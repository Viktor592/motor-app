import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';
import s from './PartsPage.module.css';

interface Part {
  id: string; article: string; name: string; category: string;
  isOriginal: boolean; localStock: number; retailPrice: number;
}

const CATEGORY_KEYS = ['OIL_FILTERS','OEM','AFTERMARKET','BRAKES','BODY','CHEMICALS'];
const INTL: Record<string, string> = { ru: 'ru', kk: 'kk-KZ', en: 'en-US' };

export default function PartsPage() {
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const intl = INTL[locale] ?? 'ru';
  const [parts, setParts]     = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [cart, setCart]       = useState<Record<string, number>>({});
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState<string | null>(null);

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const vs = r.data.vehicles ?? [];
      setVehicles(vs);
      if (vs.length === 1) setVehicleId(vs[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search)   params.q = search;
    if (category) params.category = category;
    api.get('/parts', { params }).then(r => setParts(r.data.parts)).finally(() => setLoading(false));
  }, [search, category]);

  const addToCart   = (id: string) => setCart(c => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const removeFromCart = (id: string) => setCart(c => {
    const n = { ...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n;
  });

  const cartItems = Object.entries(cart).map(([id, qty]) => ({ part: parts.find(p => p.id === id), qty })).filter(x => x.part);
  const cartTotal = cartItems.reduce((s, x) => s + (x.part!.retailPrice * x.qty), 0);
  const cartCount  = Object.values(cart).reduce((a, b) => a + b, 0);

  const placeOrder = async () => {
    if (!vehicleId) { setError(t('parts.err.select_vehicle')); return; }
    if (cartItems.length === 0) return;
    setPlacing(true); setError('');
    try {
      const { data } = await api.post('/parts/order', {
        vehicleId,
        items: cartItems.map(x => ({ partId: x.part!.id, qty: x.qty })),
      });
      setDone(data.orderNumber);
      setCart({});
    } catch (e: any) {
      setError(e.response?.data?.error ?? t('parts.err.generic'));
    } finally { setPlacing(false); }
  };

  if (done) return (
    <div className={s.page}>
      <div className={s.doneBox}>
        <div className={s.doneIcon}>✅</div>
        <h2 className={s.doneTitle}>{t('parts.done_title')}</h2>
        <p className={s.doneSub}>{t('parts.done_sub')}</p>
        <div className={s.doneRow}>
          <button className={s.btn} onClick={() => navigate('/orders')}>{t('parts.my_orders')}</button>
          <button className={s.btnGhost} onClick={() => setDone(null)}>{t('parts.continue')}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={s.page}>
      <div className={s.eye}>{t('parts.eyebrow')}</div>
      <h1 className={s.h1}>{t('parts.title')}</h1>

      <input className={s.search} placeholder={t('parts.search')}
        value={search} onChange={e => setSearch(e.target.value)} />

      <div className={s.chips}>
        <button className={s.chip} data-active={category === ''} onClick={() => setCategory('')}>{t('parts.filter_all')}</button>
        {CATEGORY_KEYS.map(key => (
          <button key={key} className={s.chip} data-active={category === key} onClick={() => setCategory(key)}>{t(`parts.category.${key}`)}</button>
        ))}
      </div>

      {loading && <div className={s.loading}>{t('parts.loading')}</div>}

      {!loading && (
        <div className={s.grid}>
          {parts.map(p => (
            <div key={p.id} className={s.card}>
              <div className={s.cardCat}>{t(`parts.category.${p.category}`).split(' ')[0] ?? ''}</div>
              <div className={s.cardName}>{p.name}</div>
              <div className={s.cardArticle}>{t('parts.article')} {p.article}</div>
              <div className={s.cardStock} data-in={p.localStock > 0}>
                {p.localStock > 0 ? `${t('parts.in_stock')} ${p.localStock}` : t('parts.on_order')}
              </div>
              <div className={s.cardBottom}>
                <div className={s.cardPrice}>{p.retailPrice.toLocaleString(intl)} ₽</div>
                {cart[p.id] ? (
                  <div className={s.qty}>
                    <button onClick={() => removeFromCart(p.id)}>−</button>
                    <span>{cart[p.id]}</span>
                    <button onClick={() => addToCart(p.id)}>+</button>
                  </div>
                ) : (
                  <button className={s.addBtn} onClick={() => addToCart(p.id)}>{t('parts.add_to_cart')}</button>
                )}
              </div>
            </div>
          ))}
          {parts.length === 0 && <div className={s.empty}>{t('parts.empty')}</div>}
        </div>
      )}

      {cartCount > 0 && (
        <div className={s.cartBar}>
          <div className={s.cartInfo}>
            <b>{cartCount}</b> {t('parts.cart_units')} <b>{cartTotal.toLocaleString(intl)} ₽</b>
          </div>
          {vehicles.length > 1 && (
            <select className={s.vehicleSelect} value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
              <option value="">{t('parts.select_vehicle')}</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model}</option>)}
            </select>
          )}
          {vehicles.length === 0 && (
            <span className={s.noVehicle}>{t('parts.no_vehicle')}</span>
          )}
          {error && <span className={s.cartError}>{error}</span>}
          <button className={s.btn} disabled={placing || !vehicleId} onClick={placeOrder}>
            {placing ? '…' : t('parts.place_order')}
          </button>
        </div>
      )}
    </div>
  );
}
