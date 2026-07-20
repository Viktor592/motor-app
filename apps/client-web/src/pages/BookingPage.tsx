import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import s from './BookingPage.module.css';

type SpecType = 'MECHANIC' | 'ELECTRICIAN' | 'DIAGNOSTICS';

const SPECS = [
  { type: 'MECHANIC'     as SpecType, icon: '🔧', name: 'Автослесарь',  sub: 'ТО, двигатель, ходовая, трансмиссия' },
  { type: 'ELECTRICIAN'  as SpecType, icon: '⚡', name: 'Автоэлектрик', sub: 'Электрика, ЭБУ, сигнализации' },
  { type: 'DIAGNOSTICS'  as SpecType, icon: '🔍', name: 'Диагност',     sub: 'Компьютерная диагностика, OBD2' },
];

const TIMES = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

export default function BookingPage() {
  const navigate = useNavigate();
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
        days.push(d.toLocaleDateString('ru', { weekday: 'short', day: '2-digit', month: 'short' }));
        dateList.push(new Date(d));
      }
    }
    setDates(days);
    setDateObjs(dateList);
  }, []);

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
      setError('Заполните все обязательные поля'); return;
    }
    setLoading(true); setError('');
    try {
      // Собираем дату+время в ISO. selDate — короткая строка вида "пн, 21 июл",
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
      setError(e.response?.data?.error ?? 'Ошибка при записи. Попробуйте снова.');
    } finally { setLoading(false); }
  };

  if (done) return (
    <div className={s.confirm}>
      <div className={s.confirmBox}>
        <div className={s.confIco}>✅</div>
        <h2 className={s.confTitle}>ЗАПИСЬ СОЗДАНА</h2>
        <p className={s.confNum}>{done}</p>
        <div className={s.confDetail}>
          <div className={s.confRow}><span>Специалист</span><b>{SPECS.find(x=>x.type===spec)?.name}</b></div>
          <div className={s.confRow}><span>Дата и время</span><b>{selDate}, {selTime}</b></div>
          <div className={s.confRow}><span>Автомобиль</span><b>{brand} {carModel}</b></div>
          <div className={s.confRow}><span>Клиент</span><b>{clientName}</b></div>
        </div>
        <p className={s.confHint}>Мы свяжемся с вами для подтверждения записи.</p>
        <button className={s.confBtn} onClick={() => navigate('/')}>← На главную</button>
      </div>
    </div>
  );

  return (
    <div className={s.page}>
      <div className={s.hero}>
        <div className={s.eye}>// Раздел 07 · Онлайн-запись</div>
        <h1 className={s.h1}>ЗАПИСЬ К <em>СПЕЦИАЛИСТУ</em></h1>
        <p className={s.sub}>AI-планировщик подбирает оптимальный слот с учётом загрузки постов.</p>
      </div>

      <form className={s.grid} onSubmit={submit}>
        <div className={s.formCol}>

          {/* Специалист */}
          <div className={s.block}>
            <div className={s.blockTitle}><span className={s.req}>*</span> Специалист</div>
            <div className={s.specGrid}>
              {SPECS.map(sp => (
                <button type="button" key={sp.type}
                  className={`${s.specCard} ${spec === sp.type ? s.specSel : ''}`}
                  onClick={() => setSpec(sp.type)}
                >
                  <span className={s.specIco}>{sp.icon}</span>
                  <span className={s.specName}>{sp.name}</span>
                  <span className={s.specSub}>{sp.sub}</span>
                  {spec === sp.type && <span className={s.specCheck}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Авто */}
          <div className={s.block}>
            <div className={s.blockTitle}><span className={s.req}>*</span> Автомобиль</div>
            <div className={s.row2}>
              <input className={s.input} placeholder="Марка (Toyota)" value={brand}
                onChange={e => setBrand(e.target.value)} />
              <input className={s.input} placeholder="Модель (Camry)" value={carModel}
                onChange={e => setCarModel(e.target.value)} />
            </div>
            <div className={s.row2}>
              <input className={s.input} type="number" placeholder="Год" value={year}
                onChange={e => setYear(e.target.value)} min={1990} max={2026} />
              <input className={s.input} type="number" placeholder="Пробег (км)" value={mileage}
                onChange={e => setMileage(e.target.value)} />
            </div>
          </div>

          {/* Жалоба */}
          <div className={s.block}>
            <div className={s.blockTitle}><span className={s.req}>*</span> Проблема</div>
            <textarea className={s.textarea} rows={4}
              placeholder="Опишите симптомы. Агент «Приёмщик» автоматически проанализирует текст."
              value={complaint} onChange={e => setComplaint(e.target.value)} />
          </div>

          {/* Дата */}
          <div className={s.block}>
            <div className={s.blockTitle}><span className={s.req}>*</span> Дата</div>
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
            <div className={s.blockTitle}><span className={s.req}>*</span> Время</div>
            <div className={s.timeGrid}>
              {TIMES.map(t => (
                <button type="button" key={t}
                  className={`${s.timeBtn} ${busyTimes.includes(t) ? s.timeBusy : ''} ${selTime === t ? s.timeSel : ''}`}
                  onClick={() => !busyTimes.includes(t) && setSelTime(t)}
                  disabled={busyTimes.includes(t)}
                >{t}</button>
              ))}
            </div>
            <div className={s.legend}>
              <span><span className={s.dotGreen} />Свободно</span>
              <span><span className={s.dotGray} />Занято</span>
            </div>
          </div>

          {/* Контакт */}
          <div className={s.block}>
            <div className={s.blockTitle}><span className={s.req}>*</span> Контактные данные</div>
            <div className={s.row2}>
              <input className={s.input} placeholder="Имя" value={clientName}
                onChange={e => setName(e.target.value)} />
              <input className={s.input} type="tel" placeholder="+79001234567" value={phone}
                onChange={e => setPhone(e.target.value)} />
            </div>
          </div>

          {error && <div className={s.err}>{error}</div>}

          <button className={s.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Создаём запись…' : '📅 Записаться → Агент «Планировщик»'}
          </button>
        </div>

        {/* Sidebar */}
        <aside className={s.aside}>
          <div className={s.asideCard}>
            <div className={s.asideTitle}>⛽ Загрузка постов</div>
            {[
              ['Пост #1 — Слесарный', '3 / 6', false],
              ['Пост #2 — Слесарный', '1 / 6', true],
              ['Пост #3 — Электрик',  '4 / 6', false],
              ['Пост #4 — Диагностика', '2 / 3', false],
            ].map(([name, val, warn]) => (
              <div key={name as string} className={s.asideRow}>
                <span className={s.asideLabel}>{name}</span>
                <span className={s.asideVal} style={{ color: warn ? 'var(--ore)' : 'var(--green)' }}>{val} свободно</span>
              </div>
            ))}
          </div>
          <div className={s.asideCard}>
            <div className={s.asideTitle}>🤖 AI-цепочка</div>
            {[
              ['Приёмщик', 'Парсит жалобу'],
              ['Диагност',  'Гипотезы & OEM'],
              ['Оценщик',   'Предв. смета'],
              ['Снабженец', 'Резерв деталей'],
              ['Планировщик', 'Бронь слота'],
            ].map(([ag, st]) => (
              <div key={ag} className={s.asideRow}>
                <span className={s.asideLabel}>{ag}</span>
                <span className={s.asideVal}>{st}</span>
              </div>
            ))}
          </div>
        </aside>
      </form>
    </div>
  );
}
