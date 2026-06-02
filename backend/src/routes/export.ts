import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../utils/prisma';
import { generateOrderPdf } from '../services/pdfExport';

export const exportRouter = Router();

/**
 * GET /api/v1/export/orders/:id/pdf
 * Скачать заказ-наряд в PDF
 */
exportRouter.get('/orders/:id/pdf', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where:  { id: req.params.id },
      select: { id: true, clientId: true, orderNumber: true },
    });

    if (!order) throw new AppError(404, 'Заказ не найден');

    // Клиент может скачать только свой заказ
    if (req.user!.role === 'CLIENT' && order.clientId !== req.user!.userId) {
      throw new AppError(403, 'Нет доступа');
    }

    const pdf = await generateOrderPdf(order.id);

    res.setHeader('Content-Type',        'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${order.orderNumber}.pdf"`);
    res.setHeader('Content-Length',      pdf.length);
    res.send(pdf);

  } catch (e) { next(e); }
});

/**
 * GET /api/v1/export/clients/xlsx
 * Экспорт клиентской базы в Excel
 */
exportRouter.get('/clients/xlsx', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const clients = await prisma.user.findMany({
      where:   { role: 'CLIENT' },
      include: {
        vehicles: true,
        orders: {
          select: { status: true, totalRetail: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let ExcelJS: any;
    try { ExcelJS = require('exceljs'); }
    catch { return res.status(500).json({ error: 'exceljs не установлен: npm install exceljs' }); }

    const wb = new ExcelJS.Workbook();
    wb.creator    = 'МОТОР';
    wb.created    = new Date();

    // ── Лист: Клиенты ──
    const wsClients = wb.addWorksheet('Клиенты', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    wsClients.columns = [
      { header: 'ID',           key: 'id',          width: 12 },
      { header: 'Имя',          key: 'name',         width: 22 },
      { header: 'Телефон',      key: 'phone',        width: 20 },
      { header: 'Автомобилей',  key: 'vehicles',     width: 14 },
      { header: 'Заказов',      key: 'orders',       width: 12 },
      { header: 'Закрытых',     key: 'closed',       width: 12 },
      { header: 'Выручка (₽)',  key: 'revenue',      width: 16 },
      { header: 'Последний визит', key: 'lastVisit', width: 18 },
      { header: 'Дата рег.',    key: 'createdAt',    width: 16 },
    ];

    // Стиль шапки
    wsClients.getRow(1).eachCell(cell => {
      cell.font       = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill       = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6200' } };
      cell.alignment  = { vertical: 'middle', horizontal: 'center' };
    });

    clients.forEach(c => {
      const closed  = c.orders.filter(o => o.status === 'CLOSED');
      const revenue = closed.reduce((s, o) => s + Number(o.totalRetail ?? 0), 0);
      const last    = c.orders[0]?.createdAt;

      wsClients.addRow({
        id:        c.id.slice(0, 8),
        name:      c.name,
        phone:     c.phoneMasked,
        vehicles:  c.vehicles.length,
        orders:    c.orders.length,
        closed:    closed.length,
        revenue:   Math.round(revenue),
        lastVisit: last ? new Date(last).toLocaleDateString('ru') : '—',
        createdAt: new Date(c.createdAt).toLocaleDateString('ru'),
      });
    });

    // Итоговая строка
    const lastRow = wsClients.rowCount + 1;
    wsClients.addRow({
      name:     'ИТОГО',
      vehicles: clients.reduce((s, c) => s + c.vehicles.length, 0),
      orders:   clients.reduce((s, c) => s + c.orders.length, 0),
      closed:   clients.reduce((s, c) => s + c.orders.filter(o => o.status === 'CLOSED').length, 0),
      revenue:  Math.round(clients.reduce((s, c) =>
        s + c.orders.filter(o => o.status === 'CLOSED').reduce((ss, o) => ss + Number(o.totalRetail ?? 0), 0), 0
      )),
    });
    wsClients.getRow(lastRow).font = { bold: true };

    // ── Лист: Автомобили ──
    const wsCars = wb.addWorksheet('Автомобили');
    wsCars.columns = [
      { header: 'Клиент',   key: 'client', width: 22 },
      { header: 'Телефон',  key: 'phone',  width: 20 },
      { header: 'Марка',    key: 'brand',  width: 14 },
      { header: 'Модель',   key: 'model',  width: 14 },
      { header: 'Год',      key: 'year',   width: 8  },
      { header: 'Пробег',   key: 'mileage',width: 12 },
      { header: 'Номер',    key: 'plate',  width: 14 },
    ];
    wsCars.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111115' } };
    });
    clients.forEach(c => {
      c.vehicles.forEach((v: any) => {
        wsCars.addRow({
          client:  c.name,
          phone:   c.phoneMasked,
          brand:   v.brand,
          model:   v.model,
          year:    v.year,
          mileage: v.mileage ?? '—',
          plate:   v.plateNum ?? '—',
        });
      });
    });

    // Отдать файл
    res.setHeader('Content-Type',        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="motor-clients-${new Date().toISOString().slice(0,10)}.xlsx"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (e) { next(e); }
});

/**
 * GET /api/v1/export/orders/xlsx?from=2025-01-01&to=2025-12-31
 * Экспорт заказов за период
 */
exportRouter.get('/orders/xlsx', authenticate, authorize('ADMIN', 'RECEPTIONIST'), async (req, res, next) => {
  try {
    const { from, to } = req.query as Record<string, string>;
    const where: any   = {};
    if (from) where.createdAt = { ...where.createdAt, gte: new Date(from) };
    if (to)   where.createdAt = { ...where.createdAt, lte: new Date(to + 'T23:59:59Z') };

    const orders = await prisma.order.findMany({
      where,
      include: {
        client:  { select: { name: true, phoneMasked: true } },
        vehicle: true,
        staff:   { select: { name: true } },
        items:   true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let ExcelJS: any;
    try { ExcelJS = require('exceljs'); }
    catch { return res.status(500).json({ error: 'exceljs не установлен' }); }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Заказы', { views: [{ state: 'frozen', ySplit: 1 }] });

    ws.columns = [
      { header: 'Номер заказа',   key: 'orderNumber', width: 20 },
      { header: 'Дата',           key: 'date',         width: 14 },
      { header: 'Статус',         key: 'status',       width: 16 },
      { header: 'Клиент',         key: 'client',       width: 22 },
      { header: 'Телефон',        key: 'phone',        width: 20 },
      { header: 'Автомобиль',     key: 'car',          width: 22 },
      { header: 'Специализация',  key: 'spec',         width: 16 },
      { header: 'Мастер',         key: 'staff',        width: 20 },
      { header: 'Выручка (₽)',    key: 'retail',       width: 16 },
      { header: 'Себестоимость (₽)', key: 'cost',      width: 20 },
      { header: 'Прибыль (₽)',    key: 'profit',       width: 16 },
    ];

    ws.getRow(1).eachCell(cell => {
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6200' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const STATUS_RU: Record<string, string> = {
      NEW: 'Новый', ASSESSED: 'Оценён', CONFIRMED: 'Подтверждён',
      IN_PROGRESS: 'В работе', READY: 'Готов', CLOSED: 'Закрыт', CANCELLED: 'Отменён',
    };
    const SPEC_RU: Record<string, string> = {
      MECHANIC: 'Слесарь', ELECTRICIAN: 'Электрик', DIAGNOSTICS: 'Диагност',
    };

    let totRetail = 0, totCost = 0;
    orders.forEach(o => {
      const retail = Number(o.totalRetail ?? 0);
      const cost   = Number(o.totalCost   ?? 0);
      totRetail += retail;
      totCost   += cost;
      ws.addRow({
        orderNumber: o.orderNumber,
        date:        new Date(o.createdAt).toLocaleDateString('ru'),
        status:      STATUS_RU[o.status] ?? o.status,
        client:      (o.client as any)?.name ?? '—',
        phone:       (o.client as any)?.phoneMasked ?? '—',
        car:         `${o.vehicle.brand} ${o.vehicle.model} ${o.vehicle.year}`,
        spec:        SPEC_RU[o.specialistType] ?? o.specialistType,
        staff:       (o.staff as any)?.name ?? '—',
        retail:      Math.round(retail),
        cost:        Math.round(cost),
        profit:      Math.round(retail - cost),
      });
    });

    // Итоги
    const lastRow = ws.rowCount + 1;
    ws.addRow({
      orderNumber: 'ИТОГО',
      retail:  Math.round(totRetail),
      cost:    Math.round(totCost),
      profit:  Math.round(totRetail - totCost),
    });
    ws.getRow(lastRow).font = { bold: true };

    res.setHeader('Content-Type',        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="motor-orders-${new Date().toISOString().slice(0,10)}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (e) { next(e); }
});
