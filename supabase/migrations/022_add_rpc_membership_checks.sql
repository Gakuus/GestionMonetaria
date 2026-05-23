-- ============================================================
-- MIGRATION 022: Add membership checks to all SECURITY DEFINER RPCs
-- ============================================================

-- 1. get_monthly_summary
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
  IF NOT fn_is_member_of(p_household_id) THEN
    RAISE EXCEPTION 'No tienes acceso a este hogar';
  END IF;

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

-- 2. get_expenses_by_category
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
  IF NOT fn_is_member_of(p_household_id) THEN
    RAISE EXCEPTION 'No tienes acceso a este hogar';
  END IF;

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

-- 3. get_monthly_evolution
CREATE OR REPLACE FUNCTION public.get_monthly_evolution(
  p_household_id UUID,
  p_months INTEGER DEFAULT 6
)
RETURNS TABLE (
  year   INTEGER,
  month  INTEGER,
  label  TEXT,
  incomes   DECIMAL(12,2),
  expenses  DECIMAL(12,2),
  balance   DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_start DATE;
  v_end   DATE;
  v_ym    DATE;
BEGIN
  IF NOT fn_is_member_of(p_household_id) THEN
    RAISE EXCEPTION 'No tienes acceso a este hogar';
  END IF;

  v_start := date_trunc('month', CURRENT_DATE) - (p_months - 1) * INTERVAL '1 month';
  v_end   := date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day';
  v_ym := v_start;
  WHILE v_ym <= v_end LOOP
    year := EXTRACT(YEAR FROM v_ym)::INT;
    month := EXTRACT(MONTH FROM v_ym)::INT;
    label := to_char(v_ym, 'YYYY-MM');

    SELECT COALESCE(SUM(i.amount), 0) INTO incomes
    FROM public.incomes i
    WHERE i.household_id = p_household_id
      AND EXTRACT(YEAR FROM i.date) = year
      AND EXTRACT(MONTH FROM i.date) = month;

    SELECT COALESCE(SUM(e.amount), 0) INTO expenses
    FROM public.expenses e
    WHERE e.household_id = p_household_id
      AND EXTRACT(YEAR FROM e.date) = year
      AND EXTRACT(MONTH FROM e.date) = month;

    balance := incomes - expenses;
    RETURN NEXT;
    v_ym := v_ym + INTERVAL '1 month';
  END LOOP;
END;
$$;

-- 4. get_daily_totals
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
  v_first DATE;
  v_last  DATE;
  v_day   DATE;
BEGIN
  IF NOT fn_is_member_of(p_household_id) THEN
    RAISE EXCEPTION 'No tienes acceso a este hogar';
  END IF;

  v_first := make_date(p_year, p_month, 1);
  v_last  := (date_trunc('month', v_first) + INTERVAL '1 month - 1 day')::DATE;
  v_day := v_first;
  WHILE v_day <= v_last LOOP
    date := v_day;

    SELECT COALESCE(SUM(amount), 0) INTO incomes
    FROM public.incomes
    WHERE household_id = p_household_id AND date = v_day;

    SELECT COALESCE(SUM(amount), 0) INTO expenses
    FROM public.expenses
    WHERE household_id = p_household_id AND date = v_day;

    is_weekend := EXTRACT(DOW FROM v_day) IN (0, 6);
    RETURN NEXT;
    v_day := v_day + 1;
  END LOOP;
END;
$$;

-- 5. get_expenses_by_payment_method
CREATE OR REPLACE FUNCTION public.get_expenses_by_payment_method(
  p_household_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  payment_method TEXT,
  total DECIMAL(12,2),
  transaction_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT fn_is_member_of(p_household_id) THEN
    RAISE EXCEPTION 'No tienes acceso a este hogar';
  END IF;

  RETURN QUERY
  SELECT
    e.payment_method,
    COALESCE(SUM(e.amount), 0)::DECIMAL(12,2) AS total,
    COUNT(*)::BIGINT AS transaction_count
  FROM public.expenses e
  WHERE e.household_id = p_household_id
    AND EXTRACT(YEAR FROM e.date) = p_year
    AND EXTRACT(MONTH FROM e.date) = p_month
  GROUP BY e.payment_method
  ORDER BY total DESC;
END;
$$;

-- 6. detect_ant_expenses
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
  v_excluded TEXT[];
BEGIN
  IF NOT fn_is_member_of(p_household_id) THEN
    RAISE EXCEPTION 'No tienes acceso a este hogar';
  END IF;

  v_excluded := ARRAY['Comida', 'Salud', 'Alquiler', 'Servicios', 'Transporte', 'Cuidado Personal'];

  UPDATE public.expenses
  SET is_ant_expense = TRUE
  WHERE household_id = p_household_id
    AND is_ant_expense = FALSE
    AND category_id IN (
      SELECT id FROM public.expense_categories WHERE name = 'Gastos Hormiga'
    );

  UPDATE public.expenses
  SET is_ant_expense = TRUE
  WHERE household_id = p_household_id
    AND amount < p_threshold
    AND is_ant_expense = FALSE
    AND (category_id NOT IN (
      SELECT id FROM public.expense_categories WHERE name = ANY(v_excluded)
    ) OR category_id IS NULL);

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

-- 7. get_weekly_breakdown
CREATE OR REPLACE FUNCTION public.get_weekly_breakdown(
  p_household_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  week_start DATE,
  week_end   DATE,
  week_label TEXT,
  incomes    DECIMAL(12,2),
  expenses   DECIMAL(12,2),
  balance    DECIMAL(12,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_first DATE;
  v_last  DATE;
  v_monday DATE;
BEGIN
  IF NOT fn_is_member_of(p_household_id) THEN
    RAISE EXCEPTION 'No tienes acceso a este hogar';
  END IF;

  v_first := make_date(p_year, p_month, 1);
  v_last  := (date_trunc('month', v_first) + INTERVAL '1 month - 1 day')::DATE;
  v_monday := v_first - ((EXTRACT(DOW FROM v_first) + 6)::INT % 7);

  WHILE v_monday <= v_last LOOP
    week_start := v_monday;
    week_end := LEAST(v_monday + 6, v_last);
    week_label := to_char(week_start, 'DD') || '-' || to_char(week_end, 'DD') || ' ' || to_char(v_first, 'MM/YYYY');

    SELECT COALESCE(SUM(i.amount), 0) INTO incomes
    FROM public.incomes i
    WHERE i.household_id = p_household_id
      AND i.date >= week_start AND i.date <= week_end;

    SELECT COALESCE(SUM(e.amount), 0) INTO expenses
    FROM public.expenses e
    WHERE e.household_id = p_household_id
      AND e.date >= week_start AND e.date <= week_end;

    balance := incomes - expenses;
    RETURN NEXT;
    v_monday := v_monday + 7;
  END LOOP;
END;
$$;

-- 8. get_savings_progress
CREATE OR REPLACE FUNCTION public.get_savings_progress(
  p_household_id UUID,
  p_year INT,
  p_month INT
) RETURNS TABLE (
  goal      DECIMAL(12,2),
  saved     DECIMAL(12,2),
  percentage NUMERIC
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_start_date DATE;
  v_end_date   DATE;
  v_total_income DECIMAL(12,2);
  v_total_expense DECIMAL(12,2);
BEGIN
  IF NOT fn_is_member_of(p_household_id) THEN
    RAISE EXCEPTION 'No tienes acceso a este hogar';
  END IF;

  v_start_date := make_date(p_year, p_month, 1);
  v_end_date   := (v_start_date + INTERVAL '1 month')::DATE;

  SELECT COALESCE(SUM(amount), 0) INTO v_total_income
    FROM public.incomes
    WHERE household_id = p_household_id
      AND date >= v_start_date AND date < v_end_date;

  SELECT COALESCE(SUM(amount), 0) INTO v_total_expense
    FROM public.expenses
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
  FROM public.households h
  WHERE h.id = p_household_id;
END;
$$;
