/**
 * МОТОР — Планировщик задач
 * Ежедневный отчёт в Telegram администратору в 21:00
 */

import { prisma } from '../utils/prisma';
import { sendTelegramMessage } from './telegram';

export function startScheduler(): void {
  // Проверка каждую минуту — простой cron без BullMQ
  setInterval(checkSchedule, 60_000);
  console.log('[Scheduler] Запущен');
}

async function checkSchedule(): Promise<void> {
  const now  = new Date();
  const hour = now.getHours();
  const min  = now.getMinutes();

  // Ежедневный отчёт в 21:00
  if (hour === 21 && min === 0) {
    await sendDailyReport();
  }
}

async function sendDailyReport(): Promise<void> {
  const setting = await prisma.priceAuditLog.findFirst({
    where: { itemName: '__setting__notifications' },
    orderBy: { createdAt: 'desc' },
  });

  let enabled = true;
  try {
    if (setting) enabled = JSON.parse(setting.performedBy).dailyReport;
  } catch {}
  if (!enabled) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayOrders, closedToday, revenue] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: 'CLOSED', paidAt: { gte: today } } }),
    prisma.order.aggregate({
      _sum: { totalRetail: true },
      where: { status: 'CLOSED', paidAt: { gte: today } },
    }),
  ]);

  const inProgress = await prisma.order.count({ where: { status: 'IN_PROGRESS' } });
  const ready      = await prisma.order.count({ where: { status: 'READY' } });

  const msg =
    `📊 *Итоги дня — МОТОР*\n\n` +
    `📅 ${today.toLocaleDateString('ru', { day: '2-digit', month: 'long' })}\n\n` +
    `🔵 Новых заказов: *${todayOrders}*\n` +
    `✅ Закрыто сегодня: *${closedToday}*\n` +
    `🔧 В работе: *${inProgress}*\n` +
    `🟢 Готово (не выдано): *${ready}*\n\n` +
    `💰 Выручка за день: *${Math.round(Number(revenue._sum.totalRetail ?? 0)).toLocaleString('ru')} ₽*`;

  // Найти всех администраторов с Telegram
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', pushToken: { startsWith: 'tg:' } },
    select: { pushToken: true },
  });

  for (const admin of admins) {
    const chatId = admin.pushToken!.slice(3);
    await sendTelegramMessage(chatId, msg);
  }
}
