import { useState, useEffect, useCallback } from 'react';
import styles from './WarehousePage.module.css';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';

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

const STATUS_KEYS: Record<string, string> = {
  DRAFT: 'warehouse.status.draft', SENT: 'warehouse.status.sent', CONFIRMED: 'warehouse.status.confirmed',
  DELIVERED: 'warehouse.status.delivered', CANCELLED: 'warehouse.status.cancelled',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6b7280', SENT: '#2563eb', CONFIRMED: '#d97706',
  DELIVERED: '#16a34a', CANCELLED: '#dc2626',
};
const CATEGORY_KEYS: Record<string, string> = {
  OIL_FILTERS: 'warehouse.cat.oil_filters', OEM: 'warehouse.cat.oem',
  AFTERMARKET: 'warehouse.cat.aftermarket', BRAKES: 'warehouse.cat.brakes',
  BODY: 'warehouse.cat.body', CHEMICALS: 'warehouse.cat.chemicals',
};

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n: number | null) =>
  n == null ? '—' : new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

export default function WarehousePage() {
  const { t } = useLocale();
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
      const { data } = await api.get(`/warehouse/stock?${params}`);
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
    const { data } = await api.get('/warehouse/low-stock?threshold=3');
    setLowStock(data);
  }, []);

  const loadSuppliers = useCallback(async () => {
    const { data } = await api.get('/warehouse/suppliers');
    setSuppliers(data);
  }, []);

  useEffect(() => {
    if (tab === 'lowstock') { loadLowStock(); loadSuppliers(); }
    if (tab === 'suppliers') loadSuppliers();
    if (tab === 'orders') loadOrders();
  }, [tab]);

  const handleAutoOrder = async () => {
    if (!autoOrderSupplier) return alert(t('warehouse.select_supplier_alert'));
    await api.post('/warehouse/auto-order', { supplierId: autoOrderSupplier, threshold: 3 });
    alert(t('warehouse.draft_created_alert'));
    setTab('orders');
  };

  // ── Supplier orders ───────────────────────────────────────
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const loadOrders = async () => {
    const { data } = await api.get('/warehouse/supplier-orders');
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
        <h1 className={styles.title}>{t('warehouse.title')}</h1>
        <div className={styles.tabs}>
          {(['stock', 'lowstock', 'orders', 'suppliers'] as const).map(tabKey => (
            <button key={tabKey} className={`${styles.tab} ${tab === tabKey ? styles.tabActive : ''}`}
              onClick={() => setTab(tabKey)}>
              {tabKey === 'stock' && t('warehouse.tab.stock')}
              {tabKey === 'lowstock' && t('warehouse.tab.lowstock')}
              {tabKey === 'orders' && t('warehouse.tab.orders')}
              {tabKey === 'suppliers' && t('warehouse.tab.suppliers')}
            </button>
          ))}
        </div>
      </div>

      {/* ── ОСТАТКИ ── */}
      {tab === 'stock' && (
        <div className={styles.section}>
          <div className={styles.toolbar}>
            <input className={styles.search} placeholder={t('warehouse.search_placeholder')}
              value={stockQ} onChange={e => { setStockQ(e.target.value); setStockPage(1); }} />
            <span className={styles.total}>{t('warehouse.total_positions', { count: stockTotal })}</span>
          </div>

          {loadingStock ? <div className={styles.loading}>{t('edo.loading')}</div> : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('warehouse.th.article')}</th><th>{t('warehouse.th.name')}</th><th>{t('warehouse.th.category')}</th>
                  <th>{t('warehouse.th.in_stock')}</th><th>{t('warehouse.reserve')}</th><th>{t('warehouse.th.available')}</th>
                  <th>{t('warehouse.th.purchase_price')}</th><th></th>
                </tr>
              </thead>
              <tbody>
                {stock.map(p => (
                  <tr key={p.id} className={p.available <= 0 ? styles.rowDanger : p.available <= 3 ? styles.rowWarn : ''}>
                    <td><code>{p.article}</code></td>
                    <td>{p.name}</td>
                    <td><span className={styles.badge}>{t(CATEGORY_KEYS[p.category] ?? '') || p.category}</span></td>
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
                        {t('warehouse.adjust_btn')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className={styles.pagination}>
            <button disabled={stockPage === 1} onClick={() => setStockPage(p => p - 1)}>{t('warehouse.pagination.back')}</button>
            <span>{t('warehouse.pagination.page', { page: stockPage })}</span>
            <button disabled={stock.length < 30} onClick={() => setStockPage(p => p + 1)}>{t('warehouse.pagination.forward')}</button>
          </div>
        </div>
      )}

      {/* ── НЕХВАТКА ── */}
      {tab === 'lowstock' && (
        <div className={styles.section}>
          <div className={styles.autoOrderBar}>
            <span className={styles.lowStockTitle}>⚠️ {t('warehouse.lowstock_title', { count: lowStock.length })}</span>
            <select className={styles.select} value={autoOrderSupplier}
              onChange={e => setAutoOrderSupplier(e.target.value)}>
              <option value="">{t('warehouse.select_supplier_placeholder')}</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button className={styles.btnPrimary} onClick={handleAutoOrder}>
              {t('warehouse.create_auto_order_btn')}
            </button>
          </div>

          <table className={styles.table}>
            <thead>
              <tr><th>{t('warehouse.th.article')}</th><th>{t('warehouse.th.name')}</th><th>{t('warehouse.th.stock')}</th><th>{t('warehouse.reserve')}</th><th>{t('warehouse.th.available')}</th><th>{t('warehouse.th.to_order')}</th></tr>
            </thead>
            <tbody>
              {lowStock.map(p => (
                <tr key={p.id} className={styles.rowDanger}>
                  <td><code>{p.article}</code></td>
                  <td>{p.name}</td>
                  <td className={styles.center}>{p.localStock}</td>
                  <td className={styles.center}>{p.reserved}</td>
                  <td className={styles.center}><strong className={styles.zero}>{p.available}</strong></td>
                  <td className={styles.center}>{t('warehouse.qty_units', { n: p.suggestedQty })}</td>
                </tr>
              ))}
              {lowStock.length === 0 && <tr><td colSpan={6} className={styles.empty}>{t('warehouse.all_good')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ЗАКАЗЫ ПОСТАВЩИКАМ ── */}
      {tab === 'orders' && (
        <div className={styles.section}>
          <div className={styles.toolbar}>
            <span className={styles.total}>{t('warehouse.orders_count', { count: orders.length })}</span>
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
                      {t(STATUS_KEYS[o.status])}
                    </span>
                    <div className={styles.statusActions}>
                      {o.status === 'DRAFT'     && <button className={styles.btnSm} onClick={() => updateOrderStatus(o.id, 'SENT')}>{t('warehouse.status_action.send')}</button>}
                      {o.status === 'SENT'      && <button className={styles.btnSm} onClick={() => updateOrderStatus(o.id, 'CONFIRMED')}>{t('warehouse.status_action.confirm')}</button>}
                      {o.status === 'CONFIRMED' && <button className={styles.btnSm} onClick={() => updateOrderStatus(o.id, 'DELIVERED')}>{t('warehouse.status_action.receive')}</button>}
                      {!['DELIVERED','CANCELLED'].includes(o.status) && (
                        <button className={styles.btnDanger} onClick={() => updateOrderStatus(o.id, 'CANCELLED')}>✕</button>
                      )}
                    </div>
                    <span>{expandedOrder === o.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedOrder === o.id && (
                  <table className={styles.tableInner}>
                    <thead><tr><th>{t('warehouse.th.article')}</th><th>{t('warehouse.th.name')}</th><th>{t('warehouse.th.qty')}</th><th>{t('warehouse.th.price')}</th><th>{t('warehouse.th.sum')}</th><th>{t('warehouse.th.received')}</th></tr></thead>
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
            {orders.length === 0 && <div className={styles.empty}>{t('warehouse.no_orders')}</div>}
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
            {suppliers.length === 0 && <div className={styles.empty}>{t('warehouse.no_suppliers')}</div>}
          </div>
        </div>
      )}

      {/* ── МОДАЛ КОРРЕКТИРОВКИ ── */}
      {adjustItem && (
        <div className={styles.overlay} onClick={() => setAdjustItem(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{t('warehouse.adjust_modal_title')}</h3>
            <p className={styles.modalSub}>{adjustItem.name} <code>{adjustItem.article}</code></p>
            <label className={styles.label}>{t('warehouse.new_qty_label')}</label>
            <input className={styles.input} type="number" min="0" value={adjustQty}
              onChange={e => setAdjustQty(e.target.value)} />
            <label className={styles.label}>{t('finance.comment_label')}</label>
            <input className={styles.input} placeholder="Инвентаризация…" value={adjustComment}
              onChange={e => setAdjustComment(e.target.value)} />
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setAdjustItem(null)}>{t('finance.cancel_btn')}</button>
              <button className={styles.btnPrimary} onClick={submitAdjust}>{t('warehouse.save_plain_btn')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
