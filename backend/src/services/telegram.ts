/**
 * МОТОР — Telegram-бот (бесплатно, через Telegraf)
 *
 * Установка: npm install telegraf
 *
 * Функции:
 *  - Уведомления клиентам о статусах заказов
 *  - Уведомления мастерам о новых заказах
 *  - Команды для мастеров: /orders /status
 *  - OTP через бот (альтернатива email)
 *
 * Настройка:
 *  TELEGRAM_BOT_TOKEN=123:ABC...  (создать через @BotFather)
 */

import { prisma } from '../utils/prisma';

let bot: any = null;

export async function initTelegramBot(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('[Telegram] TELEGRAM_BOT_TOKEN не задан — бот отключён');
    return;
  }

  try {
    const { Telegraf } = require('telegraf');
    bot = new Telegraf(token);

    // ── /start — привязка аккаунта ──────────────────────────────────────
    bot.start(async (ctx: any) => {
      const chatId   = String(ctx.chat.id);
      const username = ctx.from?.username ?? ctx.from?.first_name ?? 'неизвестно';

      await ctx.reply(
        `👋 Привет, ${username}!\n\n` +
        `Это бот автосервиса *МОТОР*.\n\n` +
        `Для привязки аккаунта введи свой номер телефона в формате:\n` +
        `\`+79001234567\``,
        { parse_mode: 'Markdown' }
      );
    });

    // ── Привязка по номеру телефона ─────────────────────────────────────
    bot.hears(/^\+7\d{10}$/, async (ctx: any) => {
      const phone  = ctx.message.text;
      const chatId = String(ctx.chat.id);

      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        return ctx.reply('❌ Пользователь с таким номером не найден.\nСначала зарегистрируйтесь в приложении.');
      }

      // Привязать telegram chat_id как pushToken
      await prisma.user.update({
        where: { id: user.id },
        data:  { pushToken: `tg:${chatId}` },
      });

      await ctx.reply(
        `✅ *Аккаунт привязан!*\n\n` +
        `Имя: ${user.name}\n` +
        `Роль: ${user.role}\n\n` +
        `Теперь вы будете получать уведомления о заказах здесь.`,
        { parse_mode: 'Markdown' }
      );
    });

    // ── /orders — список активных заказов (для мастеров) ───────────────
    bot.command('orders', async (ctx: any) => {
      const chatId = `tg:${ctx.chat.id}`;
      const user   = await prisma.user.findFirst({ where: { pushToken: chatId } });

      if (!user) return ctx.reply('❌ Аккаунт не привязан. Введите /start');
      if (!['MASTER', 'RECEPTIONIST', 'ADMIN'].includes(user.role)) {
        return ctx.reply('❌ Команда только для персонала');
      }

      const orders = await prisma.order.findMany({
        where:   { staffId: user.id, status: { in: ['NEW', 'CONFIRMED', 'IN_PROGRESS', 'READY'] } },
        include: { vehicle: true, client: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
        take:    10,
      });

      if (!orders.length) return ctx.reply('📋 Нет активных заказов');

      const STATUS_E: Record<string, string> = {
        NEW: '🔵', CONFIRMED: '🟡', IN_PROGRESS: '🟠', READY: '🟢',
      };

      const text = orders.map(o =>
        `${STATUS_E[o.status] ?? '⚪'} *${o.orderNumber}*\n` +
        `${o.vehicle.brand} ${o.vehicle.model} · ${o.vehicle.year}\n` +
        `Клиент: ${(o.client as any)?.name ?? '—'}`
      ).join('\n\n');

      ctx.reply(`📋 *Ваши активные заказы:*\n\n${text}`, { parse_mode: 'Markdown' });
    });

    // ── /status [номер заказа] ──────────────────────────────────────────
    bot.command('status', async (ctx: any) => {
      const args    = ctx.message.text.split(' ');
      const orderNo = args[1];

      if (!orderNo) return ctx.reply('Использование: /status ЗН-2025-XXXX');

      const order = await prisma.order.findFirst({
        where:   { orderNumber: orderNo },
        include: { vehicle: true, items: true },
      });

      if (!order) return ctx.reply(`❌ Заказ ${orderNo} не найден`);

      const statusLabels: Record<string, string> = {
        NEW: 'Новый', ASSESSED: 'Оценён', CONFIRMED: 'Подтверждён',
        IN_PROGRESS: 'В работе', READY: 'Готов', CLOSED: 'Закрыт', CANCELLED: 'Отменён',
      };

      ctx.reply(
        `📋 *${order.orderNumber}*\n\n` +
        `Статус: *${statusLabels[order.status] ?? order.status}*\n` +
        `Авто: ${order.vehicle.brand} ${order.vehicle.model} ${order.vehicle.year}\n` +
        (order.totalRetail ? `Сумма: ${Number(order.totalRetail).toLocaleString('ru')} ₽\n` : '') +
        `Позиций: ${order.items.length}`,
        { parse_mode: 'Markdown' }
      );
    });

    // ── /help ───────────────────────────────────────────────────────────
    bot.command('help', async (ctx: any) => {
      ctx.reply(
        `🤖 *МОТОР — Команды бота*\n\n` +
        `+79001234567 — привязать аккаунт\n` +
        `/orders — мои активные заказы\n` +
        `/status ЗН-2025-XXXX — статус заказа\n` +
        `/help — список команд\n\n` +
        `_Уведомления о статусах приходят автоматически_`,
        { parse_mode: 'Markdown' }
      );
    });

    // Запуск polling — не должен ронять весь сервер при невалидном токене
    bot.launch().then(() => {
      console.log('[Telegram] Бот запущен');
    }).catch(err => {
      console.error('[Telegram] Не удалось запустить бота:', err.message ?? err);
    });

    // Graceful stop
    process.once('SIGINT',  () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

  } catch (e: any) {
    if (e.message?.includes('Cannot find module')) {
      console.warn('[Telegram] telegraf не установлен: npm install telegraf');
    } else {
      console.error('[Telegram] Ошибка:', e.message);
    }
  }
}

/**
 * Отправить сообщение в Telegram напрямую (без бота)
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  }).catch(() => {});
}
