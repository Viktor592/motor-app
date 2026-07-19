import { useState, useEffect, useCallback } from 'react';
import styles from './BookingsPage.module.css';
import { api } from '../services/api';

interface Booking {
  id: string; clientName: string; clientPhone: string;
  serviceType: string; description: string | null;
  vehicleMake: string | null; vehicleModel: string | null; vehiclePlate: string | null;
  scheduledAt: string; status: string; source: string;
  convertedOrderId: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает', CONFIRMED: 'Подтверждена',
  COMPLETED: 'Конвертирована', CANCELLED: 'Отменена', NO_SHOW: 'Не явился',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#d97706', CONFIRMED: '#2563eb',
  COMPLETED: '#16a34a', CANCELLED: '#dc2626', NO_SHOW: '#6b7280',
};
const SERVICE_LABELS: Record<string, string> = {
  MECHANIC: '🔩 Механик', AUTO_ELECTRICIAN: '⚡ Электрик',
  TIRE_FITTER: '🔧 Шиномонтаж', DIAGNOSTICIAN: '🖥 Диагностика',
  BODY: '🚗 Кузовной', OTHER: '🛠 Другое',
};

export default function BookingsPage() {
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [total, setTotal]         = useState(0);
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus]       = useState('');
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [converting, setConverting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (date)   params.set('date', date);
      if (status) params.set('status', status);
      const { data } = await api.get(`/booking?${params}`);
      setBookings(data.bookings);
      setTotal(data.total);
    } finally { setLoading(false); }
  }, [date, status, page]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, newStatus: string) => {
    await api.patch(`/booking/${id}/status`, { status: newStatus });
    load();
  };

  const convertToOrder = async (id: string) => {
    setConverting(id);
    try {
      const { data } = await api.post(`/booking/${id}/convert`, {});
      alert(`✅ Заказ #${data.orderNumber} создан!`);
      load();
    } finally { setConverting(null); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Онлайн-записи</h1>
          <p className={styles.sub}>Управление записями с сайта и приложения</p>
        </div>
      </div>

      {/* Фильтры */}
      <div className={styles.filters}>
        <input type="date" className={styles.dateInput} value={date}
          onChange={e => { setDate(e.target.value); setPage(1); }} />
        <select className={styles.select} value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Все статусы</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span className={styles.total}>Записей: {total}</span>
      </div>

      {/* Таблица */}
      <div className={styles.tableWrap}>
        {loading ? <div className={styles.loading}>Загрузка…</div> : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Время</th><th>Клиент</th><th>Услуга</th>
                <th>Автомобиль</th><th>Статус</th><th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td>
                    <div className={styles.time}>
                      {new Date(b.scheduledAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={styles.timeSub}>
                      {new Date(b.scheduledAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </div>
                  </td>
                  <td>
                    <div className={styles.clientName}>{b.clientName}</div>
                    <a className={styles.clientPhone} href={`tel:${b.clientPhone}`}>{b.clientPhone}</a>
                    {b.description && <div className={styles.desc}>{b.description}</div>}
                  </td>
                  <td>{SERVICE_LABELS[b.serviceType] ?? b.serviceType}</td>
                  <td>
                    {b.vehicleMake ? (
                      <>
                        <div>{b.vehicleMake} {b.vehicleModel}</div>
                        {b.vehiclePlate && <code className={styles.plate}>{b.vehiclePlate}</code>}
                      </>
                    ) : <span className={styles.na}>—</span>}
                  </td>
                  <td>
                    <span className={styles.badge} style={{ background: STATUS_COLORS[b.status] + '22', color: STATUS_COLORS[b.status] }}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                    <div className={styles.source}>{b.source === 'WIDGET' ? '🌐 Сайт' : '📱 Приложение'}</div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {b.status === 'PENDING' && (
                        <>
                          <button className={styles.btnConfirm} onClick={() => updateStatus(b.id, 'CONFIRMED')}>✅ Подтвердить</button>
                          <button className={styles.btnCancel}  onClick={() => updateStatus(b.id, 'CANCELLED')}>✕</button>
                        </>
                      )}
                      {b.status === 'CONFIRMED' && !b.convertedOrderId && (
                        <button
                          className={styles.btnConvert}
                          onClick={() => convertToOrder(b.id)}
                          disabled={converting === b.id}
                        >
                          {converting === b.id ? '…' : '📋 В заказ'}
                        </button>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <button className={styles.btnNoShow} onClick={() => updateStatus(b.id, 'NO_SHOW')}>Не явился</button>
                      )}
                      {b.convertedOrderId && (
                        <span className={styles.orderLink}>Заказ создан ✅</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>Записей за выбранный день нет</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.pagination}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Назад</button>
        <span>Стр. {page}</span>
        <button disabled={bookings.length < 30} onClick={() => setPage(p => p + 1)}>Вперёд →</button>
      </div>
    </div>
  );
}
