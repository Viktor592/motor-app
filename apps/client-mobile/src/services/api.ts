import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://83.222.19.108:3000/api/v1';

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use(async cfg => {
  const token = await SecureStore.getItemAsync('motor_access');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const refresh = await SecureStore.getItemAsync('motor_refresh');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh });
        await SecureStore.setItemAsync('motor_access',  data.access);
        await SecureStore.setItemAsync('motor_refresh', data.refresh);
        orig.headers.Authorization = `Bearer ${data.access}`;
        return api(orig);
      } catch {
        await SecureStore.deleteItemAsync('motor_access');
        await SecureStore.deleteItemAsync('motor_refresh');
        // Роутер перенаправит на логин
      }
    }
    return Promise.reject(err);
  }
);

/** Сохранить токены после логина */
export async function saveAuth(data: { access: string; refresh: string; user: { id: string; name: string; role: string; phone: string } }) {
  await SecureStore.setItemAsync('motor_access',  data.access);
  await SecureStore.setItemAsync('motor_refresh', data.refresh);
  await SecureStore.setItemAsync('motor_user_id',   data.user.id);
  await SecureStore.setItemAsync('motor_user_name', data.user.name);
  await SecureStore.setItemAsync('motor_user_role', data.user.role);
  await SecureStore.setItemAsync('motor_user_phone',data.user.phone);
}

export async function clearAuth() {
  for (const k of ['motor_access','motor_refresh','motor_user_id','motor_user_name','motor_user_role','motor_user_phone']) {
    await SecureStore.deleteItemAsync(k);
  }
}
