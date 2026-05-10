-- Moderator role for customer-care dashboard (orders + human support replies).
-- Requires PostgreSQL 15+ for ADD VALUE IF NOT EXISTS on enums.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
  END IF;
END $$;
