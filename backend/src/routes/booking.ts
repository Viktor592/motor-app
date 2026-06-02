import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { generateOrderNumber } from '../utils/orderNumber';
import { notifyStaff } from '../services/notifications';

export const bookingRouter = Router();

// GET /api/v1/booking/slots?date=2025-06-10&type=MECHANIC
bookingRouter.get('/slots', authenticate, async (req, res, next) => {
  try {
    const { date, type } = z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      type: z.enum(['MECHANIC', 'ELECTRICIAN', 'DIAGNOSTICS']),
    }).parse(req.query);

    const from = new Date(date + 'T00:00:00.000Z');
    const to   = new Date(date + 'T23:59:59.999Z');

    const slots = await prisma.calendarSlot.findMany({
      where: {
        post: { type: type as any },
        startAt: { gte: from, lte: to },
        isBooked: false,
      },
      include: { post: true, master: { select: { id: true, name: true } } },
      orderBy: { startAt: 'asc' },
    });

    res.json(slots);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/booking/available-dates?type=MECHANIC
bookingRouter.get('/available-dates', authenticate, async (req, res, next) => {
  try {
    const { type } = z.object({
      type: z.enum(['MECHANIC', 'ELECTRICIAN', 'DIAGNOSTICS']),
    }).parse(req.query);

    const now = new Date();
    const in14 = new Date(now.getTime() + 14 * 86400_000);

    const slots = await prisma.calendarSlot.findMany({
      where: {
        post: { type: type as any },
        startAt: { gte: now, lte: in14 },
        isBooked: false,
      },
      select: { startAt: true },
      distinct: ['startAt'],
    });

    // Уникальные даты
    const dates = [...new Set(slots.map(s =>
      s.startAt.toISOString().slice(0, 10)
    ))];

    res.json(dates);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/booking — создать запись
bookingRouter.post('/', authenticate, authorize('CLIENT'), async (req, res, next) => {
  try {
    const body = z.object({
      specialistType: z.enum(['MECHANIC', 'ELECTRICIAN', 'DIAGNOSTICS']),
      vehicleId:      z.string().uuid(),
      slotId:         z.string().uuid(),
      complaint:      z.string().min(10).max(2000),
    }).parse(req.body);

    // Проверить, что слот ещё свободен
    const slot = await prisma.calendarSlot.findUnique({ where: { id: body.slotId } });
    if (!slot || slot.isBooked) {
      throw new AppError(409, 'Выбранный слот уже занят');
    }

    // Проверить авто принадлежит клиенту
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: body.vehicleId, clientId: req.user!.userId },
    });
    if (!vehicle) throw new AppError(404, 'Автомобиль не найден');

    // Транзакция: создать заказ + заблокировать слот
    const order = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.create({
        data: {
          orderNumber:    generateOrderNumber(),
          clientId:       req.user!.userId,
          vehicleId:      body.vehicleId,
          slotId:         body.slotId,
          specialistType: body.specialistType as any,
          complaintRaw:   body.complaint,
          status:         'NEW',
        },
        include: { vehicle: true, slot: { include: { post: true } } },
      });

      await tx.calendarSlot.update({
        where: { id: body.slotId },
        data:  { isBooked: true },
      });

      return ord;
    });

    // Уведомить персонал
    await notifyStaff(order);

    res.status(201).json({
      order: {
        id:          order.id,
        orderNumber: order.orderNumber,
        status:      order.status,
        slot:        order.slot,
        vehicle:     order.vehicle,
      },
      message: 'Запись создана. СМС с подтверждением отправлено.',
    });
  } catch (err) {
    next(err);
  }
});
