-- Итерация 16: Интеграции с системами учёта

CREATE TYPE "AccountingSystem" AS ENUM ('NONE','ONS_1C','OPTIM_GARAGE');
CREATE TYPE "SyncStatus"       AS ENUM ('OK','ERROR','PARTIAL');

CREATE TABLE "accounting_settings" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "system"      "AccountingSystem" NOT NULL DEFAULT 'NONE',
  "oneC_url"    TEXT,
  "oneC_user"   TEXT,
  "oneC_pass"   TEXT,
  "optimUrl"    TEXT,
  "optimApiKey" TEXT,
  "autoSync"    BOOLEAN NOT NULL DEFAULT false,
  "lastSyncAt"  TIMESTAMP,
  "syncErrors"  TEXT,
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Одна строка настроек
INSERT INTO "accounting_settings" ("id","system") VALUES (gen_random_uuid()::text,'NONE');

CREATE TABLE "sync_logs" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "system"     "AccountingSystem" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId"   TEXT NOT NULL,
  "status"     "SyncStatus" NOT NULL,
  "message"    TEXT,
  "payload"    TEXT,
  "response"   TEXT,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "sync_logs_entityId_idx"  ON "sync_logs"("entityId");
CREATE INDEX "sync_logs_createdAt_idx" ON "sync_logs"("createdAt");
