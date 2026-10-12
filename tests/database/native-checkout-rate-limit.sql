BEGIN;
INSERT INTO public.tenants(id,status) VALUES
('11111111-1111-4111-8111-111111111111','active'),
('22222222-2222-4222-8222-222222222222','active');
DO $$
DECLARE i integer;
BEGIN
  IF has_function_privilege('anon','public.consume_native_checkout_slot(uuid,text)','EXECUTE') OR
     has_function_privilege('authenticated','public.consume_native_checkout_slot(uuid,text)','EXECUTE') OR
     has_table_privilege('anon','public.native_checkout_rate_limits','SELECT') THEN
    RAISE EXCEPTION 'Public limiter access';
  END IF;
  FOR i IN 1..5 LOOP
    IF NOT public.consume_native_checkout_slot('11111111-1111-4111-8111-111111111111',repeat('a',64)) THEN
      RAISE EXCEPTION 'Premature rate limit';
    END IF;
  END LOOP;
  IF public.consume_native_checkout_slot('11111111-1111-4111-8111-111111111111',repeat('a',64)) THEN
    RAISE EXCEPTION 'Phone limit bypassed';
  END IF;
  IF NOT public.consume_native_checkout_slot('22222222-2222-4222-8222-222222222222',repeat('a',64)) THEN
    RAISE EXCEPTION 'Cross-tenant bucket collision';
  END IF;
  UPDATE public.native_checkout_rate_limits SET window_start = now() - interval '11 minutes';
  IF NOT public.consume_native_checkout_slot('11111111-1111-4111-8111-111111111111',repeat('a',64)) THEN
    RAISE EXCEPTION 'Window did not reset';
  END IF;
  FOR i IN 2..100 LOOP
    IF NOT public.consume_native_checkout_slot('11111111-1111-4111-8111-111111111111',lpad(to_hex(i),64,'0')) THEN
      RAISE EXCEPTION 'Premature global limit';
    END IF;
  END LOOP;
  IF public.consume_native_checkout_slot('11111111-1111-4111-8111-111111111111',repeat('b',64)) THEN
    RAISE EXCEPTION 'Global limit bypassed';
  END IF;
END $$;
ROLLBACK;
