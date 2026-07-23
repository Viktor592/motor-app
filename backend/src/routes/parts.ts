import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const partsRouter = Router();

async function withRetailPrice<T extends { category: string; localCost: any }>(parts: T[]) {
  const rules = await prisma.priceRule.findMany();
  const rulesMap = Object.fromEntries(rules.map(r => [r.category, r.markupPct]));
  return parts.map(p => ({
    ...p,
    retailPrice: Math.round(Number(p.localCost ?? 0) * (1 + (rulesMap[p.category] ?? 30) / 100)),
  }));
}

// GET /api/v1/parts?q=фильтр&category=OIL_FILTERS
partsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { q, category, page = '1', limit = '20' } = req.query as Record<string, string>;
    const where: any = {};
    if (q) where.OR = [
      { name:    { contains: q, mode: 'insensitive' } },
      { article: { contains: q, mode: 'insensitive' } },
    ];
    if (category) where.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [parts, total] = await Promise.all([
      prisma.part.findMany({ where, skip, take: parseInt(limit), orderBy: { name: 'asc' } }),
      prisma.part.count({ where }),
    ]);

    const withPrices = await withRetailPrice(parts);
    // Скрыть закупочные цены от клиентов
    const sanitized = req.user!.role === 'CLIENT'
      ? withPrices.map(p => ({ ...p, localCost: undefined }))
      : withPrices;

    res.json({ parts: sanitized, total });
  } catch (e) { next(e); }
});

// GET /api/v1/parts/:article
partsRouter.get('/:article', authenticate, async (req, res, next) => {
  try {
    const part = await prisma.part.findUnique({ where: { article: req.params.article } });
    if (!part) throw new AppError(404, 'Запчасть не найдена');
    if (req.user!.role === 'CLIENT') {
      const { localCost: _, ...safe } = part as any;
      return res.json(safe);
    }
    res.json(part);
  } catch (e) { next(e); }
});

// GET /api/v1/parts/price-rules — только персонал
partsRouter.get('/admin/price-rules', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const rules = await prisma.priceRule.findMany({ orderBy: { category: 'asc' } });
    res.json(rules);
  } catch (e) { next(e); }
});

// PATCH /api/v1/parts/admin/price-rules/:category — только админ
partsRouter.patch('/admin/price-rules/:category', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { markupPct } = z.object({ markupPct: z.number().int().min(0).max(500) }).parse(req.body);
    const rule = await prisma.priceRule.upsert({
      where:  { category: req.params.category as any },
      update: { markupPct, updatedBy: req.user!.userId },
      create: { category: req.params.category as any, markupPct, updatedBy: req.user!.userId },
    });
    // Аудит
    await prisma.priceAuditLog.create({ data: {
      itemName:   `Правило: ${req.params.category}`,
      costPrice:  0, retailPrice: 0,
      markupPct:  markupPct,
      performedBy: req.user!.userId,
    }});
    res.json(rule);
  } catch (e) { next(e); }
});

// POST /api/v1/parts/order — клиент оформляет заказ на запчасти
partsRouter.post('/order', authenticate, authorize('CLIENT'), async (req, res, next) => {
  try {
    const body = z.object({
      vehicleId: z.string().uuid(),
      items: z.array(z.object({
        partId: z.string().uuid(),
        qty:    z.number().int().min(1).max(50),
      })).min(1).max(30),
    }).parse(req.body);

    const vehicle = await prisma.vehicle.findFirst({ where: { id: body.vehicleId, clientId: req.user!.userId } });
    if (!vehicle) throw new AppError(404, 'Автомобиль не найден');

    const parts = await prisma.part.findMany({ where: { id: { in: body.items.map(i => i.partId) } } });
    const rules = await prisma.priceRule.findMany();
    const rulesMap = Object.fromEntries(rules.map(r => [r.category, r.markupPct]));

    let totalRetail = 0, totalCost = 0;
    const itemsData = body.items.map(i => {
      const part = parts.find(p => p.id === i.partId);
      if (!part) throw new AppError(400, 'Одна из запчастей больше не доступна');
      const markupPct = rulesMap[part.category] ?? 30;
      const cost   = Number(part.localCost ?? 0);
      const retail = Math.round(cost * (1 + markupPct / 100));
      totalRetail += retail * i.qty;
      totalCost   += cost * i.qty;
      return {
        type: 'PART' as const, name: part.name, article: part.article,
        qty: i.qty, costPrice: cost, retailPrice: retail, markup: markupPct,
      };
    });

    const lastOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' }, select: { orderNumber: true } });
    const nextNum   = lastOrder ? parseInt(lastOrder.orderNumber) + 1 : 1000;

    const order = await prisma.order.create({
      data: {
        orderNumber: String(nextNum), clientId: req.user!.userId, vehicleId: vehicle.id,
        specialistType: 'PARTS', complaintRaw: 'Заказ запчастей через приложение',
        status: 'NEW', totalRetail, totalCost,
        items: { create: itemsData },
      },
    });

    res.status(201).json({ ok: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (e) { next(e); }
});
