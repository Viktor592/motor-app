import { Request, Response, NextFunction } from 'express';

const map = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000; // 1 минута
const MAX_REQUESTS = 100;

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = req.ip ?? 'unknown';
  const now = Date.now();
  const entry = map.get(key);

  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Слишком много запросов. Попробуйте через минуту.',
      code: 'RATE_LIMIT',
    });
  }

  next();
}
