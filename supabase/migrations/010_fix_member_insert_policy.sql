-- ============================================================
-- MIGRATION 010: Fix household_members INSERT policy for onboarding
-- ============================================================

DROP POLICY IF EXISTS "Admin can insert members" ON household_members;

CREATE POLICY "Users can insert own membership"
  ON household_members FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    OR
    fn_is_admin_of(household_id)
  );
