-- ============================================================
-- MIGRATION 006: Organización temporal (mes/semana)
-- ============================================================

-- 1. Desglose semanal dentro de un mes
-- Divide el mes en semanas (lunes a domingo) y calcula totales
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
  v_first DATE := make_date(p_year, p_month, 1);
  v_last  DATE := (date_trunc('month', v_first) + INTERVAL '1 month - 1 day')::DATE;
  v_monday DATE;
BEGIN
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


-- 2. Evolución mensual (últimos N meses)
-- Devuelve ingresos, gastos y balance por mes
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
  v_start DATE := date_trunc('month', CURRENT_DATE) - (p_months - 1) * INTERVAL '1 month';
  v_end   DATE := date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day';
  v_ym    DATE;
BEGIN
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


-- 3. Totales diarios para un mes (soporte para vista semanal)
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
      WHERE household_id = p_household_id AND date = v_day
    ) sub;

    SELECT COALESCE(e_total, 0) INTO expenses
    FROM (
      SELECT SUM(amount) AS e_total
      FROM public.expenses
      WHERE household_id = p_household_id AND date = v_day
    ) sub;

    is_weekend := EXTRACT(DOW FROM v_day) IN (0, 6);
    RETURN NEXT;
    v_day := v_day + 1;
  END LOOP;
END;
$$;
