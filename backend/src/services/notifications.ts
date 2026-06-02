/**
 * МОТОР — Push-уведомления (без Firebase, бесплатно)
 *
 * Веб: Web Push API через VAPID (стандарт W3C, работает в Chrome/Firefox/Edge/Safari)
 * Мобильный: Expo Push Notifications (бесплатно для React Native)
 *
 * Настройка:
 *   VAPID_PUBLIC_KEY=...   (генерировать: npx web-push generate-vapid-keys)
 *   VAPID_PRIVATE_KEY=...
 *   VAPID_EMAIL=mailto:admin@motor-app.ru
 *   EXPO_ACCESS_TOKEN=...  (опционально, для Expo Push)
 */

import { prisma } from '../utils/prisma';

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  ASSESSED:    { title: '💰 Заказ оценён',    body: 'Готова предварительная смета. Подтвердите работы.' },
  CONFIRMED:   { title: '✅ Заказ подтверждён', body: 'Мастер приступит в назначенное время.' },
  IN_PROGRESS: { title: '🔧 Автомобиль в работе', body: 'Мастер приступил к ремонту.' },
  READY:       { title: '🎉 Автомобиль готов', body: 'Можете забирать в удобное время!' },
  CLOSED:      { title: '✓ Заказ закрыт',     body: 'Спасибо за доверие!' },
  CANCELLED:   { title: '❌ Заказ отменён',   body: 'Свяжитесь с нами для уточнений.' },
};

// ── Web Push (VAPID, без Firebase) ────────────────────────────────────────────
async function sendWebPush(
  subscription: string,
  payload: { title: string; body: string; data?: any }
): Promise<void> {
  let webpush: any;
  try { webpush = require('web-push'); }
  catch { return; } // пакет не установлен — тихо пропускаем

  const vapidPublic  = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail   = process.env.VAPID_EMAIL || 'mailto:admin@motor-app.ru';

  if (!vapidPublic || !vapidPrivate) return;

  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);

  try {
    await webpush.sendNotification(
      JSON.parse(subscription),
      JSON.stringify(payload)
    );
  } catch (e: any) {
    // 410 Gone — подписка устарела, удаляем
    if (e.statusCode === 410) {
      await prisma.user.updateMany({
        where: { pushToken: subscription },
        data:  { pushToken: null },
      });
    }
  }
}

// ── Expo Push (бесплатно для React Native) ────────────────────────────────────
async function sendExpoPush(
  expoPushToken: string,
  payload: { title: string; body: string; data?: any }
): Promise<void> {
  if (!expoPushToken.startsWith('ExponentPushToken')) return;

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      to:    expoPushToken,
      title: payload.title,
      body:  payload.body,
      data:  payload.data ?? {},
      sound: 'default',
    }),
  });

  if (!res.ok) console.warn('[Expo Push] Ошибка:', await res.text());
}

// ── Telegram уведомления ──────────────────────────────────────────────────────
async function sendTelegramNotification(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  }).catch(() => {});
}

// ── Главная функция отправки пользователю ────────────────────────────────────
export async function sendPushToUser(
  userId:  string,
  title:   string,
  body:    string,
  data?:   Record<string, string>
): Promise<void> {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { pushToken: true, name: true },
  });
  if (!user?.pushToken) return;

  const token = user.pushToken;
  const payload = { title, body, data };

  if (token.startsWith('ExponentPushToken')) {
    await sendExpoPush(token, payload);
  } else if (token.startsWith('{')) {
    // JSON = Web Push subscription object
    await sendWebPush(token, payload);
  } else if (token.startsWith('tg:')) {
    // Telegram chat_id с префиксом
    await sendTelegramNotification(token.slice(3), `*${title}*\n${body}`);
  } else {
    console.log(`[Push] Unknown token type for ${userId}`);
  }
}

// ── Уведомление при смене статуса ────────────────────────────────────────────
export async function notifyOrderStatusChange(orderId: string, status: string): Promise<void> {
  const msg = STATUS_MESSAGES[status];
  if (!msg) return;

  const order = await prisma.order.findUnique({
    where:  { id: orderId },
    select: { clientId: true, orderNumber: true },
  });
  if (!order) return;

  await sendPushToUser(
    order.clientId,
    msg.title,
    `${order.orderNumber}: ${msg.body}`,
    { orderId, status }
  );
}

// ── Уведомить персонал о новом заказе ────────────────────────────────────────
export async function notifyStaff(order: any): Promise<void> {
  console.log(`[Notify] Новый заказ ${order.orderNumber}`);

  const masters = await prisma.user.findMany({
    where:  { role: { in: ['MASTER', 'RECEPTIONIST'] }, pushToken: { not: null } },
    select: { id: true },
  });

  await Promise.allSettled(
    masters.map(m =>
      sendPushToUser(m.id, '📋 Новый заказ', `${order.orderNumber}`, { orderId: order.id })
    )
  );
}

export async function notifyClient(userId: string, title: string, body: string): Promise<void> {
  await sendPushToUser(userId, title, body);
}
