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
    // Авторизация
    'auth.login_title':        'ВХОД ДЛЯ СОТРУДНИКОВ',
    'auth.login_sub':          'Доступ выдаёт владелец автосервиса',
    'auth.phone_label':        'ТЕЛЕФОН',
    'auth.password_label':     'ПАРОЛЬ',
    'auth.login_btn':          'Войти →',
    'auth.forgot_link':        'Забыли пароль?',
    'auth.recovery_title':     'ВОССТАНОВЛЕНИЕ',
    'auth.send_code_btn':      'Отправить код →',
    'auth.back_to_login':      '← Назад ко входу',
    'auth.new_password_title': 'НОВЫЙ ПАРОЛЬ',
    'auth.sms_code_label':     'КОД ИЗ SMS',
    'auth.new_password_label': 'НОВЫЙ ПАРОЛЬ',
    'auth.save_btn':           'Сохранить →',
    'auth.err.enter_phone':    'Введите телефон',
    'auth.err.send_code':      'Не удалось отправить код',
    'auth.code_sent':          'Код отправлен по SMS',
    'auth.err.code_and_pwd':   'Введите код (4 цифры) и новый пароль (от 6 символов)',
    'auth.pwd_changed':        'Пароль изменён — теперь войдите с ним',
    'auth.err.change_pwd':     'Не удалось сменить пароль',
    'auth.err.fill_all':       'Введите телефон и пароль',
    'auth.err.staff_only':     'Этот вход только для сотрудников автосервиса',
    'auth.err.bad_creds':      'Неверный телефон или пароль',
    // Меню и роли (AppLayout)
    'nav.staff.orders':    'Заказы',
    'nav.staff.bookings':  'Записи',
    'nav.staff.analytics': 'Аналитика',
    'nav.staff.profile':   'Профиль',
    'role.master':         'Мастер',
    'role.receptionist':   'Приёмщик',
    // Чат с AI-агентом
    'chat.agent_name':        'Агент «Приёмщик»',
    'chat.online':             'Онлайн',
    'chat.loading_history':    'Загрузка истории…',
    'chat.agent_ready':        'Агент готов к работе',
    'chat.welcome_text':       'Опишите проблему с вашим автомобилем — я задам уточняющие вопросы, помогу разобраться и запишу к нужному специалисту.',
    'chat.prompt_suspension':  'Стук в подвеске при повороте',
    'chat.prompt_check_engine':'Горит чек двигателя',
    'chat.prompt_battery':     'Не заряжается аккумулятор',
    'chat.prompt_maintenance': 'Нужно ТО',
    'chat.placeholder':        'Опишите проблему…',
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
    'order.status.CANCELLED':     'Бас тартылды',
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
    // Авторизация
    'auth.login_title':        'ҚЫЗМЕТКЕРЛЕР КІРУІ',
    'auth.login_sub':          'Рұқсатты автосервис иесі береді',
    'auth.phone_label':        'ТЕЛЕФОН',
    'auth.password_label':     'ҚҰПИЯ СӨЗ',
    'auth.login_btn':          'Кіру →',
    'auth.forgot_link':        'Құпия сөзді ұмыттыңыз ба?',
    'auth.recovery_title':     'ҚАЛПЫНА КЕЛТІРУ',
    'auth.send_code_btn':      'Кодты жіберу →',
    'auth.back_to_login':      '← Кіруге оралу',
    'auth.new_password_title': 'ЖАҢА ҚҰПИЯ СӨЗ',
    'auth.sms_code_label':     'SMS КОДЫ',
    'auth.new_password_label': 'ЖАҢА ҚҰПИЯ СӨЗ',
    'auth.save_btn':           'Сақтау →',
    'auth.err.enter_phone':    'Телефонды енгізіңіз',
    'auth.err.send_code':      'Кодты жіберу мүмкін болмады',
    'auth.code_sent':          'Код SMS арқылы жіберілді',
    'auth.err.code_and_pwd':   'Кодты (4 сан) және жаңа құпия сөзді (кемінде 6 символ) енгізіңіз',
    'auth.pwd_changed':        'Құпия сөз өзгертілді — енді сонымен кіріңіз',
    'auth.err.change_pwd':     'Құпия сөзді өзгерту мүмкін болмады',
    'auth.err.fill_all':       'Телефон мен құпия сөзді енгізіңіз',
    'auth.err.staff_only':     'Бұл кіру тек автосервис қызметкерлеріне арналған',
    'auth.err.bad_creds':      'Қате телефон немесе құпия сөз',
    // Меню и роли (AppLayout)
    'nav.staff.orders':    'Тапсырыстар',
    'nav.staff.bookings':  'Жазбалар',
    'nav.staff.analytics': 'Аналитика',
    'nav.staff.profile':   'Профиль',
    'role.master':         'Шебер',
    'role.receptionist':   'Қабылдаушы',
    // Чат с AI-агентом
    'chat.agent_name':        'Агент «Қабылдаушы»',
    'chat.online':             'Онлайн',
    'chat.loading_history':    'Тарих жүктелуде…',
    'chat.agent_ready':        'Агент жұмысқа дайын',
    'chat.welcome_text':       'Көлігіңіздегі ақауды сипаттаңыз — мен нақтылау сұрақтарын қоямын, анықтауға көмектесемін және қажетті маманға жазамын.',
    'chat.prompt_suspension':  'Бұрылғанда аспа тарсылдайды',
    'chat.prompt_check_engine':'Двигательдің чек шамы жанып тұр',
    'chat.prompt_battery':     'Аккумулятор зарядталмайды',
    'chat.prompt_maintenance': 'ТО керек',
    'chat.placeholder':        'Ақауды сипаттаңыз…',
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
    // Auth
    'auth.login_title':        'STAFF LOGIN',
    'auth.login_sub':          'Access is granted by the auto shop owner',
    'auth.phone_label':        'PHONE',
    'auth.password_label':     'PASSWORD',
    'auth.login_btn':          'Log in →',
    'auth.forgot_link':        'Forgot password?',
    'auth.recovery_title':     'RECOVERY',
    'auth.send_code_btn':      'Send code →',
    'auth.back_to_login':      '← Back to login',
    'auth.new_password_title': 'NEW PASSWORD',
    'auth.sms_code_label':     'SMS CODE',
    'auth.new_password_label': 'NEW PASSWORD',
    'auth.save_btn':           'Save →',
    'auth.err.enter_phone':    'Enter your phone',
    'auth.err.send_code':      'Failed to send code',
    'auth.code_sent':          'Code sent via SMS',
    'auth.err.code_and_pwd':   'Enter the code (4 digits) and a new password (6+ characters)',
    'auth.pwd_changed':        'Password changed — now log in with it',
    'auth.err.change_pwd':     'Failed to change password',
    'auth.err.fill_all':       'Enter your phone and password',
    'auth.err.staff_only':     'This login is for auto shop staff only',
    'auth.err.bad_creds':      'Incorrect phone or password',
    // Menu and roles (AppLayout)
    'nav.staff.orders':    'Orders',
    'nav.staff.bookings':  'Bookings',
    'nav.staff.analytics': 'Analytics',
    'nav.staff.profile':   'Profile',
    'role.master':         'Master',
    'role.receptionist':   'Receptionist',
    // AI agent chat
    'chat.agent_name':        'Agent "Receptionist"',
    'chat.online':             'Online',
    'chat.loading_history':    'Loading history…',
    'chat.agent_ready':        'Agent ready to help',
    'chat.welcome_text':       "Describe the issue with your vehicle — I'll ask clarifying questions, help figure it out, and book you with the right specialist.",
    'chat.prompt_suspension':  'Knocking suspension when turning',
    'chat.prompt_check_engine':'Check engine light is on',
    'chat.prompt_battery':     "Battery won't charge",
    'chat.prompt_maintenance': 'Need maintenance',
    'chat.placeholder':        'Describe the issue…',
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
