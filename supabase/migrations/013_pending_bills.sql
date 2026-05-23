-- ============================================================
-- MIGRATION 013: Cuentas pendientes por pagar
-- ============================================================

CREATE TABLE IF NOT EXISTS pending_bills (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id     UUID NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  amount        DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  due_date      DATE NOT NULL,
  paid          BOOLEAN NOT NULL DEFAULT FALSE,
  paid_date     DATE,
  category_id   UUID REFERENCES expense_categories(id),
  notes         TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pending_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view pending bills"
  ON pending_bills FOR SELECT
  USING (fn_is_member_of(household_id));

CREATE POLICY "Members can insert pending bills"
  ON pending_bills FOR INSERT
  WITH CHECK (fn_is_member_of(household_id));

CREATE POLICY "Members can update pending bills"
  ON pending_bills FOR UPDATE
  USING (fn_is_member_of(household_id));

CREATE POLICY "Members can delete pending bills"
  ON pending_bills FOR DELETE
  USING (fn_is_member_of(household_id));

CREATE INDEX IF NOT EXISTS idx_pending_bills_household_due
  ON pending_bills(household_id, due_date);
