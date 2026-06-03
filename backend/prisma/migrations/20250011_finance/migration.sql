-- Итерация 11: Финансы — кассовые смены, транзакции, бюджет

CREATE TYPE "ShiftStatus"       AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "TransactionType"   AS ENUM ('INCOME_CASH', 'INCOME_CARD', 'EXPENSE', 'WITHDRAWAL', 'DEPOSIT');
CREATE TYPE "ExpenseCategory"   AS ENUM ('SALARY', 'RENT', 'PARTS_PURCHASE', 'UTILITIES', 'MARKETING', 'EQUIPMENT', 'OTHER');

-- Кассовые смены
CREATE TABLE "cash_shifts" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "openedBy"     TEXT NOT NULL,
  "closedBy"     TEXT,
  "status"       "ShiftStatus" NOT NULL DEFAULT 'OPEN',
  "openCash"     DECIMAL(12,2) NOT NULL DEFAULT 0,
  "closeCash"    DECIMAL(12,2),
  "expectedCash" DECIMAL(12,2),
  "diffCash"     DECIMAL(12,2),
  "openedAt"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "closedAt"     TIMESTAMP,
  "comment"      TEXT
);
CREATE INDEX "cash_shifts_status_idx"   ON "cash_shifts"("status");
CREATE INDEX "cash_shifts_openedAt_idx" ON "cash_shifts"("openedAt");

-- Транзакции
CREATE TABLE "cash_transactions" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shiftId"     TEXT NOT NULL REFERENCES "cash_shifts"("id"),
  "type"        "TransactionType" NOT NULL,
  "category"    "ExpenseCategory",
  "amount"      DECIMAL(12,2) NOT NULL,
  "orderId"     TEXT,
  "description" TEXT,
  "performedBy" TEXT NOT NULL,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "cash_transactions_shiftId_idx"   ON "cash_transactions"("shiftId");
CREATE INDEX "cash_transactions_type_idx"      ON "cash_transactions"("type");
CREATE INDEX "cash_transactions_createdAt_idx" ON "cash_transactions"("createdAt");

-- Бюджеты расходов
CREATE TABLE "expense_budgets" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "category"      "ExpenseCategory" NOT NULL UNIQUE,
  "monthlyAmount" DECIMAL(12,2) NOT NULL,
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedBy"     TEXT
);

-- Бюджет по умолчанию
INSERT INTO "expense_budgets" ("id", "category", "monthlyAmount") VALUES
  (gen_random_uuid()::text, 'SALARY',         150000),
  (gen_random_uuid()::text, 'RENT',            50000),
  (gen_random_uuid()::text, 'PARTS_PURCHASE',  80000),
  (gen_random_uuid()::text, 'UTILITIES',       15000),
  (gen_random_uuid()::text, 'MARKETING',       10000),
  (gen_random_uuid()::text, 'EQUIPMENT',       20000),
  (gen_random_uuid()::text, 'OTHER',           10000);
