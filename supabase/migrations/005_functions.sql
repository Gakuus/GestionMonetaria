-- ============================================================
-- MIGRATION 005: Funciones auxiliares
-- ============================================================

-- 1. Resumen mensual del hogar
CREATE OR REPLACE FUNCTION public.get_monthly_summary(
  p_household_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  total_incomes  DECIMAL(12,2),
  total_expenses DECIMAL(12,2),
  balance        DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(amount) FROM public.incomes
      WHERE household_id = p_household_id
        AND EXTRACT(YEAR FROM date) = p_year
        AND EXTRACT(MONTH FROM date) = p_month), 0) AS total_incomes,
    COALESCE((SELECT SUM(amount) FROM public.expenses
      WHERE household_id = p_household_id
        AND EXTRACT(YEAR FROM date) = p_year
        AND EXTRACT(MONTH FROM date) = p_month), 0) AS total_expenses,
    COALESCE((SELECT SUM(amount) FROM public.incomes
      WHERE household_id = p_household_id
        AND EXTRACT(YEAR FROM date) = p_year
        AND EXTRACT(MONTH FROM date) = p_month), 0)
    -
    COALESCE((SELECT SUM(amount) FROM public.expenses
      WHERE household_id = p_household_id
        AND EXTRACT(YEAR FROM date) = p_year
        AND EXTRACT(MONTH FROM date) = p_month), 0) AS balance;
END;
$$;

-- 2. Gastos agrupados por categoría
CREATE OR REPLACE FUNCTION public.get_expenses_by_category(
  p_household_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  category_name TEXT,
  total         DECIMAL(12,2),
  percentage    DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total DECIMAL(12,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM public.expenses
  WHERE household_id = p_household_id
    AND EXTRACT(YEAR FROM date) = p_year
    AND EXTRACT(MONTH FROM date) = p_month;

  RETURN QUERY
  SELECT
    ec.name,
    COALESCE(SUM(e.amount), 0),
    CASE WHEN v_total > 0
      THEN ROUND((COALESCE(SUM(e.amount), 0) / v_total) * 100, 2)
      ELSE 0
    END
  FROM public.expense_categories ec
  LEFT JOIN public.expenses e ON e.category_id = ec.id
    AND e.household_id = p_household_id
    AND EXTRACT(YEAR FROM e.date) = p_year
    AND EXTRACT(MONTH FROM e.date) = p_month
  GROUP BY ec.name, ec.id
  ORDER BY SUM(e.amount) DESC NULLS LAST;
END;
$$;

-- 3. Detectar gastos hormiga
CREATE OR REPLACE FUNCTION public.detect_ant_expenses(
  p_household_id UUID,
  p_threshold DECIMAL(12,2) DEFAULT 5000
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Regla 1: Monto menor al umbral
  UPDATE public.expenses
  SET is_ant_expense = TRUE
  WHERE household_id = p_household_id
    AND amount < p_threshold
    AND is_ant_expense = FALSE;

  -- Regla 2: Misma categoría aparece 3+ veces en últimos 30 días
  UPDATE public.expenses
  SET is_ant_expense = TRUE
  WHERE household_id = p_household_id
    AND id IN (
      SELECT e1.id FROM public.expenses e1
      WHERE e1.date >= CURRENT_DATE - INTERVAL '30 days'
        AND (
          SELECT COUNT(*) FROM public.expenses e2
          WHERE e2.household_id = e1.household_id
            AND e2.category_id = e1.category_id
            AND e2.amount BETWEEN e1.amount * 0.8 AND e1.amount * 1.2
            AND e2.date >= CURRENT_DATE - INTERVAL '30 days'
        ) >= 3
    )
    AND is_ant_expense = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
