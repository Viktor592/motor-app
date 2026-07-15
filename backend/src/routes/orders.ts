import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { io } from '../index';

export const ordersRouter = Router();

// GET /api/v1/orders — список заказов клиента или персонала
ordersRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};

    if (req.user!.role === 'CLIENT') {
      where.clientId = req.user!.userId;
    } else if (req.user!.role === 'MASTER') {
      where.staffId = req.user!.userId;
    }
    // ADMIN и RECEPTIONIST видят все

    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          client:  { select: { name: true, phoneMasked: true } },
          vehicle: true,
          slot:    { include: { post: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    // Скрыть закупочные цены от клиента
    const sanitized = orders.map(o => ({
      ...o,
      totalCost: req.user!.role === 'CLIENT' ? undefined : o.totalCost,
    }));

    res.json({ orders: sanitized, total, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/orders/:id
ordersRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        client:   { select: { name: true, phoneMasked: true } },
        vehicle:  true,
        slot:     { include: { post: true, master: { select: { id: true, name: true } } } },
        items:    true,
        messages: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
    });

    if (!order) throw new AppError(404, 'Заказ не найден');

    // Клиент видит только свои
    if (req.user!.role === 'CLIENT' && order.clientId !== req.user!.userId) {
      throw new AppError(403, 'Нет доступа');
    }

    res.json({
      ...order,
      totalCost: req.user!.role === 'CLIENT' ? undefined : order.totalCost,
      aiDiagResult: req.user!.role === 'CLIENT' ? undefined : order.aiDiagResult,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/orders/:id/status — обновить статус (мастер/приёмщик)
ordersRouter.patch(
  '/:id/status',
  authenticate,
  authorize('MASTER', 'RECEPTIONIST', 'ADMIN'),
  async (req, res, next) => {
    try {
      const { status } = z.object({
        status: z.enum(['ASSESSED', 'CONFIRMED', 'IN_PROGRESS', 'READY', 'CLOSED', 'CANCELLED']),
      }).parse(req.body);

      const order = await prisma.order.update({
        where: { id: req.params.id },
        data:  { status: status as any },
        include: { client: { select: { id: true, pushToken: true, name: true } } },
      });

      // Уведомить клиента через Socket.IO
      io.to(`user:${order.clientId}`).emit('order:status', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      });

      // Push-уведомление
      const { notifyOrderStatusChange } = await import('../services/notifications');
      await notifyOrderStatusChange(order.id, status);

      res.json({ status: order.status, orderNumber: order.orderNumber });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/orders/:id/items — добавить доп. работу к заказу, который уже в работе
ordersRouter.post('/:id/items', authenticate, authorize('MASTER', 'RECEPTIONIST', 'ADMIN'), async (req, res, next) => {
  try {
    const body = z.object({
      name:        z.string().min(2).max(200),
      qty:         z.number().int().min(1).default(1),
      retailPrice: z.number().min(0),
      type:        z.enum(['WORK', 'PART']).default('WORK'),
    }).parse(req.body);

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError(404, 'Заказ не найден');
    if (order.status !== 'IN_PROGRESS') throw new AppError(400, 'Добавлять позиции можно только в заказ, который в работе');

    const item = await prisma.orderItem.create({
      data: {
        orderId:     order.id,
        type:        body.type,
        name:        body.name,
        qty:         body.qty,
        costPrice:   0,
        retailPrice: body.retailPrice,
        markup:      0,
      },
    });

    const addSum = body.qty * body.retailPrice;
    const updated = await prisma.order.update({
      where: { id: order.id },
      data:  { totalRetail: Number(order.totalRetail ?? 0) + addSum },
    });

    io.to(`user:${order.clientId}`).emit('order:status', {
      orderId: order.id, orderNumber: order.orderNumber, status: order.status,
    });

    res.status(201).json({ item, totalRetail: updated.totalRetail });
  } catch (e) { next(e); }
});
