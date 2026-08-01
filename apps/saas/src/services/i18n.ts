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
