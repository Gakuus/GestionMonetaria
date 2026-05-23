-- ============================================================
-- MIGRATION 015: Fix missing RLS policies
-- ============================================================

-- households: allow admin to update/delete
CREATE POLICY "Admin can update households"
  ON households FOR UPDATE
  USING (fn_is_admin_of(id));

CREATE POLICY "Admin can delete households"
  ON households FOR DELETE
  USING (fn_is_admin_of(id));

-- profiles: allow user to delete own profile
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (id = auth.uid());

-- household_members: prevent privilege escalation via UPDATE
CREATE POLICY "Admin can update members"
  ON household_members FOR UPDATE
  USING (fn_is_admin_of(household_id));

-- subscriptions: members can update/delete their household subscriptions
CREATE POLICY "Members can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (fn_is_member_of(household_id));

CREATE POLICY "Members can delete subscriptions"
  ON subscriptions FOR DELETE
  USING (fn_is_member_of(household_id));
