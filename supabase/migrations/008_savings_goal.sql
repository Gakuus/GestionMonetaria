-- ============================================================
-- MIGRATION 008: Meta de ahorro mensual
-- ============================================================

-- 1. Agregar columna monthly_savings_goal a households
ALTER TABLE households
  ADD COLUMN IF NOT EXISTS monthly_savings_goal DECIMAL(12,2) DEFAULT 0;

-- 2. Función para obtener progreso de ahorro del mes
CREATE OR REPLACE FUNCTION get_savings_progress(
  p_household_id UUID,
  p_year INT,
  p_month INT
) RETURNS TABLE (
  goal      DECIMAL(12,2),
  saved     DECIMAL(12,2),
  percentage NUMERIC
) LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_start_date DATE := make_date(p_year, p_month, 1);
  v_end_date   DATE := (v_start_date + INTERVAL '1 month')::DATE;
  v_total_income DECIMAL(12,2);
  v_total_expense DECIMAL(12,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total_income
    FROM incomes
    WHERE household_id = p_household_id
      AND date >= v_start_date AND date < v_end_date;

  SELECT COALESCE(SUM(amount), 0) INTO v_total_expense
    FROM expenses
    WHERE household_id = p_household_id
      AND date >= v_start_date AND date < v_end_date;

  RETURN QUERY
  SELECT
    COALESCE(h.monthly_savings_goal, 0) AS goal,
    GREATEST(0, v_total_income - v_total_expense) AS saved,
    CASE
      WHEN COALESCE(h.monthly_savings_goal, 0) > 0
      THEN LEAST(100, ROUND(((GREATEST(0, v_total_income - v_total_expense)) / h.monthly_savings_goal) * 100, 1))
      ELSE 0
    END AS percentage
  FROM households h
  WHERE h.id = p_household_id;
END;
$$;
