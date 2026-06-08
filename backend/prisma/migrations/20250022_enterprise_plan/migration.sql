-- Добавить тариф ENTERPRISE и обновить цены
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'ENTERPRISE';
