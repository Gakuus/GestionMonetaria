-- ============================================================
-- MIGRATION 003: Row Level Security (RLS) Policies
-- ============================================================

-- Funciones auxiliares (security definer evita recursion infinita)
CREATE OR REPLACE FUNCTION fn_get_user_household_id()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT household_id FROM household_members WHERE profile_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION fn_is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE profile_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION fn_is_member_of(household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE profile_id = auth.uid() AND household_members.household_id = fn_is_member_of.household_id
  );
$$;

CREATE OR REPLACE FUNCTION fn_is_admin_of(household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE profile_id = auth.uid() AND role = 'admin' AND household_members.household_id = fn_is_admin_of.household_id
  );
$$;

-- HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS: households
-- ========================================
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (fn_is_member_of(id));

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (true);

-- ========================================
-- POLÍTICAS: profiles
-- ========================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ========================================
-- POLÍTICAS: household_members
-- ========================================
CREATE POLICY "Members can view household members"
  ON household_members FOR SELECT
  USING (fn_is_member_of(household_id));

CREATE POLICY "Admin can insert members"
  ON household_members FOR INSERT
  WITH CHECK (fn_is_admin_of(household_id));

CREATE POLICY "Admin can delete members"
  ON household_members FOR DELETE
  USING (fn_is_admin_of(household_id));

-- ========================================
-- POLÍTICAS: expenses
-- ========================================
CREATE POLICY "Members can view household expenses"
  ON expenses FOR SELECT
  USING (fn_is_member_of(household_id));

CREATE POLICY "Members can insert expenses"
  ON expenses FOR INSERT
  WITH CHECK (fn_is_member_of(household_id));

CREATE POLICY "Member can update own expenses"
  ON expenses FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM household_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Member can delete own expenses"
  ON expenses FOR DELETE
  USING (
    member_id IN (
      SELECT id FROM household_members WHERE profile_id = auth.uid()
    )
  );

-- ========================================
-- POLÍTICAS: incomes
-- ========================================
CREATE POLICY "Members can view household incomes"
  ON incomes FOR SELECT
  USING (fn_is_member_of(household_id));

CREATE POLICY "Members can insert incomes"
  ON incomes FOR INSERT
  WITH CHECK (fn_is_member_of(household_id));

CREATE POLICY "Member can update own incomes"
  ON incomes FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM household_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Member can delete own incomes"
  ON incomes FOR DELETE
  USING (
    member_id IN (
      SELECT id FROM household_members WHERE profile_id = auth.uid()
    )
  );

-- ========================================
-- POLÍTICAS: budgets
-- ========================================
CREATE POLICY "Members can view household budgets"
  ON budgets FOR SELECT
  USING (fn_is_member_of(household_id));

CREATE POLICY "Admin can insert budgets"
  ON budgets FOR INSERT
  WITH CHECK (fn_is_admin_of(household_id));

CREATE POLICY "Admin can update budgets"
  ON budgets FOR UPDATE
  USING (fn_is_admin_of(household_id));

CREATE POLICY "Admin can delete budgets"
  ON budgets FOR DELETE
  USING (fn_is_admin_of(household_id));

-- ========================================
-- POLÍTICAS: subscriptions
-- ========================================
CREATE POLICY "Members can view household subscriptions"
  ON subscriptions FOR SELECT
  USING (fn_is_member_of(household_id));

CREATE POLICY "Members can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (fn_is_member_of(household_id));

-- ========================================
-- POLÍTICAS: categories (lectura pública para autenticados)
-- ========================================
CREATE POLICY "Authenticated users can view income categories"
  ON income_categories FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view expense categories"
  ON expense_categories FOR SELECT
  USING (auth.role() = 'authenticated');
