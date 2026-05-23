-- ============================================================
-- MIGRATION 004: Seed data - Categorías
-- ============================================================

-- Categorías de ingresos
INSERT INTO income_categories (name, icon) VALUES
  ('Sueldo', 'bi-briefcase'),
  ('Freelance', 'bi-laptop'),
  ('Inversiones', 'bi-graph-up'),
  ('Venta', 'bi-tag'),
  ('Alquiler', 'bi-house-door'),
  ('Otros', 'bi-three-dots')
ON CONFLICT DO NOTHING;

-- Categorías de gastos
INSERT INTO expense_categories (name, icon) VALUES
  ('Alimentación', 'bi-cart-check'),
  ('Servicios', 'bi-lightning'),
  ('Transporte', 'bi-fuel-pump'),
  ('Salud', 'bi-heart-pulse'),
  ('Educación', 'bi-book'),
  ('Entretenimiento', 'bi-controller'),
  ('Vestimenta', 'bi-handbag'),
  ('Suscripciones', 'bi-arrow-repeat'),
  ('Ahorro/Inversión', 'bi-piggy-bank'),
  ('Impuestos', 'bi-file-earmark-text'),
  ('Mascotas', 'bi-heart'),
  ('Otros', 'bi-three-dots')
ON CONFLICT DO NOTHING;
