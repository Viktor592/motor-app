import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { maskPhone } from '../utils/maskPhone';
import { sendSms, generateOtp, OTP_TTL_MS, OTP_MAX_ATTEMPTS } from '../services/sms';

export const authRouter = Router();

function signTokens(userId: string, role: string, phone: string) {
  const access = jwt.sign(
    { userId, role, phone },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any }
  );
  const refresh = jwt.sign(
    { userId, role, phone },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES || '30d') as any }
  );
  return { access, refresh };
}

// ══════════════════════════════════════════
// OTP FLOW (основной — для мобильного)
// ══════════════════════════════════════════

/**
 * POST /api/v1/auth/otp/send
 * Отправляет OTP на телефон. Создаёт пользователя если нет.
 */
authRouter.post('/otp/send', async (req, res, next) => {
  try {
    const { phone } = z.object({
      phone: z.string().regex(/^\+7\d{10}$/, 'Формат: +79001234567'),
    }).parse(req.body);

    // Rate-limit: не чаще раза в минуту
    const user = await prisma.user.findUnique({ where: { phone } });
    if (user?.otpExpiresAt && user.otpExpiresAt.getTime() - OTP_TTL_MS > Date.now() - 60_000) {
      throw new AppError(429, 'Повторная отправка доступна через минуту');
    }

    const otp     = generateOtp();
    const expires = new Date(Date.now() + OTP_TTL_MS);

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data:  { otpCode: otp, otpExpiresAt: expires, otpAttempts: 0 },
      });
    } else {
      // Авто-регистрация при первом входе
      await prisma.user.create({
        data: {
          phone,
          phoneMasked:  maskPhone(phone),
          name:         'Клиент',
          passwordHash: '',
          role:         'CLIENT',
          otpCode:      otp,
          otpExpiresAt: expires,
          otpAttempts:  0,
        },
      });
    }

    await sendSms(phone, `Ваш код МОТОР: ${otp}. Действителен 5 минут.`);

    res.json({ message: 'Код отправлен', phone: maskPhone(phone) });
  } catch (e) { next(e); }
});

/**
 * POST /api/v1/auth/otp/verify
 * Проверяет OTP и выдаёт токены
 */
authRouter.post('/otp/verify', async (req, res, next) => {
  try {
    const { phone, code } = z.object({
      phone: z.string().regex(/^\+7\d{10}$/),
      code:  z.string().length(4),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new AppError(400, 'Сначала запросите код');
    }

    // Проверить попытки
    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      throw new AppError(429, 'Превышено число попыток. Запросите новый код.');
    }

    // Проверить срок
    if (user.otpExpiresAt < new Date()) {
      throw new AppError(400, 'Код истёк. Запросите новый.');
    }

    // Проверить код
    if (user.otpCode !== code) {
      await prisma.user.update({
        where: { id: user.id },
        data:  { otpAttempts: { increment: 1 } },
      });
      throw new AppError(400, `Неверный код. Осталось попыток: ${OTP_MAX_ATTEMPTS - user.otpAttempts - 1}`);
    }

    // Код верный — сбросить OTP
    await prisma.user.update({
      where: { id: user.id },
      data:  { otpCode: null, otpExpiresAt: null, otpAttempts: 0 },
    });

    const tokens = signTokens(user.id, user.role, user.phone);
    res.json({
      user: {
        id:   user.id,
        name: user.name,
        phone: user.phoneMasked,
        role: user.role,
        needsName: user.name === 'Клиент', // флаг — попросить ввести имя
      },
      ...tokens,
    });
  } catch (e) { next(e); }
});

// ══════════════════════════════════════════
// PASSWORD FLOW (для веба и персонала)
// ══════════════════════════════════════════

authRouter.post('/register', async (req, res, next) => {
  try {
    const body = z.object({
      phone:    z.string().regex(/^\+7\d{10}$/),
      name:     z.string().min(2).max(100),
      password: z.string().min(6),
    }).parse(req.body);

    const exists = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (exists) throw new AppError(409, 'Пользователь с таким номером уже существует');

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        phone:       body.phone,
        phoneMasked: maskPhone(body.phone),
        name:        body.name,
        passwordHash,
        role:        'CLIENT',
      },
    });

    const tokens = signTokens(user.id, user.role, user.phone);
    res.status(201).json({
      user: { id: user.id, name: user.name, phone: user.phoneMasked, role: user.role },
      ...tokens,
    });
  } catch (e) { next(e); }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { phone, password } = z.object({
      phone:    z.string(),
      password: z.string(),
    }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.isActive) throw new AppError(401, 'Неверный номер или пароль');

    const ok = user.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false;
    if (!ok) throw new AppError(401, 'Неверный номер или пароль');

    const tokens = signTokens(user.id, user.role, user.phone);
    res.json({
      user: { id: user.id, name: user.name, phone: user.phoneMasked, role: user.role },
      ...tokens,
    });
  } catch (e) { next(e); }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refresh } = z.object({ refresh: z.string() }).parse(req.body);
    const payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET!) as any;

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) throw new AppError(401, 'Пользователь не найден');

    const tokens = signTokens(user.id, user.role, user.phone);
    res.json(tokens);
  } catch (e) { next(e); }
});

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:   { id: req.user!.userId },
      include: { vehicles: true },
    });
    if (!user) throw new AppError(404, 'Пользователь не найден');

    res.json({
      id:       user.id,
      name:     user.name,
      phone:    user.phoneMasked,
      email:    user.email,
      role:     user.role,
      avatarUrl: user.avatarUrl,
      vehicles: user.vehicles,
    });
  } catch (e) { next(e); }
});
// PATCH /api/v1/auth/avatar — загрузить/сменить аватар
authRouter.patch('/avatar', authenticate, async (req, res, next) => {
  try {
    const { avatarUrl } = z.object({
      avatarUrl: z.string().max(500_000).nullable(),
    }).parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data:  { avatarUrl },
    });
    res.json({ avatarUrl: user.avatarUrl });
  } catch (e) { next(e); }
});

// PATCH /api/v1/auth/avatar — загрузить/сменить аватар
authRouter.patch('/avatar', authenticate, async (req, res, next) => {
  try {
    const { avatarUrl } = z.object({
      avatarUrl: z.string().max(500_000).nullable(),
    }).parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data:  { avatarUrl },
    });
    res.json({ avatarUrl: user.avatarUrl });
  } catch (e) { next(e); }
});

// PATCH /api/v1/auth/name — обновить имя после OTP-регистрации
authRouter.patch('/name', authenticate, async (req, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(2).max(100) }).parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data:  { name },
    });
    res.json({ name: user.name });
  } catch (e) { next(e); }
});
