-- Итерации 13-15: Лояльность, напоминания ТО

CREATE TYPE "LoyaltyTxType" AS ENUM ('EARN','REDEEM','REFERRAL','PROMO','EXPIRE');

CREATE TABLE "loyalty_transactions" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL,
  "type"        "LoyaltyTxType" NOT NULL,
  "points"      INTEGER NOT NULL,
  "orderId"     TEXT,
  "description" TEXT,
  "expiresAt"   TIMESTAMP,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "loyalty_tx_userId_idx"  ON "loyalty_transactions"("userId");
CREATE INDEX "loyalty_tx_orderId_idx" ON "loyalty_transactions"("orderId");

CREATE TABLE "referrals" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "referrerId"  TEXT NOT NULL,
  "refereeId"   TEXT NOT NULL UNIQUE,
  "bonusPoints" INTEGER NOT NULL DEFAULT 500,
  "isPaid"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "referrals_referrerId_idx" ON "referrals"("referrerId");

CREATE TABLE "to_reminders" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "vehicleId"  TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "type"       TEXT NOT NULL,
  "dueDate"    TIMESTAMP NOT NULL,
  "dueMileage" INTEGER,
  "isSent"     BOOLEAN NOT NULL DEFAULT false,
  "sentAt"     TIMESTAMP,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "to_reminders_vehicleId_idx" ON "to_reminders"("vehicleId");
CREATE INDEX "to_reminders_dueDate_idx"   ON "to_reminders"("dueDate");
CREATE INDEX "to_reminders_isSent_idx"    ON "to_reminders"("isSent");
