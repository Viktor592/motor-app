-- Итерация 21: ЭДО, ФНС, Онлайн-касса 54-ФЗ

CREATE TYPE "EdoDocType"    AS ENUM ('ACT','INVOICE','UPD','INVOICE_RETURN');
CREATE TYPE "EdoDocStatus"  AS ENUM ('DRAFT','SENT','SIGNED','REJECTED','CANCELLED');
CREATE TYPE "EdoProvider"   AS ENUM ('DIADOC','SBIS','KONTUR','MANUAL');
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING','DONE','ERROR');

-- Документы ЭДО
CREATE TABLE "edo_documents" (
  "id"               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId"          TEXT,
  "clientId"         TEXT,
  "type"             "EdoDocType"   NOT NULL,
  "status"           "EdoDocStatus" NOT NULL DEFAULT 'DRAFT',
  "provider"         "EdoProvider"  NOT NULL DEFAULT 'MANUAL',
  "docNumber"        TEXT NOT NULL,
  "docDate"          TIMESTAMP NOT NULL DEFAULT NOW(),
  "totalAmount"      DECIMAL(12,2) NOT NULL,
  "vatAmount"        DECIMAL(12,2),
  "externalId"       TEXT,
  "externalUrl"      TEXT,
  "pdfUrl"           TEXT,
  "counterpartyName" TEXT,
  "counterpartyInn"  TEXT,
  "counterpartyKpp"  TEXT,
  "createdBy"        TEXT NOT NULL,
  "createdAt"        TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "edo_docs_orderId_idx"  ON "edo_documents"("orderId");
CREATE INDEX "edo_docs_status_idx"   ON "edo_documents"("status");
CREATE INDEX "edo_docs_docDate_idx"  ON "edo_documents"("docDate");

-- Настройки ЭДО (одна строка)
CREATE TABLE "edo_settings" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "provider"     "EdoProvider" NOT NULL DEFAULT 'MANUAL',
  "diadocToken"  TEXT,
  "diadocBoxId"  TEXT,
  "sbisLogin"    TEXT,
  "sbisPassword" TEXT,
  "orgName"      TEXT,
  "orgInn"       TEXT,
  "orgKpp"       TEXT,
  "orgOgrn"      TEXT,
  "orgAddress"   TEXT,
  "orgDirector"  TEXT,
  "bankName"     TEXT,
  "bankBik"      TEXT,
  "bankAccount"  TEXT,
  "bankCorr"     TEXT,
  "taxSystem"    TEXT NOT NULL DEFAULT 'USN_INCOME',
  "vatRate"      INTEGER NOT NULL DEFAULT 0,
  "updatedAt"    TIMESTAMP NOT NULL DEFAULT NOW()
);
INSERT INTO "edo_settings" ("id") VALUES (gen_random_uuid()::text);

-- КУДиР
CREATE TABLE "kudir_entries" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "entryDate" TIMESTAMP NOT NULL,
  "docNumber" TEXT NOT NULL,
  "docDate"   TIMESTAMP NOT NULL,
  "operation" TEXT NOT NULL,
  "income"    DECIMAL(12,2),
  "expense"   DECIMAL(12,2),
  "orderId"   TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "kudir_entryDate_idx" ON "kudir_entries"("entryDate");

-- Фискальные чеки
CREATE TABLE "fiscal_receipts" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId"      TEXT NOT NULL,
  "paymentId"    TEXT,
  "status"       "ReceiptStatus" NOT NULL DEFAULT 'PENDING',
  "atolUuid"     TEXT UNIQUE,
  "fiscalNumber" TEXT,
  "fdNumber"     INTEGER,
  "fnNumber"     TEXT,
  "totalAmount"  DECIMAL(12,2) NOT NULL,
  "cashAmount"   DECIMAL(12,2),
  "cardAmount"   DECIMAL(12,2),
  "receiptQr"    TEXT,
  "receiptUrl"   TEXT,
  "errorMessage" TEXT,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "fiscal_receipts_orderId_idx" ON "fiscal_receipts"("orderId");
CREATE INDEX "fiscal_receipts_status_idx"  ON "fiscal_receipts"("status");

-- МЧД и журнал авто-отчётности
CREATE TYPE "ReportType"   AS ENUM ('USN_DECLARATION','KUDIR','SFR_EFS1','ROSSTAT_1MF','NDC');
CREATE TYPE "ReportStatus" AS ENUM ('QUEUED','SENT','ACCEPTED','REJECTED','ERROR');

CREATE TABLE "auto_reports" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type"       "ReportType"   NOT NULL,
  "status"     "ReportStatus" NOT NULL DEFAULT 'QUEUED',
  "year"       INTEGER NOT NULL,
  "quarter"    INTEGER,
  "operator"   TEXT NOT NULL DEFAULT 'manual',
  "trackingId" TEXT,
  "xmlContent" TEXT,
  "message"    TEXT,
  "sentAt"     TIMESTAMP,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "auto_reports_type_idx"   ON "auto_reports"("type");
CREATE INDEX "auto_reports_status_idx" ON "auto_reports"("status");

CREATE TABLE "mchd_records" (
  "id"                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "mchDId"              TEXT NOT NULL UNIQUE,
  "principalInn"        TEXT NOT NULL,
  "representativeName"  TEXT NOT NULL,
  "authorities"         TEXT NOT NULL,
  "validFrom"           TIMESTAMP NOT NULL,
  "validTo"             TIMESTAMP NOT NULL,
  "status"              TEXT NOT NULL DEFAULT 'active',
  "registeredVia"       TEXT NOT NULL DEFAULT 'manual',
  "fnsId"               TEXT,
  "xmlContent"          TEXT,
  "createdAt"           TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "mchd_principalInn_idx" ON "mchd_records"("principalInn");
