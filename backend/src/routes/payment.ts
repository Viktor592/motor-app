import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../utils/prisma';
import { createPayment, confirmPaymentManual, checkPayment } from '../services/payment';
import { io } from '../index';

export const paymentRouter = Router();

/**
 * POST /api/v1/payments/:orderId/create
 * Создать СБП QR для оплаты
 */
paymentRouter.post('/:orderId/create', authenticate, authorize('CLIENT'), async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where:   { id: req.params.orderId, clientId: req.user!.userId },
    });
    if (!order) throw new AppError(404, 'Заказ не найден');
    if (!['CONFIRMED', 'READY'].includes(order.status)) {
      throw new AppError(409, 'Заказ не готов к оплате');
    }
    if (!order.totalRetail) throw new AppError(409, 'Смета ещё не готова');

    const result = await createPayment({
      orderId:     order.id,
      amountRub:   Number(order.totalRetail),
      description: `Заказ ${order.orderNumber} — автосервис МОТОР`,
      returnUrl:   `${process.env.APP_URL || 'https://motor-app.ru'}/orders/${order.id}`,
    });

    res.json({
      paymentId:   result.paymentId,
      qrImageUrl:  result.qrImageUrl,
      amount:      order.totalRetail,
      description: `Заказ ${order.orderNumber}`,
      method:      'СБП (Система быстрых платежей)',
    });
  } catch (e) { next(e); }
});

/**
 * POST /api/v1/payments/:orderId/confirm
 * Мастер / приёмщик подтверждает получение оплаты
 */
paymentRouter.post(
  '/:orderId/confirm',
  authenticate,
  authorize('MASTER', 'RECEPTIONIST', 'ADMIN'),
  async (req, res, next) => {
    try {
      await confirmPaymentManual(req.params.orderId, req.user!.userId);

      const order = await prisma.order.findUnique({
        where:  { id: req.params.orderId },
        select: { clientId: true, orderNumber: true },
      });

      // Real-time уведомление клиенту
      if (order) {
        io.to(`user:${order.clientId}`).emit('order:status', {
          orderId:     req.params.orderId,
          orderNumber: order.orderNumber,
          status:      'CLOSED',
        });
        const { notifyOrderStatusChange } = await import('../services/notifications');
        await notifyOrderStatusChange(req.params.orderId, 'CLOSED');
      }

      res.json({ ok: true, status: 'CLOSED' });
    } catch (e) { next(e); }
  }
);

/**
 * GET /api/v1/payments/:orderId/status
 */
paymentRouter.get('/:orderId/status', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where:  { id: req.params.orderId },
      select: { paymentId: true, status: true, paidAt: true, clientId: true },
    });
    if (!order) throw new AppError(404, 'Заказ не найден');
    if (req.user!.role === 'CLIENT' && order.clientId !== req.user!.userId) {
      throw new AppError(403, 'Нет доступа');
    }

    res.json({
      status:  order.status,
      paid:    order.status === 'CLOSED',
      paidAt:  order.paidAt,
      method:  'СБП',
    });
  } catch (e) { next(e); }
});

paymentRouter.post('/webhook', async (req, res) => {
  res.json({ ok: true });
});
