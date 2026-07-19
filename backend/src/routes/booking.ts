import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { sendPushToUser } from '../services/notifications';

export const bookingRouter = Router();

async function resolveStaffTenantId(req: any): Promise<string | null> {
  if (req.tenantId) return req.tenantId;
  const tu = await prisma.tenantUser.findFirst({ where: { userId: req.user!.userId } });
  return tu?.tenantId ?? null;
}

// GET /api/v1/booking/slots?date=2024-01-15&serviceType=MECHANIC
bookingRouter.get('/slots', async (req, res, next) => {
  try {
    const { date, serviceType } = z.object({
      date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      serviceType: z.string().optional(),
    }).parse(req.query);

    const dayStart = new Date(date + 'T00:00:00');
    const dayEnd   = new Date(date + 'T23:59:59');

    const existing = await prisma.booking.findMany({
      where: {
        tenantId:    req.tenantId ?? undefined,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status:      { notIn: ['CANCELLED'] },
        ...(serviceType ? { serviceType } : {}),
      },
      select: { scheduledAt: true, durationMin: true },
    });

    const slots: { time: string; available: boolean; datetime: string }[] = [];
    const now = new Date();

    for (let hour = 9; hour < 19; hour++) {
      for (const min of [0, 30]) {
        const timeStr = `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
        const dt      = new Date(`${date}T${timeStr}:00`);

        if (dt <= now) {
          slots.push({ time: timeStr, available: false, datetime: dt.toISOString() });
          continue;
        }

        const busy = existing.some(e => {
          const eStart  = new Date(e.scheduledAt).getTime();
          const eEnd    = eStart + (e.durationMin ?? 60) * 60000;
          const slotEnd = dt.getTime() + 60 * 60000;
          return dt.getTime() < eEnd && slotEnd > eStart;
        });

        slots.push({ time: timeStr, available: !busy, datetime: dt.toISOString() });
      }
    }

    res.json({ date, slots });
  } catch (e) { next(e); }
});

// POST /api/v1/booking/public — создать запись без авторизации
bookingRouter.post('/public', optionalAuth, async (req, res, next) => {
  try {
    const data = z.object({
      clientName:   z.string().min(2),
      clientPhone:  z.string().min(7),
      serviceType:  z.string(),
      description:  z.string().optional(),
      vehicleMake:  z.string().optional(),
      vehicleModel: z.string().optional(),
      vehiclePlate: z.string().optional(),
      scheduledAt:  z.string().datetime(),
    }).parse(req.body);

    const slotStart = new Date(data.scheduledAt);
    const slotEnd   = new Date(slotStart.getTime() + 60 * 60000);

    const conflict = await prisma.booking.findFirst({
      where: {
        tenantId:    req.tenantId ?? undefined,
        scheduledAt: { gte: slotStart, lt: slotEnd },
        status:      { notIn: ['CANCELLED'] },
        serviceType: data.serviceType,
      },
    });
    if (conflict) throw new AppError(409, 'Выбранное время уже занято');

    const booking = await prisma.booking.create({
      data: {
        tenantId:     req.tenantId ?? null,
        clientName:   data.clientName,
        clientPhone:  data.clientPhone,
        userId:       req.user?.role === 'CLIENT' ? req.user.userId : null,
        serviceType:  data.serviceType,
        description:  data.description ?? null,
        vehicleMake:  data.vehicleMake ?? null,
        vehicleModel: data.vehicleModel ?? null,
        vehiclePlate: data.vehiclePlate ?? null,
        scheduledAt:  slotStart,
        durationMin:  60,
        status:       'PENDING',
        source:       'WIDGET',
      },
    });

    const staff = await prisma.user.findMany({
      where:  { role: { in: ['RECEPTIONIST', 'ADMIN'] }, pushToken: { not: null } },
      select: { id: true },
    });
    await Promise.allSettled(staff.map(u =>
      sendPushToUser(u.id, '📅 Новая запись с сайта',
        `${data.clientName} · ${slotStart.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`)
    ));

    res.status(201).json({ ok: true, bookingId: booking.id, message: 'Запись принята! Мы свяжемся с вами для подтверждения.' });
  } catch (e) { next(e); }
});

// GET /api/v1/booking — список записей
bookingRouter.get('/', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const tenantId = await resolveStaffTenantId(req);
    const { date, status, page = '1', limit = '30' } = req.query as Record<string, string>;
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (status) where.status = status;
    if (date) {
      const d = new Date(date);
      where.scheduledAt = {
        gte: new Date(new Date(d).setHours(0,0,0,0)),
        lte: new Date(new Date(d).setHours(23,59,59,999)),
      };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({ where, skip, take: parseInt(limit), orderBy: { scheduledAt: 'asc' } }),
      prisma.booking.count({ where }),
    ]);
    res.json({ bookings, total });
  } catch (e) { next(e); }
});

// PATCH /api/v1/booking/:id/status
bookingRouter.patch('/:id/status', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { status, masterId } = z.object({
      status:   z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
      masterId: z.string().uuid().optional(),
    }).parse(req.body);

    const tenantId = await resolveStaffTenantId(req);
    const existing = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'Запись не найдена');
    if (tenantId && existing.tenantId && existing.tenantId !== tenantId) {
      throw new AppError(403, 'Эта запись принадлежит другому автосервису');
    }

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data:  { status, ...(masterId ? { masterId } : {}) },
    });

    if (booking.userId && status === 'CONFIRMED') {
      const dt = new Date(booking.scheduledAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
      await sendPushToUser(booking.userId, '✅ Запись подтверждена', dt);
    }

    res.json(booking);
  } catch (e) { next(e); }
});

// POST /api/v1/booking/:id/convert — конвертировать запись в заказ
bookingRouter.post('/:id/convert', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const tenantId = await resolveStaffTenantId(req);
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) throw new AppError(404, 'Запись не найдена');
    if (tenantId && booking.tenantId && booking.tenantId !== tenantId) {
      throw new AppError(403, 'Эта запись принадлежит другому автосервису');
    }

    let client = await prisma.user.findFirst({ where: { phone: booking.clientPhone } });
    if (!client) {
      client = await prisma.user.create({
        data: { phone: booking.clientPhone, phoneMasked: booking.clientPhone.replace(/\d(?=\d{4})/g,'*'), name: booking.clientName, role: 'CLIENT' },
      });
    }

    let vehicleId: string | undefined;
    if (booking.vehiclePlate) {
      const vehicle = await prisma.vehicle.upsert({
        where:  { id: '_nonexistent_' }, // placeholder — логика ниже
        update: {},
        create: { clientId: client.id, brand: booking.vehicleMake ?? '', model: booking.vehicleModel ?? '', year: 0, plateNum: booking.vehiclePlate ?? null },
      });
      vehicleId = vehicle.id;
    }

    const lastOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' }, select: { orderNumber: true } });
    const nextNum   = lastOrder ? parseInt(lastOrder.orderNumber) + 1 : 1000;

    const order = await prisma.order.create({
      data: {
        orderNumber: String(nextNum), clientId: client.id,
        vehicleId: vehicleId ?? '', specialistType: booking.serviceType as any,
        complaintRaw: booking.description ?? '', status: 'NEW',
      },
    });

    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'COMPLETED' } });

    res.status(201).json({ ok: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (e) { next(e); }
});

// PATCH /api/v1/booking/slots/:id/shift — сдвинуть время слота в графике поста
// (например, работа затянулась и нужно сдвинуть учёт занятости на посту)
bookingRouter.patch('/slots/:id/shift', authenticate, authorize('MASTER', 'RECEPTIONIST', 'ADMIN'), async (req, res, next) => {
  try {
    const { minutes } = z.object({ minutes: z.number().int().min(-240).max(240) }).parse(req.body);

    const slot = await prisma.calendarSlot.findUnique({ where: { id: req.params.id } });
    if (!slot) throw new AppError(404, 'Слот не найден');

    const newStart = new Date(slot.startAt.getTime() + minutes * 60000);
    const newEnd   = new Date(slot.endAt.getTime()   + minutes * 60000);

    const conflict = await prisma.calendarSlot.findFirst({
      where: {
        postId: slot.postId,
        id: { not: slot.id },
        isBooked: true,
        startAt: { lt: newEnd },
        endAt:   { gt: newStart },
      },
    });
    if (conflict) throw new AppError(409, 'На этом посту уже есть запись в новом временном окне');

    const updated = await prisma.calendarSlot.update({
      where: { id: slot.id },
      data:  { startAt: newStart, endAt: newEnd },
    });

    res.json({ ok: true, slot: updated });
  } catch (e) { next(e); }
});

// GET /api/v1/booking/mine — мои записи (для авторизованного клиента)
bookingRouter.get('/mine', authenticate, authorize('CLIENT'), async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where:   { userId: req.user!.userId },
      orderBy: { scheduledAt: 'desc' },
    });
    res.json({ bookings });
  } catch (e) { next(e); }
});
