import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { invalidateTenantCache } from '../middleware/tenant';
import { sendPush } from '../services/push';

export const saasRouter = Router();

// ══════════════════════════════════════
// ПЛАНЫ И ЛИМИТЫ
// ══════════════════════════════════════

export const PLANS = {
  TRIAL:    { maxMasters: 1,  maxOrdersPerMonth: 50,   priceRub: 0,     name: 'Пробный'  },
  STARTER:  { maxMasters: 2,  maxOrdersPerMonth: 300,  priceRub: 25000, name: 'Старт'    },
  PRO:      { maxMasters: 5,  maxOrdersPerMonth: 1000, priceRub: 35000, name: 'Профи'    },
  BUSINESS: { maxMasters: 15, maxOrdersPerMonth: 5000, priceRub: 45000, name: 'Бизнес'   },
  ENTERPRISE:{ maxMasters: 99, maxOrdersPerMonth: 9999, priceRub: 55000, name: 'Корпорат' },
} as const;

// ══════════════════════════════════════
// ПУБЛИЧНЫЙ ОНБОРДИНГ
// ══════════════════════════════════════

// POST /api/v1/saas/register — регистрация нового автосервиса
saasRouter.post('/register', async (req, res, next) => {
  try {
    const data = z.object({
      name:        z.string().min(3).max(100),
      ownerName:   z.string().min(2),
      ownerEmail:  z.string().email(),
      ownerPhone:  z.string().min(7).optional(),
      slug:        z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Только строчные латинские буквы, цифры и дефис'),
      timezone:    z.string().default('Europe/Moscow'),
    }).parse(req.body);

    // Проверить уникальность
    const [slugExists, emailExists] = await Promise.all([
      prisma.tenant.findUnique({ where: { slug: data.slug } }),
      prisma.tenant.findUnique({ where: { ownerEmail: data.ownerEmail } }),
    ]);
    if (slugExists)  throw new AppError(409, `Адрес "${data.slug}" уже занят`);
    if (emailExists) throw new AppError(409, 'Этот email уже зарегистрирован');

    // Создать тенант + владельца в транзакции
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 14);

    const result = await prisma.$transaction(async tx => {
      // Тенант
      const tenant = await tx.tenant.create({
        data: {
          slug:        data.slug,
          name:        data.name,
          ownerEmail:  data.ownerEmail,
          ownerPhone:  data.ownerPhone,
          plan:        'TRIAL',
          status:      'TRIAL',
          trialEndsAt: trialEnds,
          timezone:    data.timezone,
        },
      });

      // Пользователь-владелец
      const owner = await tx.user.create({
        data: {
          name:     data.ownerName,
          email:    data.ownerEmail,
          phoneMasked: (data.ownerPhone ?? '').replace(/\d(?=\d{4})/g,'*'),
          phone:    data.ownerPhone,
          role:     'ADMIN',
        } as any,
      });

      // Привязка
      await tx.tenantUser.create({
        data: { tenantId: tenant.id, userId: owner.id, role: 'OWNER' },
      });

      return { tenant, owner };
    });

    res.status(201).json({
      ok:      true,
      tenantId: result.tenant.id,
      slug:     result.tenant.slug,
      url:      `https://${data.slug}.${process.env.BASE_DOMAIN ?? 'motor-app.ru'}`,
      trialEndsAt: trialEnds,
      message: `Добро пожаловать! Пробный период — 14 дней. URL: ${data.slug}.motor-app.ru`,
    });
  } catch (e) { next(e); }
});

