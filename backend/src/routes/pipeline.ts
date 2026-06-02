import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { parseComplaint } from '../agents/receptionist';
import { runDiagnostics } from '../agents/diagnostician';
import { buildEstimate } from '../agents/estimator';
import { io } from '../index';

export const pipelineRouter = Router();

/**
 * POST /api/v1/pipeline/:orderId/run
 * Запускает полную AI-цепочку для заказа:
 *   1. Приёмщик → разбирает жалобу
 *   2. Диагност  → строит гипотезы + список деталей
 *   3. Оценщик   → считает смету с наценками
 *
 * Только для персонала (MASTER, RECEPTIONIST, ADMIN)
 */
pipelineRouter.post(
  '/:orderId/run',
  authenticate,
  authorize('MASTER', 'RECEPTIONIST', 'ADMIN'),
  async (req, res, next) => {
    try {
      const { orderId } = req.params;

      const order = await prisma.order.findUnique({
        where:   { id: orderId },
        include: { vehicle: true },
      });
      if (!order) throw new AppError(404, 'Заказ не найден');
      if (!['NEW', 'ASSESSED'].includes(order.status)) {
        throw new AppError(409, `Нельзя запустить пайплайн для статуса ${order.status}`);
      }

      // ── Уведомить клиента о начале обработки ──
      io.to(`user:${order.clientId}`).emit('order:pipeline_started', { orderId });

      res.json({ message: 'Пайплайн запущен', orderId });

      // ── Запускаем асинхронно, не блокируя ответ ──
      runPipeline(order).catch(err =>
        console.error(`[Pipeline] Ошибка для заказа ${orderId}:`, err)
      );
    } catch (e) { next(e); }
  }
);

/**
 * GET /api/v1/pipeline/:orderId/status
 */
pipelineRouter.get('/:orderId/status', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where:  { id: req.params.orderId },
      select: {
        id: true, status: true, orderNumber: true,
        complaintParsed: true, aiDiagResult: true,
        totalCost: true, totalRetail: true,
        items: true,
      },
    });
    if (!order) throw new AppError(404, 'Заказ не найден');

    // Скрыть закупочные данные от клиента
    if (req.user!.role === 'CLIENT') {
      return res.json({
        ...order,
        totalCost:       undefined,
        aiDiagResult:    undefined,
        complaintParsed: undefined,
        items: order.items.map(i => ({ ...i, costPrice: undefined })),
      });
    }

    res.json(order);
  } catch (e) { next(e); }
});

// ─────────────────────────────────────────────
// Внутренняя функция пайплайна
// ─────────────────────────────────────────────
async function runPipeline(order: any) {
  const orderId = order.id;
  console.log(`\n[Pipeline] 🚀 Старт для ${order.orderNumber}`);

  try {
    // ── Шаг 1: Приёмщик ──────────────────────────────
    console.log(`[Pipeline] 1/3 Приёмщик → парсим жалобу...`);
    const parsed = await parseComplaint(order.complaintRaw);

    await prisma.order.update({
      where: { id: orderId },
      data:  { complaintParsed: parsed as any },
    });

    io.to(`order:${orderId}`).emit('pipeline:step', {
      step: 1, name: 'Приёмщик', status: 'done',
      data: { affectedSystem: parsed.affectedSystem, urgency: parsed.urgency },
    });
    console.log(`[Pipeline] ✓ Приёмщик: ${parsed.affectedSystem} (${parsed.urgency})`);

    // ── Шаг 2: Диагност ──────────────────────────────
    console.log(`[Pipeline] 2/3 Диагност → строим гипотезы...`);
    const diagResult = await runDiagnostics(parsed, {
      brand:   order.vehicle.brand,
      model:   order.vehicle.model,
      year:    order.vehicle.year,
      mileage: order.vehicle.mileage ?? undefined,
    });

    await prisma.order.update({
      where: { id: orderId },
      data:  { aiDiagResult: diagResult as any },
    });

    io.to(`order:${orderId}`).emit('pipeline:step', {
      step: 2, name: 'Диагност', status: 'done',
      data: {
        topHypothesis: diagResult.hypotheses[0]?.title,
        hypothesesCount: diagResult.hypotheses.length,
        estimate: `${diagResult.minEstimate.toLocaleString('ru')}–${diagResult.maxEstimate.toLocaleString('ru')} ₽`,
      },
    });
    console.log(`[Pipeline] ✓ Диагност: ${diagResult.hypotheses.length} гипотез, смета ${diagResult.minEstimate}–${diagResult.maxEstimate} ₽`);

    // ── Шаг 3: Оценщик ───────────────────────────────
    console.log(`[Pipeline] 3/3 Оценщик → считаем смету...`);

    // Удалить старые позиции если пересчёт
    await prisma.orderItem.deleteMany({ where: { orderId } });

    const estimate = await buildEstimate(diagResult, order.specialistType, orderId);

    io.to(`order:${orderId}`).emit('pipeline:step', {
      step: 3, name: 'Оценщик', status: 'done',
      data: {
        itemsCount:  estimate.items.length,
        totalRetail: estimate.totalRetail,
        marginPct:   estimate.marginPct,
      },
    });

    // ── Уведомить клиента ─────────────────────────────
    io.to(`user:${order.clientId}`).emit('order:pipeline_done', {
      orderId, orderNumber: order.orderNumber,
      totalRetail: estimate.totalRetail,
      status: 'ASSESSED',
    });

    const { notifyOrderStatusChange } = await import('../services/notifications');
    await notifyOrderStatusChange(orderId, 'ASSESSED');

    console.log(`[Pipeline] ✅ Готово: ${order.orderNumber} → ASSESSED, итого ${estimate.totalRetail} ₽\n`);

  } catch (err: any) {
    console.error(`[Pipeline] ❌ Ошибка:`, err.message);
    io.to(`order:${orderId}`).emit('pipeline:error', {
      orderId, error: 'Ошибка AI-обработки. Проверьте заказ вручную.',
    });
    // Не меняем статус — пусть приёмщик разберётся
  }
}
