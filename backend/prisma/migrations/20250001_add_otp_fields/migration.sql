-- AlterTable: добавить OTP поля и сделать passwordHash nullable
ALTER TABLE "users"
  ALTER COLUMN "passwordHash" SET DEFAULT '',
  ADD COLUMN IF NOT EXISTS "otpCode"      TEXT,
  ADD COLUMN IF NOT EXISTS "otpExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "otpAttempts"  INTEGER NOT NULL DEFAULT 0;
