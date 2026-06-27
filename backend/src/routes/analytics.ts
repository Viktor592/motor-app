import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';

export const analyticsRouter = Router();

// ── Аналитика мастера ─────────────────────────────────────────────────────────
// GET /api/v1/analytics/master/me?period=week|month|year
analyticsRouter.get('/master/me', authenticate, authorize('MASTER', 'RECEPTIONIST', 'ADMIN'), async (req, res, next) => {
  try {
    const period = (req.query.period as string) || 'month';
    const masterId = req.query.masterId as string || req.user!.userId;

    // Только ADMIN может смотреть других мастеров
    const targetId = (req.user!.role === 'ADMIN' && masterId) ? masterId : req.user!.userId;

    const from = getPeriodStart(period);

    const [orders, closedOrders, inProgressOrders] = await Promise.all([
      prisma.order.findMany({
        where: { staffId: targetId, createdAt: { gte: from } },
        include: { items: true, vehicle: true },
      }),
      prisma.order.findMany({
        where: { staffId: targetId, status: 'CLOSED', paidAt: { gte: from } },
        include: { items: true },
      }),
      prisma.order.count({
        where: { staffId: targetId, status: 'IN_PROGRESS' },
      }),
    ]);

    // Выручка и маржа
    const totalRetail = closedOrders.reduce((s, o) => s + Number(o.totalRetail ?? 0), 0);
    const totalCost   = closedOrders.reduce((s, o) => s + Number(o.totalCost   ?? 0), 0);
    const margin      = totalRetail - totalCost;
    const marginPct   = totalRetail > 0 ? Math.round(margin / totalRetail * 100) : 0;

    // Средний чек
    const avgCheck = closedOrders.length > 0 ? Math.round(totalRetail / closedOrders.length) : 0;

    // По специализации
    const bySpec = orders.reduce((acc: Record<string, number>, o) => {
      acc[o.specialistType] = (acc[o.specialistType] ?? 0) + 1;
      return acc;
    }, {});

    // Динамика по дням
    const dailyMap = new Map<string, { orders: number; revenue: number }>();
    closedOrders.forEach(o => {
      const day = (o.paidAt ?? o.updatedAt).toISOString().slice(0, 10);
      const cur = dailyMap.get(day) ?? { orders: 0, revenue: 0 };
      cur.orders++;
      cur.revenue += Number(o.totalRetail ?? 0);
      dailyMap.set(day, cur);
    });
    const daily = Array.from(dailyMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Топ типов работ
    const workItems = closedOrders.flatMap(o => o.items.filter(i => i.type === 'WORK'));
    const workMap   = new Map<string, number>();
    workItems.forEach(i => workMap.set(i.name, (workMap.get(i.name) ?? 0) + 1));
    const topWork = Array.from(workMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      period,
      summary: {
        totalOrders:    orders.length,
        closedOrders:   closedOrders.length,
        inProgress:     inProgressOrders,
        totalRetail:    Math.round(totalRetail),
        totalCost:      Math.round(totalCost),
        margin:         Math.round(margin),
        marginPct,
        avgCheck,
      },
      bySpec,
      daily,
      topWork,
    });
  } catch (e) { next(e); }
});