// GET /api/v1/saas/check-slug?slug=motor-spb
saasRouter.get('/check-slug', async (req, res, next) => {
  try {
    const { slug } = z.object({ slug: z.string().min(3) }).parse(req.query);
    const exists = await prisma.tenant.findUnique({ where: { slug } });
    res.json({ available: !exists });
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// УПРАВЛЕНИЕ СВОИМ АККАУНТОМ
// ══════════════════════════════════════

// GET /api/v1/saas/me — инфо о своём тенанте
saasRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { tenantId: true } as any,
    });
    if (!user?.tenantId) throw new AppError(404, 'Тенант не найден');

    const tenant = await prisma.tenant.findUnique({
      where: { id: (user as any).tenantId } as any,
      include: { subscription: { include: { payments: { orderBy: { createdAt: 'desc' }, take: 5 } } } },
    });

    // Текущие лимиты
    const plan = PLANS[tenant!.plan];
    const mastersCount = await prisma.user.count({ where: { tenantId: (user as any).tenantId, role: 'MASTER' } as any });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const ordersThisMonth = await prisma.order.count({ where: { createdAt: { gte: monthStart }, clientId: { in: [] } } as any });

    // Дней до конца триала
    let trialDaysLeft: number | null = null;
    if (tenant!.status === 'TRIAL' && tenant!.trialEndsAt) {
      trialDaysLeft = Math.max(0, Math.floor((tenant!.trialEndsAt.getTime() - Date.now()) / 86400000));
    }

    res.json({
      tenant,
      plan,
      usage: {
        masters:      mastersCount,
        maxMasters:   plan.maxMasters,
        orders:       ordersThisMonth,
        maxOrders:    plan.maxOrdersPerMonth,
      },
      trialDaysLeft,
    });
  } catch (e) { next(e); }
});

// PATCH /api/v1/saas/me/branding — обновить брендинг
saasRouter.patch('/me/branding', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { tenantId: true } as any });
    if (!user?.tenantId) throw new AppError(404, 'Тенант не найден');

    const data = z.object({
      name:         z.string().min(3).optional(),
      logoUrl:      z.string().url().optional(),
      primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
      domain:       z.string().optional(),
    }).parse(req.body);

    const tenant = await prisma.tenant.update({
      where: { id: (user as any).tenantId } as any,
      data,
    });
    invalidateTenantCache(tenant.slug);

    res.json({ ok: true, tenant });
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// БИЛЛИНГ — ЮКасса
// ══════════════════════════════════════

// POST /api/v1/saas/billing/upgrade — сменить тариф / создать подписку
saasRouter.post('/billing/upgrade', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { plan } = z.object({
      plan: z.enum(['STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE']),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { tenantId: true } as any });
    if (!user?.tenantId) throw new AppError(404, 'Тенант не найден');

    const planInfo = PLANS[plan];

    // Создать платёж в ЮКассе
    const yukassaPayment = await createYukassaPayment({
      amount:      planInfo.priceRub,
      description: `МОТОР — тариф ${planInfo.name} (1 месяц)`,
      metadata:    { tenantId: (user as any).tenantId, plan },
      returnUrl:   `https://${process.env.BASE_DOMAIN}/billing/success`,
    });

    res.json({
      paymentId:     yukassaPayment.id,
      confirmUrl:    yukassaPayment.confirmation.confirmation_url,
      amount:        planInfo.priceRub,
      plan:          planInfo.name,
    });
  } catch (e) { next(e); }
});

// POST /api/v1/saas/billing/webhook — вебхук от ЮКассы
saasRouter.post('/billing/webhook', async (req, res, next) => {
  try {
    const event = req.body;
    if (event.event !== 'payment.succeeded') return res.json({ ok: true });

    const { tenantId, plan } = event.object.metadata ?? {};
    if (!tenantId || !plan) return res.json({ ok: true });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } as any });
    if (!tenant) return res.json({ ok: true });

    const paidUntil = new Date();
    paidUntil.setMonth(paidUntil.getMonth() + 1);

    // Обновляем тенант
    await prisma.$transaction(async tx => {
      await tx.tenant.update({
        where: { id: tenantId } as any,
        data:  { plan, status: 'ACTIVE', paidUntil },
      });

      // Создаём / обновляем подписку
      const sub = await tx.subscription.upsert({
        where: { tenantId } as any,
        update: { plan, status: 'ACTIVE', priceRub: PLANS[plan as keyof typeof PLANS].priceRub, currentPeriodEnd: paidUntil },
        create: { tenantId, plan, status: 'ACTIVE', priceRub: PLANS[plan as keyof typeof PLANS].priceRub, currentPeriodEnd: paidUntil },
      });

      await tx.payment.create({
        data: {
          subscriptionId: sub.id,
          amountRub:      Math.round(parseFloat(event.object.amount.value)),
          status:         'succeeded',
          yukassaId:      event.object.id,
          paidAt:         new Date(),
        },
      });
    });

    invalidateTenantCache(tenant.slug);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// GET /api/v1/saas/billing/plans — список тарифов
