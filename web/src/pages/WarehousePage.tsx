import { useState, useEffect, useCallback } from 'react';
import styles from './WarehousePage.module.css';
import { api } from '../services/api';

// ── Types ────────────────────────────────────────────────────
interface StockItem {
  id: string; article: string; name: string;
  category: string; localStock: number; localCost: number | null;
  reserved: number; available: number;
}
interface Supplier {
  id: string; name: string; type: string; isActive: boolean;
}
interface SupplierOrder {
  id: string; status: string; totalCost: number | null;
  createdAt: string; comment: string | null;
  supplier: { name: string };
  items: { id: string; article: string; name: string; qty: number; costPrice: number; isReceived: boolean }[];
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик', SENT: 'Отправлен', CONFIRMED: 'Подтверждён',
  DELIVERED: 'Доставлен', CANCELLED: 'Отменён',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6b7280', SENT: '#2563eb', CONFIRMED: '#d97706',
  DELIVERED: '#16a34a', CANCELLED: '#dc2626',
};
const CATEGORY_LABELS: Record<string, string> = {
  OIL_FILTERS: 'Масло / фильтры', OEM: 'OEM оригинал',
  AFTERMARKET: 'Аналоги', BRAKES: 'Тормоза',
  BODY: 'Кузов', CHEMICALS: 'Химия',
};

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n: number | null) =>
  n == null ? '—' : new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

