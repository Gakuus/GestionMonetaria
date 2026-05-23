-- ============================================================
-- MIGRATION 011: Security definer function for household creation
-- ============================================================

CREATE OR REPLACE FUNCTION create_household(p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_name TEXT;
BEGIN
  v_name := TRIM(LEFT(p_name, 100));

  IF v_name = '' THEN
    RAISE EXCEPTION 'El nombre del hogar no puede estar vacío';
  END IF;

  INSERT INTO households (name) VALUES (v_name) RETURNING id INTO v_id;

  INSERT INTO household_members (household_id, profile_id, role)
  VALUES (v_id, auth.uid(), 'admin');

  RETURN v_id;
END;
$$;
