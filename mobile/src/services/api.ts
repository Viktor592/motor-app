import axios from 'axios';
import { storage } from '../utils/storage';

export const API_URL = __DEV__
  ? 'http://10.0.2.2:3000/api/v1'   // Android эмулятор
  : 'https://api.motor-app.ru/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: добавить токен ──
api.interceptors.request.use((config) => {
  const token = storage.getString('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: обновить токен при 401 ──
let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      const refresh = storage.getString('refresh_token');

      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, { refresh });
        const { access } = res.data;
        storage.set('access_token', access);
        api.defaults.headers.common.Authorization = `Bearer ${access}`;
        queue.forEach(cb => cb(access));
        queue = [];
        return api(original);
      } catch {
        // refresh тоже истёк — разлогинить
        storage.delete('access_token');
        storage.delete('refresh_token');
        // TODO: dispatch logout action
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
