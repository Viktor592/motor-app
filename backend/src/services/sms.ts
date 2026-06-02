/**
 * МОТОР — Сервис OTP-уведомлений (всё бесплатно)
 *
 * Приоритет:
 *   1. Email через Gmail SMTP (nodemailer, бесплатно)
 *   2. Telegram Bot (telegraf, бесплатно если клиент дал chat_id)
 *   3. WhatsApp через Baileys (бесплатно, self-hosted)
 *   4. Лог в консоль (development)
 *
 * Настройка:
 *   OTP_CHANNEL=email|telegram|console
 *   GMAIL_USER=your@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  (App Password, не обычный пароль)
 *   TELEGRAM_BOT_TOKEN=123:ABC...
 */

export const OTP_TTL_MS       = 5 * 60 * 1000;  // 5 минут
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ── Email через Gmail SMTP ────────────────────────────────────────────────────
async function sendEmail(to: string, otp: string): Promise<void> {
  let nodemailer: any;
  try { nodemailer = require('nodemailer'); }
  catch { throw new Error('nodemailer не установлен: npm install nodemailer'); }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from:    `"МОТОР Автосервис" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Код подтверждения: ${otp}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto">
        <h2 style="color:#ff6200">МОТОР</h2>
        <p>Ваш код подтверждения:</p>
        <div style="font-size:40px;font-weight:900;letter-spacing:8px;color:#111;padding:16px 0">${otp}</div>
        <p style="color:#888;font-size:12px">Код действителен 5 минут.<br>Не передавайте его никому.</p>
      </div>
    `,
  });
}

// ── Telegram Bot ──────────────────────────────────────────────────────────────
async function sendTelegram(chatId: string, otp: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN не задан');

  const text = `🔑 *МОТОР* — Код подтверждения:\n\n*${otp}*\n\n_Действителен 5 минут_`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });

  if (!res.ok) {
    const err = await res.json() as any;
    throw new Error(`Telegram: ${err.description}`);
  }
}

// ── Web Push (без Firebase, через VAPID) ──────────────────────────────────────
async function sendWebPush(subscription: string, otp: string): Promise<void> {
  let webpush: any;
  try { webpush = require('web-push'); }
  catch { throw new Error('web-push не установлен: npm install web-push'); }

  const vapidPublic  = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail   = process.env.VAPID_EMAIL || 'mailto:admin@motor-app.ru';

  if (!vapidPublic || !vapidPrivate) throw new Error('VAPID ключи не заданы');

  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);

  await webpush.sendNotification(
    JSON.parse(subscription),
    JSON.stringify({ title: 'МОТОР', body: `Код: ${otp}`, otp })
  );
}

// ── Главная функция ──────────────────────────────────────────────────────────
export async function sendOtpNotification(
  target:  string,   // email, telegram chat_id, или телефон (для лога)
  otp:     string,
  channel: string = process.env.OTP_CHANNEL || 'console'
): Promise<void> {
  switch (channel) {
    case 'email':
      await sendEmail(target, otp);
      console.log(`[OTP] Email → ${target}`);
      break;

    case 'telegram':
      await sendTelegram(target, otp);
      console.log(`[OTP] Telegram → ${target}`);
      break;

    case 'webpush':
      await sendWebPush(target, otp);
      console.log(`[OTP] WebPush → ${target}`);
      break;

    default:
      // Development / demo — просто пишем в лог
      console.log(`\n┌─────────────────────────────┐`);
      console.log(`│  OTP для ${target.padEnd(17)}│`);
      console.log(`│  Код: ${otp.padEnd(23)}│`);
      console.log(`└─────────────────────────────┘\n`);
  }
}

// Обратная совместимость — auth.ts вызывает sendSms
export async function sendSms(phone: string, text: string): Promise<void> {
  const otp = text.match(/\d{4}/)?.[0] ?? '----';
  await sendOtpNotification(phone, otp);
}