saasRouter.get('/billing/plans', async (_req, res) => {
  res.json(
    Object.entries(PLANS).filter(([k]) => k !== 'TRIAL').map(([id, p]) => ({
      id, ...p,
      features: getPlanFeatures(id as keyof typeof PLANS),
    }))
  );
});

// ══════════════════════════════════════
// SUPER-ADMIN (Антропик/владелец SaaS)
// ══════════════════════════════════════

// GET /api/v1/saas/admin/tenants
saasRouter.get('/admin/tenants', authenticate, async (req, res, next) => {
  try {
    // Только super-admin (env переменная)
    if (req.user!.userId !== process.env.SUPER_ADMIN_ID) throw new AppError(403, 'Forbidden');

    const { page = '1', status } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * 20;
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({ where, skip, take: 20, orderBy: { createdAt: 'desc' }, include: { subscription: true } }),
      prisma.tenant.count({ where }),
    ]);

    const mrr = await prisma.subscription.aggregate({
      where:  { status: 'ACTIVE' },
      _sum:   { priceRub: true },
    });

    res.json({ tenants, total, mrr: mrr._sum.priceRub ?? 0 });
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// ХЕЛПЕРЫ
// ══════════════════════════════════════

async function createYukassaPayment(opts: {
  amount: number; description: string;
  metadata: Record<string, string>; returnUrl: string;
}) {
  const shopId  = process.env.YUKASSA_SHOP_ID;
  const secret  = process.env.YUKASSA_SECRET_KEY;

  if (!shopId || !secret) {
    // Mock для разработки
    return { id: 'mock_' + Date.now(), confirmation: { confirmation_url: opts.returnUrl + '?mock=1' } };
  }

  const resp = await fetch('https://api.yookassa.ru/v3/payments', {
    method:  'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secret}`).toString('base64'),
      'Content-Type':  'application/json',
      'Idempotence-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({
      amount:       { value: opts.amount.toFixed(2), currency: 'RUB' },
      capture:      true,
      confirmation: { type: 'redirect', return_url: opts.returnUrl },
      description:  opts.description,
      metadata:     opts.metadata,
      save_payment_method: true,
    }),
  });

  if (!resp.ok) throw new AppError(502, 'Ошибка платёжной системы');
  return resp.json() as any;
}

function getPlanFeatures(plan: keyof typeof PLANS): string[] {
  const base = ['Заказ-наряды', 'Клиентская база', 'Telegram-бот', 'Онлайн-запись'];
  switch (plan) {
    case 'STARTER':   return [...base, 'До 2 мастеров', 'AI-приёмщик', 'Аналитика', 'PWA'];
    case 'PRO':       return [...base, 'До 5 мастеров', 'Все AI-агенты', 'Склад', 'Финансы', 'Лояльность'];
    case 'BUSINESS':  return [...base, 'До 15 мастеров', 'ЭДО и ФНС', 'Онлайн-касса', '1С/Оптим Гараж', 'Push-уведомления'];
    case 'ENTERPRISE':return [...base, 'Без лимитов', 'Все функции', 'White-label', 'API', 'SLA 99.9%', 'Выделенный менеджер'];
    default:          return base;
  }
}
