-- ============================================================
-- MIGRATION 007: Gastos por método de pago
-- ============================================================

-- Agrupa los gastos de un hogar en un mes por método de pago
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
