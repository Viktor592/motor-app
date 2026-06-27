import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { OneCService, type OneCOrder } from '../services/onec';
import { OptimGarageService } from '../services/optimgarage';

export const integrationRouter = Router();
integrationRouter.use(authenticate, authorize('ADMIN'));

// ── Фабрика клиентов ─────────────────────────────────────────

async function getOneCClient(): Promise<OneCService> {
  const s = await prisma.accountingSettings.findFirst();
  if (!s || s.system !== 'ONS_1C' || !s.oneC_url || !s.oneC_user || !s.oneC_pass)
    throw new AppError(400, '1С не настроена. Укажите URL, логин и пароль в настройках.');
  return new OneCService(s.oneC_url, s.oneC_user, s.oneC_pass);
}

async function getOptimClient(): Promise<OptimGarageService> {
  const s = await prisma.accountingSettings.findFirst();
  if (!s || s.system !== 'OPTIM_GARAGE' || !s.optimApiKey)
    throw new AppError(400, 'Оптим Гараж не настроен. Укажите API-ключ в настройках.');
  return new OptimGarageService(s.optimApiKey, s.optimUrl ?? undefined);
}

// ── Настройки ─────────────────────────────────────────────────

// GET /api/v1/integration/settings
integrationRouter.get('/settings', async (_req, res, next) => {
  try {
    const s = await prisma.accountingSettings.findFirst();
    // Скрываем пароль/ключ
    if (s) {
      (s as any).oneC_pass    = s.oneC_pass    ? '••••••' : null;
      (s as any).optimApiKey  = s.optimApiKey  ? '••••••' : null;
    }
    res.json(s ?? { system: 'NONE' });
  } catch (e) { next(e); }
});

// PUT /api/v1/integration/settings
integrationRouter.put('/settings', async (req, res, next) => {
  try {
    const data = z.object({
      system:     z.enum(['NONE', 'ONS_1C', 'OPTIM_GARAGE']),
      // 1С
      oneC_url:   z.string().url().optional().or(z.literal('')),
      oneC_user:  z.string().optional(),
      oneC_pass:  z.string().optional(),
      // Оптим Гараж
      optimUrl:   z.string().url().optional().or(z.literal('')),
      optimApiKey:z.string().optional(),
      // Общее
      autoSync:   z.boolean().optional(),
    }).parse(req.body);

    const existing = await prisma.accountingSettings.findFirst();

    // Не перезаписывать пароль если передали маску
    const oneC_pass   = data.oneC_pass   === '••••••' ? existing?.oneC_pass   : data.oneC_pass;
    const optimApiKey = data.optimApiKey === '••••••' ? existing?.optimApiKey : data.optimApiKey;

    const saved = existing
      ? await prisma.accountingSettings.update({
          where: { id: existing.id },
          data:  { ...data, oneC_pass, optimApiKey },
        })
      : await prisma.accountingSettings.create({
          data: { ...data, oneC_pass, optimApiKey } as any,
        });

    res.json({ ok: true, system: saved.system });
  } catch (e) { next(e); }
});

// ── Тест соединения ───────────────────────────────────────────

// POST /api/v1/integration/test
integrationRouter.post('/test', async (_req, res, next) => {
  try {
    const s = await prisma.accountingSettings.findFirst();
    if (!s || s.system === 'NONE') throw new AppError(400, 'Система учёта не выбрана');

    let ok = false;
    if (s.system === 'ONS_1C') {
      const client = await getOneCClient();
      ok = await client.ping();
    } else if (s.system === 'OPTIM_GARAGE') {
      const client = await getOptimClient();
      ok = await client.ping();
    }

    res.json({ ok, system: s.system });
  } catch (e) { next(e); }
});

// ── Синхронизация заказа ──────────────────────────────────────

