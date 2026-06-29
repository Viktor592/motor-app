export interface AuthUser {
  id: string;
  name: string;
  role: 'CLIENT' | 'ADMIN' | 'MASTER' | 'STAFF';
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: AuthUser;
}

export function saveAuth(data: AuthTokens) {
  localStorage.setItem('access_token',  data.access);
  localStorage.setItem('refresh_token', data.refresh);
  localStorage.setItem('user_id',   data.user.id);
  localStorage.setItem('user_name', data.user.name);
  localStorage.setItem('user_role', data.user.role);
}

export function clearAuth() {
  localStorage.clear();
}

export function getRole(): string | null {
  return localStorage.getItem('user_role');
}

export function getToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getName(): string | null {
  return localStorage.getItem('user_name');
}

/** После логина редиректим на нужное приложение по роли */
export function redirectByRole(role: string) {
  const urls: Record<string, string> = {
    CLIENT: import.meta.env.VITE_CLIENT_URL  ?? 'http://localhost:3001',
    ADMIN:  import.meta.env.VITE_ADMIN_URL   ?? 'http://localhost:3003',
    MASTER: import.meta.env.VITE_STAFF_URL   ?? 'http://localhost:3002',
    STAFF:  import.meta.env.VITE_STAFF_URL   ?? 'http://localhost:3002',
  };
  window.location.href = urls[role] ?? '/';
}
