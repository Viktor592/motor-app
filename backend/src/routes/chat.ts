import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { callAI } from '../services/aiProvider';
import { io } from '../index';

export const chatRouter = Router();

const RECEPTIONIST_SYSTEM = `Ты — AI-агент «Приёмщик» автосервиса МОТОР.

Твои задачи:
1. Дружелюбно принять жалобу клиента
2. Уточнить: марка/модель авто, год, пробег, симптомы
3. Дать предварительную оценку — какой специалист нужен
4. Предложить записаться

Правила:
- Отвечай только на русском языке
- Будь кратким и профессиональным
- Никогда не называй закупочные цены
- Предварительную смету давай только в виде диапазона "от X до Y рублей"
- Если жалоба связана с электрикой — рекомендуй автоэлектрика
- Если нужна диагностика кодов ошибок — рекомендуй диагноста
- Иначе — рекомендуй автослесаря`;

// GET /api/v1/chat/:orderId/messages
chatRouter.get('/:orderId/messages', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.orderId, clientId: req.user!.userId },
    });
    if (!order) throw new AppError(404, 'Заказ не найден');

    const messages = await prisma.chatMessage.findMany({
      where:   { orderId: req.params.orderId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (e) { next(e); }
});

// POST /api/v1/chat
chatRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const body = z.object({
      message: z.string().min(1).max(2000),
      orderId: z.string().uuid().optional(),
    }).parse(req.body);

    // Сохранить сообщение пользователя
    await prisma.chatMessage.create({
      data: {
        userId:  req.user!.userId,
        orderId: body.orderId,
        role:    'USER',
        content: body.message,
      },
    });

    // Получить историю
    const history = body.orderId
      ? await prisma.chatMessage.findMany({
          where:   { orderId: body.orderId },
          orderBy: { createdAt: 'asc' },
          take:    20,
        })
      : [];

    const messages = history.map(m => ({
      role:    m.role === 'USER' ? 'user' : 'assistant' as const,
      content: m.content,
    }));

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      messages.push({ role: 'user', content: body.message });
    }

    // Вызов AI (бесплатный провайдер)
    const aiResponse = await callAI(RECEPTIONIST_SYSTEM, messages as any, 1024);

    // Сохранить ответ
    const aiMsg = await prisma.chatMessage.create({
      data: {
        userId:  req.user!.userId,
        orderId: body.orderId,
        role:    'ASSISTANT',
        content: aiResponse.text,
      },
    });

    if (body.orderId) {
      io.to(`order:${body.orderId}`).emit('chat:message', aiMsg);
    }

    res.json({ message: aiMsg, provider: aiResponse.provider });
  } catch (e) { next(e); }
});
