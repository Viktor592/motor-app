import { useState } from 'react';
import styles from './RegisterPage.module.css';

const TIMEZONES = [
  { value: 'Europe/Moscow',       label: 'Москва (UTC+3)'        },
  { value: 'Europe/Kaliningrad',  label: 'Калининград (UTC+2)'   },
  { value: 'Asia/Yekaterinburg',  label: 'Екатеринбург (UTC+5)'  },
  { value: 'Asia/Novosibirsk',    label: 'Новосибирск (UTC+7)'   },
  { value: 'Asia/Krasnoyarsk',    label: 'Красноярск (UTC+7)'    },
  { value: 'Asia/Irkutsk',        label: 'Иркутск (UTC+8)'       },
  { value: 'Asia/Vladivostok',    label: 'Владивосток (UTC+10)'  },
];

export default function OwnerRegisterPage() {
  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [result, setResult] = useState<any>(null);
  const [slugAvail, setSlugAvail] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const [form, setForm] = useState({
    name:       '',
    inn:        '',
    ogrn:       '',
    ownerName:  '',
    ownerEmail: '',
    ownerPhone: '',
    password:   '',
    slug:       '',
    timezone:   'Europe/Moscow',
  });

  const upd = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const checkSlug = async (slug: string) => {
    if (slug.length < 3) return;
    setCheckingSlug(true);
    try {
      const r    = await fetch(`/api/v1/saas/check-slug?slug=${slug}`);
      const data = await r.json();
      setSlugAvail(data.available);
    } finally { setCheckingSlug(false); }
  };

  const autoSlug = (name: string) =>
    name.toLowerCase()
      .replace(/[а-яё]/g, c => ({ а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' }[c] ?? c))
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const r    = await fetch('/api/v1/saas/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? data.message ?? 'Ошибка регистрации');
      setResult(data);
      setStep(4);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  if (step === 4 && result) return (
    <div className={styles.page}>
      <div className={styles.success}>
        <div className={styles.successIcon}>📋</div>
        <h1 className={styles.successTitle}>Заявка отправлена на проверку</h1>
        <p className={styles.successSub}>Мы проверим ИНН/ОГРН и одобрим доступ, обычно это быстро.</p>
        <div className={styles.successCard}>
          <div className={styles.successRow}>
            <span>Будущий адрес</span>
            <span className={styles.successLink}>{form.slug}.83.222.19.108.nip.io</span>
          </div>
          <div className={styles.successRow}>
            <span>Телефон для входа</span>
            <strong>{form.ownerPhone}</strong>
          </div>
          <div className={styles.successRow}>
            <span>Статус</span>
            <strong>На проверке</strong>
          </div>
        </div>
        <a className={styles.btnPrimary} href="/owner/login">
          Перейти ко входу →
        </a>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Лого */}
        <div className={styles.logo}>⚡ МОТОР</div>
        <h1 className={styles.title}>Регистрация автосервиса</h1>
        <p className={styles.sub}>14 дней бесплатно, карта не нужна</p>

        {/* Прогресс */}
        <div className={styles.progress}>
          {[1,2,3].map(n => (
            <div key={n} className={`${styles.progressStep} ${step >= n ? styles.progressActive : ''}`}>
              <div className={styles.progressDot}>{step > n ? '✓' : n}</div>
              <span>{n === 1 ? 'Сервис' : n === 2 ? 'Владелец' : 'Адрес'}</span>
            </div>
          ))}
        </div>

        {error && <div className={styles.error}>⚠️ {error}</div>}

        {/* Шаг 1: Название */}
        {step === 1 && (
          <div className={styles.stepBody}>
            <div className={styles.field}>
              <label className={styles.label}>Название автосервиса *</label>
              <input className={styles.input} placeholder="Автосервис Победа"
                value={form.name} onChange={e => {
                  upd('name', e.target.value);
                  const s = autoSlug(e.target.value);
                  upd('slug', s);
                  if (s.length >= 3) checkSlug(s);
                }} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>ИНН *</label>
              <input className={styles.input} placeholder="7712345678" maxLength={12}
                value={form.inn} onChange={e => upd('inn', e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>ОГРН / ОГРНИП (необязательно)</label>
              <input className={styles.input} placeholder="1157746000000" maxLength={15}
                value={form.ogrn} onChange={e => upd('ogrn', e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Часовой пояс</label>
              <select className={styles.select} value={form.timezone} onChange={e => upd('timezone', e.target.value)}>
                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </div>
            <button className={styles.btnPrimary} disabled={form.name.length < 3 || form.inn.length < 10}
              onClick={() => setStep(2)}>
              Далее →
            </button>
          </div>
        )}

        {/* Шаг 2: Владелец */}
        {step === 2 && (
          <div className={styles.stepBody}>
            <div className={styles.field}>
              <label className={styles.label}>Ваше имя *</label>
              <input className={styles.input} placeholder="Иван Иванов"
                value={form.ownerName} onChange={e => upd('ownerName', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email *</label>
              <input className={styles.input} type="email" placeholder="ivan@example.ru"
                value={form.ownerEmail} onChange={e => upd('ownerEmail', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Телефон *</label>
              <input className={styles.input} type="tel" placeholder="+79990000000"
                value={form.ownerPhone} onChange={e => {
                  const d = e.target.value.replace(/\D/g, '');
                  const n = d.startsWith('7') ? d : d.startsWith('8') ? '7'+d.slice(1) : '7'+d;
                  upd('ownerPhone', d ? '+' + n.slice(0,11) : '');
                }} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Пароль *</label>
              <input className={styles.input} type="password" placeholder="Минимум 6 символов"
                value={form.password} onChange={e => upd('password', e.target.value)} />
            </div>
            <div className={styles.btnRow}>
              <button className={styles.btnSecondary} onClick={() => setStep(1)}>← Назад</button>
              <button className={styles.btnPrimary}
                disabled={form.ownerName.length < 2 || !form.ownerEmail.includes('@') || !/^\+7\d{10}$/.test(form.ownerPhone) || form.password.length < 6}
                onClick={() => setStep(3)}>
                Далее →
              </button>
            </div>
          </div>
        )}

        {/* Шаг 3: Адрес */}
        {step === 3 && (
          <div className={styles.stepBody}>
            <div className={styles.field}>
              <label className={styles.label}>Адрес сервиса *</label>
              <div className={styles.slugWrap}>
                <input className={`${styles.input} ${styles.slugInput}`}
                  placeholder="motor-spb"
                  value={form.slug}
                  onChange={e => {
                    const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    upd('slug', v);
                    if (v.length >= 3) checkSlug(v);
                    else setSlugAvail(null);
                  }} />
                <span className={styles.slugSuffix}>.83.222.19.108.nip.io</span>
              </div>
              {checkingSlug && <div className={styles.slugHint}>Проверяю…</div>}
              {!checkingSlug && slugAvail === true  && <div className={styles.slugOk}>✅ Адрес свободен</div>}
              {!checkingSlug && slugAvail === false && <div className={styles.slugErr}>❌ Адрес занят</div>}
              <div className={styles.slugHint}>Только латинские буквы, цифры и дефис. Минимум 3 символа.</div>
            </div>

            <div className={styles.preview}>
              <div className={styles.previewLabel}>Ваш адрес будет:</div>
              <div className={styles.previewUrl}>https://{form.slug || 'your-service'}.83.222.19.108.nip.io</div>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.btnSecondary} onClick={() => setStep(2)}>← Назад</button>
              <button className={styles.btnPrimary}
                disabled={form.slug.length < 3 || slugAvail === false || loading}
                onClick={submit}>
                {loading ? 'Создаю…' : '🚀 Создать сервис'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
