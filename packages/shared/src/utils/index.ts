// ═══════════════════════════════════════════════════
// МОТОР — Shared Utils
// ═══════════════════════════════════════════════════
import { WEEKDAYS_SHORT, MONTHS_SHORT } from '../constants';

// ── Date helpers ─────────────────────────────────
/** "2025-01-14" → "Вт 14 янв" */
export function formatSlotDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** Returns next N working days (excluding Sunday) starting from tomorrow */
export function getWorkingDays(count: number): string[] {
  const days: string[] = [];
  const d = new Date();
  while (days.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) {  // skip Sunday
      days.push(d.toISOString().split('T')[0]);
    }
  }
  return days;
}

/** "2025-01-14" + "10:00" → "14 янв, 10:00" */
export function formatBookingDateTime(isoDate: string, time: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${time}`;
}

// ── Phone helpers ────────────────────────────────
/** Raw digits → "+7 (999) 123-45-67" */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const d = digits.startsWith('8') ? '7' + digits.slice(1) : digits;
  if (d.length < 11) return raw;
  return `+${d[0]} (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,9)}-${d.slice(9,11)}`;
}

/** "+7 (999) 123-45-67" → "+79991234567" */
export function normalizePhone(formatted: string): string {
  const digits = formatted.replace(/\D/g, '');
  return digits.startsWith('8') ? '+7' + digits.slice(1) : '+' + digits;
}

/** Validate Russian phone */
export function isValidPhone(phone: string): boolean {
  return /^(\+7|8)\d{10}$/.test(phone.replace(/[\s\-()]/g, ''));
}

// ── Order number helpers ─────────────────────────
/** "ЗН-2025-0847" → display as-is, just validate format */
export function isValidOrderNumber(n: string): boolean {
  return /^ЗН-\d{4}-\d{4}$/.test(n);
}

// ── Price helpers ────────────────────────────────
/** 12400 → "12 400 ₽" */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('ru-RU') + ' ₽';
}

/** "от X до Y" range */
export function formatPriceRange(min: number, max: number): string {
  return `от ${formatPrice(min)} до ${formatPrice(max)}`;
}

// ── Car display ──────────────────────────────────
export function formatCarName(make: string, model: string, year?: number): string {
  return [make, model, year].filter(Boolean).join(' ');
}

// ── Status progress (0–100) ──────────────────────
export function bookingProgress(status: string): number {
  const map: Record<string, number> = {
    new: 10,
    estimated: 30,
    confirmed: 45,
    in_progress: 70,
    ready: 95,
    closed: 100,
    cancelled: 0,
  };
  return map[status] ?? 0;
}

// ── Truncate text ────────────────────────────────
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}
