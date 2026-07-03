/**
 * МОТОР — Тёмная / светлая тема
 */

export type Theme = 'dark' | 'light' | 'system';

const THEME_KEY = 'motor_theme';

function applyTheme(theme: Theme) {
  const root       = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark     = theme === 'dark' || (theme === 'system' && prefersDark);

  root.setAttribute('data-theme', isDark ? 'dark' : 'light');

  // Обновить meta theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', isDark ? '#0f1117' : '#ffffff');
}

export function getTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme) ?? 'dark';
}

export function setTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent('motor-theme-change', { detail: theme }));
}

// Применить при загрузке
applyTheme(getTheme());

// Следить за системной темой
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getTheme() === 'system') applyTheme('system');
});

import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getTheme());

  useEffect(() => {
    const handler = (e: Event) => setThemeState((e as CustomEvent).detail);
    window.addEventListener('motor-theme-change', handler);
    return () => window.removeEventListener('motor-theme-change', handler);
  }, []);

  return {
    theme,
    setTheme: (t: Theme) => { setTheme(t); setThemeState(t); },
    isDark: theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches),
  };
}
