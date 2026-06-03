import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { searchSupplier } from '../services/suppliers';

export const warehouseRouter = Router();

// ══════════════════════════════════════
// ОСТАТКИ НА СКЛАДЕ
// ══════════════════════════════════════

// GET /api/v1/warehouse/stock — список запчастей с остатками
warehouseRouter.get('/stock', authenticate, authorize('ADMIN', 'RECEPTIONIST', 'MASTER'), async (req, res, next) => {
  try {
    const { q, category, lowStock, page = '1', limit = '30' } = req.query as Record<string, string>;

    const where: any = {};
    if (q) where.OR = [
      { name:    { contains: q, mode: 'insensitive' } },
      { article: { contains: q, mode: 'insensitive' } },
    ];
    if (category) where.category = category;
    if (lowStock === 'true') where.localStock = { lte: 3 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { name: 'asc' },
        include: {
          reservations: { where: { isActive: true } },
        },
      }),
      prisma.part.count({ where }),
    ]);

    const result = parts.map(p => ({
      ...p,
      reserved: p.reservations.reduce((sum, r) => sum + r.qty, 0),
      available: p.localStock - p.reservations.filter(r => r.isActive).reduce((sum, r) => sum + r.qty, 0),
      reservations: undefined,
    }));

    res.json({ parts: result, total });
  } catch (e) { next(e); }
});

// GET /api/v1/warehouse/stock/:partId/movements — история движений
warehouseRouter.get('/stock/:partId/movements', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: { partId: req.params.partId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { supplier: { select: { name: true } } },
    });
    res.json(movements);
  } catch (e) { next(e); }
});

// POST /api/v1/warehouse/stock/adjustment — инвентаризация / ручная корректировка
warehouseRouter.post('/stock/adjustment', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { partId, qty, comment } = z.object({
      partId:  z.string().uuid(),
      qty:     z.number().int(),
      comment: z.string().optional(),
    }).parse(req.body);

    const part = await prisma.part.findUnique({ where: { id: partId } });
    if (!part) throw new AppError(404, 'Запчасть не найдена');

    const diff = qty - part.localStock;

    await prisma.$transaction([
      prisma.part.update({
        where: { id: partId },
        data: { localStock: qty },
      }),
      prisma.stockMovement.create({
        data: {
          partId,
          type: 'ADJUSTMENT',
          qty: diff,
          comment: comment ?? 'Инвентаризация',
          performedBy: req.user!.userId,
        },
      }),
    ]);

    res.json({ ok: true, newStock: qty });
  } catch (e) { next(e); }
});

// POST /api/v1/warehouse/stock/receive — приём товара от поставщика
warehouseRouter.post('/stock/receive', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { items, supplierId, supplierOrderId } = z.object({
      supplierId:      z.string().uuid().optional(),
      supplierOrderId: z.string().uuid().optional(),
      items: z.array(z.object({
        partId:    z.string().uuid(),
        qty:       z.number().int().positive(),
        costPrice: z.number().positive(),
      })),
    }).parse(req.body);

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.part.update({
          where: { id: item.partId },
          data: {
            localStock: { increment: item.qty },
            localCost:  item.costPrice,
          },
        });
        await tx.stockMovement.create({
          data: {
            partId:     item.partId,
            type:       'IN',
            qty:        item.qty,
            costPrice:  item.costPrice,
            supplierId: supplierId ?? null,
            performedBy: req.user!.userId,
          },
        });
      }

      // Отметить позиции заказа поставщику как полученные
      if (supplierOrderId) {
        const partIds = items.map(i => i.partId);
        await tx.supplierOrderItem.updateMany({
          where: { supplierOrderId, partId: { in: partIds } },
          data:  { isReceived: true },
        });
        // Если все получены — закрыть заказ
        const remaining = await tx.supplierOrderItem.count({
          where: { supplierOrderId, isReceived: false },
        });
        if (remaining === 0) {
          await tx.supplierOrder.update({
            where: { id: supplierOrderId },
            data:  { status: 'DELIVERED' },
          });
        }
      }
    });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// РЕЗЕРВИРОВАНИЕ ПОД ЗАКАЗЫ
// ══════════════════════════════════════

// POST /api/v1/warehouse/reserve — зарезервировать запчасти под заказ
warehouseRouter.post('/reserve', authenticate, authorize('ADMIN', 'RECEPTIONIST', 'MASTER'), async (req, res, next) => {
  try {
    const { orderId, items } = z.object({
      orderId: z.string().uuid(),
      items: z.array(z.object({
        partId: z.string().uuid(),
        qty:    z.number().int().positive(),
      })),
    }).parse(req.body);

    const results: any[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const part = await tx.part.findUnique({
          where:   { id: item.partId },
          include: { reservations: { where: { isActive: true } } },
        });
        if (!part) throw new AppError(404, `Запчасть ${item.partId} не найдена`);

        const reserved = part.reservations.reduce((s, r) => s + r.qty, 0);
        const available = part.localStock - reserved;

        if (available < item.qty) {
          results.push({
            partId: item.partId,
            name: part.name,
            requested: item.qty,
            available,
            ok: false,
          });
          continue;
        }

        await tx.stockReservation.create({
          data: { partId: item.partId, orderId, qty: item.qty },
        });
        await tx.stockMovement.create({
          data: {
            partId:     item.partId,
            type:       'RESERVE',
            qty:        -item.qty,
            orderId,
            performedBy: req.user!.userId,
          },
        });
        results.push({ partId: item.partId, name: part.name, qty: item.qty, ok: true });
      }
    });

    res.json({ results });
  } catch (e) { next(e); }
});

