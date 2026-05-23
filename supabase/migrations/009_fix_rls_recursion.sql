-- ============================================================
-- MIGRATION 009: Fix RLS recursion with security definer functions
-- ============================================================

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Members can view household members" ON household_members;
DROP POLICY IF EXISTS "Admin can insert members" ON household_members;
DROP POLICY IF EXISTS "Admin can delete members" ON household_members;

DROP POLICY IF EXISTS "Users can view their households" ON households;

DROP POLICY IF EXISTS "Members can view household expenses" ON expenses;
DROP POLICY IF EXISTS "Members can insert expenses" ON expenses;

DROP POLICY IF EXISTS "Members can view household incomes" ON incomes;
DROP POLICY IF EXISTS "Members can insert incomes" ON incomes;

DROP POLICY IF EXISTS "Members can view household budgets" ON budgets;
DROP POLICY IF EXISTS "Admin can insert budgets" ON budgets;
DROP POLICY IF EXISTS "Admin can update budgets" ON budgets;
DROP POLICY IF EXISTS "Admin can delete budgets" ON budgets;

DROP POLICY IF EXISTS "Members can view household subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Members can insert subscriptions" ON subscriptions;

-- Drop old functions if exist
DROP FUNCTION IF EXISTS fn_get_user_household_id();
DROP FUNCTION IF EXISTS fn_is_admin();
DROP FUNCTION IF EXISTS fn_is_member_of(UUID);
DROP FUNCTION IF EXISTS fn_is_admin_of(UUID);

-- Funciones auxiliares (security definer evita recursion infinita)
CREATE OR REPLACE FUNCTION fn_is_member_of(p_household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE profile_id = auth.uid() AND household_members.household_id = p_household_id
  );
$$;

CREATE OR REPLACE FUNCTION fn_is_admin_of(p_household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM household_members
    WHERE profile_id = auth.uid() AND role = 'admin' AND household_members.household_id = p_household_id
  );
$$;

-- ========================================
-- POLÍTICAS: households
-- ========================================
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (fn_is_member_of(id));

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

-- ========================================
-- POLÍTICAS: incomes
-- ========================================
CREATE POLICY "Members can view household incomes"
  ON incomes FOR SELECT
  USING (fn_is_member_of(household_id));

CREATE POLICY "Members can insert incomes"
  ON incomes FOR INSERT
  WITH CHECK (fn_is_member_of(household_id));

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
