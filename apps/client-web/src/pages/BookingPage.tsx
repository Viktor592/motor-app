import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLocale } from '../services/i18n';
import s from './BookingPage.module.css';

type SpecType = 'MECHANIC' | 'ELECTRICIAN' | 'DIAGNOSTICS';

const SPEC_TYPES: { type: SpecType; icon: string }[] = [
  { type: 'MECHANIC',    icon: '🔧' },
  { type: 'ELECTRICIAN', icon: '⚡' },
  { type: 'DIAGNOSTICS', icon: '🔍' },
];

const TIMES = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
const INTL: Record<string, string> = { ru: 'ru', kk: 'kk-KZ', en: 'en-US' };

export default function BookingPage() {
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const intl = INTL[locale] ?? 'ru';
  const [spec,      setSpec]      = useState<SpecType | ''>('');
  const [dates,     setDates]     = useState<string[]>([]);
  const [dateObjs,  setDateObjs]  = useState<Date[]>([]);
  const [selDate,   setSelDate]   = useState('');
  const [selTime,   setSelTime]   = useState('');
  const [brand,     setBrand]     = useState('');
  const [carModel,  setCarModel]  = useState('');
  const [year,      setYear]      = useState('');
  const [mileage,   setMileage]   = useState('');
  const [complaint, setComplaint] = useState('');
  const [clientName, setName]     = useState(localStorage.getItem('motor_user_name') ?? '');
  const [phone,     setPhone]     = useState(localStorage.getItem('motor_user_phone') ?? '');
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState<string | null>(null);
  const [error,     setError]     = useState('');
  const [busyTimes, setBusyTimes] = useState<string[]>([]);

  useEffect(() => {
    // Сгенерировать ближайшие 7 рабочих дней
    const days: string[] = [];
    const dateList: Date[] = [];
    const d = new Date();
    while (days.length < 7) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) {
        days.push(d.toLocaleDateString(intl, { weekday: 'short', day: '2-digit', month: 'short' }));
        dateList.push(new Date(d));
      }
    }
    setDates(days);
    setDateObjs(dateList);
  }, [intl]);

  useEffect(() => {
    if (!selDate || !spec) { setBusyTimes([]); return; }
    setSelTime('');
    const idx = dates.indexOf(selDate);
    const d = dateObjs[idx];
    if (!d) return;
    const dateStr = d.toISOString().slice(0, 10);
    api.get('/booking/slots', { params: { date: dateStr, serviceType: spec } })
      .then(r => setBusyTimes(r.data.slots.filter((s: any) => !s.available).map((s: any) => s.time)))
      .catch(() => setBusyTimes([]));
  }, [selDate, spec]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spec || !selDate || !selTime || !brand || !carModel || !complaint || !clientName || !phone) {
      setError(t('booking.err.required')); return;
    }
    setLoading(true); setError('');
    try {
      // Собираем дату+время в ISO. selDate — короткая локализованная строка,
      // поэтому ищём соответствующую реальную дату из dateObjs.
      const realDate = dateObjs[dates.indexOf(selDate)];
      const [hh, mm] = selTime.split(':').map(Number);
      const scheduledAt = new Date(realDate);
      scheduledAt.setHours(hh, mm, 0, 0);

      const { data } = await api.post('/booking/public', {
        clientName,
        clientPhone:  phone,
        serviceType:  spec,
        description:  complaint,
        vehicleMake:  brand,
        vehicleModel: carModel || undefined,
        vehicleYear:  year ? parseInt(year) : undefined,
        scheduledAt:  scheduledAt.toISOString(),
      });
      setDone(data.bookingId.slice(0, 8).toUpperCase());
    } catch (e: any) {
      setError(e.response?.data?.error ?? t('booking.err.generic'));
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className={s.confirm}>
      <div className={s.confirmBox}>
        <div className={s.confIco}>✅</div>
        <h2 className={s.confTitle}>{t('booking.done_title')}</h2>
        <p className={s.confNum}>{done}</p>
        <div className={s.confDetail}>
          <div className={s.confRow}><span>{t('booking.done.specialist')}</span><b>{t(`booking.spec.${spec}.name`)}</b></div>
          <div className={s.confRow}><span>{t('booking.done.datetime')}</span><b>{selDate}, {selTime}</b></div>
          <div className={s.confRow}><span>{t('booking.done.vehicle')}</span><b>{brand} {carModel}</b></div>
          <div className={s.confRow}><span>{t('booking.done.client')}</span><b>{clientName}</b></div>
        </div>
        <p className={s.confHint}>{t('booking.done.hint')}</p>
        <button className={s.confBtn} onClick={() => navigate('/')}>{t('booking.back_home')}</button>
      </div>
    </div>
  );

  return (
    <div className={s.page}>
      <div className={s.hero}>
        <div className={s.eye}>{t('booking.eyebrow')}</div>
        <h1 className={s.h1}>{t('booking.title_pre')} <em>{t('booking.title_em')}</em></h1>
        <p className={s.sub}>{t('booking.subtitle')}</p>
      </div>

      <form className={s.grid} onSubmit={submit}>
        <div className={s.formCol}>

          {/* Специалист */}
          <div className={s.block}>
            <div className={s.blockTitle}><span className={s.req}>*</span> {t('booking.spec_label')}</div>
            <div className={s.specGrid}>
              {SPEC_TYPES.map(sp => (
                <button type="button" key={sp.type}
                  className={`${s.specCard} ${spec === sp.type ? s.specSel : ''}`}
                  onClick={() => setSpec(sp.type)}
                >
                  <span className={s.specIco}>{sp.icon}</span>
                  <span className={s.specName}>{t(`booking.spec.${sp.type}.name`)}</span>
                  <span className={s.specSub}>{t(`booking.spec.${sp.type}.sub`)}</span>
                  {spec === sp.type && <span className={s.specCheck}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Авто */}
          <div className={s.block}>
            <div className={s.blockTitle}><span className={s.req}>*</span> {t('booking.car_label')}</div>
            <div className={s.row2}>
              <input className={s.input} placeholder={t('booking.ph.brand')} value={brand}
                onChange={e => setBrand(e.target.value)} />
              <input className={s.input} placeholder={t('booking.ph.model')} value={carModel}
                onChange={e => setCarModel(e.target.value)} />
            </div>
            <div className={s.row2}>
              <input className={s.input} type="number" placeholder={t('booking.ph.year')} value={year}
                onChange={e => setYear(e.target.value)} min={1990} max={2026} />
              <input className={s.input} type="number" placeholder={t('booking.ph.mileage')} value={mileage}
                onChange={e => setMileage(e.target.value)} />
            </div>
          </div>

          {/* Жалоба */}
          <div className={s.block}>
            <div className={s.blockTitle}><span className={s.req}>*</span> {t('booking.problem_label')}</div>
            <textarea className={s.textarea} rows={4}
              placeholder={t('booking.problem_ph')}
              value={complaint} onChange={e => setComplaint(e.target.value)} />
          </div>

          {/* Дата */}
          <div className={s.block}>
            <div className={s.blockTitle}><span className={s.req}>*</span> {t('booking.date_label')}</div>
            <div className={s.dateRow}>
              {dates.map(d => (
                <button type="button" key={d}
                  className={`${s.dateBtn} ${selDate === d ? s.dateSel : ''}`}
                  onClick={() => setSelDate(d)}
                >{d}</button>
              ))}
            </div>
          </div>

          {/* Время */}
          <div className={s.block}>
            <div className={s.blockTitle}><span className={s.req}>*</span> {t('booking.time_label')}</div>
            <div className={s.timeGrid}>
              {TIMES.map(time => (
                <button type="button" key={time}
                  className={`${s.timeBtn} ${busyTimes.includes(time) ? s.timeBusy : ''} ${selTime === time ? s.timeSel : ''}`}
                  onClick={() => !busyTimes.includes(time) && setSelTime(time)}
                  disabled={busyTimes.includes(time)}
                >{time}</button>
              ))}
            </div>
            <div className={s.legend}>
              <span><span className={s.dotGreen} />{t('booking.legend_free')}</span>
              <span><span className={s.dotGray} />{t('booking.legend_busy')}</span>
            </div>
          </div>

          {/* Контакт */}
          <div className={s.block}>
            <div className={s.blockTitle}><span className={s.req}>*</span> {t('booking.contact_label')}</div>
            <div className={s.row2}>
              <input className={s.input} placeholder={t('booking.ph.name')} value={clientName}
                onChange={e => setName(e.target.value)} />
              <input className={s.input} type="tel" placeholder="+79001234567" value={phone}
                onChange={e => setPhone(e.target.value)} />
            </div>
          </div>

          {error && <div className={s.err}>{error}</div>}

          <button className={s.submitBtn} type="submit" disabled={loading}>
            {loading ? t('booking.submitting') : t('booking.submit')}
          </button>
        </div>

        {/* Sidebar */}
        <aside className={s.aside}>
          <div className={s.asideCard}>
            <div className={s.asideTitle}>{t('booking.posts_title')}</div>
            {[
              [t('booking.post1'), '3 / 6', false],
              [t('booking.post2'), '1 / 6', true],
              [t('booking.post3'), '4 / 6', false],
              [t('booking.post4'), '2 / 3', false],
            ].map(([name, val, warn]) => (
              <div key={name as string} className={s.asideRow}>
                <span className={s.asideLabel}>{name}</span>
                <span className={s.asideVal} style={{ color: warn ? 'var(--ore)' : 'var(--green)' }}>{val} {t('booking.free_suffix')}</span>
              </div>
            ))}
          </div>
          <div className={s.asideCard}>
            <div className={s.asideTitle}>{t('booking.ai_chain_title')}</div>
            {[
              ['receptionist'], ['diagnost'], ['estimator'], ['supplier'], ['planner'],
            ].map(([key]) => (
              <div key={key} className={s.asideRow}>
                <span className={s.asideLabel}>{t(`booking.agent.${key}`)}</span>
                <span className={s.asideVal}>{t(`booking.agent.${key}_s`)}</span>
              </div>
            ))}
          </div>
        </aside>
      </form>
    </div>
  );
}
