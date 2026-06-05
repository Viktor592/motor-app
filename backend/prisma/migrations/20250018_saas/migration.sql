-- Итерация 18: Мультитенантность SaaS

CREATE TYPE "PlanType"     AS ENUM ('STARTER','PRO','BUSINESS','TRIAL');
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE','SUSPENDED','TRIAL','CANCELLED');
CREATE TYPE "SubStatus"    AS ENUM ('ACTIVE','PAST_DUE','CANCELLED');

CREATE TABLE "tenants" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "slug"         TEXT NOT NULL UNIQUE,
  "name"         TEXT NOT NULL,
  "domain"       TEXT UNIQUE,
  "plan"         "PlanType"     NOT NULL DEFAULT 'TRIAL',
  "status"       "TenantStatus" NOT NULL DEFAULT 'TRIAL',
  "trialEndsAt"  TIMESTAMP,
  "paidUntil"    TIMESTAMP,
  "logoUrl"      TEXT,
  "primaryColor" TEXT DEFAULT '#ff6200',
  "ownerEmail"   TEXT NOT NULL UNIQUE,
  "ownerPhone"   TEXT,
  "timezone"     TEXT NOT NULL DEFAULT 'Europe/Moscow',
  "currency"     TEXT NOT NULL DEFAULT 'RUB',
  "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "tenants_slug_idx"   ON "tenants"("slug");
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

CREATE TABLE "tenant_users" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"  TEXT NOT NULL REFERENCES "tenants"("id"),
  "userId"    TEXT NOT NULL,
  "role"      TEXT NOT NULL DEFAULT 'STAFF',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("tenantId","userId")
);
CREATE INDEX "tenant_users_tenantId_idx" ON "tenant_users"("tenantId");
CREATE INDEX "tenant_users_userId_idx"   ON "tenant_users"("userId");

CREATE TABLE "subscriptions" (
  "id"               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"         TEXT NOT NULL UNIQUE REFERENCES "tenants"("id"),
  "plan"             "PlanType" NOT NULL,
  "status"           "SubStatus" NOT NULL DEFAULT 'ACTIVE',
  "priceRub"         INTEGER NOT NULL,
  "yukassaSubId"     TEXT UNIQUE,
  "currentPeriodEnd" TIMESTAMP,
  "cancelAtEnd"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"        TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "payments" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "subscriptionId" TEXT NOT NULL REFERENCES "subscriptions"("id"),
  "amountRub"      INTEGER NOT NULL,
  "status"         TEXT NOT NULL,
  "yukassaId"      TEXT UNIQUE,
  "paidAt"         TIMESTAMP,
  "createdAt"      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "payments_subscriptionId_idx" ON "payments"("subscriptionId");
