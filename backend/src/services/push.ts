/**
 * Push-уведомления через Expo Push Service (бесплатно)
 * Документация: https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to:       string;   // ExponentPushToken[...]
  title:    string;
  body:     string;
  data?:    Record<string, any>;
  sound?:   'default' | null;
  badge?:   number;
  priority?: 'default' | 'normal' | 'high';
}

interface PushResult {
  status: 'ok' | 'error';
  id?:    string;
  details?: any;
}

/**
 * Отправить push одному пользователю
 */
export async function sendPush(token: string, title: string, body: string, data?: Record<string, any>): Promise<void> {
  if (!token || !token.startsWith('ExponentPushToken')) {
    console.warn('[Push] Невалидный токен:', token?.slice(0, 20));
    return;
  }

  const message: PushMessage = {
    to:       token,
    title,
    body,
    data:     data ?? {},
    sound:    'default',
    priority: 'high',
  };

  try {
    const resp = await fetch(EXPO_PUSH_URL, {
      method:  'POST',
      headers: {
        'Accept':       'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await resp.json() as any;
    if (result.data?.status === 'error') {
      console.warn('[Push] Ошибка:', result.data.details);
    }
  } catch (e) {
    console.error('[Push] Сетевая ошибка:', e);
  }
}

/**
 * Отправить push нескольким пользователям (batch, до 100 за раз)
 */
export async function sendPushBatch(messages: PushMessage[]): Promise<PushResult[]> {
  const results: PushResult[] = [];

  // Expo принимает максимум 100 за раз
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    try {
      const resp = await fetch(EXPO_PUSH_URL, {
        method:  'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
      const json = await resp.json() as any;
      results.push(...(json.data ?? []));
    } catch (e) {
      console.error('[Push] Batch error:', e);
    }
  }

  return results;
}

// ── Готовые шаблоны уведомлений ──────────────────────────────

export const PushTemplates = {
  /** Клиенту: статус заказа изменился */
  orderStatusChanged(orderId: string, orderNumber: string, newStatus: string, token: string) {
    const statusLabels: Record<string, string> = {
      IN_PROGRESS:   'Начата работа',
      WAITING_PARTS: 'Ожидаем запчасти',
      QUALITY_CHECK: 'Проверка качества',
      DONE:          'Готов к выдаче! 🎉',
      CLOSED:        'Заказ закрыт',
    };
    const label = statusLabels[newStatus] ?? newStatus;
    return sendPush(
      token,
      `Заказ #${orderNumber}`,
      label,
      { orderId, type: 'order_status', status: newStatus },
    );
  },

  /** Клиенту: новое сообщение в чате */
  newChatMessage(orderId: string, senderName: string, preview: string, token: string) {
    return sendPush(
      token,
      `Сообщение от ${senderName}`,
      preview.length > 80 ? preview.slice(0, 77) + '…' : preview,
      { orderId, type: 'chat_message' },
    );
  },

  /** Мастеру: новый заказ назначен */
  orderAssigned(orderId: string, orderNumber: string, vehicleName: string, token: string) {
    return sendPush(
      token,
      '🔧 Новый заказ',
      `${vehicleName} — Заказ #${orderNumber}`,
      { orderId, type: 'order_assigned' },
    );
  },

  /** Клиенту: запись подтверждена */
  bookingConfirmed(bookingId: string, date: string, time: string, token: string) {
    return sendPush(
      token,
      '✅ Запись подтверждена',
      `${date} в ${time} — ждём вас!`,
      { bookingId, type: 'booking_confirmed' },
    );
  },

  /** Клиенту: напоминание о записи за 2 часа */
  bookingReminder(bookingId: string, time: string, token: string) {
    return sendPush(
      token,
      '⏰ Напоминание о записи',
      `Через 2 часа — в ${time}`,
      { bookingId, type: 'booking_reminder' },
    );
  },
};
