import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sendPushToUser } from '../services/notifications';

export const loyaltyRouter = Router();

const POINTS_PER_RUB     = 0.05;   // 1 балл за 20 ₽
const POINTS_TO_RUB      = 0.5;    // 1 балл = 0.5 ₽
const REFERRAL_BONUS     = 500;    // баллов рефереру
const REFERRAL_NEW_BONUS = 300;    // баллов новому клиенту
const MIN_REDEEM         = 100;    // минимум баллов для списания
const MAX_REDEEM_PCT     = 30;     // максимум 30% суммы заказа

// ── Баланс баллов ─────────────────────────────────────────────

async function getUserBalance(userId: string): Promise<number> {
  const result = await prisma.loyaltyTransaction.aggregate({
    where:  { userId },
    _sum:   { points: true },
  });
  return Math.max(0, result._sum.points ?? 0);
}

// GET /api/v1/loyalty/balance — мой баланс
loyaltyRouter.get('/balance', authenticate, async (req, res, next) => {
  try {
    const balance = await getUserBalance(req.user!.userId);
    const history = await prisma.loyaltyTransaction.findMany({
      where:   { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take:    20,
    });
    res.json({ balance, rubles: Math.round(balance * POINTS_TO_RUB), history });
  } catch (e) { next(e); }
});

// GET /api/v1/loyalty/balance/:userId — баланс клиента (персонал)
loyaltyRouter.get('/balance/:userId', authenticate, authorize('ADMIN','RECEPTIONIST'), async (req, res, next) => {
  try {
    const balance = await getUserBalance(req.params.userId);
    res.json({ balance, rubles: Math.round(balance * POINTS_TO_RUB) });
  } catch (e) { next(e); }
});

// ── Начисление / списание ─────────────────────────────────────

// POST /api/v1/loyalty/earn — начислить за заказ (вызывается при закрытии)
loyaltyRouter.post('/earn', authenticate, authorize('ADMIN','RECEPTIONIST'), async (req, res, next) => {
  try {
    const { userId, orderId, amountRub } = z.object({
      userId:    z.string().uuid(),
      orderId:   z.string().uuid(),
      amountRub: z.number().positive(),
    }).parse(req.body);

    // Проверить не начислялось ли уже
    const exists = await prisma.loyaltyTransaction.findFirst({
      where: { orderId, type: 'EARN' },
    });
    if (exists) throw new AppError(409, 'Баллы за этот заказ уже начислены');

    const points = Math.floor(amountRub * POINTS_PER_RUB);
    if (points <= 0) return res.json({ points: 0, message: 'Сумма слишком мала' });

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // сгорают через год

    await prisma.loyaltyTransaction.create({
      data: {
        userId,
        type:        'EARN',
        points,
        orderId,
        description: `Начисление за заказ`,
        expiresAt,
      },
    });

    // Push клиенту
    await sendPushToUser(userId, `🎁 +${points} баллов`, `Начислено за визит. Баланс: ${await getUserBalance(userId)} б.`);

    res.json({ points, balance: await getUserBalance(userId) });
  } catch (e) { next(e); }
});

// POST /api/v1/loyalty/redeem — списать баллы при оплате
loyaltyRouter.post('/redeem', authenticate, authorize('ADMIN','RECEPTIONIST'), async (req, res, next) => {
  try {
    const { userId, orderId, points, orderTotal } = z.object({
      userId:     z.string().uuid(),
      orderId:    z.string().uuid(),
      points:     z.number().int().positive(),
      orderTotal: z.number().positive(),
    }).parse(req.body);

    if (points < MIN_REDEEM) throw new AppError(400, `Минимум ${MIN_REDEEM} баллов для списания`);

    const balance = await getUserBalance(userId);
    if (balance < points) throw new AppError(400, `Недостаточно баллов: ${balance} < ${points}`);

    const maxRedeem = Math.floor(orderTotal * MAX_REDEEM_PCT / 100 / POINTS_TO_RUB);
    if (points > maxRedeem) throw new AppError(400, `Можно списать максимум ${maxRedeem} баллов (${MAX_REDEEM_PCT}% от суммы)`);

    const discount = Math.round(points * POINTS_TO_RUB);

    await prisma.loyaltyTransaction.create({
      data: {
        userId,
        type:        'REDEEM',
        points:      -points,
        orderId,
        description: `Списание за заказ. Скидка: ${discount} ₽`,
      },
    });

    res.json({ pointsRedeemed: points, discount, newBalance: balance - points });
  } catch (e) { next(e); }
});

// POST /api/v1/loyalty/promo — ручное промо-начисление
loyaltyRouter.post('/promo', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { userId, points, description } = z.object({
      userId:      z.string().uuid(),
      points:      z.number().int().positive().max(10000),
      description: z.string().min(3),
    }).parse(req.body);

    await prisma.loyaltyTransaction.create({
      data: { userId, type: 'PROMO', points, description },
    });

    res.json({ ok: true, newBalance: await getUserBalance(userId) });
  } catch (e) { next(e); }
});

// ── Реферальная программа ─────────────────────────────────────

