import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const usersRouter = Router();

// GET /api/v1/users/profile
usersRouter.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { vehicles: { orderBy: { createdAt: 'desc' } } },
    });
    if (!user) throw new AppError(404, 'Пользователь не найден');
    res.json({ id: user.id, name: user.name, phone: user.phoneMasked, role: user.role, vehicles: user.vehicles });
  } catch (e) { next(e); }
});

// PATCH /api/v1/users/profile
usersRouter.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(2).max(100) }).parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user!.userId }, data: { name } });
    res.json({ name: user.name });
  } catch (e) { next(e); }
});

// PATCH /api/v1/users/push-token
usersRouter.patch('/push-token', authenticate, async (req, res, next) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);
    await prisma.user.update({ where: { id: req.user!.userId }, data: { pushToken: token } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/v1/users/vehicles
usersRouter.post('/vehicles', authenticate, async (req, res, next) => {
  try {
    const body = z.object({
      brand: z.string().min(1), model: z.string().min(1),
      year: z.number().int().min(1990).max(2026),
      mileage: z.number().optional(), plateNum: z.string().optional(),
      vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/i, 'VIN должен содержать 17 символов (без I, O, Q)').optional().or(z.literal('')),
    }).parse(req.body);
    const vehicle = await prisma.vehicle.create({
      data: { ...body, vin: body.vin || null, clientId: req.user!.userId },
    });
    res.status(201).json(vehicle);
  } catch (e) { next(e); }
});

// PATCH /api/v1/users/vehicles/:id
usersRouter.patch('/vehicles/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, clientId: req.user!.userId } });
    if (!existing) throw new AppError(404, 'Автомобиль не найден');

    const body = z.object({
      brand: z.string().min(1).optional(), model: z.string().min(1).optional(),
      year: z.number().int().min(1990).max(2026).optional(),
      mileage: z.number().optional(), plateNum: z.string().optional(),
      vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/i, 'VIN должен содержать 17 символов (без I, O, Q)').optional().or(z.literal('')),
    }).parse(req.body);

    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data:  { ...body, vin: body.vin === '' ? null : body.vin },
    });
    res.json(vehicle);
  } catch (e) { next(e); }
});

// DELETE /api/v1/users/vehicles/:id
usersRouter.delete('/vehicles/:id', authenticate, async (req, res, next) => {
  try {
    const v = await prisma.vehicle.findFirst({ where: { id: req.params.id, clientId: req.user!.userId } });
    if (!v) throw new AppError(404, 'Автомобиль не найден');
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// GET /api/v1/users/vin/:vin — расшифровка VIN (марка/модель/год)
usersRouter.get('/vin/:vin', authenticate, async (req, res, next) => {
  try {
    const vin = req.params.vin.toUpperCase();
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) throw new AppError(400, 'Неверный формат VIN');

    const r = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`);
    const data = await r.json();
    const info = data.Results?.[0] ?? {};

    res.json({
      brand: info.Make || null,
      model: info.Model || null,
      year:  info.ModelYear ? parseInt(info.ModelYear) : null,
    });
  } catch (e) { next(e); }
});
