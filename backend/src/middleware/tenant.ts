/**
 * Tenant middleware — определяет тенанта по:
 * 1. Поддомену: motor-spb.motor-app.ru → slug = "motor-spb"
 * 2. Кастомному домену: победа-авто.рф → ищем по domain
 * 3. Заголовку X-Tenant-Slug (для мобильного приложения)
 */
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from './errorHandler';

// Расширяем Request
declare global {
  namespace Express {
    interface Request {
      tenantId?:   string;
      tenantSlug?: string;
      tenantPlan?: string;
    }
  }
}

const BASE_DOMAIN = process.env.BASE_DOMAIN ?? 'motor-app.ru';

// Кэш тенантов на 5 минут
const cache = new Map<string, { id: string; slug: string; plan: string; status: string; expiresAt: number }>();

async function resolveTenant(slug?: string, domain?: string) {
  const cacheKey = slug ?? domain ?? '';
  const cached   = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const tenant = await prisma.tenant.findFirst({
    where: slug ? { slug } : { domain },
    select: { id: true, slug: true, plan: true, status: true },
  });

  if (!tenant) return null;

  const entry = { ...tenant, expiresAt: Date.now() + 5 * 60 * 1000 };
  cache.set(cacheKey, entry);
  return entry;
}

export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const host = req.hostname ?? '';

    // Вариант 1: заголовок X-Tenant-Slug (мобилка, API)
    const headerSlug = req.headers['x-tenant-slug'] as string | undefined;

    // Вариант 2: поддомен (motor-spb.motor-app.ru)
    let subdomainSlug: string | undefined;
    if (host.endsWith(`.${BASE_DOMAIN}`)) {
      subdomainSlug = host.replace(`.${BASE_DOMAIN}`, '');
    }

    // Вариант 3: кастомный домен
    const customDomain = (!subdomainSlug && host !== BASE_DOMAIN) ? host : undefined;

    const slug = headerSlug ?? subdomainSlug;
    const tenant = await resolveTenant(slug, customDomain);

    if (!tenant) {
      // Нет тенанта — работаем без изоляции (для super-admin и онбординга)
      return next();
    }

    if (tenant.status === 'SUSPENDED') {
      throw new AppError(402, 'Подписка приостановлена. Пожалуйста, оплатите доступ.');
    }
    if (tenant.status === 'CANCELLED') {
      throw new AppError(403, 'Аккаунт отменён.');
    }

    req.tenantId   = tenant.id;
    req.tenantSlug = tenant.slug;
    req.tenantPlan = tenant.plan;

    next();
  } catch (e) { next(e); }
}

// Инвалидация кэша при обновлении тенанта
export function invalidateTenantCache(slug: string) {
  cache.delete(slug);
}
