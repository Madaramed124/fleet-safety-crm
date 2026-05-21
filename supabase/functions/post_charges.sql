-- RPC function to atomically insert charges + documents and mark violation charged
-- Usage: SELECT post_charges(p_driver_id := 'uuid', p_violation_id := 'uuid', p_charges := '[{...}]'::jsonb, p_created_by := NULL);

CREATE OR REPLACE FUNCTION public.post_charges(
  p_driver_id uuid,
  p_violation_id uuid,
  p_charges jsonb,
  p_created_by uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  created_charges jsonb := '[]'::jsonb;
  ch jsonb;
  new_charge_id uuid;
  doc jsonb;
BEGIN
  PERFORM 1 FROM violations WHERE id = p_violation_id FOR UPDATE;

  -- Insert each charge and its documents
  FOR ch IN SELECT * FROM jsonb_array_elements(p_charges) LOOP
    INSERT INTO charges(violation_id, driver_id, charge_type, description, amount, document_url, created_by, status)
    VALUES (p_violation_id, p_driver_id, ch->>'charge_type', ch->>'description', (ch->>'amount')::numeric, ch->>'document_url', p_created_by, 'posted')
    RETURNING id INTO new_charge_id;

    -- insert any docs
    IF ch ? 'documents' THEN
      FOR doc IN SELECT * FROM jsonb_array_elements(ch->'documents') LOOP
        INSERT INTO charge_documents(charge_id, file_name, file_url, file_type)
        VALUES (new_charge_id, doc->>'file_name', doc->>'file_url', doc->>'file_type');
      END LOOP;
    END IF;

    created_charges := created_charges || jsonb_build_object('charge_id', new_charge_id);
  END LOOP;

  -- update violation accounting status
  UPDATE violations SET accounting_status = 'charged' WHERE id = p_violation_id;

  RETURN jsonb_build_object('success', true, 'charges', created_charges, 'violation_id', p_violation_id);
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;
