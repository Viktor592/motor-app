import type { AuthTokens, UserRole } from '../types';

const KEYS = {
  access:  'motor_access',
  refresh: 'motor_refresh',
  userId:  'motor_user_id',
  name:    'motor_user_name',
  role:    'motor_user_role',
  phone:   'motor_user_phone',
} as const;

export function saveTokens(data: AuthTokens): void {
  localStorage.setItem(KEYS.access,  data.access);
  localStorage.setItem(KEYS.refresh, data.refresh);
  localStorage.setItem(KEYS.userId,  data.user.id);
  localStorage.setItem(KEYS.name,    data.user.name);
  localStorage.setItem(KEYS.role,    data.user.role);
  localStorage.setItem(KEYS.phone,   data.user.phone);
}

export function clearTokens(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}

export function getAccessToken(): string | null {
  return localStorage.getItem(KEYS.access);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(KEYS.refresh);
}

export function getRole(): UserRole | null {
  return localStorage.getItem(KEYS.role) as UserRole | null;
}

export function getUserName(): string | null {
  return localStorage.getItem(KEYS.name);
}

export function getUserId(): string | null {
  return localStorage.getItem(KEYS.userId);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/** После логина редиректим на нужное приложение по роли */
export function redirectByRole(role: UserRole): void {
  const urls: Record<UserRole, string> = {
    CLIENT: import.meta.env?.VITE_CLIENT_WEB_URL ?? 'http://localhost:3001',
    ADMIN:  import.meta.env?.VITE_ADMIN_URL      ?? 'http://localhost:3003',
    MASTER: import.meta.env?.VITE_STAFF_WEB_URL  ?? 'http://localhost:3002',
    STAFF:  import.meta.env?.VITE_STAFF_WEB_URL  ?? 'http://localhost:3002',
  };
  window.location.replace(urls[role]);
}
