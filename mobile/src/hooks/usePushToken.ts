/**
 * Expo Push Notifications (бесплатно, без Firebase)
 * Установка: npm install expo-notifications expo-device
 *
 * Expo Push — бесплатный сервис без ключей/проектов/кредитки.
 * Ограничений на количество нет. Работает iOS + Android.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { api } from '../services/api';

export function usePushToken() {
  const { token: authToken } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!authToken) return;
    registerExpoPush();
  }, [authToken]);
}

async function registerExpoPush() {
  try {
    // Динамический импорт — не крашим если пакеты не установлены
    const Notifications = require('expo-notifications');
    const Device        = require('expo-device');

    if (!Device.isDevice) {
      console.log('[Push] Expo Push работает только на реальном устройстве');
      return;
    }

    // Запросить разрешение
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Разрешение не получено');
      return;
    }

    // Android — создать канал
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('motor_orders', {
        name:       'Заказы МОТОР',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ff6200',
      });
    }

    // Получить Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const expoPushToken = tokenData.data;

    if (!expoPushToken) return;

    // Отправить токен на сервер
    await api.patch('/users/push-token', { token: expoPushToken });
    console.log('[Push] Expo Push токен зарегистрирован');

    // Обработка уведомлений в foreground
    Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('[Push] Foreground:', notification.request.content.title);
    });

    // Нажатие на уведомление
    Notifications.addNotificationResponseReceivedListener((response: any) => {
      const orderId = response.notification.request.content.data?.orderId;
      if (orderId) {
        console.log('[Push] Открыть заказ:', orderId);
        // TODO: navigate to order screen
      }
    });

  } catch (e: any) {
    if (!e.message?.includes('Cannot find module')) {
      console.warn('[Push]', e.message);
    }
  }
}
