import { useState, useEffect, useCallback } from 'react';
import styles from './BookingsPage.module.css';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';

interface Booking {
  id: string; clientName: string; clientPhone: string;
  serviceType: string; description: string | null;
  vehicleMake: string | null; vehicleModel: string | null; vehiclePlate: string | null;
  scheduledAt: string; status: string; source: string;
  convertedOrderId: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#d97706', CONFIRMED: '#2563eb',
  COMPLETED: '#16a34a', CANCELLED: '#dc2626', NO_SHOW: '#6b7280',
};

export default function BookingsPage() {
  const { t } = useLocale();
  const STATUS_LABELS: Record<string, string> = {
    PENDING: t('admin_bookings.status.PENDING'), CONFIRMED: t('admin_bookings.status.CONFIRMED'),
    COMPLETED: t('admin_bookings.status.COMPLETED'), CANCELLED: t('admin_bookings.status.CANCELLED'), NO_SHOW: t('admin_bookings.status.NO_SHOW'),
  };
  const SERVICE_LABELS: Record<string, string> = {
    MECHANIC: `🔩 ${t('admin_bookings.service.MECHANIC')}`, AUTO_ELECTRICIAN: `⚡ ${t('admin_bookings.service.AUTO_ELECTRICIAN')}`,
    TIRE_FITTER: `🔧 ${t('admin_bookings.service.TIRE_FITTER')}`, DIAGNOSTICIAN: `🖥 ${t('admin_bookings.service.DIAGNOSTICIAN')}`,
    BODY: `🚗 ${t('admin_bookings.service.BODY')}`, OTHER: `🛠 ${t('admin_bookings.service.OTHER')}`,
  };
  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [total, setTotal]         = useState(0);
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus]       = useState('');
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);

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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('admin_bookings.title')}</h1>
          <p className={styles.sub}>{t('admin_bookings.subtitle')}</p>
        </div>
        <a
          href="/booking-widget.html" target="_blank"
          className={styles.widgetLink}
        >
          🔗 {t('admin_bookings.widget_link')}
        </a>
      </div>

      {/* Фильтры */}
      <div className={styles.filters}>
        <input type="date" className={styles.dateInput} value={date}
          onChange={e => { setDate(e.target.value); setPage(1); }} />
        <select className={styles.select} value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{t('admin_bookings.all_statuses')}</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span className={styles.total}>{t('admin_bookings.count', { n: total })}</span>
      </div>

      {/* Таблица */}
      <div className={styles.tableWrap}>
        {loading ? <div className={styles.loading}>{t('common.loading')}</div> : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('admin_bookings.th_time')}</th><th>{t('admin_bookings.th_client')}</th><th>{t('admin_bookings.th_service')}</th>
                <th>{t('admin_bookings.th_vehicle')}</th><th>{t('admin_bookings.th_status')}</th>
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
                    <div className={styles.source}>{b.source === 'WIDGET' ? `🌐 ${t('admin_bookings.source_site')}` : `📱 ${t('admin_bookings.source_app')}`}</div>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>{t('admin_bookings.empty_day')}</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.pagination}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← {t('admin_bookings.back')}</button>
        <span>{t('admin_bookings.page', { n: page })}</span>
        <button disabled={bookings.length < 30} onClick={() => setPage(p => p + 1)}>{t('admin_bookings.forward')} →</button>
      </div>
    </div>
  );
}