// ── P&L Дашборд владельца ─────────────────────────────────────────────────────
// GET /api/v1/analytics/pnl?period=month|quarter|year
analyticsRouter.get('/pnl', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const period = (req.query.period as string) || 'month';
    const from   = getPeriodStart(period);

    const [
      closedOrders, allOrders,
      newClients, totalClients,
      masters,
    ] = await Promise.all([
      prisma.order.findMany({
        where:   { status: 'CLOSED', paidAt: { gte: from } },
        include: { items: true, staff: { select: { id: true, name: true } } },
      }),
      prisma.order.findMany({
        where:   { createdAt: { gte: from } },
        select:  { status: true, specialistType: true, createdAt: true },
      }),
      prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: from } } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.findMany({
        where:   { role: 'MASTER' },
        select:  { id: true, name: true },
      }),
    ]);

    const revenue = closedOrders.reduce((s, o) => s + Number(o.totalRetail ?? 0), 0);
    const cost    = closedOrders.reduce((s, o) => s + Number(o.totalCost   ?? 0), 0);
    const profit  = revenue - cost;

    // Конверсия: заказы по статусам
    const statusCounts = allOrders.reduce((acc: Record<string, number>, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});
    const conversion = allOrders.length > 0
      ? Math.round(closedOrders.length / allOrders.length * 100)
      : 0;

    // Выручка по специалистам
    const bySpec = closedOrders.reduce((acc: Record<string, { revenue: number; orders: number }>, o) => {
      const spec = (o as any).specialistType ?? 'UNKNOWN';
      if (!acc[spec]) acc[spec] = { revenue: 0, orders: 0 };
      acc[spec].revenue += Number(o.totalRetail ?? 0);
      acc[spec].orders++;
      return acc;
    }, {});

    // Выручка по мастерам
    const byMaster = masters.map(m => {
      const mOrders = closedOrders.filter((o: any) => o.staff?.id === m.id);
      return {
        id:      m.id,
        name:    m.name,
        orders:  mOrders.length,
        revenue: Math.round(mOrders.reduce((s, o) => s + Number(o.totalRetail ?? 0), 0)),
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Динамика по неделям
    const weekMap = new Map<string, { revenue: number; orders: number; profit: number }>();
    closedOrders.forEach(o => {
      const d   = o.paidAt ?? o.updatedAt;
      const mon = getMonday(d).toISOString().slice(0, 10);
      const cur = weekMap.get(mon) ?? { revenue: 0, orders: 0, profit: 0 };
      cur.revenue += Number(o.totalRetail ?? 0);
      cur.orders++;
      cur.profit  += Number(o.totalRetail ?? 0) - Number(o.totalCost ?? 0);
      weekMap.set(mon, cur);
    });
    const weekly = Array.from(weekMap.entries())
      .map(([week, v]) => ({ week, ...v }))
      .sort((a, b) => a.week.localeCompare(b.week));

    res.json({
      period,
      summary: {
        revenue:     Math.round(revenue),
        cost:        Math.round(cost),
        profit:      Math.round(profit),
        marginPct:   revenue > 0 ? Math.round(profit / revenue * 100) : 0,
        avgCheck:    closedOrders.length > 0 ? Math.round(revenue / closedOrders.length) : 0,
        totalOrders: allOrders.length,
        closedOrders: closedOrders.length,
        conversion,
        newClients,
        totalClients,
      },
      statusCounts,
      bySpec,
      byMaster,
      weekly,
    });
  } catch (e) { next(e); }
});

// ── Хелперы ───────────────────────────────────────────────────────────────────
function getPeriodStart(period: string, multiplier = 1): Date {
  const d = new Date();
  switch (period) {
    case 'week':    d.setDate(d.getDate() - 7 * multiplier);        break;
    case 'month':   d.setMonth(d.getMonth() - 1 * multiplier);      break;
    case 'quarter': d.setMonth(d.getMonth() - 3 * multiplier);      break;
    case 'year':    d.setFullYear(d.getFullYear() - 1 * multiplier); break;
    default:        d.setMonth(d.getMonth() - 1 * multiplier);
  }
  return d;
}

