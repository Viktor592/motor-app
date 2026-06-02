import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const partsRouter = Router();

// GET /api/v1/parts?q=фильтр&category=OIL_FILTERS
partsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { q, category, page = '1', limit = '20' } = req.query as Record<string, string>;
    const where: any = {};
    if (q) where.OR = [
      { name:    { contains: q, mode: 'insensitive' } },
      { article: { contains: q, mode: 'insensitive' } },
    ];
    if (category) where.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [parts, total] = await Promise.all([
      prisma.part.findMany({ where, skip, take: parseInt(limit), orderBy: { name: 'asc' } }),
      prisma.part.count({ where }),
    ]);

    // Скрыть закупочные цены от клиентов
    const sanitized = req.user!.role === 'CLIENT'
      ? parts.map(p => ({ ...p, localCost: undefined }))
      : parts;

    res.json({ parts: sanitized, total });
  } catch (e) { next(e); }
});

// GET /api/v1/parts/:article
partsRouter.get('/:article', authenticate, async (req, res, next) => {
  try {
    const part = await prisma.part.findUnique({ where: { article: req.params.article } });
    if (!part) throw new AppError(404, 'Запчасть не найдена');
    if (req.user!.role === 'CLIENT') {
      const { localCost: _, ...safe } = part as any;
      return res.json(safe);
    }
    res.json(part);
  } catch (e) { next(e); }
});

// GET /api/v1/parts/price-rules — только персонал
partsRouter.get('/admin/price-rules', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const rules = await prisma.priceRule.findMany({ orderBy: { category: 'asc' } });
    res.json(rules);
  } catch (e) { next(e); }
});

// PATCH /api/v1/parts/admin/price-rules/:category — только админ
partsRouter.patch('/admin/price-rules/:category', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { markupPct } = z.object({ markupPct: z.number().int().min(0).max(500) }).parse(req.body);
    const rule = await prisma.priceRule.upsert({
      where:  { category: req.params.category as any },
      update: { markupPct, updatedBy: req.user!.userId },
      create: { category: req.params.category as any, markupPct, updatedBy: req.user!.userId },
    });
    // Аудит
    await prisma.priceAuditLog.create({ data: {
      itemName:   `Правило: ${req.params.category}`,
      costPrice:  0, retailPrice: 0,
      markupPct:  markupPct,
      performedBy: req.user!.userId,
    }});
    res.json(rule);
  } catch (e) { next(e); }
});
