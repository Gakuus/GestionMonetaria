-- ============================================================
-- MIGRATION 014: Nueva categoría Auto
-- ============================================================

INSERT INTO expense_categories (name, icon) VALUES
  ('Auto', 'bi-car-front')
ON CONFLICT DO NOTHING;
