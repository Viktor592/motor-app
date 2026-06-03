import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const financeRouter = Router();

// ══════════════════════════════════════
// КАССОВЫЕ СМЕНЫ
// ══════════════════════════════════════

// GET /api/v1/finance/shifts — список смен
financeRouter.get('/shifts', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [shifts, total] = await Promise.all([
      prisma.cashShift.findMany({
        orderBy: { openedAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          transactions: {
            select: { type: true, amount: true },
          },
        },
      }),
      prisma.cashShift.count(),
    ]);

    const result = shifts.map(s => {
      const incCash = s.transactions.filter(t => t.type === 'INCOME_CASH').reduce((sum, t) => sum + Number(t.amount), 0);
      const incCard = s.transactions.filter(t => t.type === 'INCOME_CARD').reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = s.transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        ...s,
        transactions: undefined,
        incCash: Math.round(incCash),
        incCard: Math.round(incCard),
        expense: Math.round(expense),
        totalIncome: Math.round(incCash + incCard),
      };
    });

    res.json({ shifts: result, total });
  } catch (e) { next(e); }
});

// GET /api/v1/finance/shifts/current — текущая открытая смена
financeRouter.get('/shifts/current', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const shift = await prisma.cashShift.findFirst({
      where: { status: 'OPEN' },
      include: {
        transactions: { orderBy: { createdAt: 'desc' } },
      },
    });
    res.json(shift ?? null);
  } catch (e) { next(e); }
});

// POST /api/v1/finance/shifts/open — открыть смену
financeRouter.post('/shifts/open', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const existing = await prisma.cashShift.findFirst({ where: { status: 'OPEN' } });
    if (existing) throw new AppError(400, 'Смена уже открыта');

    const { openCash, comment } = z.object({
      openCash: z.number().min(0).default(0),
      comment:  z.string().optional(),
    }).parse(req.body);

    const shift = await prisma.cashShift.create({
      data: { openedBy: req.user!.userId, openCash, comment },
    });
    res.status(201).json(shift);
  } catch (e) { next(e); }
});

// POST /api/v1/finance/shifts/:id/close — закрыть смену
financeRouter.post('/shifts/:id/close', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { closeCash, comment } = z.object({
      closeCash: z.number().min(0),
      comment:   z.string().optional(),
    }).parse(req.body);

    const shift = await prisma.cashShift.findUnique({
      where:   { id: req.params.id },
      include: { transactions: true },
    });
    if (!shift) throw new AppError(404, 'Смена не найдена');
    if (shift.status === 'CLOSED') throw new AppError(400, 'Смена уже закрыта');

    // Считаем ожидаемый остаток
    const inflow  = shift.transactions.filter(t => ['INCOME_CASH', 'DEPOSIT'].includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);
    const outflow = shift.transactions.filter(t => ['EXPENSE', 'WITHDRAWAL'].includes(t.type)).reduce((s, t) => s + Number(t.amount), 0);
    const expectedCash = Number(shift.openCash) + inflow - outflow;
    const diffCash     = closeCash - expectedCash;

    const closed = await prisma.cashShift.update({
      where: { id: req.params.id },
      data: {
        status: 'CLOSED',
        closedBy: req.user!.userId,
        closedAt: new Date(),
        closeCash,
        expectedCash,
        diffCash,
        comment: comment ?? shift.comment,
      },
    });

    res.json(closed);
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// ТРАНЗАКЦИИ
// ══════════════════════════════════════

// GET /api/v1/finance/transactions?shiftId=...&type=...
financeRouter.get('/transactions', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { shiftId, type, from, to, page = '1', limit = '50' } = req.query as Record<string, string>;
    const where: any = {};
    if (shiftId) where.shiftId  = shiftId;
    if (type)    where.type     = type;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [txs, total] = await Promise.all([
      prisma.cashTransaction.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cashTransaction.count({ where }),
    ]);

    res.json({ transactions: txs, total });
  } catch (e) { next(e); }
});

// POST /api/v1/finance/transactions — добавить транзакцию
financeRouter.post('/transactions', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const data = z.object({
      type:        z.enum(['INCOME_CASH', 'INCOME_CARD', 'EXPENSE', 'WITHDRAWAL', 'DEPOSIT']),
      amount:      z.number().positive(),
      category:    z.enum(['SALARY', 'RENT', 'PARTS_PURCHASE', 'UTILITIES', 'MARKETING', 'EQUIPMENT', 'OTHER']).optional(),
      orderId:     z.string().uuid().optional(),
      description: z.string().optional(),
    }).parse(req.body);

    // Найти текущую открытую смену
    const shift = await prisma.cashShift.findFirst({ where: { status: 'OPEN' } });
    if (!shift) throw new AppError(400, 'Нет открытой смены. Откройте смену перед записью транзакций.');

    const tx = await prisma.cashTransaction.create({
      data: {
        ...data,
        shiftId:     shift.id,
        performedBy: req.user!.userId,
      },
    });

    res.status(201).json(tx);
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// РАСХОДЫ И БЮДЖЕТ
// ══════════════════════════════════════

// GET /api/v1/finance/budget — плановые расходы
financeRouter.get('/budget', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const budgets = await prisma.expenseBudget.findMany({ orderBy: { category: 'asc' } });
    res.json(budgets);
  } catch (e) { next(e); }
});

