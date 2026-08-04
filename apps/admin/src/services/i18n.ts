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
    // Акции (PromotionsPage)
    'promotions.title':            'Акции для клиентов',
    'promotions.subtitle':         'Простое объявление об акции — видно только вашим клиентам. Запуском рекламы на платформе занимается администрация МОТОР.',
    'promotions.title_placeholder':'Заголовок (например: Скидка 15% на ТО)',
    'promotions.body_placeholder': 'Текст акции',
    'promotions.publish_btn':      '+ Опубликовать акцию',
    'promotions.empty':            'Акций пока нет',
    // Меню супер-админа (SuperAdminLayout)
    'super_admin.nav.services':   'Автосервисы',
    'super_admin.nav.users':      'Пользователи',
    'super_admin.nav.promotions': 'Акции',
    'super_admin.platform_group': 'Платформа',
    'super_admin.name_fallback':  'Супер-админ',
    'super_admin.logout':         'Выйти',
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
    'order.status.NEW':           'Жаңа',
    'order.status.ASSESSED':      'Бағаланды',
    'order.status.CONFIRMED':     'Расталды',
    'order.status.READY':         'Дайын',
    'order.status.CANCELLED':     'Бас тартылды',
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
    // Акции (PromotionsPage)
    'promotions.title':            'Клиенттерге арналған акциялар',
    'promotions.subtitle':         'Акция туралы қарапайым хабарландыру — тек сіздің клиенттеріңізге көрінеді. Платформада жарнама іске қосумен МОТОР әкімшілігі айналысады.',
    'promotions.title_placeholder':'Тақырып (мысалы: ТО-ға 15% жеңілдік)',
    'promotions.body_placeholder': 'Акция мәтіні',
    'promotions.publish_btn':      '+ Акцияны жариялау',
    'promotions.empty':            'Әзірге акциялар жоқ',
    // Меню супер-админа (SuperAdminLayout)
    'super_admin.nav.services':   'Автосервистер',
    'super_admin.nav.users':      'Пайдаланушылар',
    'super_admin.nav.promotions': 'Акциялар',
    'super_admin.platform_group': 'Платформа',
    'super_admin.name_fallback':  'Супер-админ',
    'super_admin.logout':         'Шығу',
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
    'order.status.NEW':           'New',
    'order.status.ASSESSED':      'Assessed',
    'order.status.CONFIRMED':     'Confirmed',
    'order.status.READY':         'Ready',
    'order.status.CANCELLED':     'Cancelled',
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
    // Promotions (PromotionsPage)
    'promotions.title':            'Promotions for clients',
    'promotions.subtitle':         'A simple promotion announcement — visible only to your clients. Launching platform-wide ads is handled by MOTOR administration.',
    'promotions.title_placeholder':'Title (e.g.: 15% off maintenance)',
    'promotions.body_placeholder': 'Promotion text',
    'promotions.publish_btn':      '+ Publish promotion',
    'promotions.empty':            'No promotions yet',
    // Super admin menu (SuperAdminLayout)
    'super_admin.nav.services':   'Auto Shops',
    'super_admin.nav.users':      'Users',
    'super_admin.nav.promotions': 'Promotions',
    'super_admin.platform_group': 'Platform',
    'super_admin.name_fallback':  'Super Admin',
    'super_admin.logout':         'Log out',
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
