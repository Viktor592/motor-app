/**
 * Web Push подписка (VAPID, без Firebase)
 * Работает в Chrome, Firefox, Edge, Safari 16+
 */
import { api } from './api';

export async function registerWebPush(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[Push] Web Push не поддерживается');
    return;
  }

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.log('[Push] VITE_VAPID_PUBLIC_KEY не задан');
    return;
  }

  try {
    // Регистрация Service Worker
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Запрос разрешения
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Подписка
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    // Отправить токен на сервер (JSON строка subscription объекта)
    await api.patch('/users/push-token', {
      token: JSON.stringify(subscription),
    });

    console.log('[Push] Web Push зарегистрирован');
  } catch (e) {
    console.warn('[Push] Ошибка регистрации:', e);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding  = '='.repeat((4 - base64String.length % 4) % 4);
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData  = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
