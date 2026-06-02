import { prisma } from '../utils/prisma';

/**
 * Генерирует PDF заказ-наряда.
 * Использует PDFKit (npm install pdfkit @types/pdfkit)
 */
export async function generateOrderPdf(orderId: string): Promise<Buffer> {
  const order = await prisma.order.findUnique({
    where:   { id: orderId },
    include: {
      client:  { select: { name: true, phoneMasked: true } },
      vehicle: true,
      slot:    { include: { post: true } },
      items:   true,
    },
  });

  if (!order) throw new Error('Заказ не найден');

  // Динамический импорт чтобы не крашить при отсутствии pdfkit
  let PDFDocument: any;
  try {
    PDFDocument = require('pdfkit');
  } catch {
    throw new Error('pdfkit не установлен. Выполните: npm install pdfkit --save в backend/');
  }

  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data',  (chunk: Buffer) => chunks.push(chunk));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = 595 - 80; // A4 ширина минус отступы

    // ── Шапка ──────────────────────────────────────────
    doc.fontSize(24).font('Helvetica-Bold').text('МОТОР', 40, 40);
    doc.fontSize(10).font('Helvetica').fillColor('#888')
       .text('AI-экосистема автосервиса', 40, 68);

    doc.fontSize(10).fillColor('#000')
       .text(`Заказ-наряд: ${order.orderNumber}`, 350, 40, { align: 'right', width: pageW - 310 })
       .text(`Дата: ${new Date(order.createdAt).toLocaleDateString('ru')}`, 350, 55, { align: 'right', width: pageW - 310 })
       .text(`Статус: ${statusLabel(order.status)}`, 350, 70, { align: 'right', width: pageW - 310 });

    doc.moveTo(40, 90).lineTo(555, 90).strokeColor('#e0e0e0').stroke();

    // ── Клиент и автомобиль ─────────────────────────────
    doc.y = 105;
    doc.fontSize(8).fillColor('#888').font('Helvetica').text('КЛИЕНТ', 40);
    doc.fontSize(11).fillColor('#000').font('Helvetica-Bold')
       .text(order.client?.name ?? '—', 40, doc.y + 2);
    doc.fontSize(10).font('Helvetica').fillColor('#444')
       .text(order.client?.phoneMasked ?? '', 40, doc.y + 2);

    doc.fontSize(8).fillColor('#888').font('Helvetica').text('АВТОМОБИЛЬ', 300, 105);
    doc.fontSize(11).fillColor('#000').font('Helvetica-Bold')
       .text(`${order.vehicle.brand} ${order.vehicle.model}`, 300, 119);
    doc.fontSize(10).font('Helvetica').fillColor('#444')
       .text(`${order.vehicle.year} г.` + (order.vehicle.mileage ? ` · ${order.vehicle.mileage.toLocaleString('ru')} км` : ''), 300, 134);

    // ── Запись ───────────────────────────────────────────
    if (order.slot) {
      doc.y = 160;
      doc.fontSize(8).fillColor('#888').font('Helvetica').text('ЗАПИСЬ');
      doc.fontSize(10).fillColor('#000').font('Helvetica')
         .text(
           `${new Date(order.slot.startAt).toLocaleString('ru', { day:'2-digit', month:'long', hour:'2-digit', minute:'2-digit' })} · ${order.slot.post.name}`,
           40, doc.y + 2
         );
    }

    doc.moveTo(40, doc.y + 16).lineTo(555, doc.y + 16).strokeColor('#e0e0e0').stroke();
    doc.y += 28;

    // ── Жалоба ───────────────────────────────────────────
    doc.fontSize(8).fillColor('#888').font('Helvetica').text('ОПИСАНИЕ ПРОБЛЕМЫ', 40, doc.y);
    doc.y += 12;
    doc.fontSize(10).fillColor('#333').font('Helvetica')
       .text(order.complaintRaw, 40, doc.y, { width: pageW, lineGap: 3 });

    doc.y += 20;
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e0e0e0').stroke();
    doc.y += 16;

    // ── Таблица позиций ──────────────────────────────────
    doc.fontSize(8).fillColor('#888').font('Helvetica')
       .text('НАИМЕНОВАНИЕ', 40,  doc.y)
       .text('КОЛ.', 370, doc.y)
       .text('ЦЕНА',  410, doc.y)
       .text('СУММА', 480, doc.y);

    doc.y += 14;
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#ccc').stroke();
    doc.y += 8;

    let totalRetail = 0;
    for (const item of order.items) {
      const sum = item.qty * Number(item.retailPrice);
      totalRetail += sum;

      doc.fontSize(10).fillColor('#000').font(item.type === 'WORK' ? 'Helvetica-Bold' : 'Helvetica')
         .text(`${item.type === 'WORK' ? '⚙ ' : '⬡ '}${item.name}`, 40, doc.y, { width: 320 });

      const lineY = doc.y;
      doc.fontSize(10).font('Helvetica').fillColor('#333')
         .text(String(item.qty),                         370, lineY)
         .text(fmt(Number(item.retailPrice)) + ' ₽',    410, lineY)
         .text(fmt(sum) + ' ₽',                         480, lineY);

      doc.y = lineY + 18;
      doc.moveTo(40, doc.y - 4).lineTo(555, doc.y - 4).strokeColor('#f0f0f0').stroke();
    }

    // ── Итого ────────────────────────────────────────────
    doc.y += 8;
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#333').lineWidth(1.5).stroke();
    doc.lineWidth(1);
    doc.y += 10;

    doc.fontSize(13).font('Helvetica-Bold').fillColor('#000')
       .text('ИТОГО К ОПЛАТЕ:', 40, doc.y)
       .text(fmt(Number(order.totalRetail ?? totalRetail)) + ' ₽', 480, doc.y);

    // ── Подвал ───────────────────────────────────────────
    doc.y += 50;
    doc.fontSize(8).font('Helvetica').fillColor('#aaa')
       .text('Документ сформирован автоматически системой МОТОР · ' + new Date().toLocaleString('ru'), 40, doc.y, { align: 'center', width: pageW });

    doc.end();
  });
}

function statusLabel(s: string): string {
  const m: Record<string, string> = {
    NEW: 'Новый', ASSESSED: 'Оценён', CONFIRMED: 'Подтверждён',
    IN_PROGRESS: 'В работе', READY: 'Готов', CLOSED: 'Закрыт', CANCELLED: 'Отменён',
  };
  return m[s] ?? s;
}

function fmt(n: number): string {
  return n.toLocaleString('ru', { minimumFractionDigits: 0 });
}
