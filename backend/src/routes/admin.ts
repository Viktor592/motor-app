import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { maskPhone } from '../utils/maskPhone';

export const adminRouter = Router();

// Все admin роуты требуют ADMIN
adminRouter.use(authenticate, authorize('ADMIN', 'RECEPTIONIST'));

// ── Дашборд статистики ────────────────────────────────────
adminRouter.get('/stats', async (_req, res, next) => {
  try {
    const [
      totalOrders, newOrders, inProgress, readyOrders,
      totalRevenue, totalClients, todayOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'NEW' } }),
      prisma.order.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.order.count({ where: { status: 'READY' } }),
      prisma.order.aggregate({ _sum: { totalRetail: true }, where: { status: 'CLOSED' } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    res.json({
      orders: { total: totalOrders, new: newOrders, inProgress, ready: readyOrders, today: todayOrders },
      revenue: { total: Number(totalRevenue._sum.totalRetail ?? 0) },
      clients: { total: totalClients },
    });
  } catch (e) { next(e); }
});

// ── Правила ценообразования ───────────────────────────────
adminRouter.get('/price-rules', async (_req, res, next) => {
  try {
    const rules = await prisma.priceRule.findMany({ orderBy: { category: 'asc' } });
    res.json(rules);
  } catch (e) { next(e); }
});

adminRouter.patch('/price-rules/:category', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { markupPct } = z.object({
      markupPct: z.number().int().min(0).max(500),
    }).parse(req.body);

    const rule = await prisma.priceRule.upsert({
      where:  { category: req.params.category as any },
      update: { markupPct, updatedBy: req.user!.userId },
      create: { category: req.params.category as any, markupPct, updatedBy: req.user!.userId },
    });

    await prisma.priceAuditLog.create({
      data: {
        itemName:    `Правило: ${req.params.category}`,
        costPrice:   0, retailPrice: 0,
        markupPct,
        performedBy: req.user!.userId,
      },
    });

    res.json(rule);
  } catch (e) { next(e); }
});

// ── Аудит лог ценообразования ─────────────────────────────
adminRouter.get('/price-audit', authorize('ADMIN'), async (req, res, next) => {
  try {
    const logs = await prisma.priceAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (e) { next(e); }
});

// ── Список пользователей ──────────────────────────────────
adminRouter.get('/users', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { role, page = '1', q } = req.query as Record<string, string>;
    const where: any = {};
    if (role) where.role = role;
    if (q) where.OR = [
      { name:  { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
    ];

    const skip = (parseInt(page) - 1) * 30;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, phoneMasked: true,
          role: true, isActive: true, createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: 30,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total });
  } catch (e) { next(e); }
});

// ── Создать сотрудника (мастер / приёмщик) ────────────────
adminRouter.post('/staff', authorize('ADMIN'), async (req, res, next) => {
  try {
    let tenantId = req.tenantId;
    if (!tenantId) {
      const tu = await prisma.tenantUser.findFirst({ where: { userId: req.user!.userId } });
      tenantId = tu?.tenantId;
    }
    if (!tenantId) throw new AppError(400, 'Тенант не определён');

    const body = z.object({
      phone:    z.string().regex(/^\+7\d{10}$/, 'Формат: +7XXXXXXXXXX'),
      name:     z.string().min(2).max(100),
      password: z.string().min(6),
      role:     z.enum(['MASTER', 'RECEPTIONIST']),
    }).parse(req.body);

    const exists = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (exists) throw new AppError(409, 'Пользователь с таким номером уже существует');

    const passwordHash = await bcrypt.hash(body.password, 12);
    const staff = await prisma.$transaction(async tx => {
      const user = await tx.user.create({
        data: {
          phone: body.phone, phoneMasked: maskPhone(body.phone),
          name: body.name, passwordHash, role: body.role,
        } as any,
      });
      await tx.tenantUser.create({
        data: { tenantId: tenantId!, userId: user.id, role: 'STAFF' },
      });
      return user;
    });

    res.status(201).json({
      id: staff.id, name: staff.name, phone: staff.phoneMasked, role: staff.role,
    });
  } catch (e) { next(e); }
});

// ── Активировать / деактивировать пользователя ────────────
adminRouter.patch('/users/:id/toggle', authorize('ADMIN'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError(404, 'Пользователь не найден');

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data:  { isActive: !user.isActive },
    });

    res.json({ isActive: updated.isActive });
  } catch (e) { next(e); }
});

// ── Назначить роль ────────────────────────────────────────
adminRouter.patch('/users/:id/role', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { role } = z.object({
      role: z.enum(['CLIENT', 'MASTER', 'RECEPTIONIST', 'ADMIN']),
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data:  { role },
    });

    res.json({ role: user.role });
  } catch (e) { next(e); }
});

// ── Загрузка постов (сегодня) ─────────────────────────────
adminRouter.get('/posts/load', async (_req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const posts = await prisma.post.findMany({
      where: { isActive: true },
      include: {
        slots: {
          where: { startAt: { gte: today, lt: tomorrow } },
          select: { isBooked: true },
        },
      },
    });

    res.json(posts.map(p => ({
      id:     p.id,
      name:   p.name,
      type:   p.type,
      total:  p.slots.length,
      booked: p.slots.filter(s => s.isBooked).length,
      free:   p.slots.filter(s => !s.isBooked).length,
    })));
  } catch (e) { next(e); }
});
