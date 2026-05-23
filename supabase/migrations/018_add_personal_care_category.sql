-- ============================================================
-- MIGRATION 018: Nueva categoría Cuidado Personal
-- ============================================================

INSERT INTO expense_categories (name, icon) VALUES
  ('Cuidado Personal', 'bi-handbag')
ON CONFLICT DO NOTHING;
