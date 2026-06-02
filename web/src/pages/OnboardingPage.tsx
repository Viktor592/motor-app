import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import s from './OnboardingPage.module.css';

type Step = 'welcome' | 'admin' | 'service' | 'posts' | 'masters' | 'done';

interface Post   { name: string; type: 'MECHANIC' | 'ELECTRICIAN' | 'DIAGNOSTICS' }
interface Master { name: string; phone: string; password: string }

const POST_TYPES = [
  { value: 'MECHANIC',    label: '🔧 Слесарный' },
  { value: 'ELECTRICIAN', label: '⚡ Электрик'  },
  { value: 'DIAGNOSTICS', label: '🔍 Диагностика' },
];

const STEP_LABELS: Record<Step, string> = {
  welcome: 'Добро пожаловать',
  admin:   'Администратор',
  service: 'Данные сервиса',
  posts:   'Посты',
  masters: 'Мастера',
  done:    'Готово',
};

const STEPS: Step[] = ['welcome', 'admin', 'service', 'posts', 'masters', 'done'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step,   setStep]   = useState<Step>('welcome');
  const [loading, setLoad]  = useState(false);
  const [error,   setError] = useState('');

  // Форма
  const [adminName,     setAdminName]     = useState('');
  const [adminPhone,    setAdminPhone]    = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [serviceName,   setServiceName]   = useState('');
  const [serviceCity,   setServiceCity]   = useState('');
  const [servicePhone,  setServicePhone]  = useState('');
  const [posts,         setPosts]         = useState<Post[]>([
    { name: 'Пост #1 — Слесарный',  type: 'MECHANIC' },
    { name: 'Пост #2 — Электрик',   type: 'ELECTRICIAN' },
    { name: 'Пост #3 — Диагностика', type: 'DIAGNOSTICS' },
  ]);
  const [masters, setMasters] = useState<Master[]>([]);

  const fmtPhone = (v: string) => {
    const n = v.replace(/\D/g, '');
    if (!n) return '';
    let d = n.startsWith('7') ? n : '7' + n;
    d = d.slice(0, 11);
    let r = '+7';
    if (d.length > 1) r += ' (' + d.slice(1, 4);
    if (d.length >= 4) r += ') ' + d.slice(4, 7);
    if (d.length >= 7) r += '-' + d.slice(7, 9);
    if (d.length >= 9) r += '-' + d.slice(9, 11);
    return r;
  };
  const rawPhone = (v: string) => '+7' + v.replace(/\D/g, '').slice(1);

  const addPost   = () => setPosts(p => [...p, { name: `Пост #${p.length + 1}`, type: 'MECHANIC' }]);
  const delPost   = (i: number) => setPosts(p => p.filter((_, idx) => idx !== i));
  const addMaster = () => setMasters(m => [...m, { name: '', phone: '', password: '' }]);
  const delMaster = (i: number) => setMasters(m => m.filter((_, idx) => idx !== i));

  const canNext = (): boolean => {
    if (step === 'admin')   return adminName.length >= 2 && rawPhone(adminPhone).length === 12 && adminPassword.length >= 6;
    if (step === 'service') return serviceName.length >= 2;
    if (step === 'posts')   return posts.length > 0 && posts.every(p => p.name.length >= 2);
    return true;
  };

  const next = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const submit = async () => {
    setLoad(true); setError('');
    try {
      const validMasters = masters.filter(m => m.name && m.phone && m.password.length >= 6);
      await api.post('/onboarding/setup', {
        adminName,
        adminPhone:    rawPhone(adminPhone),
        adminPassword,
        serviceName,
        servicePhone:  servicePhone ? rawPhone(servicePhone) : undefined,
        serviceCity:   serviceCity || undefined,
        posts,
        masters:       validMasters.map(m => ({ ...m, phone: rawPhone(m.phone) })),
      });
      setStep('done');
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Ошибка настройки');
    } finally { setLoad(false); }
  };

  const stepIdx = STEPS.indexOf(step);

  return (
    <div className={s.root}>
      <div className={s.panel}>
        {/* Лого */}
        <div className={s.logo}>
          <div className={s.hex}>М</div>
          <span className={s.brand}>МОТОР</span>
        </div>

        {/* Прогресс */}
        {step !== 'done' && (
          <div className={s.progress}>
            {STEPS.filter(s => s !== 'done').map((st, i) => (
              <div key={st} className={`${s.progressStep} ${i <= stepIdx ? s.progressDone : ''}`}>
                <div className={s.progressDot}>{i < stepIdx ? '✓' : i + 1}</div>
                <span className={s.progressLabel}>{STEP_LABELS[st]}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Шаг: Добро пожаловать ── */}
        {step === 'welcome' && (
          <div className={s.stepBox}>
            <h1 className={s.welcomeTitle}>Добро пожаловать<br/>в <span>МОТОР</span></h1>
            <p className={s.welcomeText}>
              Это первый запуск системы. Мастер настройки займёт 3 минуты —
              после этого сервис будет готов к работе.
            </p>
            <div className={s.featureList}>
              {['AI-агенты: Приёмщик, Диагност, Оценщик','Онлайн-запись к мастерам','Заказ-наряды и сметы','Аналитика P&L','Push-уведомления','Оплата через СБП'].map(f => (
                <div key={f} className={s.feature}><span className={s.featIco}>✓</span>{f}</div>
              ))}
            </div>
            <button className={s.btnPrimary} onClick={next}>Начать настройку →</button>
          </div>
        )}

        {/* ── Шаг: Администратор ── */}
        {step === 'admin' && (
          <div className={s.stepBox}>
            <h2 className={s.stepTitle}>Аккаунт администратора</h2>
            <p className={s.stepSub}>Этот аккаунт будет иметь полный доступ к системе.</p>
            {[
              { label: 'ИМЯ',    val: adminName,     set: setAdminName,     type: 'text',     ph: 'Иван Иванов' },
              { label: 'ТЕЛЕФОН', val: adminPhone,   set: (v: string) => setAdminPhone(fmtPhone(v)), type: 'tel', ph: '+7 (999) 000-00-00' },
              { label: 'ПАРОЛЬ', val: adminPassword, set: setAdminPassword, type: 'password', ph: 'Минимум 6 символов' },
            ].map(f => (
              <div key={f.label} className={s.field}>
                <label className={s.label}>{f.label}</label>
                <input className={s.input} type={f.type} value={f.val}
                  onChange={e => f.set(e.target.value)} placeholder={f.ph} />
              </div>
            ))}
            <div className={s.btns}>
              <button className={s.btnSecondary} onClick={() => setStep('welcome')}>← Назад</button>
              <button className={s.btnPrimary} onClick={next} disabled={!canNext()}>Далее →</button>
            </div>
          </div>
        )}

        {/* ── Шаг: Данные сервиса ── */}
        {step === 'service' && (
          <div className={s.stepBox}>
            <h2 className={s.stepTitle}>Данные автосервиса</h2>
            <p className={s.stepSub}>Отображаются в уведомлениях и документах.</p>
            {[
              { label: 'НАЗВАНИЕ СЕРВИСА', val: serviceName,  set: setServiceName,  ph: 'Автосервис "Гараж"', req: true  },
              { label: 'ГОРОД',           val: serviceCity,  set: setServiceCity,  ph: 'Москва',             req: false },
            ].map(f => (
              <div key={f.label} className={s.field}>
                <label className={s.label}>{f.label}{f.req && <span className={s.req}> *</span>}</label>
                <input className={s.input} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} />
              </div>
            ))}
            <div className={s.field}>
              <label className={s.label}>ТЕЛЕФОН СЕРВИСА</label>
              <input className={s.input} type="tel" value={servicePhone}
                onChange={e => setServicePhone(fmtPhone(e.target.value))} placeholder="+7 (999) 000-00-00" />
            </div>
            <div className={s.btns}>
              <button className={s.btnSecondary} onClick={() => setStep('admin')}>← Назад</button>
              <button className={s.btnPrimary} onClick={next} disabled={!canNext()}>Далее →</button>
            </div>
          </div>
        )}

        {/* ── Шаг: Посты ── */}
        {step === 'posts' && (
          <div className={s.stepBox}>
            <h2 className={s.stepTitle}>Рабочие посты</h2>
            <p className={s.stepSub}>Укажите посты вашего сервиса. Каждый пост — отдельная очередь записи.</p>
            <div className={s.postList}>
              {posts.map((p, i) => (
                <div key={i} className={s.postRow}>
                  <input
                    className={s.input}
                    value={p.name}
                    onChange={e => setPosts(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                    placeholder="Название поста"
                    style={{ flex: 1 }}
                  />
                  <select
                    className={s.select}
                    value={p.type}
                    onChange={e => setPosts(prev => prev.map((x, idx) => idx === i ? { ...x, type: e.target.value as any } : x))}
                  >
                    {POST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {posts.length > 1 && (
                    <button className={s.delBtn} onClick={() => delPost(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <button className={s.btnAdd} onClick={addPost}>+ Добавить пост</button>
            <div className={s.btns}>
              <button className={s.btnSecondary} onClick={() => setStep('service')}>← Назад</button>
              <button className={s.btnPrimary} onClick={next} disabled={!canNext()}>Далее →</button>
            </div>
          </div>
        )}

        {/* ── Шаг: Мастера ── */}
        {step === 'masters' && (
          <div className={s.stepBox}>
            <h2 className={s.stepTitle}>Мастера (необязательно)</h2>
            <p className={s.stepSub}>Добавьте мастеров сейчас или позже через Admin-панель.</p>
            {masters.map((m, i) => (
              <div key={i} className={s.masterCard}>
                <div className={s.masterCardHead}>
                  <span className={s.masterIdx}>Мастер #{i + 1}</span>
                  <button className={s.delBtn} onClick={() => delMaster(i)}>✕</button>
                </div>
                {[
                  { label: 'ИМЯ',    val: m.name,     set: (v: string) => setMasters(p => p.map((x, idx) => idx === i ? { ...x, name: v } : x)),     ph: 'Иван Петров',      type: 'text'     },
                  { label: 'ТЕЛЕФОН', val: m.phone,   set: (v: string) => setMasters(p => p.map((x, idx) => idx === i ? { ...x, phone: fmtPhone(v) } : x)), ph: '+7 (999) 000-00-00', type: 'tel'  },
                  { label: 'ПАРОЛЬ', val: m.password, set: (v: string) => setMasters(p => p.map((x, idx) => idx === i ? { ...x, password: v } : x)), ph: 'Минимум 6 символов', type: 'password' },
                ].map(f => (
                  <div key={f.label} className={s.field}>
                    <label className={s.label}>{f.label}</label>
                    <input className={s.input} type={f.type} value={f.val}
                      onChange={e => f.set(e.target.value)} placeholder={f.ph} />
                  </div>
                ))}
              </div>
            ))}
            <button className={s.btnAdd} onClick={addMaster}>+ Добавить мастера</button>
            {error && <div className={s.err}>{error}</div>}
            <div className={s.btns}>
              <button className={s.btnSecondary} onClick={() => setStep('posts')}>← Назад</button>
              <button className={s.btnPrimary} onClick={submit} disabled={loading}>
                {loading ? 'Настраиваем систему…' : '✓ Завершить настройку'}
              </button>
            </div>
          </div>
        )}

        {/* ── Шаг: Готово ── */}
        {step === 'done' && (
          <div className={s.doneBox}>
            <div className={s.doneIco}>🎉</div>
            <h2 className={s.doneTitle}>МОТОР ГОТОВ К РАБОТЕ</h2>
            <p className={s.doneSub}>Система настроена. Войдите под аккаунтом администратора.</p>
            <div className={s.doneInfo}>
              <div className={s.doneRow}><span>Администратор</span><b>{adminName}</b></div>
              <div className={s.doneRow}><span>Телефон</span><b>{adminPhone}</b></div>
              <div className={s.doneRow}><span>Постов создано</span><b>{posts.length}</b></div>
              <div className={s.doneRow}><span>Мастеров добавлено</span><b>{masters.filter(m => m.name && m.phone).length}</b></div>
            </div>
            <button className={s.btnPrimary} onClick={() => navigate('/login')}>Войти в систему →</button>
          </div>
        )}
      </div>

      {/* Декоративный фон */}
      <div className={s.bg}><div className={s.bgText}>МОТОР</div></div>
    </div>
  );
}
