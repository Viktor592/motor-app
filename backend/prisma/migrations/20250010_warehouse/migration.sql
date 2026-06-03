-- Итерация 10: Склад и запчасти

-- Поставщики
CREATE TYPE "SupplierType" AS ENUM ('EXIST', 'AUTODOC', 'MANUAL');
CREATE TYPE "SupplierOrderStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'DELIVERED', 'CANCELLED');
CREATE TYPE "StockMovementType" AS ENUM ('IN', 'OUT', 'RESERVE', 'UNRESERVE', 'ADJUSTMENT');

CREATE TABLE "suppliers" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name"      TEXT NOT NULL,
  "type"      "SupplierType" NOT NULL DEFAULT 'MANUAL',
  "apiKey"    TEXT,
  "apiUrl"    TEXT,
  "phone"     TEXT,
  "email"     TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Движения склада
CREATE TABLE "stock_movements" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "partId"      TEXT NOT NULL REFERENCES "parts"("id"),
  "type"        "StockMovementType" NOT NULL,
  "qty"         INTEGER NOT NULL,
  "orderId"     TEXT,
  "supplierId"  TEXT REFERENCES "suppliers"("id"),
  "costPrice"   DECIMAL(12,2),
  "comment"     TEXT,
  "performedBy" TEXT NOT NULL,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "stock_movements_partId_idx"   ON "stock_movements"("partId");
CREATE INDEX "stock_movements_orderId_idx"  ON "stock_movements"("orderId");
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- Резервы
CREATE TABLE "stock_reservations" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "partId"    TEXT NOT NULL REFERENCES "parts"("id"),
  "orderId"   TEXT NOT NULL,
  "qty"       INTEGER NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "stock_reservations_partId_idx"  ON "stock_reservations"("partId");
CREATE INDEX "stock_reservations_orderId_idx" ON "stock_reservations"("orderId");

-- Заказы поставщикам
CREATE TABLE "supplier_orders" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "supplierId"  TEXT NOT NULL REFERENCES "suppliers"("id"),
  "status"      "SupplierOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "totalCost"   DECIMAL(12,2),
  "comment"     TEXT,
  "createdBy"   TEXT NOT NULL,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "supplier_orders_supplierId_idx" ON "supplier_orders"("supplierId");
CREATE INDEX "supplier_orders_status_idx"     ON "supplier_orders"("status");

CREATE TABLE "supplier_order_items" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "supplierOrderId" TEXT NOT NULL REFERENCES "supplier_orders"("id"),
  "partId"          TEXT,
  "article"         TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "qty"             INTEGER NOT NULL,
  "costPrice"       DECIMAL(12,2) NOT NULL,
  "isReceived"      BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX "supplier_order_items_supplierOrderId_idx" ON "supplier_order_items"("supplierOrderId");