// POST /api/v1/loyalty/referral — зарегистрировать реферала
loyaltyRouter.post('/referral', authenticate, async (req, res, next) => {
  try {
    const { referralCode } = z.object({ referralCode: z.string().uuid() }).parse(req.body);

    const referrer = await prisma.user.findUnique({ where: { id: referralCode } });
    if (!referrer) throw new AppError(404, 'Реферальный код не найден');
    if (referrer.id === req.user!.userId) throw new AppError(400, 'Нельзя использовать собственный код');

    const existing = await prisma.referral.findUnique({ where: { refereeId: req.user!.userId } });
    if (existing) throw new AppError(409, 'Реферальный код уже использован');

    await prisma.$transaction([
      prisma.referral.create({
        data: { referrerId: referrer.id, refereeId: req.user!.userId, bonusPoints: REFERRAL_BONUS },
      }),
      prisma.loyaltyTransaction.create({
        data: { userId: referrer.id, type: 'REFERRAL', points: REFERRAL_BONUS, description: `Реферал: новый клиент` },
      }),
      prisma.loyaltyTransaction.create({
        data: { userId: req.user!.userId, type: 'REFERRAL', points: REFERRAL_NEW_BONUS, description: 'Приветственный бонус' },
      }),
    ]);

    await sendPushToUser(referrer.id, `🎉 +${REFERRAL_BONUS} баллов`, 'По вашей реферальной ссылке зарегистрировался новый клиент!');

    res.json({ ok: true, bonusPoints: REFERRAL_NEW_BONUS });
  } catch (e) { next(e); }
});

// GET /api/v1/loyalty/referral-code — получить свой реферальный код
loyaltyRouter.get('/referral-code', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { id: true, name: true } });
    if (!user) throw new AppError(404, 'Пользователь не найден');
    // Реферальный код = userId (UUID)
    const link = `${process.env.APP_URL ?? 'https://motor-app.ru'}/register?ref=${user.id}`;
    res.json({ code: user.id, link });
  } catch (e) { next(e); }
});

// ── Напоминания о ТО ──────────────────────────────────────────

// GET /api/v1/loyalty/reminders — мои напоминания
loyaltyRouter.get('/reminders', authenticate, async (req, res, next) => {
  try {
    const reminders = await prisma.toReminder.findMany({
      where:   { userId: req.user!.userId },
      orderBy: { dueDate: 'asc' },
    });
    res.json(reminders);
  } catch (e) { next(e); }
});

// POST /api/v1/loyalty/reminders — создать напоминание (персонал)
loyaltyRouter.post('/reminders', authenticate, authorize('ADMIN','RECEPTIONIST','MASTER'), async (req, res, next) => {
  try {
    const data = z.object({
      vehicleId:  z.string().uuid(),
      userId:     z.string().uuid(),
      type:       z.enum(['oil_change','tire_rotation','inspection','brake_fluid','coolant','timing_belt','other']),
      dueDate:    z.string().datetime(),
      dueMileage: z.number().int().optional(),
    }).parse(req.body);

    const reminder = await prisma.toReminder.create({ data: { ...data, dueDate: new Date(data.dueDate) } });

    // Push сразу если дата через 7 дней
    const daysUntil = Math.floor((new Date(data.dueDate).getTime() - Date.now()) / 86400000);
    if (daysUntil <= 7) {
      const typeLabels: Record<string, string> = {
        oil_change: 'замена масла', tire_rotation: 'ротация шин',
        inspection: 'плановый ТО', brake_fluid: 'тормозная жидкость',
        coolant: 'антифриз', timing_belt: 'ремень ГРМ', other: 'обслуживание',
      };
      await sendPushToUser(data.userId, '🔧 Напоминание о ТО',
        `Через ${daysUntil} дн. — ${typeLabels[data.type] ?? data.type}`);
    }

    res.status(201).json(reminder);
  } catch (e) { next(e); }
});

// ── Scheduler: проверка напоминаний ──────────────────────────
// Вызывается из scheduler.ts каждое утро
export async function processDueReminders() {
  const soon = new Date();
  soon.setDate(soon.getDate() + 3); // напомнить за 3 дня

  const due = await prisma.toReminder.findMany({
    where: { dueDate: { lte: soon }, isSent: false },
    take:  100,
  });

  const typeLabels: Record<string, string> = {
    oil_change: 'Замена масла', tire_rotation: 'Ротация шин',
    inspection: 'Плановый ТО', brake_fluid: 'Тормозная жидкость',
    coolant: 'Антифриз', timing_belt: 'Ремень ГРМ', other: 'Обслуживание',
  };

  for (const r of due) {
    const daysLeft = Math.max(0, Math.floor((r.dueDate.getTime() - Date.now()) / 86400000));
    const label    = typeLabels[r.type] ?? r.type;
    await sendPushToUser(r.userId, `🔧 ${label}`,
      daysLeft === 0 ? 'Сегодня!' : `Через ${daysLeft} ${daysLeft === 1 ? 'день' : 'дня'}`);

    await prisma.toReminder.update({ where: { id: r.id }, data: { isSent: true, sentAt: new Date() } });
  }

  return due.length;
}
