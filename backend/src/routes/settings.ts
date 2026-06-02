import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const settingsRouter = Router();
settingsRouter.use(authenticate, authorize('ADMIN'));

// ── Настройки хранятся в простой JSON-таблице ────────────────────────────────
// Используем PriceAuditLog как KV-хранилище (без новой миграции)
// В продакшене — отдельная таблица ServiceSettings

const SETTINGS_KEY_PREFIX = '__setting__';

async function getSetting(key: string): Promise<any> {
  const row = await prisma.priceAuditLog.findFirst({
    where:   { itemName: SETTINGS_KEY_PREFIX + key },
    orderBy: { createdAt: 'desc' },
  });
  if (!row) return null;
  try { return JSON.parse(row.performedBy); } catch { return null; }
}

async function setSetting(key: string, value: any): Promise<void> {
  await prisma.priceAuditLog.create({
    data: {
      itemName:    SETTINGS_KEY_PREFIX + key,
      costPrice:   0,
      retailPrice: 0,
      markupPct:   0,
      performedBy: JSON.stringify(value),
    },
  });
}

// GET /api/v1/settings
settingsRouter.get('/', async (_req, res, next) => {
  try {
    const [service, hours, notifications] = await Promise.all([
      getSetting('service'),
      getSetting('hours'),
      getSetting('notifications'),
    ]);

    res.json({
      service:       service ?? { name: 'МОТОР', city: '', phone: '', address: '' },
      hours:         hours   ?? { start: 9, end: 20, workDays: [1,2,3,4,5,6] },
      notifications: notifications ?? { newOrdersToTelegram: true, statusToClient: true, dailyReport: false },
    });
  } catch (e) { next(e); }
});

// PATCH /api/v1/settings/service
settingsRouter.patch('/service', async (req, res, next) => {
  try {
    const body = z.object({
      name:    z.string().min(2).max(100),
      city:    z.string().max(100).optional(),
      phone:   z.string().optional(),
      address: z.string().max(200).optional(),
      website: z.string().url().optional().or(z.literal('')),
    }).parse(req.body);

    await setSetting('service', body);
    res.json(body);
  } catch (e) { next(e); }
});

// PATCH /api/v1/settings/hours
settingsRouter.patch('/hours', async (req, res, next) => {
  try {
    const body = z.object({
      start:    z.number().int().min(0).max(23),
      end:      z.number().int().min(1).max(24),
      workDays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    }).parse(req.body);

    await setSetting('hours', body);
    res.json(body);
  } catch (e) { next(e); }
});

// PATCH /api/v1/settings/notifications
settingsRouter.patch('/notifications', async (req, res, next) => {
  try {
    const body = z.object({
      newOrdersToTelegram: z.boolean(),
      statusToClient:      z.boolean(),
      dailyReport:         z.boolean(),
    }).parse(req.body);

    await setSetting('notifications', body);
    res.json(body);
  } catch (e) { next(e); }
});

// ── Управление постами ────────────────────────────────────────────────────────

// GET /api/v1/settings/posts
settingsRouter.get('/posts', async (_req, res, next) => {
  try {
    const posts = await prisma.post.findMany({ orderBy: { name: 'asc' } });
    res.json(posts);
  } catch (e) { next(e); }
});

// POST /api/v1/settings/posts
settingsRouter.post('/posts', async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2),
      type: z.enum(['MECHANIC', 'ELECTRICIAN', 'DIAGNOSTICS']),
    }).parse(req.body);

    const post = await prisma.post.create({ data: body as any });
    res.status(201).json(post);
  } catch (e) { next(e); }
});

// PATCH /api/v1/settings/posts/:id
settingsRouter.patch('/posts/:id', async (req, res, next) => {
  try {
    const body = z.object({
      name:     z.string().min(2).optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body);

    const post = await prisma.post.update({ where: { id: req.params.id }, data: body });
    res.json(post);
  } catch (e) { next(e); }
});

// DELETE /api/v1/settings/posts/:id
settingsRouter.delete('/posts/:id', async (req, res, next) => {
  try {
    const slots = await prisma.calendarSlot.count({
      where: { postId: req.params.id, isBooked: true },
    });
    if (slots > 0) throw new AppError(409, 'Есть забронированные слоты. Сначала завершите заказы.');

    await prisma.calendarSlot.deleteMany({ where: { postId: req.params.id, isBooked: false } });
    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
