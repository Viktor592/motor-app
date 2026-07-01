import axios, { type AxiosInstance } from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../auth';

const BASE_URL = typeof window !== 'undefined'
  ? (window.__MOTOR_API_URL__ ?? '/api/v1')
  : '/api/v1';

declare global {
  interface Window { __MOTOR_API_URL__?: string; }
}

export function createApiClient(baseURL = BASE_URL): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 15000 });

  client.interceptors.request.use(cfg => {
    const token = getAccessToken();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  });

  let refreshing = false;
  let queue: Array<(t: string) => void> = [];

  client.interceptors.response.use(
    r => r,
    async err => {
      const orig = err.config;
      if (err.response?.status === 401 && !orig._retry) {
        orig._retry = true;
        if (refreshing) {
          return new Promise(res =>
            queue.push(t => { orig.headers.Authorization = `Bearer ${t}`; res(client(orig)); })
          );
        }
        refreshing = true;
        try {
          const refresh = getRefreshToken();
          const { data } = await axios.post(`${baseURL}/auth/refresh`, { refresh });
          saveTokens(data);
          queue.forEach(fn => fn(data.access));
          queue = [];
          orig.headers.Authorization = `Bearer ${data.access}`;
          return client(orig);
        } catch {
          clearTokens();
          window.location.replace(window.__MOTOR_SAAS_URL__ ?? '/');
        } finally {
          refreshing = false;
        }
      }
      return Promise.reject(err);
    }
  );

  return client;
}

export const api = createApiClient();
