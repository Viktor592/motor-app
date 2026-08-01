/**
 * МОТОР — Простая i18n система без внешних зависимостей
 * Поддерживаемые языки: ru (по умолчанию), kk (казахский), en (английский)
 */

export type Locale = 'ru' | 'kk' | 'en';

// ── Словари ───────────────────────────────────────────────────
const translations: Record<Locale, Record<string, string>> = {
  ru: {
  },
  kk: {
  },
  en: {
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
