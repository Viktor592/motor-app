import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticate, authorize } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { DiadocService } from '../services/diadoc';
import { AatolService, orderItemsToAtol } from '../services/atol';
import { generateInvoiceHtml, generateActHtml } from '../services/docGenerator';
import {
  calculateTax, analyzeTaxOptimization,
  generateKudirXml, generateUsnDeclarationXml,
  type TaxSystem,
} from '../services/taxService';

export const edoRouter = Router();
edoRouter.use(authenticate, authorize('ADMIN'));

// ── Фабрики клиентов ─────────────────────────────────────────

async function getEdoSettings() {
  const s = await prisma.edoSettings.findFirst();
  if (!s) throw new AppError(400, 'Настройки ЭДО не заданы');
  return s;
}

async function getDiadoc(): Promise<DiadocService> {
  const s = await getEdoSettings();
  if (!s.diadocToken || !s.diadocBoxId)
    throw new AppError(400, 'Диадок не настроен. Укажите токен и BoxId.');
  return new DiadocService(s.diadocToken, s.diadocBoxId);
}

async function getAtol(): Promise<AatolService> {
  const { ATOL_LOGIN, ATOL_PASSWORD, ATOL_GROUP } = process.env;
  if (!ATOL_LOGIN || !ATOL_PASSWORD || !ATOL_GROUP)
    throw new AppError(400, 'Атол не настроен. Задайте ATOL_LOGIN, ATOL_PASSWORD, ATOL_GROUP в .env');
  return new AatolService(ATOL_LOGIN, ATOL_PASSWORD, ATOL_GROUP);
}

// ══════════════════════════════════════
// НАСТРОЙКИ ЭДО / ФНС
// ══════════════════════════════════════

// GET /api/v1/edo/settings
edoRouter.get('/settings', async (_req, res, next) => {
  try {
    const s = await prisma.edoSettings.findFirst();
    if (s) {
      (s as any).diadocToken  = s.diadocToken  ? '••••••' : null;
      (s as any).sbisPassword = s.sbisPassword ? '••••••' : null;
    }
    res.json(s ?? {});
  } catch (e) { next(e); }
});

// PUT /api/v1/edo/settings
edoRouter.put('/settings', async (req, res, next) => {
  try {
    const data = z.object({
      provider:    z.enum(['DIADOC','SBIS','KONTUR','MANUAL']).optional(),
      diadocToken: z.string().optional(),
      diadocBoxId: z.string().optional(),
      sbisLogin:   z.string().optional(),
      sbisPassword:z.string().optional(),
      orgName:     z.string().optional(),
      orgInn:      z.string().optional(),
      orgKpp:      z.string().optional(),
      orgOgrn:     z.string().optional(),
      orgAddress:  z.string().optional(),
      orgDirector: z.string().optional(),
      bankName:    z.string().optional(),
      bankBik:     z.string().optional(),
      bankAccount: z.string().optional(),
      bankCorr:    z.string().optional(),
      taxSystem:   z.enum(['USN_INCOME','USN_INCOME_MINUS','PATENT','OSNO','NPD']).optional(),
      vatRate:     z.number().int().min(0).max(20).optional(),
    }).parse(req.body);

    const existing = await prisma.edoSettings.findFirst();
    // Не перезаписывать маски
    if (data.diadocToken === '••••••') delete data.diadocToken;
    if (data.sbisPassword === '••••••') delete data.sbisPassword;

    const saved = existing
      ? await prisma.edoSettings.update({ where: { id: existing.id }, data })
      : await prisma.edoSettings.create({ data: data as any });

    res.json({ ok: true, system: saved.taxSystem });
  } catch (e) { next(e); }
});

