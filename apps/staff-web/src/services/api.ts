import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('motor_access');
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
        return new Promise(res => queue.push(t => { orig.headers.Authorization = `Bearer ${t}`; res(api(orig)); }));
      }
      refreshing = true;
      try {
        const refresh = localStorage.getItem('motor_refresh');
        const { data } = await axios.post('/api/v1/auth/refresh', { refresh });
        localStorage.setItem('motor_access', data.access);
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        queue.forEach(cb => cb(data.access)); queue = [];
        return api(orig);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      } finally { refreshing = false; }
    }
    return Promise.reject(err);
  }
);
