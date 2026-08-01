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
