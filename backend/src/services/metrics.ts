/**
 * Prometheus-метрики для backend
 * GET /metrics — эндпоинт для Prometheus scrape
 */
import { Request, Response, NextFunction, Router } from 'express';

interface Counter { value: number; labels: Record<string, string>; }
interface Histogram { buckets: number[]; counts: number[]; sum: number; count: number; labels: Record<string, string>; }

const counters   = new Map<string, Counter>();
const histograms = new Map<string, Histogram>();
const gauges     = new Map<string, number>();

// ── API метрики ───────────────────────────────────────────────

export function incCounter(name: string, labels: Record<string, string> = {}) {
  const key = name + JSON.stringify(labels);
  const cur = counters.get(key) ?? { value: 0, labels };
  cur.value++;
  counters.set(key, cur);
}

export function setGauge(name: string, value: number) {
  gauges.set(name, value);
}

export function observeHistogram(name: string, value: number, labels: Record<string, string> = {}) {
  const BUCKETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
  const key = name + JSON.stringify(labels);
  const cur = histograms.get(key) ?? { buckets: BUCKETS, counts: new Array(BUCKETS.length).fill(0), sum: 0, count: 0, labels };
  cur.sum   += value;
  cur.count += 1;
  cur.buckets.forEach((b, i) => { if (value <= b) cur.counts[i]++; });
  histograms.set(key, cur);
}

// ── HTTP middleware ────────────────────────────────────────────

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route    = req.route?.path ?? req.path.replace(/\/[0-9a-f-]{36}/gi, '/:id');
    const labels   = { method: req.method, route, status: String(res.statusCode) };

    incCounter('http_requests_total', labels);
    observeHistogram('http_request_duration_seconds', duration, { method: req.method, route });

    if (res.statusCode >= 500) incCounter('http_errors_total', { route });
  });
  next();
}

// ── /metrics эндпоинт ─────────────────────────────────────────

export const metricsRouter = Router();

metricsRouter.get('/metrics', (_req: Request, res: Response) => {
  const lines: string[] = [];
  const ts = Date.now();

  // Counters
  counters.forEach((c, key) => {
    const name  = key.replace(/\{.*/, '');
    const lStr  = Object.entries(c.labels).map(([k,v]) => `${k}="${v}"`).join(',');
    lines.push(`# TYPE ${name} counter`);
    lines.push(`${name}{${lStr}} ${c.value} ${ts}`);
  });

  // Gauges
  gauges.forEach((v, name) => {
    lines.push(`# TYPE ${name} gauge`);
    lines.push(`${name} ${v} ${ts}`);
  });

  // Histograms
  histograms.forEach((h, key) => {
    const name = key.replace(/\{.*/, '');
    const lStr = Object.entries(h.labels).map(([k,v]) => `${k}="${v}"`).join(',');
    lines.push(`# TYPE ${name} histogram`);
    h.buckets.forEach((b, i) => {
      lines.push(`${name}_bucket{le="${b}",${lStr}} ${h.counts[i]} ${ts}`);
    });
    lines.push(`${name}_bucket{le="+Inf",${lStr}} ${h.count} ${ts}`);
    lines.push(`${name}_sum{${lStr}} ${h.sum} ${ts}`);
    lines.push(`${name}_count{${lStr}} ${h.count} ${ts}`);
  });

  // Runtime
  const mem = process.memoryUsage();
  lines.push('# TYPE process_heap_bytes gauge');
  lines.push(`process_heap_bytes ${mem.heapUsed} ${ts}`);
  lines.push('# TYPE process_rss_bytes gauge');
  lines.push(`process_rss_bytes ${mem.rss} ${ts}`);
  lines.push('# TYPE process_uptime_seconds gauge');
  lines.push(`process_uptime_seconds ${Math.floor(process.uptime())} ${ts}`);

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(lines.join('\n') + '\n');
});

// ── Периодические gauge-метрики из БД ────────────────────────
// Вызывается из scheduler каждые 5 минут
export async function updateDbMetrics(prisma: any) {
  try {
    const [orders, users, bookings] = await Promise.all([
      prisma.order.count({ where: { status: { in: ['PENDING','IN_PROGRESS','WAITING_PARTS','QUALITY_CHECK','DONE'] } } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
    ]);
    setGauge('motor_active_orders',    orders);
    setGauge('motor_clients_total',    users);
    setGauge('motor_pending_bookings', bookings);
  } catch (e) {
    console.warn('[Metrics] DB metrics error:', e);
  }
}
