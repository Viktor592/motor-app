/**
 * МОТОР — Простая i18n система без внешних зависимостей
 * Поддерживаемые языки: ru (по умолчанию), kk (казахский), en (английский)
 */

export type Locale = 'ru' | 'kk' | 'en';

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

  en: {
    'nav.home':        'Home',
    'nav.orders':      'Orders',
    'nav.bookings':    'Bookings',
    'nav.warehouse':   'Warehouse',
    'nav.finance':     'Finance',
    'nav.report':      'Reports',
    'nav.integration': 'Integrations',
    'nav.plans':       'Plan',
    'nav.settings':    'Settings',
    'order.status.PENDING':       'Pending',
    'order.status.IN_PROGRESS':   'In progress',
    'order.status.WAITING_PARTS': 'Awaiting parts',
    'order.status.QUALITY_CHECK': 'Quality check',
    'order.status.DONE':          'Done',
    'order.status.CLOSED':        'Closed',
    'common.save':    'Save',
    'common.cancel':  'Cancel',
    'common.delete':  'Delete',
    'common.edit':    'Edit',
    'common.add':     'Add',
    'common.search':  'Search',
    'common.loading': 'Loading…',
    'common.empty':   'No data',
    'common.total':   'Total',
    'common.yes':     'Yes',
    'common.no':      'No',
    'finance.revenue':    'Revenue',
    'finance.expenses':   'Expenses',
    'finance.profit':     'Profit',
    'finance.shift':      'Shift',
    'finance.open_shift': 'Open shift',
    'finance.close_shift':'Close shift',
    'warehouse.stock':    'Stock',
    'warehouse.reserve':  'Reserved',
    'warehouse.supplier': 'Supplier',
    'warehouse.order':    'Order from supplier',
    'warehouse.low':      'Low stock',
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
      { code: 'en' as Locale, name: 'English', flag: '🇬🇧' },
    ],
  };
}
