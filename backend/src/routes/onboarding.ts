import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import { maskPhone } from '../utils/maskPhone';

export const onboardingRouter = Router();

/**
 * GET /api/v1/onboarding/status
 * Проверить — нужен ли онбординг (нет постов = первый запуск)
 */
onboardingRouter.get('/status', async (_req, res, next) => {
  try {
    const [postsCount, adminCount] = await Promise.all([
      prisma.post.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ]);

    res.json({
      needsOnboarding: postsCount === 0 || adminCount === 0,
      hasAdmin:        adminCount > 0,
      hasPosts:        postsCount > 0,
      postsCount,
    });
  } catch (e) { next(e); }
});

/**
 * POST /api/v1/onboarding/setup
 * Полная начальная настройка сервиса
 * Доступно без авторизации только если нет ни одного ADMIN
 */
onboardingRouter.post('/setup', async (req, res, next) => {
  try {
    // Проверить — если уже есть ADMIN, требуем авторизацию
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) {
      return res.status(403).json({
        error: 'Онбординг уже выполнен. Управление через Admin-панель.',
      });
    }

    const body = z.object({
      // Администратор
      adminName:     z.string().min(2),
      adminPhone:    z.string().regex(/^\+7\d{10}$/),
      adminPassword: z.string().min(6),

      // Название и контакты сервиса
      serviceName:   z.string().min(2),
      servicePhone:  z.string().optional(),
      serviceCity:   z.string().optional(),

      // Посты (минимум 1)
      posts: z.array(z.object({
        name: z.string().min(2),
        type: z.enum(['MECHANIC', 'ELECTRICIAN', 'DIAGNOSTICS']),
      })).min(1).max(20),

      // Мастера (опционально)
      masters: z.array(z.object({
        name:     z.string().min(2),
        phone:    z.string().regex(/^\+7\d{10}$/),
        password: z.string().min(6),
      })).optional().default([]),
    }).parse(req.body);

    // Транзакция: создать всё сразу
    const result = await prisma.$transaction(async (tx) => {
      // 1. Создать администратора
      const adminHash = await bcrypt.hash(body.adminPassword, 12);
      const admin = await tx.user.create({
        data: {
          phone:       body.adminPhone,
          phoneMasked: maskPhone(body.adminPhone),
          name:        body.adminName,
          passwordHash: adminHash,
          role:        'ADMIN',
        },
      });

      // 2. Создать посты
      const posts = await Promise.all(
        body.posts.map(p =>
          tx.post.create({ data: { name: p.name, type: p.type as any } })
        )
      );

      // 3. Создать мастеров
      const masters = await Promise.all(
        body.masters.map(async m => {
          const hash = await bcrypt.hash(m.password, 12);
          return tx.user.create({
            data: {
              phone:        m.phone,
              phoneMasked:  maskPhone(m.phone),
              name:         m.name,
              passwordHash: hash,
              role:         'MASTER',
            },
          });
        })
      );

      // 4. Правила ценообразования по умолчанию
      await tx.priceRule.createMany({
        data: [
          { category: 'OIL_FILTERS', markupPct: 30 },
          { category: 'OEM',         markupPct: 20 },
          { category: 'AFTERMARKET', markupPct: 40 },
          { category: 'BRAKES',      markupPct: 35 },
          { category: 'BODY',        markupPct: 25 },
          { category: 'CHEMICALS',   markupPct: 50 },
        ],
        skipDuplicates: true,
      });

      // 5. Сгенерировать слоты на ближайшие 14 дней
      const slotData: any[] = [];
      const hours = [9,10,11,12,13,14,15,16,17,18,19];
      let d = new Date();
      d.setHours(0,0,0,0);
      for (let day = 0; day < 14; day++) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() === 0) continue;
        for (const post of posts) {
          for (const h of hours) {
            const start = new Date(d); start.setHours(h, 0, 0, 0);
            const end   = new Date(d); end.setHours(h + 1, 0, 0, 0);
            slotData.push({ postId: post.id, startAt: start, endAt: end, isBooked: false });
          }
        }
      }
      await tx.calendarSlot.createMany({ data: slotData });

      return { admin, posts, masters, slotsCreated: slotData.length };
    });

    res.status(201).json({
      message: 'Сервис успешно настроен!',
      admin:   { id: result.admin.id, name: result.admin.name, phone: result.admin.phoneMasked },
      posts:   result.posts.length,
      masters: result.masters.length,
      slots:   result.slotsCreated,
    });
  } catch (e) { next(e); }
});

/**
 * POST /api/v1/onboarding/generate-slots
 * Сгенерировать слоты на следующие N дней (только ADMIN)
 */
onboardingRouter.post('/generate-slots', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { days = 14 } = z.object({ days: z.number().int().min(1).max(60).default(14) }).parse(req.body);

    const posts = await prisma.post.findMany({ where: { isActive: true } });
    if (!posts.length) throw new AppError(400, 'Нет активных постов');

    // Найти последний существующий слот
    const lastSlot = await prisma.calendarSlot.findFirst({ orderBy: { startAt: 'desc' } });
    const fromDate = lastSlot ? new Date(lastSlot.startAt) : new Date();
    fromDate.setHours(0, 0, 0, 0);

    const hours    = [9,10,11,12,13,14,15,16,17,18,19];
    const slotData: any[] = [];
    let d = new Date(fromDate);

    for (let day = 0; day < days; day++) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) continue;
      for (const post of posts) {
        for (const h of hours) {
          const start = new Date(d); start.setHours(h, 0, 0, 0);
          const end   = new Date(d); end.setHours(h + 1, 0, 0, 0);
          slotData.push({ postId: post.id, startAt: start, endAt: end, isBooked: false });
        }
      }
    }

    await prisma.calendarSlot.createMany({ data: slotData, skipDuplicates: true });
    res.json({ created: slotData.length, days });
  } catch (e) { next(e); }
});
