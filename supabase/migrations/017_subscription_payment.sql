-- ============================================================
-- MIGRATION 017: Add payment tracking to subscriptions
-- ============================================================

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_paid_at DATE;
