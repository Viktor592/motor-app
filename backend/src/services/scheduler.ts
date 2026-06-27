/**
 * МОТОР — Планировщик задач
 * Ежедневный отчёт в Telegram администратору в 21:00
 */

import { prisma } from '../utils/prisma';
import { sendPush } from './push';
import { sendTelegramMessage } from './telegram';
import { processDueReminders } from '../routes/loyalty';

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

  // Напоминания о ТО
  await processDueReminders().catch(e => console.error('[Scheduler] reminders:', e));

  for (const admin of admins) {
    const chatId = admin.pushToken!.slice(3);
    await sendTelegramMessage(chatId, msg);
  }
}

// ══════════════════════════════════════
// АВТОМАТИЧЕСКАЯ ОТЧЁТНОСТЬ (планировщик)
// ══════════════════════════════════════

import { AutoReportingService } from './autoReporting';

/**
 * Проверяет сроки отчётности и авто-отправляет через оператора
 * Запускается ежедневно в 09:00
 */
export async function checkAndSendReports() {
  const settings = await prisma.edoSettings.findFirst();
  if (!settings?.orgInn) return;

  const now     = new Date();
  const year    = now.getFullYear();
  const month   = now.getMonth() + 1; // 1-12
  const day     = now.getDate();

  const reporter = new AutoReportingService({
    konturApiKey: process.env.KONTUR_API_KEY,
    inn:          settings.orgInn,
    kpp:          settings.orgKpp ?? undefined,
  });

  const mchD = await prisma.mchDRecord.findFirst({
    where: { principalInn: settings.orgInn, status: 'active' },
  });

  // УСН: авансовые платежи
  // Q1 → до 28 апреля, Q2 → до 28 июля, Q3 → до 28 октября
  // Годовая декларация → до 28 апреля следующего года
  const isUsnDeadline = (
    (month === 4  && day >= 25 && day <= 28) ||  // Q1 аванс
    (month === 7  && day >= 25 && day <= 28) ||  // Q2 аванс
    (month === 10 && day >= 25 && day <= 28) ||  // Q3 аванс
    (month === 4  && day === 28 && now.getMonth() === 3)  // Годовая
  );

  if (isUsnDeadline && ['USN_INCOME', 'USN_INCOME_MINUS'].includes(settings.taxSystem ?? '')) {
    // Проверить не отправлялась ли уже
    const alreadySent = await prisma.autoReport.findFirst({
      where: {
        type:   'USN_DECLARATION',
        year,
        status: { in: ['SENT', 'ACCEPTED'] },
      },
    });

    if (!alreadySent) {
      console.info('[Scheduler] Автоотправка декларации УСН...');
      try {
        const from = new Date(year, 0, 1);
        const to   = new Date(year, 11, 31);
        const entries = await prisma.kudirEntry.findMany({ where: { entryDate: { gte: from, lte: to } } });
        const revenue  = entries.reduce((s: number, e: any) => s + Number(e.income  ?? 0), 0);
        const expenses = entries.reduce((s: number, e: any) => s + Number(e.expense ?? 0), 0);
        const taxRate  = settings.taxSystem === 'USN_INCOME_MINUS' ? 15 : 6;
        const taxAmount = settings.taxSystem === 'USN_INCOME'
          ? revenue * taxRate / 100
          : Math.max(0, revenue - expenses) * taxRate / 100;

        const result = await reporter.sendUsnDeclaration({
          year, orgName: settings.orgName ?? '', inn: settings.orgInn,
          kpp: settings.orgKpp ?? undefined, okato: '45000000',
          taxSystem: (settings.taxSystem ?? 'USN_INCOME') as any,
          revenue, expenses, taxRate, taxAmount,
          advancePaid: 0, insurance: 49500,
          mchDId: mchD?.mchDId,
        });

        await prisma.autoReport.create({
          data: {
            type: 'USN_DECLARATION', status: result.status as any,
            year, operator: result.operator,
            trackingId: result.trackingId ?? null,
            message:    result.message ?? null,
            sentAt:     result.sentAt ?? null,
          },
        });

        // Уведомить администратора
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN', pushToken: { not: null } },
          select: { id: true },
        });
        for (const admin of admins) {
          const u = await prisma.user.findUnique({ where: { id: admin.id }, select: { pushToken: true } });
          if (u?.pushToken) await sendPush(
            u.pushToken,
            result.status === 'SENT' ? '✅ Декларация отправлена' : '⚠️ Ошибка отправки',
            `УСН за ${year}: ${result.message ?? result.status}`,
          );
        }

        console.info('[Scheduler] Декларация УСН:', result.status);
      } catch (e) {
        console.error('[Scheduler] Ошибка авто-отчётности:', e);
      }
    }
  }
}