// POST /api/v1/edo/test — тест соединения
edoRouter.post('/test', async (req, res, next) => {
  try {
    const s = await getEdoSettings();
    let ok = false;
    if (s.provider === 'DIADOC') { const d = await getDiadoc(); ok = await d.ping(); }
    else if (s.provider === 'MANUAL') ok = true;
    else ok = false;
    res.json({ ok, provider: s.provider });
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// ДОКУМЕНТЫ ЭДО
// ══════════════════════════════════════

// GET /api/v1/edo/documents
edoRouter.get('/documents', async (req, res, next) => {
  try {
    const { status, type, page = '1', limit = '30' } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;
    if (type)   where.type   = type;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [docs, total] = await Promise.all([
      prisma.edoDocument.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      prisma.edoDocument.count({ where }),
    ]);
    res.json({ docs, total });
  } catch (e) { next(e); }
});

// POST /api/v1/edo/documents/invoice — создать счёт из заказа
edoRouter.post('/documents/invoice', async (req, res, next) => {
  try {
    const { orderId } = z.object({ orderId: z.string().uuid() }).parse(req.body);

    const [order, settings] = await Promise.all([
      prisma.order.findUnique({
        where:   { id: orderId },
        include: { client: true, vehicle: true, items: true },
      }),
      getEdoSettings(),
    ]);
    if (!order) throw new AppError(404, 'Заказ не найден');

    const lastDoc = await prisma.edoDocument.findFirst({ orderBy: { createdAt: 'desc' }, select: { docNumber: true } });
    const nextNum = lastDoc ? parseInt(lastDoc.docNumber.replace(/\D/g, '')) + 1 : 1;
    const docNum  = `СЧ-${String(nextNum).padStart(4, '0')}`;

    const totalAmount = order.items.reduce((s, i) => s + Number(i.retailPrice) * i.qty, 0);

    const doc = await prisma.edoDocument.create({
      data: {
        orderId,
        clientId:         order.clientId,
        type:             'INVOICE',
        status:           'DRAFT',
        provider:         settings.provider as any,
        docNumber:        docNum,
        totalAmount,
        counterpartyName: order.client.name,
        counterpartyInn:  (order.client as any).inn,
        createdBy:        req.user!.userId,
      },
    });

    // Генерируем HTML счёта
    const html = generateInvoiceHtml({
      docNumber: docNum,
      docDate:   new Date(),
      org: {
        name:       settings.orgName    ?? 'Автосервис',
        inn:        settings.orgInn     ?? '',
        kpp:        settings.orgKpp     ?? undefined,
        address:    settings.orgAddress ?? '',
        director:   settings.orgDirector ?? undefined,
        bankName:   settings.bankName   ?? undefined,
        bankBik:    settings.bankBik    ?? undefined,
        bankAccount:settings.bankAccount ?? undefined,
        bankCorr:   settings.bankCorr   ?? undefined,
      },
      client: {
        name:  order.client.name,
        inn:   (order.client as any).inn ?? undefined,
        phone: order.client.phone,
      },
      items: order.items.map(i => ({
        name:    i.name,
        unit:    i.type === 'WORK' ? 'услуга' : 'шт',
        qty:     i.qty,
        price:   Number(i.retailPrice),
        amount:  Number(i.retailPrice) * i.qty,
        vatRate: settings.vatRate ?? 0,
      })),
      totalAmount,
      vatAmount: settings.vatRate ? totalAmount * settings.vatRate / (100 + settings.vatRate) : 0,
    });

    res.json({ doc, html });
  } catch (e) { next(e); }
});

// POST /api/v1/edo/documents/act — создать акт из заказа
edoRouter.post('/documents/act', async (req, res, next) => {
  try {
    const { orderId } = z.object({ orderId: z.string().uuid() }).parse(req.body);

    const [order, settings] = await Promise.all([
      prisma.order.findUnique({
        where:   { id: orderId },
        include: { client: true, items: true },
      }),
      getEdoSettings(),
    ]);
    if (!order) throw new AppError(404, 'Заказ не найден');
    if (order.status !== 'CLOSED') throw new AppError(400, 'Акт можно создать только для закрытого заказа');

    const lastDoc = await prisma.edoDocument.findFirst({ orderBy: { createdAt: 'desc' }, select: { docNumber: true } });
    const nextNum = lastDoc ? parseInt(lastDoc.docNumber.replace(/\D/g, '')) + 1 : 1;
    const docNum  = `АКТ-${String(nextNum).padStart(4, '0')}`;
    const totalAmount = order.items.reduce((s, i) => s + Number(i.retailPrice) * i.qty, 0);

    const doc = await prisma.edoDocument.create({
      data: {
        orderId,
        clientId:         order.clientId,
        type:             'ACT',
        status:           'DRAFT',
        provider:         settings.provider as any,
        docNumber:        docNum,
        totalAmount,
        counterpartyName: order.client.name,
        counterpartyInn:  (order.client as any).inn,
        createdBy:        req.user!.userId,
      },
    });

    const html = generateActHtml({
      docNumber: docNum, docDate: new Date(),
      org: {
        name: settings.orgName ?? '', inn: settings.orgInn ?? '',
        address: settings.orgAddress ?? '', director: settings.orgDirector ?? undefined,
      },
      client: { name: order.client.name, inn: (order.client as any).inn ?? undefined, phone: order.client.phone },
      items: order.items.map(i => ({
        name: i.name, unit: i.type === 'WORK' ? 'услуга' : 'шт',
        qty: i.qty, price: Number(i.retailPrice), amount: Number(i.retailPrice) * i.qty,
      })),
      totalAmount,
    });

    // Добавить в КУДиР автоматически
    await prisma.kudirEntry.create({
      data: {
        entryDate: new Date(), docNumber: docNum, docDate: new Date(),
        operation: `Оказание услуг автосервиса (заказ #${order.orderNumber})`,
        income: totalAmount, orderId,
      },
    });

    res.json({ doc, html });
  } catch (e) { next(e); }
});

// PATCH /api/v1/edo/documents/:id/send — отправить через Диадок
edoRouter.patch('/documents/:id/send', async (req, res, next) => {
  try {
    const doc = await prisma.edoDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) throw new AppError(404, 'Документ не найден');

    const settings = await getEdoSettings();
    if (settings.provider === 'DIADOC') {
      const diadoc = await getDiadoc();
      const { messageId } = await diadoc.sendDocument({
        toBoxId:       req.body.toBoxId ?? '',
        docType:       doc.type === 'INVOICE' ? 'Invoice' : 'Act',
        fileName:      `${doc.docNumber}.xml`,
        contentBase64: Buffer.from(`<doc>${doc.docNumber}</doc>`).toString('base64'),
      });
      await prisma.edoDocument.update({
        where: { id: doc.id },
        data:  { status: 'SENT', externalId: messageId },
      });
    } else {
      await prisma.edoDocument.update({ where: { id: doc.id }, data: { status: 'SENT' } });
    }

    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// ОНЛАЙН-КАССА АТОЛ (54-ФЗ)
// ══════════════════════════════════════

// POST /api/v1/edo/fiscal/receipt — пробить чек
edoRouter.post('/fiscal/receipt', async (req, res, next) => {
  try {
    const { orderId, paymentType } = z.object({
      orderId:     z.string().uuid(),
      paymentType: z.enum(['cash', 'card', 'sbp']).default('card'),
    }).parse(req.body);

    const order = await prisma.order.findUnique({
      where:   { id: orderId },
      include: { client: true, items: true },
    });
    if (!order) throw new AppError(404, 'Заказ не найден');

    const settings    = await getEdoSettings();
    const totalAmount = order.items.reduce((s, i) => s + Number(i.retailPrice) * i.qty, 0);

    // Создать запись чека
    const receipt = await prisma.fiscalReceipt.create({
      data: {
        orderId, totalAmount,
        cashAmount: paymentType === 'cash' ? totalAmount : 0,
        cardAmount: paymentType !== 'cash' ? totalAmount : 0,
        status: 'PENDING',
      },
    });

    // Фискализировать через Атол
    try {
      const atol    = await getAtol();
      const items   = orderItemsToAtol(order.items.map(i => ({
        name:        i.name,
        qty:         i.qty,
        retailPrice: Number(i.retailPrice),
        type:        i.type,
      })), settings.vatRate ?? 0);

      const paymentCode = paymentType === 'cash' ? 0 : 1;
      const { uuid }    = await atol.sell({
        externalId:   orderId,
        clientEmail:  order.client.email ?? undefined,
        clientPhone:  order.client.phone,
        items,
        payments:     [{ type: paymentCode, sum: totalAmount }],
        totalSum:     totalAmount,
      });

      await prisma.fiscalReceipt.update({
        where: { id: receipt.id },
        data:  { atolUuid: uuid },
      });

      res.json({ receiptId: receipt.id, atolUuid: uuid, status: 'PENDING' });
    } catch (atolErr: any) {
      await prisma.fiscalReceipt.update({
        where: { id: receipt.id },
        data:  { status: 'ERROR', errorMessage: atolErr.message },
      });
      throw new AppError(502, `Ошибка фискализации: ${atolErr.message}`);
    }
  } catch (e) { next(e); }
});

// GET /api/v1/edo/fiscal/receipt/:id — статус чека
edoRouter.get('/fiscal/receipt/:id', async (req, res, next) => {
  try {
    const receipt = await prisma.fiscalReceipt.findUnique({ where: { id: req.params.id } });
    if (!receipt) throw new AppError(404, 'Чек не найден');

    // Если ждём статуса — запросить у Атол
    if (receipt.status === 'PENDING' && receipt.atolUuid) {
      try {
        const atol   = await getAtol();
        const status = await atol.getStatus(receipt.atolUuid);
        if (status.status === 'done') {
          await prisma.fiscalReceipt.update({
            where: { id: receipt.id },
            data: {
              status:        'DONE',
              fiscalNumber:  status.payload.fiscal_document_attribute?.toString(),
              fdNumber:      status.payload.fiscal_document_number,
              fnNumber:      status.payload.fn_number,
              receiptUrl:    status.payload.url,
            },
          });
        } else if (status.status === 'fail') {
          await prisma.fiscalReceipt.update({
            where: { id: receipt.id },
            data:  { status: 'ERROR', errorMessage: status.error?.text },
          });
        }
      } catch {}
    }

    const updated = await prisma.fiscalReceipt.findUnique({ where: { id: req.params.id } });
    res.json(updated);
  } catch (e) { next(e); }
});

// POST /api/v1/edo/atol/webhook — вебхук от Атол
edoRouter.post('/atol/webhook', async (req, res, next) => {
  try {
    const { uuid, status, payload, error } = req.body;
    const receipt = await prisma.fiscalReceipt.findFirst({ where: { atolUuid: uuid } });
    if (!receipt) return res.json({ ok: true });

    if (status === 'done') {
      await prisma.fiscalReceipt.update({
        where: { id: receipt.id },
        data: {
          status:       'DONE',
          fiscalNumber: payload?.fiscal_document_attribute?.toString(),
          fdNumber:     payload?.fiscal_document_number,
          fnNumber:     payload?.fn_number,
          receiptUrl:   payload?.url,
        },
      });
    } else if (status === 'fail') {
      await prisma.fiscalReceipt.update({
        where: { id: receipt.id },
        data:  { status: 'ERROR', errorMessage: error?.text },
      });
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// НАЛОГОВЫЙ AI-АГЕНТ
// ══════════════════════════════════════

// POST /api/v1/edo/tax/analyze — AI-анализ налоговой нагрузки
edoRouter.post('/tax/analyze', async (req, res, next) => {
  try {
    const params = z.object({
      period:        z.enum(['quarter', 'year']).default('year'),
      revenue:       z.number().positive(),
      expenses:      z.number().min(0).default(0),
      employees:     z.number().int().min(0).default(0),
      insuredAmount: z.number().min(0).default(0),
      region:        z.string().default('77'),
      patentCost:    z.number().optional(),
    }).parse(req.body);

    const result = await analyzeTaxOptimization({
      ...params,
      system: 'USN_INCOME', // будет сравнивать все
    });

    res.json(result);
  } catch (e) { next(e); }
});

// GET /api/v1/edo/tax/calculate — быстрый расчёт по одному режиму
edoRouter.get('/tax/calculate', async (req, res, next) => {
  try {
    const { system, revenue, expenses, employees, insuredAmount, region, period } =
      req.query as Record<string, string>;

    const result = calculateTax({
      system:        (system as TaxSystem) ?? 'USN_INCOME',
      region:        region   ?? '77',
      revenue:       parseFloat(revenue   ?? '0'),
      expenses:      parseFloat(expenses  ?? '0'),
      employees:     parseInt(employees   ?? '0'),
      insuredAmount: parseFloat(insuredAmount ?? '0'),
      period:        (period as 'quarter' | 'year') ?? 'year',
    });

    res.json(result);
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// КУДиР и ДЕКЛАРАЦИИ
// ══════════════════════════════════════

// GET /api/v1/edo/kudir?year=2024 — книга доходов и расходов
edoRouter.get('/kudir', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year as string ?? new Date().getFullYear().toString());
    const from = new Date(year, 0, 1);
    const to   = new Date(year, 11, 31, 23, 59, 59);

    const entries = await prisma.kudirEntry.findMany({
      where:   { entryDate: { gte: from, lte: to } },
      orderBy: { entryDate: 'asc' },
    });

    const totalIncome  = entries.reduce((s, e) => s + Number(e.income  ?? 0), 0);
    const totalExpense = entries.reduce((s, e) => s + Number(e.expense ?? 0), 0);

    // Автоматически добавить из закрытых заказов которых нет в КУДиР
    const closedOrders = await prisma.order.findMany({
      where: { status: 'CLOSED', paidAt: { gte: from, lte: to } },
      select: { id: true, orderNumber: true, totalRetail: true, paidAt: true },
    });
    const existingOrderIds = new Set(entries.map(e => e.orderId).filter(Boolean));
    const missing = closedOrders.filter(o => !existingOrderIds.has(o.id));

    if (missing.length > 0) {
      await prisma.kudirEntry.createMany({
        data: missing.map(o => ({
          entryDate: o.paidAt ?? new Date(),
          docNumber: `ЗН-${o.orderNumber}`,
          docDate:   o.paidAt ?? new Date(),
          operation: `Оплата заказ-наряда №${o.orderNumber}`,
          income:    o.totalRetail,
          orderId:   o.id,
        })),
        skipDuplicates: true,
      });
    }

    res.json({ entries, totalIncome, totalExpense, year, autoAdded: missing.length });
  } catch (e) { next(e); }
});

// GET /api/v1/edo/kudir/xml?year=2024 — КУДиР в XML для ФНС
edoRouter.get('/kudir/xml', async (req, res, next) => {
  try {
    const year     = parseInt(req.query.year as string ?? new Date().getFullYear().toString());
    const settings = await getEdoSettings();
    const from     = new Date(year, 0, 1);
    const to       = new Date(year, 11, 31);
    const entries  = await prisma.kudirEntry.findMany({
      where: { entryDate: { gte: from, lte: to } },
      orderBy: { entryDate: 'asc' },
    });

    const xml = generateKudirXml({
      year,
      orgName:   settings.orgName  ?? 'Организация',
      inn:       settings.orgInn   ?? '',
      taxSystem: (settings.taxSystem as any) ?? 'USN_INCOME',
      entries:   entries.map(e => ({
        date:      e.entryDate,
        docNumber: e.docNumber,
        docDate:   e.docDate,
        operation: e.operation,
        income:    e.income ? Number(e.income) : undefined,
        expense:   e.expense ? Number(e.expense) : undefined,
      })),
    });

    res.setHeader('Content-Type', 'application/xml; charset=windows-1251');
    res.setHeader('Content-Disposition', `attachment; filename="kudir_${year}.xml"`);
    res.send(xml);
  } catch (e) { next(e); }
});

// GET /api/v1/edo/declaration/usn?year=2024 — декларация УСН XML
edoRouter.get('/declaration/usn', async (req, res, next) => {
  try {
    const year     = parseInt(req.query.year as string ?? new Date().getFullYear().toString());
    const settings = await getEdoSettings();
    const from     = new Date(year, 0, 1);
    const to       = new Date(year, 11, 31);

    // Считаем итоги за год
    const entries = await prisma.kudirEntry.findMany({
      where: { entryDate: { gte: from, lte: to } },
    });
    const revenue  = entries.reduce((s, e) => s + Number(e.income  ?? 0), 0);
    const expenses = entries.reduce((s, e) => s + Number(e.expense ?? 0), 0);
    const system   = (settings.taxSystem ?? 'USN_INCOME') as 'USN_INCOME' | 'USN_INCOME_MINUS';
    const taxRate  = system === 'USN_INCOME' ? 6 : 15;

    const taxCalc = calculateTax({
      system, region: req.query.region as string ?? '77',
      revenue, expenses, employees: 0,
      insuredAmount: Number(settings.vatRate ?? 0),
      period: 'year',
    });

    const xml = generateUsnDeclarationXml({
      year, orgName: settings.orgName ?? '', inn: settings.orgInn ?? '',
      kpp: settings.orgKpp ?? undefined, okato: req.query.okato as string ?? '45000000',
      taxSystem: system, revenue, expenses, taxRate,
      taxAmount: taxCalc.taxAmount,
      advancePaid: Number(req.query.advancePaid ?? 0),
      insurance:   taxCalc.deductions,
      employees:   0,
    });

    res.setHeader('Content-Type', 'application/xml; charset=windows-1251');
    res.setHeader('Content-Disposition', `attachment; filename="usn_declaration_${year}.xml"`);
    res.send(xml);
  } catch (e) { next(e); }
});

// ══════════════════════════════════════
// ДЕДЛАЙНЫ И НАПОМИНАНИЯ ФНС
// ══════════════════════════════════════

// GET /api/v1/edo/deadlines — ближайшие сроки отчётности
edoRouter.get('/deadlines', async (req, res, next) => {
  try {
    const settings = await getEdoSettings();
    const system   = settings.taxSystem ?? 'USN_INCOME';
    const now      = new Date();
    const year     = now.getFullYear();

    const deadlines = getTaxDeadlines(system, year).filter(d => d.date >= now);
    res.json({ deadlines, taxSystem: system });
  } catch (e) { next(e); }
});

function getTaxDeadlines(system: string, year: number): { date: Date; title: string; type: string; urgent: boolean }[] {
  const d: { date: Date; title: string; type: string; urgent: boolean }[] = [];

  if (['USN_INCOME', 'USN_INCOME_MINUS'].includes(system)) {
    d.push(
      { date: new Date(year, 3, 28),  title: 'Декларация УСН за год',       type: 'declaration', urgent: false },
      { date: new Date(year, 3, 28),  title: 'Уплата налога УСН за год',    type: 'payment',     urgent: false },
      { date: new Date(year, 3, 28),  title: 'Авансовый платёж Q1',         type: 'advance',     urgent: false },
      { date: new Date(year, 6, 28),  title: 'Авансовый платёж Q2',         type: 'advance',     urgent: false },
      { date: new Date(year, 9, 28),  title: 'Авансовый платёж Q3',         type: 'advance',     urgent: false },
      { date: new Date(year, 11, 31), title: 'Фиксированные взносы ИП',     type: 'insurance',   urgent: false },
      { date: new Date(year + 1, 0, 31), title: '1% взнос с дохода >300 тыс', type: 'insurance', urgent: false },
    );
  }
  if (system === 'PATENT') {
    d.push(
      { date: new Date(year, 11, 31), title: 'Оплата патента (при сроке > 6 мес)', type: 'payment', urgent: false },
      { date: new Date(year, 11, 31), title: 'Фиксированные взносы ИП', type: 'insurance', urgent: false },
    );
  }

  // Отметить срочные (осталось ≤ 7 дней)
  const now = new Date();
  d.forEach(item => {
    item.urgent = (item.date.getTime() - now.getTime()) <= 7 * 86400000;
  });

  return d.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ══════════════════════════════════════
// МЧД И АВТОМАТИЧЕСКАЯ ОТЧЁТНОСТЬ
// ══════════════════════════════════════

import { FnsMchDService, generateMchDXml } from '../services/mchd';
import { AutoReportingService } from '../services/autoReporting';
import crypto from 'crypto';

// GET /api/v1/edo/mchd — список МЧД
edoRouter.get('/mchd', async (_req, res, next) => {
  try {
    const records = await prisma.mchDRecord.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(records);
  } catch (e) { next(e); }
});

// POST /api/v1/edo/mchd — создать и зарегистрировать МЧД
edoRouter.post('/mchd', async (req, res, next) => {
  try {
    const data = z.object({
      authorities:     z.array(z.string()),
      validMonths:     z.number().int().min(1).max(36).default(12),
      registerVia:     z.enum(['diadoc','fns','manual']).default('manual'),
      signedHash:      z.string().optional(), // КЭП директора (base64)
    }).parse(req.body);

    const settings   = await getEdoSettings();
    if (!settings.orgInn) throw new AppError(400, 'ИНН не заполнен в настройках');

    const mchDId     = crypto.randomUUID();
    const validFrom  = new Date();
    const validTo    = new Date();
    validTo.setMonth(validTo.getMonth() + data.validMonths);

    const xml = generateMchDXml({
      mchDId,
      principalInn:       settings.orgInn,
      principalKpp:       settings.orgKpp ?? undefined,
      principalName:      settings.orgName ?? '',
      representativeInn:  settings.orgInn,
      representativeName: 'Система МОТОР (автоматизированная отчётность)',
      authorities:        data.authorities as any,
      validFrom, validTo,
    });

    let registrationResult: any = { registered: false };
    const mchDService = new FnsMchDService();

    if (data.registerVia === 'diadoc' && settings.diadocToken && settings.diadocBoxId) {
      registrationResult = await mchDService.registerViaDiadoc({
        diadocToken: settings.diadocToken,
        diadocBoxId: settings.diadocBoxId,
        mchDXml: xml,
        mchDId,
      });
    } else if (data.registerVia === 'fns' && data.signedHash) {
      registrationResult = await mchDService.registerViaFns({
        mchDXml: xml, mchDId, signedHash: data.signedHash,
      });
    }

    const record = await prisma.mchDRecord.create({
      data: {
        mchDId,
        principalInn:      settings.orgInn,
        representativeName:'Система МОТОР',
        authorities:       JSON.stringify(data.authorities),
        validFrom, validTo,
        status:            registrationResult.registered ? 'active' : 'draft',
        registeredVia:     data.registerVia,
        fnsId:             registrationResult.fnsId ?? registrationResult.messageId ?? null,
        xmlContent:        xml,
      },
    });

    res.status(201).json({ record, xml, registered: registrationResult.registered });
  } catch (e) { next(e); }
});

// POST /api/v1/edo/reporting/send — отправить отчёт автоматически
edoRouter.post('/reporting/send', async (req, res, next) => {
  try {
    const { type, year, quarter } = z.object({
      type:    z.enum(['USN_DECLARATION','KUDIR','SFR_EFS1']),
      year:    z.number().int().default(new Date().getFullYear()),
      quarter: z.number().int().min(1).max(4).optional(),
    }).parse(req.body);

    const settings = await getEdoSettings();
    if (!settings.orgInn) throw new AppError(400, 'Заполните реквизиты в настройках ЭДО');

    const mchD = await prisma.mchDRecord.findFirst({
      where: { principalInn: settings.orgInn, status: 'active' },
    });

    const reporter = new AutoReportingService({
      konturApiKey: process.env.KONTUR_API_KEY,
      inn:          settings.orgInn,
      kpp:          settings.orgKpp ?? undefined,
    });

    let result: any;
    if (type === 'USN_DECLARATION') {
      // Считаем данные за год
      const from = new Date(year, 0, 1);
      const to   = new Date(year, 11, 31);
      const entries = await prisma.kudirEntry.findMany({ where: { entryDate: { gte: from, lte: to } } });
      const revenue  = entries.reduce((s, e) => s + Number(e.income  ?? 0), 0);
      const expenses = entries.reduce((s, e) => s + Number(e.expense ?? 0), 0);
      const taxRate  = settings.taxSystem === 'USN_INCOME_MINUS' ? 15 : 6;
      const taxAmount = settings.taxSystem === 'USN_INCOME'
        ? revenue * taxRate / 100
        : Math.max(0, revenue - expenses) * taxRate / 100;

      result = await reporter.sendUsnDeclaration({
        year, orgName: settings.orgName ?? '', inn: settings.orgInn,
        kpp: settings.orgKpp ?? undefined, okato: '45000000',
        taxSystem: (settings.taxSystem ?? 'USN_INCOME') as any,
        revenue, expenses, taxRate, taxAmount,
        advancePaid: 0, insurance: 49500,
        mchDId: mchD?.mchDId,
      });
    } else {
      result = { type, status: 'QUEUED', operator: 'manual', message: 'Тип отчёта в разработке' };
    }

    // Сохранить в журнал
    await prisma.autoReport.create({
      data: {
        type:       type as any,
        status:     result.status as any,
        year, quarter,
        operator:   result.operator,
        trackingId: result.trackingId ?? null,
        message:    result.message ?? null,
        sentAt:     result.sentAt ?? null,
      },
    });

    res.json(result);
  } catch (e) { next(e); }
});

// GET /api/v1/edo/reporting/history — история отправок
edoRouter.get('/reporting/history', async (_req, res, next) => {
  try {
    const reports = await prisma.autoReport.findMany({
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
    res.json(reports);
  } catch (e) { next(e); }
});

// GET /api/v1/edo/reporting/status/:trackingId — статус у оператора
edoRouter.get('/reporting/status/:trackingId', async (req, res, next) => {
  try {
    const settings = await getEdoSettings();
    const reporter = new AutoReportingService({
      konturApiKey: process.env.KONTUR_API_KEY,
      inn:          settings.orgInn ?? '',
      kpp:          settings.orgKpp ?? undefined,
    });
    const status = await reporter.checkStatus(req.params.trackingId);

    await prisma.autoReport.updateMany({
      where: { trackingId: req.params.trackingId },
      data:  { status: status as any },
    });

    res.json({ trackingId: req.params.trackingId, status });
  } catch (e) { next(e); }
});
