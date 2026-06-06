import { useState, useEffect, useRef } from 'react';
import styles from './OnboardingTour.module.css';

interface TourStep {
  target:   string;     // CSS selector
  title:    string;
  text:     string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  { target: 'nav [href="/"]',          title: '👋 Добро пожаловать в МОТОР!', text: 'Это главная панель — здесь KPI, активные заказы и быстрый доступ ко всему.',             position: 'right'  },
  { target: 'nav [href="/orders"]',    title: '📋 Заказы',                    text: 'Все заказ-наряды в одном месте. Создавайте, отслеживайте статус, закрывайте.',              position: 'right'  },
  { target: 'nav [href="/bookings"]',  title: '📅 Онлайн-записи',             text: 'Записи с сайта и приложения. Один клик — и запись превращается в заказ.',                  position: 'right'  },
  { target: 'nav [href="/warehouse"]', title: '📦 Склад',                     text: 'Остатки запчастей, резервирование под заказы, авто-заказ при нехватке.',                    position: 'right'  },
  { target: 'nav [href="/finance"]',   title: '💰 Финансы',                   text: 'Кассовые смены, расходы по категориям, P&L с графиками и бюджет vs факт.',                 position: 'right'  },
  { target: 'nav [href="/report"]',    title: '📊 Аналитика',                 text: 'Рейтинг мастеров, топ услуги, загрузка по дням недели, сравнение периодов.',               position: 'right'  },
  { target: 'nav [href="/plans"]',     title: '💳 Ваш тариф',                 text: 'Здесь можно посмотреть лимиты и перейти на более мощный план.',                            position: 'right'  },
];

const TOUR_KEY = 'motor_tour_done';

interface Props { onDone?: () => void; }

export default function OnboardingTour({ onDone }: Props) {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [pos, setPos]         = useState({ top: 0, left: 0, width: 0, height: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem(TOUR_KEY)) return;
    // Небольшая задержка — дать странице отрендериться
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    updatePos();
    window.addEventListener('resize', updatePos);
    return () => window.removeEventListener('resize', updatePos);
  }, [visible, step]);

  const updatePos = () => {
    const current = TOUR_STEPS[step];
    const el = document.querySelector(current.target) as HTMLElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) setStep(s => s + 1);
    else done();
  };
  const done = () => {
    localStorage.setItem(TOUR_KEY, '1');
    setVisible(false);
    onDone?.();
  };

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const tipPos  = getTipPosition(pos, current.position);

  return (
    <div className={styles.root}>
      {/* Затемнение с вырезом под элемент */}
      <svg className={styles.overlay} ref={overlayRef as any}>
        <defs>
          <mask id="spotlight">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={pos.left - 6} y={pos.top - 6}
              width={pos.width + 12} height={pos.height + 12}
              rx="8" fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#spotlight)" />
      </svg>

      {/* Тултип */}
      <div className={styles.tip} style={tipPos}>
        <div className={styles.tipInner}>
          <div className={styles.progress}>
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`${styles.dot} ${i === step ? styles.dotActive : i < step ? styles.dotDone : ''}`} />
            ))}
          </div>
          <h3 className={styles.title}>{current.title}</h3>
          <p className={styles.text}>{current.text}</p>
          <div className={styles.actions}>
            <button className={styles.btnSkip} onClick={done}>Пропустить</button>
            <button className={styles.btnNext} onClick={next}>
              {step < TOUR_STEPS.length - 1 ? 'Далее →' : '🎉 Начать работу!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTipPosition(pos: { top: number; left: number; width: number; height: number }, side: string) {
  const GAP = 16;
  const W   = 280;
  switch (side) {
    case 'right':  return { top: pos.top,        left: pos.left + pos.width + GAP };
    case 'left':   return { top: pos.top,        left: pos.left - W - GAP };
    case 'bottom': return { top: pos.top + pos.height + GAP, left: pos.left };
    case 'top':    return { top: pos.top - 160,  left: pos.left };
    default:       return { top: pos.top + pos.height + GAP, left: pos.left };
  }
}