// DELETE /api/v1/warehouse/reserve/:orderId — снять резерв (при отмене/закрытии)
warehouseRouter.delete('/reserve/:orderId', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const reservations = await prisma.stockReservation.findMany({
      where: { orderId: req.params.orderId, isActive: true },
    });

    await prisma.$transaction(async (tx) => {
      for (const res_ of reservations) {
        await tx.stockReservation.update({
          where: { id: res_.id },
          data:  { isActive: false },
        });
        await tx.stockMovement.create({
          data: {
            partId:     res_.partId,
            type:       'UNRESERVE',
            qty:        res_.qty,
            orderId:    req.params.orderId,
            performedBy: req.user!.userId,
          },
        });
      }
    });

    res.json({ ok: true, released: reservations.length });
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// ПОСТАВЩИКИ
// ══════════════════════════════════════

// GET /api/v1/warehouse/suppliers
warehouseRouter.get('/suppliers', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where:   { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(suppliers);
  } catch (e) { next(e); }
});

// POST /api/v1/warehouse/suppliers
warehouseRouter.post('/suppliers', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const data = z.object({
      name:   z.string().min(2),
      type:   z.enum(['EXIST', 'AUTODOC', 'MANUAL']).default('MANUAL'),
      apiKey: z.string().optional(),
      apiUrl: z.string().optional(),
      phone:  z.string().optional(),
      email:  z.string().email().optional(),
    }).parse(req.body);

    const supplier = await prisma.supplier.create({ data });
    res.status(201).json(supplier);
  } catch (e) { next(e); }
});

// GET /api/v1/warehouse/suppliers/search?article=...&supplierId=...
// Поиск запчасти у поставщика по артикулу
warehouseRouter.get('/suppliers/search', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { article, supplierId } = z.object({
      article:    z.string().min(3),
      supplierId: z.string().uuid(),
    }).parse(req.query);

    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new AppError(404, 'Поставщик не найден');

    const results = await searchSupplier(supplier, article);
    res.json(results);
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// ЗАКАЗЫ ПОСТАВЩИКАМ
// ══════════════════════════════════════

// GET /api/v1/warehouse/supplier-orders
warehouseRouter.get('/supplier-orders', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const orders = await prisma.supplierOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        supplier: { select: { name: true } },
        items:    true,
      },
    });
    res.json(orders);
  } catch (e) { next(e); }
});

// POST /api/v1/warehouse/supplier-orders — создать заказ поставщику
warehouseRouter.post('/supplier-orders', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { supplierId, items, comment } = z.object({
      supplierId: z.string().uuid(),
      comment:    z.string().optional(),
      items: z.array(z.object({
        article:   z.string(),
        name:      z.string(),
        qty:       z.number().int().positive(),
        costPrice: z.number().positive(),
        partId:    z.string().uuid().optional(),
      })),
    }).parse(req.body);

    const total = items.reduce((s, i) => s + i.qty * i.costPrice, 0);

    const order = await prisma.supplierOrder.create({
      data: {
        supplierId,
        comment,
        totalCost: total,
        createdBy: req.user!.userId,
        items: { create: items },
      },
      include: { items: true, supplier: { select: { name: true } } },
    });

    res.status(201).json(order);
  } catch (e) { next(e); }
});

// PATCH /api/v1/warehouse/supplier-orders/:id/status
warehouseRouter.patch('/supplier-orders/:id/status', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { status } = z.object({
      status: z.enum(['DRAFT', 'SENT', 'CONFIRMED', 'DELIVERED', 'CANCELLED']),
    }).parse(req.body);

    const order = await prisma.supplierOrder.update({
      where: { id: req.params.id },
      data:  { status },
    });
    res.json(order);
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// АВТО-ЗАКАЗ при нехватке
// ══════════════════════════════════════

// GET /api/v1/warehouse/low-stock — запчасти с низким остатком
warehouseRouter.get('/low-stock', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.threshold as string ?? '3');

    const parts = await prisma.part.findMany({
      where: { localStock: { lte: threshold } },
      orderBy: { localStock: 'asc' },
      include: {
        reservations: { where: { isActive: true } },
      },
    });

    const result = parts.map(p => ({
      ...p,
      reserved:  p.reservations.reduce((s, r) => s + r.qty, 0),
      available: p.localStock - p.reservations.reduce((s, r) => s + r.qty, 0),
      needsOrder: true,
      suggestedQty: Math.max(10 - p.localStock, 1),
      reservations: undefined,
    }));

    res.json(result);
  } catch (e) { next(e); }
});

// POST /api/v1/warehouse/auto-order — создать черновик заказа по нехватке
warehouseRouter.post('/auto-order', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { supplierId, threshold = 3 } = z.object({
      supplierId: z.string().uuid(),
      threshold:  z.number().int().default(3),
    }).parse(req.body);

    const lowParts = await prisma.part.findMany({
      where: { localStock: { lte: threshold }, localCost: { not: null } },
    });

    if (lowParts.length === 0) {
      return res.json({ message: 'Нет позиций с низким остатком', created: false });
    }

    const total = lowParts.reduce((s, p) => {
      const qty = Math.max(10 - p.localStock, 1);
      return s + qty * Number(p.localCost ?? 0);
    }, 0);

    const order = await prisma.supplierOrder.create({
      data: {
        supplierId,
        comment:   `Авто-заказ. Порог: ${threshold} шт.`,
        totalCost: total,
        createdBy: req.user!.userId,
        items: {
          create: lowParts.map(p => ({
            partId:    p.id,
            article:   p.article,
            name:      p.name,
            qty:       Math.max(10 - p.localStock, 1),
            costPrice: p.localCost ?? 0,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json({ created: true, order });
  } catch (e) { next(e); }
});
