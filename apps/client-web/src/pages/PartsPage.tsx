import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import s from './PartsPage.module.css';

interface Part {
  id: string; article: string; name: string; category: string;
  isOriginal: boolean; localStock: number; retailPrice: number;
}

const CATEGORIES: Record<string, string> = {
  OIL_FILTERS: '🛢️ Масло и фильтры',
  OEM:         '🏭 Оригинал (OEM)',
  AFTERMARKET: '🔁 Аналоги',
  BRAKES:      '🛑 Тормоза',
  BODY:        '🚗 Кузов',
  CHEMICALS:   '🧴 Химия, расходники',
};

export default function PartsPage() {
  const navigate = useNavigate();
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
    if (!vehicleId) { setError('Выберите автомобиль'); return; }
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
      setError(e.response?.data?.error ?? 'Не удалось оформить заказ');
    } finally { setPlacing(false); }
  };

  if (done) return (
    <div className={s.page}>
      <div className={s.doneBox}>
        <div className={s.doneIcon}>✅</div>
        <h2 className={s.doneTitle}>Заказ оформлен</h2>
        <p className={s.doneSub}>Мы свяжемся с вами по готовности запчастей.</p>
        <div className={s.doneRow}>
          <button className={s.btn} onClick={() => navigate('/orders')}>Мои заказы →</button>
          <button className={s.btnGhost} onClick={() => setDone(null)}>Продолжить покупки</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={s.page}>
      <div className={s.eye}>// КАТАЛОГ</div>
      <h1 className={s.h1}>Запчасти</h1>

      <input className={s.search} placeholder="Поиск по названию или артикулу…"
        value={search} onChange={e => setSearch(e.target.value)} />

      <div className={s.chips}>
        <button className={s.chip} data-active={category === ''} onClick={() => setCategory('')}>Все</button>
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <button key={key} className={s.chip} data-active={category === key} onClick={() => setCategory(key)}>{label}</button>
        ))}
      </div>

      {loading && <div className={s.loading}>Загрузка…</div>}

      {!loading && (
        <div className={s.grid}>
          {parts.map(p => (
            <div key={p.id} className={s.card}>
              <div className={s.cardCat}>{CATEGORIES[p.category]?.split(' ')[0] ?? ''}</div>
              <div className={s.cardName}>{p.name}</div>
              <div className={s.cardArticle}>Артикул: {p.article}</div>
              <div className={s.cardStock} data-in={p.localStock > 0}>
                {p.localStock > 0 ? `В наличии: ${p.localStock}` : 'Под заказ'}
              </div>
              <div className={s.cardBottom}>
                <div className={s.cardPrice}>{p.retailPrice.toLocaleString('ru')} ₽</div>
                {cart[p.id] ? (
                  <div className={s.qty}>
                    <button onClick={() => removeFromCart(p.id)}>−</button>
                    <span>{cart[p.id]}</span>
                    <button onClick={() => addToCart(p.id)}>+</button>
                  </div>
                ) : (
                  <button className={s.addBtn} onClick={() => addToCart(p.id)}>+ В корзину</button>
                )}
              </div>
            </div>
          ))}
          {parts.length === 0 && <div className={s.empty}>Ничего не найдено</div>}
        </div>
      )}

      {cartCount > 0 && (
        <div className={s.cartBar}>
          <div className={s.cartInfo}>
            <b>{cartCount}</b> шт. на <b>{cartTotal.toLocaleString('ru')} ₽</b>
          </div>
          {vehicles.length > 1 && (
            <select className={s.vehicleSelect} value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
              <option value="">Выберите авто</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model}</option>)}
            </select>
          )}
          {vehicles.length === 0 && (
            <span className={s.noVehicle}>Сначала добавьте авто в профиле</span>
          )}
          {error && <span className={s.cartError}>{error}</span>}
          <button className={s.btn} disabled={placing || !vehicleId} onClick={placeOrder}>
            {placing ? '…' : 'Оформить заказ →'}
          </button>
        </div>
      )}
    </div>
  );
}
