-- ============================================================
-- MIGRATION 020: Nueva categoría Gastos Hormiga
-- ============================================================

INSERT INTO expense_categories (name, icon) VALUES
  ('Gastos Hormiga', 'bi-bug')
ON CONFLICT DO NOTHING;