export default function WarehousePage() {
  const [tab, setTab] = useState<'stock' | 'orders' | 'suppliers' | 'lowstock'>('stock');

  // ── Stock ─────────────────────────────────────────────────
  const [stock, setStock] = useState<StockItem[]>([]);
  const [stockTotal, setStockTotal] = useState(0);
  const [stockQ, setStockQ] = useState('');
  const [stockPage, setStockPage] = useState(1);
  const [loadingStock, setLoadingStock] = useState(false);

  const loadStock = useCallback(async () => {
    setLoadingStock(true);
    try {
      const params = new URLSearchParams({ page: String(stockPage), limit: '30' });
      if (stockQ) params.set('q', stockQ);
      const data = await api.get(`/warehouse/stock?${params}`);
      setStock(data.parts);
      setStockTotal(data.total);
    } finally { setLoadingStock(false); }
  }, [stockPage, stockQ]);

  useEffect(() => { if (tab === 'stock') loadStock(); }, [tab, loadStock]);

  // ── Low stock ─────────────────────────────────────────────
  const [lowStock, setLowStock] = useState<(StockItem & { suggestedQty: number })[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [autoOrderSupplier, setAutoOrderSupplier] = useState('');

  const loadLowStock = useCallback(async () => {
    const data = await api.get('/warehouse/low-stock?threshold=3');
    setLowStock(data);
  }, []);

  const loadSuppliers = useCallback(async () => {
    const data = await api.get('/warehouse/suppliers');
    setSuppliers(data);
  }, []);

  useEffect(() => {
    if (tab === 'lowstock') { loadLowStock(); loadSuppliers(); }
    if (tab === 'suppliers') loadSuppliers();
    if (tab === 'orders') loadOrders();
  }, [tab]);

  const handleAutoOrder = async () => {
    if (!autoOrderSupplier) return alert('Выберите поставщика');
    await api.post('/warehouse/auto-order', { supplierId: autoOrderSupplier, threshold: 3 });
    alert('Черновик заказа создан!');
    setTab('orders');
  };

  // ── Supplier orders ───────────────────────────────────────
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const loadOrders = async () => {
    const data = await api.get('/warehouse/supplier-orders');
    setOrders(data);
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await api.patch(`/warehouse/supplier-orders/${id}/status`, { status });
    loadOrders();
  };

  // ── Adjustment modal ──────────────────────────────────────
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustComment, setAdjustComment] = useState('');

  const submitAdjust = async () => {
    if (!adjustItem) return;
    await api.post('/warehouse/stock/adjustment', {
      partId: adjustItem.id,
      qty: parseInt(adjustQty),
      comment: adjustComment,
    });
    setAdjustItem(null);
    setAdjustQty('');
    setAdjustComment('');
    loadStock();
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Склад</h1>
        <div className={styles.tabs}>
          {(['stock', 'lowstock', 'orders', 'suppliers'] as const).map(t => (
            <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}>
              {t === 'stock' && '📦 Остатки'}
              {t === 'lowstock' && '⚠️ Нехватка'}
              {t === 'orders' && '🛒 Заказы'}
              {t === 'suppliers' && '🏭 Поставщики'}
            </button>
          ))}
        </div>
      </div>

      {/* ── ОСТАТКИ ── */}
      {tab === 'stock' && (
        <div className={styles.section}>
          <div className={styles.toolbar}>
            <input className={styles.search} placeholder="Поиск по названию или артикулу…"
              value={stockQ} onChange={e => { setStockQ(e.target.value); setStockPage(1); }} />
            <span className={styles.total}>Всего: {stockTotal} позиций</span>
          </div>

          {loadingStock ? <div className={styles.loading}>Загрузка…</div> : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Артикул</th><th>Наименование</th><th>Категория</th>
                  <th>На складе</th><th>Резерв</th><th>Доступно</th>
                  <th>Цена закупки</th><th></th>
                </tr>
              </thead>
              <tbody>
                {stock.map(p => (
                  <tr key={p.id} className={p.available <= 0 ? styles.rowDanger : p.available <= 3 ? styles.rowWarn : ''}>
                    <td><code>{p.article}</code></td>
                    <td>{p.name}</td>
                    <td><span className={styles.badge}>{CATEGORY_LABELS[p.category] ?? p.category}</span></td>
                    <td className={styles.center}>{p.localStock}</td>
                    <td className={styles.center}>{p.reserved > 0 ? <span className={styles.reserved}>-{p.reserved}</span> : '—'}</td>
                    <td className={styles.center}>
                      <strong className={p.available <= 0 ? styles.zero : p.available <= 3 ? styles.low : ''}>
                        {p.available}
                      </strong>
                    </td>
                    <td>{fmt(p.localCost)}</td>
                    <td>
                      <button className={styles.btnSm} onClick={() => { setAdjustItem(p); setAdjustQty(String(p.localStock)); }}>
                        ✏️ Корр.
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className={styles.pagination}>
            <button disabled={stockPage === 1} onClick={() => setStockPage(p => p - 1)}>← Назад</button>
            <span>Стр. {stockPage}</span>
            <button disabled={stock.length < 30} onClick={() => setStockPage(p => p + 1)}>Вперёд →</button>
          </div>
        </div>
      )}

      {/* ── НЕХВАТКА ── */}
      {tab === 'lowstock' && (
        <div className={styles.section}>
          <div className={styles.autoOrderBar}>
            <span className={styles.lowStockTitle}>⚠️ {lowStock.length} позиций с остатком ≤ 3 шт.</span>
            <select className={styles.select} value={autoOrderSupplier}
              onChange={e => setAutoOrderSupplier(e.target.value)}>
              <option value="">— Выбрать поставщика —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button className={styles.btnPrimary} onClick={handleAutoOrder}>
              🔄 Создать авто-заказ
            </button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr><th>Артикул</th><th>Наименование</th><th>Остаток</th><th>Резерв</th><th>Доступно</th><th>Заказать</th></tr>
            </thead>
            <tbody>
              {lowStock.map(p => (
                <tr key={p.id} className={styles.rowDanger}>
                  <td><code>{p.article}</code></td>
                  <td>{p.name}</td>
                  <td className={styles.center}>{p.localStock}</td>
                  <td className={styles.center}>{p.reserved}</td>
                  <td className={styles.center}><strong className={styles.zero}>{p.available}</strong></td>
                  <td className={styles.center}>{p.suggestedQty} шт.</td>
                </tr>
              ))}
              {lowStock.length === 0 && <tr><td colSpan={6} className={styles.empty}>Всё в порядке ✅</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ЗАКАЗЫ ПОСТАВЩИКАМ ── */}
      {tab === 'orders' && (
        <div className={styles.section}>
          <div className={styles.toolbar}>
            <span className={styles.total}>Заказов: {orders.length}</span>
          </div>
          <div className={styles.orderList}>
            {orders.map(o => (
              <div key={o.id} className={styles.orderCard}>
                <div className={styles.orderHead} onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}>
                  <div>
                    <span className={styles.orderSupplier}>{o.supplier.name}</span>
                    <span className={styles.orderDate}>{new Date(o.createdAt).toLocaleDateString('ru-RU')}</span>
                    {o.comment && <span className={styles.orderComment}>{o.comment}</span>}
                  </div>
                  <div className={styles.orderRight}>
                    <span className={styles.orderTotal}>{fmt(o.totalCost)}</span>
                    <span className={styles.statusBadge} style={{ background: STATUS_COLORS[o.status] }}>
                      {STATUS_LABELS[o.status]}
                    </span>
                    <div className={styles.statusActions}>
                      {o.status === 'DRAFT'     && <button className={styles.btnSm} onClick={() => updateOrderStatus(o.id, 'SENT')}>📤 Отправить</button>}
                      {o.status === 'SENT'      && <button className={styles.btnSm} onClick={() => updateOrderStatus(o.id, 'CONFIRMED')}>✅ Подтвердить</button>}
                      {o.status === 'CONFIRMED' && <button className={styles.btnSm} onClick={() => updateOrderStatus(o.id, 'DELIVERED')}>📦 Получен</button>}
                      {!['DELIVERED','CANCELLED'].includes(o.status) && (
                        <button className={styles.btnDanger} onClick={() => updateOrderStatus(o.id, 'CANCELLED')}>✕</button>
                      )}
                    </div>
                    <span>{expandedOrder === o.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedOrder === o.id && (
                  <table className={styles.tableInner}>
                    <thead><tr><th>Артикул</th><th>Наименование</th><th>Кол-во</th><th>Цена</th><th>Сумма</th><th>Получено</th></tr></thead>
                    <tbody>
                      {o.items.map(item => (
                        <tr key={item.id} className={item.isReceived ? styles.received : ''}>
                          <td><code>{item.article}</code></td>
                          <td>{item.name}</td>
                          <td className={styles.center}>{item.qty}</td>
                          <td>{fmt(item.costPrice)}</td>
                          <td>{fmt(item.qty * item.costPrice)}</td>
                          <td className={styles.center}>{item.isReceived ? '✅' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
            {orders.length === 0 && <div className={styles.empty}>Заказов пока нет</div>}
          </div>
        </div>
      )}

      {/* ── ПОСТАВЩИКИ ── */}
      {tab === 'suppliers' && (
        <div className={styles.section}>
          <div className={styles.supplierGrid}>
            {suppliers.map(s => (
              <div key={s.id} className={styles.supplierCard}>
                <div className={styles.supplierIcon}>
                  {s.type === 'EXIST' ? '🔌' : s.type === 'AUTODOC' ? '🌐' : '🏭'}
                </div>
                <div>
                  <div className={styles.supplierName}>{s.name}</div>
                  <div className={styles.supplierType}>{s.type}</div>
                </div>
                <div className={`${styles.statusDot} ${s.isActive ? styles.dotActive : styles.dotOff}`} />
              </div>
            ))}
            {suppliers.length === 0 && <div className={styles.empty}>Поставщики не добавлены</div>}
          </div>
        </div>
      )}

      {/* ── МОДАЛ КОРРЕКТИРОВКИ ── */}
      {adjustItem && (
        <div className={styles.overlay} onClick={() => setAdjustItem(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Корректировка остатка</h3>
            <p className={styles.modalSub}>{adjustItem.name} <code>{adjustItem.article}</code></p>
            <label className={styles.label}>Новое количество</label>
            <input className={styles.input} type="number" min="0" value={adjustQty}
              onChange={e => setAdjustQty(e.target.value)} />
            <label className={styles.label}>Комментарий</label>
            <input className={styles.input} placeholder="Инвентаризация…" value={adjustComment}
              onChange={e => setAdjustComment(e.target.value)} />
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setAdjustItem(null)}>Отмена</button>
              <button className={styles.btnPrimary} onClick={submitAdjust}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
