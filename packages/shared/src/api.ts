import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

let refreshing = false;
let queue: Array<(t: string) => void> = [];

api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      if (refreshing) {
        return new Promise(res =>
          queue.push(t => { orig.headers.Authorization = `Bearer ${t}`; res(api(orig)); })
        );
      }
      refreshing = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh });
        localStorage.setItem('access_token', data.access);
        queue.forEach(fn => fn(data.access));
        queue = [];
        orig.headers.Authorization = `Bearer ${data.access}`;
        return api(orig);
      } catch {
        localStorage.clear();
        // Редирект на saas логин
        window.location.href = import.meta.env.VITE_SAAS_URL ?? '/';
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(err);
  }
);
