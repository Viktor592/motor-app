-- Итерация 12: Онлайн-запись
CREATE TYPE "BookingStatus" AS ENUM ('PENDING','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW');

CREATE TABLE "bookings" (
  "id"               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "clientName"       TEXT NOT NULL,
  "clientPhone"      TEXT NOT NULL,
  "userId"           TEXT,
  "serviceType"      TEXT NOT NULL,
  "description"      TEXT,
  "vehicleMake"      TEXT,
  "vehicleModel"     TEXT,
  "vehiclePlate"     TEXT,
  "scheduledAt"      TIMESTAMP NOT NULL,
  "durationMin"      INTEGER NOT NULL DEFAULT 60,
  "status"           "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "masterId"         TEXT,
  "source"           TEXT NOT NULL DEFAULT 'WIDGET',
  "convertedOrderId" TEXT,
  "createdAt"        TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "bookings_scheduledAt_idx"  ON "bookings"("scheduledAt");
CREATE INDEX "bookings_status_idx"       ON "bookings"("status");
CREATE INDEX "bookings_clientPhone_idx"  ON "bookings"("clientPhone");
