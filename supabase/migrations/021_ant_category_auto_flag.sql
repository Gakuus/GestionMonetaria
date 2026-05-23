-- ============================================================
-- MIGRATION 021: Gastos en categoría "Gastos Hormiga" se marcan
-- automáticamente como gastos hormiga
-- ============================================================

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
  -- Categorías que no se consideran gastos hormiga (necesidades básicas)
  v_excluded := ARRAY['Comida', 'Salud', 'Alquiler', 'Servicios', 'Transporte', 'Cuidado Personal'];

  -- Regla 0: Todo gasto en la categoría "Gastos Hormiga" se marca automáticamente
  UPDATE public.expenses
  SET is_ant_expense = TRUE
  WHERE household_id = p_household_id
    AND is_ant_expense = FALSE
    AND category_id IN (
      SELECT id FROM public.expense_categories WHERE name = 'Gastos Hormiga'
    );

  -- Regla 1: Monto menor al umbral (excluyendo categorías básicas)
  UPDATE public.expenses
  SET is_ant_expense = TRUE
  WHERE household_id = p_household_id
    AND amount < p_threshold
    AND is_ant_expense = FALSE
    AND (category_id NOT IN (
      SELECT id FROM public.expense_categories WHERE name = ANY(v_excluded)
    ) OR category_id IS NULL);

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
