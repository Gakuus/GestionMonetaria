-- ============================================================
-- MIGRATION 016: Nueva categoría Deporte
-- ============================================================

INSERT INTO expense_categories (name, icon) VALUES
  ('Deporte', 'bi-activity')
ON CONFLICT DO NOTHING;
