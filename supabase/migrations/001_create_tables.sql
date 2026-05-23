-- ============================================================
-- MIGRATION 001: Creación de tablas principales
-- ============================================================

-- 1. Hogares
CREATE TABLE IF NOT EXISTS households (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Perfiles de usuario (vinculados a auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Miembros del hogar
CREATE TABLE IF NOT EXISTS household_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, profile_id)
);

-- 4. Categorías de ingresos
CREATE TABLE IF NOT EXISTS income_categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL,
  icon  TEXT NOT NULL DEFAULT 'bi-cash'
);

-- 5. Categorías de gastos
CREATE TABLE IF NOT EXISTS expense_categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL,
  icon  TEXT NOT NULL DEFAULT 'bi-cart'
);

-- 6. Ingresos
CREATE TABLE IF NOT EXISTS incomes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id       UUID NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES income_categories(id),
  amount          DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description     TEXT DEFAULT '',
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring    BOOLEAN DEFAULT FALSE,
  recurring_type  TEXT CHECK (recurring_type IN ('weekly', 'monthly', 'yearly')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Gastos
CREATE TABLE IF NOT EXISTS expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id       UUID NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES expense_categories(id),
  amount          DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description     TEXT DEFAULT '',
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('cash', 'debit', 'credit', 'transfer')),
  is_recurring    BOOLEAN DEFAULT FALSE,
  recurring_type  TEXT CHECK (recurring_type IN ('weekly', 'monthly', 'yearly')),
  receipt_url     TEXT,
  is_ant_expense  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Presupuestos
CREATE TABLE IF NOT EXISTS budgets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id   UUID NOT NULL REFERENCES expense_categories(id),
  month         DATE NOT NULL,
  amount        DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, category_id, month)
);

-- 9. Suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  service_name    TEXT NOT NULL,
  amount          DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  billing_date    INTEGER NOT NULL CHECK (billing_date BETWEEN 1 AND 31),
  category_id     UUID NOT NULL REFERENCES expense_categories(id),
  billing_period  TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')) DEFAULT 'monthly',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_expenses_household_date ON expenses(household_id, date);
CREATE INDEX IF NOT EXISTS idx_incomes_household_date ON incomes(household_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_profile ON household_members(profile_id);
