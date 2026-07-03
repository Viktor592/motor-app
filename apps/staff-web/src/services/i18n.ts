/**
 * МОТОР — Простая i18n система без внешних зависимостей
 * Поддерживаемые языки: ru (по умолчанию), kk (казахский), uk (украинский)
 */

export type Locale = 'ru' | 'kk' | 'uk';

// ── Словари ───────────────────────────────────────────────────
const translations: Record<Locale, Record<string, string>> = {
  ru: {
    // Навигация
    'nav.home':        'Главная',
    'nav.orders':      'Заказы',
    'nav.bookings':    'Записи',
    'nav.warehouse':   'Склад',
    'nav.finance':     'Финансы',
    'nav.report':      'Отчёты',
    'nav.integration': 'Интеграции',
    'nav.plans':       'Тариф',
    'nav.settings':    'Настройки',
    // Заказы
    'order.status.PENDING':       'Ожидает',
    'order.status.IN_PROGRESS':   'В работе',
    'order.status.WAITING_PARTS': 'Ждёт запчасти',
    'order.status.QUALITY_CHECK': 'Проверка',
    'order.status.DONE':          'Готов',
    'order.status.CLOSED':        'Закрыт',
    // Общее
    'common.save':    'Сохранить',
    'common.cancel':  'Отмена',
    'common.delete':  'Удалить',
    'common.edit':    'Редактировать',
    'common.add':     'Добавить',
    'common.search':  'Поиск',
    'common.loading': 'Загрузка…',
    'common.empty':   'Нет данных',
    'common.total':   'Итого',
    'common.yes':     'Да',
    'common.no':      'Нет',
    // Финансы
    'finance.revenue':    'Выручка',
    'finance.expenses':   'Расходы',
    'finance.profit':     'Прибыль',
    'finance.shift':      'Смена',
    'finance.open_shift': 'Открыть смену',
    'finance.close_shift':'Закрыть смену',
    // Склад
    'warehouse.stock':    'Остатки',
    'warehouse.reserve':  'Резерв',
    'warehouse.supplier': 'Поставщик',
    'warehouse.order':    'Заказ поставщику',
    'warehouse.low':      'Нехватка',
  },

  kk: {
    // Навигация
    'nav.home':        'Басты бет',
    'nav.orders':      'Тапсырыстар',
    'nav.bookings':    'Жазбалар',
    'nav.warehouse':   'Қойма',
    'nav.finance':     'Қаржы',
    'nav.report':      'Есептер',
    'nav.integration': 'Интеграциялар',
    'nav.plans':       'Тариф',
    'nav.settings':    'Параметрлер',
    // Заказы
    'order.status.PENDING':       'Күтуде',
    'order.status.IN_PROGRESS':   'Жұмыста',
    'order.status.WAITING_PARTS': 'Бөлшек күтуде',
    'order.status.QUALITY_CHECK': 'Тексеру',
    'order.status.DONE':          'Дайын',
    'order.status.CLOSED':        'Жабық',
    // Общее
    'common.save':    'Сақтау',
    'common.cancel':  'Болдырмау',
    'common.delete':  'Жою',
    'common.edit':    'Өзгерту',
    'common.add':     'Қосу',
    'common.search':  'Іздеу',
    'common.loading': 'Жүктелуде…',
    'common.empty':   'Деректер жоқ',
    'common.total':   'Жиыны',
    'common.yes':     'Иә',
    'common.no':      'Жоқ',
    // Финансы
    'finance.revenue':    'Түсім',
    'finance.expenses':   'Шығыстар',
    'finance.profit':     'Пайда',
    'finance.shift':      'Ауысым',
    'finance.open_shift': 'Ауысымды ашу',
    'finance.close_shift':'Ауысымды жабу',
    // Склад
    'warehouse.stock':    'Қалдықтар',
    'warehouse.reserve':  'Резерв',
    'warehouse.supplier': 'Жеткізуші',
    'warehouse.order':    'Жеткізуші тапсырысы',
    'warehouse.low':      'Жетіспеушілік',
  },

  uk: {
    'nav.home':        'Головна',
    'nav.orders':      'Замовлення',
    'nav.bookings':    'Записи',
    'nav.warehouse':   'Склад',
    'nav.finance':     'Фінанси',
    'nav.report':      'Звіти',
    'nav.integration': 'Інтеграції',
    'nav.plans':       'Тариф',
    'nav.settings':    'Налаштування',
    'order.status.PENDING':       'Очікує',
    'order.status.IN_PROGRESS':   'В роботі',
    'order.status.WAITING_PARTS': 'Чекає запчастини',
    'order.status.QUALITY_CHECK': 'Перевірка',
    'order.status.DONE':          'Готово',
    'order.status.CLOSED':        'Закрито',
    'common.save':    'Зберегти',
    'common.cancel':  'Скасувати',
    'common.delete':  'Видалити',
    'common.edit':    'Редагувати',
    'common.add':     'Додати',
    'common.search':  'Пошук',
    'common.loading': 'Завантаження…',
    'common.empty':   'Немає даних',
    'common.total':   'Разом',
    'common.yes':     'Так',
    'common.no':      'Ні',
    'finance.revenue':    'Виручка',
    'finance.expenses':   'Витрати',
    'finance.profit':     'Прибуток',
    'finance.shift':      'Зміна',
    'finance.open_shift': 'Відкрити зміну',
    'finance.close_shift':'Закрити зміну',
    'warehouse.stock':    'Залишки',
    'warehouse.reserve':  'Резерв',
    'warehouse.supplier': 'Постачальник',
    'warehouse.order':    'Замовлення постачальнику',
    'warehouse.low':      'Нестача',
  },
};

// ── Хранилище языка ───────────────────────────────────────────
let currentLocale: Locale = (localStorage.getItem('motor_locale') as Locale) ?? 'ru';
const listeners = new Set<() => void>();

export function getLocale(): Locale { return currentLocale; }

export function setLocale(locale: Locale) {
  currentLocale = locale;
  localStorage.setItem('motor_locale', locale);
  listeners.forEach(fn => fn());
  document.documentElement.lang = locale;
}

export function onLocaleChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ── Основная функция перевода ─────────────────────────────────
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = translations[currentLocale] ?? translations.ru;
  let text   = dict[key] ?? translations.ru[key] ?? key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return text;
}

// ── React хук ─────────────────────────────────────────────────
import { useState, useEffect } from 'react';

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(currentLocale);

  useEffect(() => {
    return onLocaleChange(() => setLocaleState(getLocale()));
  }, []);

  return {
    locale,
    setLocale,
    t,
    locales: [
      { code: 'ru' as Locale, name: 'Русский',    flag: '🇷🇺' },
      { code: 'kk' as Locale, name: 'Қазақша',    flag: '🇰🇿' },
      { code: 'uk' as Locale, name: 'Українська', flag: '🇺🇦' },
    ],
  };
}