// PUT /api/v1/finance/budget/:category — обновить бюджет категории
financeRouter.put('/budget/:category', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { monthlyAmount } = z.object({ monthlyAmount: z.number().min(0) }).parse(req.body);

    const budget = await prisma.expenseBudget.upsert({
      where:  { category: req.params.category as any },
      update: { monthlyAmount, updatedBy: req.user!.userId },
      create: { category: req.params.category as any, monthlyAmount, updatedBy: req.user!.userId },
    });

    res.json(budget);
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// P&L С РАСХОДАМИ (расширенный)
// ══════════════════════════════════════

// GET /api/v1/finance/pnl?period=month|quarter|year
financeRouter.get('/pnl', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const period = (req.query.period as string) || 'month';
    const from   = getPeriodStart(period);

    const [closedOrders, transactions, budgets] = await Promise.all([
      prisma.order.findMany({
        where:   { status: 'CLOSED', paidAt: { gte: from } },
        include: { items: true },
      }),
      prisma.cashTransaction.findMany({
        where: { createdAt: { gte: from } },
      }),
      prisma.expenseBudget.findMany(),
    ]);

    // Выручка
    const revenueCash = transactions.filter(t => t.type === 'INCOME_CASH').reduce((s, t) => s + Number(t.amount), 0);
    const revenueCard = transactions.filter(t => t.type === 'INCOME_CARD').reduce((s, t) => s + Number(t.amount), 0);
    const revenueTotal = revenueCash + revenueCard;

    // Себестоимость (из заказов)
    const cogs = closedOrders.reduce((s, o) => s + Number(o.totalCost ?? 0), 0);
    const grossProfit = closedOrders.reduce((s, o) => s + Number(o.totalRetail ?? 0), 0) - cogs;

    // Расходы по категориям
    const expenseTxs = transactions.filter(t => t.type === 'EXPENSE');
    const expenseByCategory: Record<string, number> = {};
    expenseTxs.forEach(t => {
      const cat = t.category ?? 'OTHER';
      expenseByCategory[cat] = (expenseByCategory[cat] ?? 0) + Number(t.amount);
    });
    const totalExpenses = Object.values(expenseByCategory).reduce((s, v) => s + v, 0);

    // Чистая прибыль
    const netProfit = grossProfit - totalExpenses;

    // Бюджет vs факт
    const budgetAnalysis = budgets.map(b => ({
      category: b.category,
      budget:   Number(b.monthlyAmount),
      actual:   Math.round(expenseByCategory[b.category] ?? 0),
      diff:     Math.round((expenseByCategory[b.category] ?? 0) - Number(b.monthlyAmount)),
    }));

    // Динамика по неделям
    const weekMap = new Map<string, { revenue: number; expenses: number; profit: number }>();
    transactions.forEach(t => {
      const mon = getMonday(t.createdAt).toISOString().slice(0, 10);
      const cur = weekMap.get(mon) ?? { revenue: 0, expenses: 0, profit: 0 };
      if (['INCOME_CASH', 'INCOME_CARD'].includes(t.type)) cur.revenue  += Number(t.amount);
      if (t.type === 'EXPENSE')                             cur.expenses += Number(t.amount);
      weekMap.set(mon, cur);
    });
    const weekly = Array.from(weekMap.entries())
      .map(([week, v]) => ({ week, ...v, profit: Math.round(v.revenue - v.expenses) }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Структура расходов для диаграммы
    const expenseStructure = Object.entries(expenseByCategory).map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
      pct: totalExpenses > 0 ? Math.round(amount / totalExpenses * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    res.json({
      period,
      summary: {
        revenueCash:   Math.round(revenueCash),
        revenueCard:   Math.round(revenueCard),
        revenueTotal:  Math.round(revenueTotal),
        cogs:          Math.round(cogs),
        grossProfit:   Math.round(grossProfit),
        totalExpenses: Math.round(totalExpenses),
        netProfit:     Math.round(netProfit),
        netMarginPct:  revenueTotal > 0 ? Math.round(netProfit / revenueTotal * 100) : 0,
        closedOrders:  closedOrders.length,
        avgCheck:      closedOrders.length > 0 ? Math.round(closedOrders.reduce((s, o) => s + Number(o.totalRetail ?? 0), 0) / closedOrders.length) : 0,
      },
      expenseByCategory: expenseByCategory,
      expenseStructure,
      budgetAnalysis,
      weekly,
    });
  } catch (e) { next(e); }
});

// ── Хелперы ───────────────────────────────────────────────────────────────────
function getPeriodStart(period: string): Date {
  const d = new Date();
  switch (period) {
    case 'week':    d.setDate(d.getDate() - 7);        break;
    case 'month':   d.setMonth(d.getMonth() - 1);      break;
    case 'quarter': d.setMonth(d.getMonth() - 3);      break;
    case 'year':    d.setFullYear(d.getFullYear() - 1); break;
    default:        d.setMonth(d.getMonth() - 1);
  }
  return d;
}

function getMonday(date: Date): Date {
  const d   = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}
