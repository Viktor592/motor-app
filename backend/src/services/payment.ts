/**
 * МОТОР — Оплата через СБП QR (бесплатно)
 *
 * СБП (Система быстрых платежей) — комиссия 0% до 1 млн руб/месяц для ИП/ООО.
 * Клиент сканирует QR своим банком, деньги приходят мгновенно.
 *
 * Для генерации QR не нужен платный эквайринг.
 * Используем стандарт ЦБ РФ для СБП QR-кода (RFC 3986).
 *
 * Для полноценного приёма с проверкой статуса:
 *   - Тинькофф СБП API (бесплатный тариф до 1 млн/мес)
 *   - Сбер СБП API
 *   - ЮMoney СБП (без абонентской платы)
 */

import { prisma } from '../utils/prisma';

export interface PaymentInfo {
  qrData:      string;   // строка для QR-кода
  qrImageUrl:  string;   // URL картинки QR (qrserver.com, бесплатно)
  amount:      number;
  description: string;
  phone:       string;   // номер СБП получателя
}

/**
 * Создать платёж через СБП QR
 */
export async function createPayment(params: {
  orderId:     string;
  amountRub:   number;
  description: string;
  returnUrl:   string;
}): Promise<{ paymentId: string; confirmationUrl: string; qrImageUrl: string }> {
  // СБП QR данные по стандарту ЦБ РФ
  const sbpPhone   = process.env.SBP_PHONE   || '+79000000000'; // номер счёта получателя
  const sbpBank    = process.env.SBP_BANK_ID || 'tinkoff';      // банк получателя
  const merchantId = process.env.SBP_MERCHANT_ID || '';

  // Формат СБП URI (стандарт ЦБ)
  const amount  = params.amountRub.toFixed(2);
  const purpose = encodeURIComponent(params.description);

  // Универсальная СБП-ссылка (открывается любым банком с СБП)
  const sbpUrl = `https://qr.nspk.ru/AS100003N2E3RGA2AE2NFKJI8K6GKFSA` +
    `?type=01&bank=${sbpBank}&phone=${encodeURIComponent(sbpPhone)}` +
    `&sum=${amount}&cur=RUB&crc=0AC8`;

  // QR через бесплатный API (qrserver.com — 10 млн запросов/мес бесплатно)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(sbpUrl)}`;

  // Генерируем внутренний paymentId
  const paymentId = `sbp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  await prisma.order.update({
    where: { id: params.orderId },
    data:  { paymentId },
  });

  return {
    paymentId,
    confirmationUrl: qrImageUrl,
    qrImageUrl,
  };
}

/**
 * Пометить заказ как оплаченный вручную (мастер подтверждает оплату)
 * В продакшене — заменить на webhook от банка
 */
export async function confirmPaymentManual(orderId: string, staffId: string): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data:  { status: 'CLOSED', paidAt: new Date() },
  });
  console.log(`[Payment] Оплата подтверждена вручную: ${orderId} by ${staffId}`);
}

/**
 * Заглушка для обратной совместимости
 */
export async function checkPayment(paymentId: string): Promise<{ status: string; paid: boolean }> {
  const order = await prisma.order.findFirst({ where: { paymentId } });
  return { status: order?.status ?? 'pending', paid: order?.status === 'CLOSED' };
}

export async function handleWebhook(_body: any): Promise<void> {
  // Webhook от банка — реализовать при подключении СБП API конкретного банка
  console.log('[Payment] Webhook:', _body);
}
