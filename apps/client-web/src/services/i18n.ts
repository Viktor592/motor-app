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
    'order.status.NEW':           'Новый',
    'order.status.ASSESSED':      'Оценён',
    'order.status.CONFIRMED':     'Подтверждён',
    'order.status.READY':         'Готов',
    'order.status.CANCELLED':     'Отменён',
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
    // Вход по коду
    'otp.title':          'ВХОД',
    'otp.subtitle':       'Введите номер — отправим SMS с кодом',
    'otp.phone_label':    'ТЕЛЕФОН',
    'otp.sending':        'Отправляем…',
    'otp.get_code':       'Получить код →',
    'otp.hint':           'Новый аккаунт создаётся автоматически',
    'otp.or':             '— или —',
    'otp.password_login': 'Войти с паролем (персонал)',
    'otp.code_title':     'КОД',
    'otp.code_subtitle':  'Отправили SMS на',
    'otp.verifying':      'Проверяем код…',
    'otp.resend_in':      'Повторная отправка через {sec} с',
    'otp.resend':         'Отправить снова',
    'otp.change_number':  '← Изменить номер',
    'otp.err.full_phone': 'Введите номер полностью',
    'otp.err.send':       'Ошибка отправки',
    'otp.err.code':       'Неверный код',
    'otp.err.generic':    'Ошибка',
    // Главная клиента
    'home.eyebrow':       '// ДАШБОРД КЛИЕНТА',
    'home.greeting':      'Привет,',
    'home.greeting_fallback': 'клиент',
    'home.subtitle':      'Управляйте заказами и общайтесь с AI-агентами МОТОР.',
    'home.ai_online':     'AI-агенты онлайн',
    'home.promo_badge':   '🔥 Акция',
    'home.my_bookings':   '📅 Мои записи',
    'booking.status.PENDING':   'Ожидает подтверждения',
    'booking.status.CONFIRMED': 'Подтверждена',
    'booking.status.COMPLETED': 'Завершена',
    'booking.status.CANCELLED': 'Отменена',
    'booking.status.NO_SHOW':   'Не явился',
    'home.qa.book':       'Записаться',
    'home.qa.book_sub':   'Слесарь · Электрик · Диагност',
    'home.qa.chat':       'AI-чат',
    'home.qa.chat_sub':   'Агент «Приёмщик» онлайн',
    'home.qa.orders':     'Все заказы',
    'home.qa.orders_sub': '{count} заказов в истории',
    'home.active_orders': 'АКТИВНЫЕ ЗАКАЗЫ',
    'home.no_active':     'Нет активных заказов',
    'home.book_link':     'Записаться →',
    'home.history':       'ИСТОРИЯ',
    'home.estimate':      'Смета:',
    'orders.eyebrow':     '// Мои заказы',
    'orders.title':       'ЗАКАЗЫ',
    'orders.new_booking': '+ Новая запись',
    'orders.search':      'Поиск по номеру, марке, клиенту…',
    'orders.filter_all':  'Все',
    'orders.empty':       'Нет заказов',
    'orders.empty_status':' с этим статусом',
    'orders.book_link':   'Записаться →',
    'specialist.MECHANIC':    '🔧 Слесарь',
    'specialist.ELECTRICIAN': '⚡ Электрик',
    'specialist.DIAGNOSTICS': '🔍 Диагност',
    'specialist.PARTS':       '📦 Запчасти',
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
    'order.status.NEW':           'Жаңа',
    'order.status.ASSESSED':      'Бағаланды',
    'order.status.CONFIRMED':     'Расталды',
    'order.status.READY':         'Дайын',
    'order.status.CANCELLED':     'Болдырылмады',
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
    // Код бойынша кіру
    'otp.title':          'КІРУ',
    'otp.subtitle':       'Нөмірді енгізіңіз — SMS кодын жібереміз',
    'otp.phone_label':    'ТЕЛЕФОН',
    'otp.sending':        'Жіберілуде…',
    'otp.get_code':       'Кодты алу →',
    'otp.hint':           'Жаңа аккаунт автоматты түрде жасалады',
    'otp.or':             '— немесе —',
    'otp.password_login': 'Құпия сөзбен кіру (қызметкерлер)',
    'otp.code_title':     'КОД',
    'otp.code_subtitle':  'SMS жіберілді:',
    'otp.verifying':      'Код тексерілуде…',
    'otp.resend_in':      'Қайта жіберу {sec} с кейін',
    'otp.resend':         'Қайта жіберу',
    'otp.change_number':  '← Нөмірді өзгерту',
    'otp.err.full_phone': 'Нөмірді толық енгізіңіз',
    'otp.err.send':       'Жіберу қатесі',
    'otp.err.code':       'Қате код',
    'otp.err.generic':    'Қате',
    // Клиент басты беті
    'home.eyebrow':       '// КЛИЕНТ ПАНЕЛІ',
    'home.greeting':      'Сәлем,',
    'home.greeting_fallback': 'клиент',
    'home.subtitle':      'Тапсырыстарды басқарыңыз және МОТОР AI-агенттерімен сөйлесіңіз.',
    'home.ai_online':     'AI-агенттер желіде',
    'home.promo_badge':   '🔥 Акция',
    'home.my_bookings':   '📅 Менің жазбаларым',
    'booking.status.PENDING':   'Растауды күтуде',
    'booking.status.CONFIRMED': 'Расталды',
    'booking.status.COMPLETED': 'Аяқталды',
    'booking.status.CANCELLED': 'Болдырылмады',
    'booking.status.NO_SHOW':   'Келмеді',
    'home.qa.book':       'Жазылу',
    'home.qa.book_sub':   'Слесарь · Электрик · Диагност',
    'home.qa.chat':       'AI-чат',
    'home.qa.chat_sub':   '«Қабылдаушы» агенті желіде',
    'home.qa.orders':     'Барлық тапсырыстар',
    'home.qa.orders_sub': 'тарихта {count} тапсырыс',
    'home.active_orders': 'БЕЛСЕНДІ ТАПСЫРЫСТАР',
    'home.no_active':     'Белсенді тапсырыстар жоқ',
    'home.book_link':     'Жазылу →',
    'home.history':       'ТАРИХ',
    'home.estimate':      'Смета:',
    'orders.eyebrow':     '// Менің тапсырыстарым',
    'orders.title':       'ТАПСЫРЫСТАР',
    'orders.new_booking': '+ Жаңа жазба',
    'orders.search':      'Нөмір, марка, клиент бойынша іздеу…',
    'orders.filter_all':  'Барлығы',
    'orders.empty':       'Тапсырыстар жоқ',
    'orders.empty_status':' осы мәртебемен',
    'orders.book_link':   'Жазылу →',
    'specialist.MECHANIC':    '🔧 Слесарь',
    'specialist.ELECTRICIAN': '⚡ Электрик',
    'specialist.DIAGNOSTICS': '🔍 Диагност',
    'specialist.PARTS':       '📦 Қосалқы бөлшектер',
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
    'order.status.NEW':           'New',
    'order.status.ASSESSED':      'Assessed',
    'order.status.CONFIRMED':     'Confirmed',
    'order.status.READY':         'Ready',
    'order.status.CANCELLED':     'Cancelled',
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
    // OTP login
    'otp.title':          'LOG IN',
    'otp.subtitle':       'Enter your number — we\u2019ll send an SMS code',
    'otp.phone_label':    'PHONE',
    'otp.sending':        'Sending\u2026',
    'otp.get_code':       'Get code \u2192',
    'otp.hint':           'A new account is created automatically',
    'otp.or':             '\u2014 or \u2014',
    'otp.password_login': 'Log in with password (staff)',
    'otp.code_title':     'CODE',
    'otp.code_subtitle':  'We sent an SMS to',
    'otp.verifying':      'Verifying code\u2026',
    'otp.resend_in':      'Resend available in {sec}s',
    'otp.resend':         'Resend',
    'otp.change_number':  '\u2190 Change number',
    'otp.err.full_phone': 'Enter the full phone number',
    'otp.err.send':       'Failed to send',
    'otp.err.code':       'Invalid code',
    'otp.err.generic':    'Error',
    // Client home
    'home.eyebrow':       '// CLIENT DASHBOARD',
    'home.greeting':      'Hi,',
    'home.greeting_fallback': 'client',
    'home.subtitle':      'Manage your orders and chat with MOTOR AI agents.',
    'home.ai_online':     'AI agents online',
    'home.promo_badge':   '🔥 Promo',
    'home.my_bookings':   '📅 My bookings',
    'booking.status.PENDING':   'Awaiting confirmation',
    'booking.status.CONFIRMED': 'Confirmed',
    'booking.status.COMPLETED': 'Completed',
    'booking.status.CANCELLED': 'Cancelled',
    'booking.status.NO_SHOW':   'No-show',
    'home.qa.book':       'Book a visit',
    'home.qa.book_sub':   'Mechanic · Electrician · Diagnostics',
    'home.qa.chat':       'AI chat',
    'home.qa.chat_sub':   '\u201CFront desk\u201D agent online',
    'home.qa.orders':     'All orders',
    'home.qa.orders_sub': '{count} orders in history',
    'home.active_orders': 'ACTIVE ORDERS',
    'home.no_active':     'No active orders',
    'home.book_link':     'Book a visit \u2192',
    'home.history':       'HISTORY',
    'home.estimate':      'Estimate:',
    'orders.eyebrow':     '// My orders',
    'orders.title':       'ORDERS',
    'orders.new_booking': '+ New booking',
    'orders.search':      'Search by number, make, client…',
    'orders.filter_all':  'All',
    'orders.empty':       'No orders',
    'orders.empty_status':' with this status',
    'orders.book_link':   'Book a visit →',
    'specialist.MECHANIC':    '🔧 Mechanic',
    'specialist.ELECTRICIAN': '⚡ Electrician',
    'specialist.DIAGNOSTICS': '🔍 Diagnostics',
    'specialist.PARTS':       '📦 Parts',
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
      { code: 'ru' as Locale, name: 'Русский', flag: '🇷🇺' },
      { code: 'kk' as Locale, name: 'Қазақша', flag: '🇰🇿' },
      { code: 'en' as Locale, name: 'English', flag: '🇬🇧' },
    ],
  };
}
