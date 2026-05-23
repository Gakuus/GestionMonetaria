-- ============================================================
-- MIGRATION 012: Fix ambiguous date column in get_daily_totals
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_daily_totals(
  p_household_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  date       DATE,
  incomes    DECIMAL(12,2),
  expenses   DECIMAL(12,2),
  is_weekend BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_first DATE := make_date(p_year, p_month, 1);
  v_last  DATE := (date_trunc('month', v_first) + INTERVAL '1 month - 1 day')::DATE;
  v_day   DATE;
BEGIN
  v_day := v_first;
  WHILE v_day <= v_last LOOP
    date := v_day;

    SELECT COALESCE(i_total, 0) INTO incomes
    FROM (
      SELECT SUM(amount) AS i_total
      FROM public.incomes
      WHERE household_id = p_household_id AND public.incomes.date = v_day
    ) sub;

    SELECT COALESCE(e_total, 0) INTO expenses
    FROM (
      SELECT SUM(amount) AS e_total
      FROM public.expenses
      WHERE household_id = p_household_id AND public.expenses.date = v_day
    ) sub;

    is_weekend := EXTRACT(DOW FROM v_day) IN (0, 6);
    RETURN NEXT;
    v_day := v_day + 1;
  END LOOP;
END;
$$;