function getMonday(date: Date): Date {
  const d   = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ══════════════════════════════════════
// ИТЕРАЦИЯ 13 — РАСШИРЕННАЯ АНАЛИТИКА
// ══════════════════════════════════════

// GET /api/v1/analytics/report?period=month — сводный отчёт
analyticsRouter.get('/report', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const period = (req.query.period as string) || 'month';
    const from   = getPeriodStart(period);
    const prevFrom = getPeriodStart(period, 2); // предыдущий период

    const [closedOrders, prevOrders, masters, transactions] = await Promise.all([
      prisma.order.findMany({
        where: { status: 'CLOSED', paidAt: { gte: from } },
        include: { items: true, staff: { select: { name: true } } },
      }),
      prisma.order.findMany({
        where: { status: 'CLOSED', paidAt: { gte: prevFrom, lt: from } },
        include: { items: true },
      }),
      prisma.user.findMany({
        where: { role: 'MASTER' },
        select: { id: true, name: true },
      }),
      prisma.cashTransaction.findMany({
        where: { createdAt: { gte: from }, type: 'EXPENSE' },
      }),
    ]);

    // --- Текущий период ---
    const revenue    = closedOrders.reduce((s, o) => s + Number(o.totalRetail ?? 0), 0);
    const cogs       = closedOrders.reduce((s, o) => s + Number(o.totalCost   ?? 0), 0);
    const expenses   = transactions.reduce((s, t) => s + Number(t.amount), 0);
    const netProfit  = revenue - cogs - expenses;
    const avgCheck   = closedOrders.length > 0 ? Math.round(revenue / closedOrders.length) : 0;

    // --- Предыдущий период ---
    const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.totalRetail ?? 0), 0);
    const growthPct   = prevRevenue > 0 ? Math.round((revenue - prevRevenue) / prevRevenue * 100) : null;

    // --- Топ услуги ---
    const serviceMap: Record<string, { count: number; revenue: number }> = {};
    closedOrders.forEach(o => {
      o.items.forEach(item => {
        if (item.type !== 'WORK') return;
        const cur = serviceMap[item.name] ?? { count: 0, revenue: 0 };
        cur.count++;
        cur.revenue += Number(item.retailPrice) * item.qty;
        serviceMap[item.name] = cur;
      });
    });
    const topServices = Object.entries(serviceMap)
      .map(([name, v]) => ({ name, ...v, revenue: Math.round(v.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // --- Топ мастера ---
    const masterMap: Record<string, { name: string; orders: number; revenue: number }> = {};
    closedOrders.forEach(o => {
      if (!o.staffId) return;
      const masterName = o.staff?.name ?? 'Неизвестно';
      const cur = masterMap[o.staffId] ?? { name: masterName, orders: 0, revenue: 0 };
      cur.orders++;
      cur.revenue += Number(o.totalRetail ?? 0);
      masterMap[o.staffId] = cur;
    });
    const topMasters = Object.entries(masterMap)
      .map(([id, v]) => ({ id, ...v, revenue: Math.round(v.revenue), avgCheck: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0 }))
      .sort((a, b) => b.revenue - a.revenue);

    // --- Загрузка по дням недели ---
    const weekdayMap = new Array(7).fill(0).map(() => ({ orders: 0, revenue: 0 }));
    closedOrders.forEach(o => {
      const day = new Date(o.paidAt ?? o.updatedAt).getDay();
      weekdayMap[day].orders++;
      weekdayMap[day].revenue += Number(o.totalRetail ?? 0);
    });
    const weekdays = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
    const byWeekday = weekdayMap.map((v, i) => ({ day: weekdays[i], ...v, revenue: Math.round(v.revenue) }));

    // --- Динамика по дням ---
    const dailyMap = new Map<string, { orders: number; revenue: number }>();
    closedOrders.forEach(o => {
      const day = new Date(o.paidAt ?? o.updatedAt).toISOString().slice(0, 10);
      const cur = dailyMap.get(day) ?? { orders: 0, revenue: 0 };
      cur.orders++;
      cur.revenue += Number(o.totalRetail ?? 0);
      dailyMap.set(day, cur);
    });
    const daily = Array.from(dailyMap.entries())
      .map(([date, v]) => ({ date, orders: v.orders, revenue: Math.round(v.revenue) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      period,
      summary: {
        revenue:      Math.round(revenue),
        cogs:         Math.round(cogs),
        expenses:     Math.round(expenses),
        netProfit:    Math.round(netProfit),
        grossMarginPct: revenue > 0 ? Math.round((revenue - cogs) / revenue * 100) : 0,
        netMarginPct:   revenue > 0 ? Math.round(netProfit / revenue * 100) : 0,
        totalOrders:  closedOrders.length,
        avgCheck,
        growthPct,
        prevRevenue:  Math.round(prevRevenue),
      },
      topServices,
      topMasters,
      byWeekday,
      daily,
    });
  } catch (e) { next(e); }
});

// GET /api/v1/analytics/kpi — KPI для дашборда (сегодня)
analyticsRouter.get('/kpi', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const weekStart  = getPeriodStart('week');
    const monthStart = getPeriodStart('month');

    const [todayOrders, weekOrders, monthOrders, activeOrders, pendingBookings, openShift] = await Promise.all([
      prisma.order.findMany({ where: { status: 'CLOSED', paidAt: { gte: todayStart } }, select: { totalRetail: true } }),
      prisma.order.findMany({ where: { status: 'CLOSED', paidAt: { gte: weekStart  } }, select: { totalRetail: true } }),
      prisma.order.findMany({ where: { status: 'CLOSED', paidAt: { gte: monthStart } }, select: { totalRetail: true } }),
      prisma.order.count({ where: { status: { in: ['NEW','IN_PROGRESS','ASSESSED','CONFIRMED','READY'] } } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.cashShift.findFirst({ where: { status: 'OPEN' } }),
    ]);

    const sum = (orders: { totalRetail: any }[]) => Math.round(orders.reduce((s, o) => s + Number(o.totalRetail ?? 0), 0));

    res.json({
      today:   { orders: todayOrders.length, revenue: sum(todayOrders) },
      week:    { orders: weekOrders.length,  revenue: sum(weekOrders)  },
      month:   { orders: monthOrders.length, revenue: sum(monthOrders) },
      active:  activeOrders,
      pendingBookings,
      shiftOpen: !!openShift,
    });
  } catch (e) { next(e); }
});
