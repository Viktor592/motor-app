import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.motor-app.ru/api/v1';

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use(async cfg => {
  const token = await SecureStore.getItemAsync('motor_access');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(r => r, async err => {
  if (err.response?.status === 401 && !err.config._retry) {
    err.config._retry = true;
    try {
      const refresh = await SecureStore.getItemAsync('motor_refresh');
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh });
      await saveAuth(data);
      err.config.headers.Authorization = `Bearer ${data.access}`;
      return api(err.config);
    } catch { await clearAuth(); }
  }
  return Promise.reject(err);
});

export async function saveAuth(data: any) {
  await SecureStore.setItemAsync('motor_access',   data.access);
  await SecureStore.setItemAsync('motor_refresh',  data.refresh);
  await SecureStore.setItemAsync('motor_user_id',  data.user.id);
  await SecureStore.setItemAsync('motor_user_name',data.user.name);
  await SecureStore.setItemAsync('motor_user_role',data.user.role);
}

export async function clearAuth() {
  for (const k of ['motor_access','motor_refresh','motor_user_id','motor_user_name','motor_user_role']) {
    await SecureStore.deleteItemAsync(k);
  }
}
