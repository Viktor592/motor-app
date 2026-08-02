/**
 * МОТОР — Простая i18n система без внешних зависимостей
 * Поддерживаемые языки: ru (по умолчанию), kk (казахский), en (английский)
 */

export type Locale = 'ru' | 'kk' | 'en';

// ── Словари ───────────────────────────────────────────────────
const translations: Record<Locale, Record<string, string>> = {
  ru: {
    'auth.err.fill_all':     'Введите телефон и пароль',
    'auth.err.login_failed': 'Ошибка входа',
    'auth.title':            'Вход',
    'auth.phone_label':      'Телефон',
    'auth.password_label':   'Пароль',
    'auth.login_btn':        'Войти →',
    'auth.no_account':       'Нет аккаунта?',
    'auth.register_link':    'Зарегистрировать автосервис',
    'home.subtitle':          'Платформа для автосервисов',
    'home.client_login':      'Я клиент — войти',
    'home.owner_login':       'Я владелец автосервиса — войти',
    'home.staff_login':       'Я сотрудник автосервиса — войти',
    'home.client_register':   'Регистрация клиента',
    'home.owner_register':    'Регистрация автосервиса',
    'home.superadmin_login':  'Вход супер-админа',
    'home.privacy_policy':    'Политика обработки персональных данных',
    'home.public_offer':      'Публичная оферта',
    'register.err.invalid':        'Заполните все поля корректно (пароль — минимум 6 символов)',
    'register.err.failed':         'Ошибка регистрации',
    'register.done_title':         'Готово!',
    'register.done_sub':           'Аккаунт создан. Теперь войдите под своим телефоном и паролем.',
    'register.title':              'Регистрация',
    'register.name_label':         'Имя',
    'register.register_btn':       'Зарегистрироваться →',
    'register.have_account':       'Уже есть аккаунт?',
    'register.login_link':         'Войти',
    'register.are_you_owner':      'Вы владелец автосервиса?',
    'register.business_register':  'Регистрация бизнеса',
    // Регистрация автосервиса (OwnerRegisterPage)
    'owner_register.tz.moscow':        'Москва',
    'owner_register.tz.kaliningrad':   'Калининград',
    'owner_register.tz.yekaterinburg': 'Екатеринбург',
    'owner_register.tz.novosibirsk':   'Новосибирск',
    'owner_register.tz.krasnoyarsk':   'Красноярск',
    'owner_register.tz.irkutsk':       'Иркутск',
    'owner_register.tz.vladivostok':   'Владивосток',
    'owner_register.success_title':    'Заявка отправлена на проверку',
    'owner_register.success_sub':      'Мы проверим ИНН/ОГРН и одобрим доступ, обычно это быстро.',
    'owner_register.future_address':   'Будущий адрес',
    'owner_register.login_phone':      'Телефон для входа',
    'owner_register.status':           'Статус',
    'owner_register.pending':          'На проверке',
    'owner_register.go_to_login':      'Перейти ко входу →',
    'owner_register.title':            'Регистрация автосервиса',
    'owner_register.subtitle':         '14 дней бесплатно, карта не нужна',
    'owner_register.step1':            'Сервис',
    'owner_register.step2':            'Владелец',
    'owner_register.step3':            'Адрес',
    'owner_register.service_name_label':       'Название автосервиса *',
    'owner_register.service_name_placeholder': 'Автосервис Победа',
    'owner_register.inn_label':        'ИНН *',
    'owner_register.ogrn_label':       'ОГРН / ОГРНИП (необязательно)',
    'owner_register.timezone_label':   'Часовой пояс',
    'owner_register.next_btn':         'Далее →',
    'owner_register.your_name_label':       'Ваше имя *',
    'owner_register.your_name_placeholder': 'Иван Иванов',
    'owner_register.email_label':      'Email *',
    'owner_register.phone_label':      'Телефон *',
    'owner_register.password_label':   'Пароль *',
    'owner_register.password_placeholder': 'Минимум 6 символов',
    'owner_register.back_btn':         'Назад',
    'owner_register.address_label':    'Адрес сервиса *',
    'owner_register.checking':         'Проверяю…',
    'owner_register.slug_available':   'Адрес свободен',
    'owner_register.slug_taken':       'Адрес занят',
    'owner_register.slug_hint':        'Только латинские буквы, цифры и дефис. Минимум 3 символа.',
    'owner_register.address_will_be':  'Ваш адрес будет:',
    'owner_register.creating':         'Создаю…',
    'owner_register.create_btn':       'Создать сервис',
  },
  kk: {
    'auth.err.fill_all':     'Телефон мен құпия сөзді енгізіңіз',
    'auth.err.login_failed': 'Кіру қатесі',
    'auth.title':            'Кіру',
    'auth.phone_label':      'Телефон',
    'auth.password_label':   'Құпия сөз',
    'auth.login_btn':        'Кіру →',
    'auth.no_account':       'Аккаунт жоқ па?',
    'auth.register_link':    'Автосервисті тіркеу',
    'home.subtitle':          'Автосервистерге арналған платформа',
    'home.client_login':      'Мен клиентпін — кіру',
    'home.owner_login':       'Мен автосервис иесімін — кіру',
    'home.staff_login':       'Мен автосервис қызметкерімін — кіру',
    'home.client_register':   'Клиентті тіркеу',
    'home.owner_register':    'Автосервисті тіркеу',
    'home.superadmin_login':  'Супер-админ кіруі',
    'home.privacy_policy':    'Дербес деректерді өңдеу саясаты',
    'home.public_offer':      'Жария оферта',
    'register.err.invalid':        'Барлық өрістерді дұрыс толтырыңыз (құпия сөз — кемінде 6 таңба)',
    'register.err.failed':         'Тіркеу қатесі',
    'register.done_title':         'Дайын!',
    'register.done_sub':           'Аккаунт құрылды. Енді телефоныңыз бен құпия сөзіңізбен кіріңіз.',
    'register.title':              'Тіркелу',
    'register.name_label':         'Аты',
    'register.register_btn':       'Тіркелу →',
    'register.have_account':       'Аккаунтыңыз бар ма?',
    'register.login_link':         'Кіру',
    'register.are_you_owner':      'Сіз автосервис иесісіз бе?',
    'register.business_register':  'Бизнесті тіркеу',
    // Регистрация автосервиса (OwnerRegisterPage)
    'owner_register.tz.moscow':        'Мәскеу',
    'owner_register.tz.kaliningrad':   'Калининград',
    'owner_register.tz.yekaterinburg': 'Екатеринбург',
    'owner_register.tz.novosibirsk':   'Новосібір',
    'owner_register.tz.krasnoyarsk':   'Красноярск',
    'owner_register.tz.irkutsk':       'Иркутск',
    'owner_register.tz.vladivostok':   'Владивосток',
    'owner_register.success_title':    'Өтінім тексеруге жіберілді',
    'owner_register.success_sub':      'Біз СТН/ОГРН-ды тексеріп, рұқсат береміз, әдетте бұл жылдам болады.',
    'owner_register.future_address':   'Болашақ мекенжай',
    'owner_register.login_phone':      'Кіру үшін телефон',
    'owner_register.status':           'Мәртебе',
    'owner_register.pending':          'Тексерілуде',
    'owner_register.go_to_login':      'Кіруге өту →',
    'owner_register.title':            'Автосервисті тіркеу',
    'owner_register.subtitle':         '14 күн тегін, карта қажет емес',
    'owner_register.step1':            'Сервис',
    'owner_register.step2':            'Иесі',
    'owner_register.step3':            'Мекенжай',
    'owner_register.service_name_label':       'Автосервис атауы *',
    'owner_register.service_name_placeholder': 'Победа автосервисі',
    'owner_register.inn_label':        'СТН *',
    'owner_register.ogrn_label':       'ОГРН / ОГРНИП (міндетті емес)',
    'owner_register.timezone_label':   'Уақыт белдеуі',
    'owner_register.next_btn':         'Келесі →',
    'owner_register.your_name_label':       'Атыңыз *',
    'owner_register.your_name_placeholder': 'Иван Иванов',
    'owner_register.email_label':      'Email *',
    'owner_register.phone_label':      'Телефон *',
    'owner_register.password_label':   'Құпия сөз *',
    'owner_register.password_placeholder': 'Кемінде 6 таңба',
    'owner_register.back_btn':         'Артқа',
    'owner_register.address_label':    'Сервис мекенжайы *',
    'owner_register.checking':         'Тексерілуде…',
    'owner_register.slug_available':   'Мекенжай бос',
    'owner_register.slug_taken':       'Мекенжай бос емес',
    'owner_register.slug_hint':        'Тек латын әріптері, сандар және дефис. Кемінде 3 таңба.',
    'owner_register.address_will_be':  'Сіздің мекенжайыңыз:',
    'owner_register.creating':         'Құрылуда…',
    'owner_register.create_btn':       'Сервис құру',
  },
  en: {
    'auth.err.fill_all':     'Enter your phone and password',
    'auth.err.login_failed': 'Login failed',
    'auth.title':            'Log in',
    'auth.phone_label':      'Phone',
    'auth.password_label':   'Password',
    'auth.login_btn':        'Log in →',
    'auth.no_account':       "Don't have an account?",
    'auth.register_link':    'Register your auto shop',
    'home.subtitle':          'Platform for auto shops',
    'home.client_login':      "I'm a client — log in",
    'home.owner_login':       "I'm an auto shop owner — log in",
    'home.staff_login':       "I'm an auto shop employee — log in",
    'home.client_register':   'Register a client',
    'home.owner_register':    'Register an auto shop',
    'home.superadmin_login':  'Super admin login',
    'home.privacy_policy':    'Privacy policy',
    'home.public_offer':      'Public offer',
    'register.err.invalid':        'Fill in all fields correctly (password — at least 6 characters)',
    'register.err.failed':         'Registration failed',
    'register.done_title':         'Done!',
    'register.done_sub':           'Account created. Now log in with your phone and password.',
    'register.title':              'Registration',
    'register.name_label':         'Name',
    'register.register_btn':       'Register →',
    'register.have_account':       'Already have an account?',
    'register.login_link':         'Log in',
    'register.are_you_owner':      'Are you an auto shop owner?',
    'register.business_register':  'Register a business',
    // Auto shop registration (OwnerRegisterPage)
    'owner_register.tz.moscow':        'Moscow',
    'owner_register.tz.kaliningrad':   'Kaliningrad',
    'owner_register.tz.yekaterinburg': 'Yekaterinburg',
    'owner_register.tz.novosibirsk':   'Novosibirsk',
    'owner_register.tz.krasnoyarsk':   'Krasnoyarsk',
    'owner_register.tz.irkutsk':       'Irkutsk',
    'owner_register.tz.vladivostok':   'Vladivostok',
    'owner_register.success_title':    'Application sent for review',
    'owner_register.success_sub':      "We'll verify your tax ID and approve access — usually fast.",
    'owner_register.future_address':   'Future address',
    'owner_register.login_phone':      'Login phone',
    'owner_register.status':           'Status',
    'owner_register.pending':          'Under review',
    'owner_register.go_to_login':      'Go to login →',
    'owner_register.title':            'Auto shop registration',
    'owner_register.subtitle':         '14 days free, no card required',
    'owner_register.step1':            'Service',
    'owner_register.step2':            'Owner',
    'owner_register.step3':            'Address',
    'owner_register.service_name_label':       'Auto shop name *',
    'owner_register.service_name_placeholder': 'Pobeda Auto Service',
    'owner_register.inn_label':        'Tax ID *',
    'owner_register.ogrn_label':       'Reg. number (optional)',
    'owner_register.timezone_label':   'Timezone',
    'owner_register.next_btn':         'Next →',
    'owner_register.your_name_label':       'Your name *',
    'owner_register.your_name_placeholder': 'John Smith',
    'owner_register.email_label':      'Email *',
    'owner_register.phone_label':      'Phone *',
    'owner_register.password_label':   'Password *',
    'owner_register.password_placeholder': 'At least 6 characters',
    'owner_register.back_btn':         'Back',
    'owner_register.address_label':    'Service address *',
    'owner_register.checking':         'Checking…',
    'owner_register.slug_available':   'Address available',
    'owner_register.slug_taken':       'Address taken',
    'owner_register.slug_hint':        'Latin letters, digits and hyphen only. At least 3 characters.',
    'owner_register.address_will_be':  'Your address will be:',
    'owner_register.creating':         'Creating…',
    'owner_register.create_btn':       'Create service',
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