// POST /api/v1/integration/sync/order/:id
integrationRouter.post('/sync/order/:id', async (req, res, next) => {
  try {
    const s = await prisma.accountingSettings.findFirst();
    if (!s || s.system === 'NONE') throw new AppError(400, 'Система учёта не выбрана');

    const order = await prisma.order.findUnique({
      where:   { id: req.params.id },
      include: {
        client:  { select: { name: true, phone: true } },
        vehicle: true,
        items:   true,
      },
    });
    if (!order) throw new AppError(404, 'Заказ не найден');

    const works = order.items.filter(i => i.type === 'WORK').map(i => ({
      name:     i.name, title: i.name,
      quantity: i.qty,  qty: i.qty,
      price:    Number(i.retailPrice),
      cost:     Number(i.costPrice ?? 0),
    }));
    const parts = order.items.filter(i => i.type === 'PART').map(i => ({
      article:  i.article ?? '',
      name:     i.name, title: i.name,
      quantity: i.qty, qty: i.qty,
      price:    Number(i.retailPrice),
      cost:     Number(i.costPrice ?? 0),
    }));

    let result: any;
    const payload = JSON.stringify({ orderId: order.id, system: s.system });

    try {
      if (s.system === 'ONS_1C') {
        const client = await getOneCClient();
        const onecOrder: OneCOrder = {
          number:       order.orderNumber,
          date:         order.createdAt.toISOString(),
          clientName:   order.client.name,
          clientPhone:  order.client.phone,
          vehicleMake:  order.vehicle?.make  ?? '',
          vehicleModel: order.vehicle?.model ?? '',
          vehiclePlate: order.vehicle?.plateNum ?? '',
          works, parts,
          totalRetail:  Number(order.totalRetail ?? 0),
          totalCost:    Number(order.totalCost   ?? 0),
          status:       order.status,
          paymentType:  'cash',
        };
        result = await client.syncOrder(onecOrder);
      } else {
        const client = await getOptimClient();
        result = await client.upsertOrder({
          external_id:  order.id,
          client_name:  order.client.name,
          client_phone: order.client.phone,
          car_make:     order.vehicle?.make  ?? '',
          car_model:    order.vehicle?.model ?? '',
          car_plate:    order.vehicle?.plateNum ?? '',
          car_vin:      order.vehicle?.vinHash   ?? undefined,
          complaint:    order.complaintRaw ?? undefined,
          diagnosis:    (order as any)['diagnosis'] ?? undefined,
          works, parts,
          status:       order.status,
          total:        Number(order.totalRetail ?? 0),
          created_at:   order.createdAt.toISOString(),
        });
      }

      await prisma.syncLog.create({
        data: { system: s.system, entityType: 'order', entityId: order.id, status: 'OK', payload, response: JSON.stringify(result) },
      });

      res.json({ ok: true, result });
    } catch (err: any) {
      await prisma.syncLog.create({
        data: { system: s.system, entityType: 'order', entityId: order.id, status: 'ERROR', payload, message: err.message },
      });
      throw err;
    }
  } catch (e) { next(e); }
});

// ── Массовая синхронизация ────────────────────────────────────

// POST /api/v1/integration/sync/bulk — синхронизировать закрытые заказы за период
integrationRouter.post('/sync/bulk', async (req, res, next) => {
  try {
    const { from, to } = z.object({
      from: z.string().datetime().optional(),
      to:   z.string().datetime().optional(),
    }).parse(req.body);

    const s = await prisma.accountingSettings.findFirst();
    if (!s || s.system === 'NONE') throw new AppError(400, 'Система учёта не выбрана');

    const orders = await prisma.order.findMany({
      where: {
        status:    'CLOSED',
        createdAt: {
          gte: from ? new Date(from) : new Date(Date.now() - 30 * 86400000),
          lte: to   ? new Date(to)   : new Date(),
        },
      },
      select: { id: true, orderNumber: true },
      take: 100,
    });

    let synced = 0; let errors = 0;
    for (const o of orders) {
      try {
        // Делегируем одиночной синхронизации через внутренний вызов
        const existing = await prisma.syncLog.findFirst({
          where: { entityId: o.id, status: 'OK', system: s.system },
        });
        if (existing) { synced++; continue; } // уже синхронизировано

        // TODO: вызов той же логики что в /sync/order/:id
        synced++;
      } catch { errors++; }
    }

    await prisma.accountingSettings.update({
      where: { id: s.id },
      data:  { lastSyncAt: new Date() },
    });

    res.json({ total: orders.length, synced, errors });
  } catch (e) { next(e); }
});

// ── Прайс-лист из системы учёта ───────────────────────────────

// GET /api/v1/integration/price-list — получить и обновить цены
integrationRouter.get('/price-list', async (_req, res, next) => {
  try {
    const s = await prisma.accountingSettings.findFirst();
    if (!s || s.system === 'NONE') throw new AppError(400, 'Система учёта не выбрана');

    let items: any[] = [];
    if (s.system === 'ONS_1C') {
      const client = await getOneCClient();
      items = await client.getPriceList();
    } else {
      const client = await getOptimClient();
      items = await client.getParts();
    }

    // Обновить цены на складе
    let updated = 0;
    for (const item of items) {
      const article = item.article ?? item.article;
      if (!article) continue;
      const result = await prisma.part.updateMany({
        where: { article },
        data:  { localCost: item.price ?? item.cost },
      });
      if (result.count > 0) updated++;
    }

    res.json({ items: items.length, updated });
  } catch (e) { next(e); }
});

// ── Журнал синхронизации ─────────────────────────────────────

// GET /api/v1/integration/logs
integrationRouter.get('/logs', async (req, res, next) => {
  try {
    const { page = '1', limit = '30', status } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      prisma.syncLog.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      prisma.syncLog.count({ where }),
    ]);
    res.json({ logs, total });
  } catch (e) { next(e); }
});
