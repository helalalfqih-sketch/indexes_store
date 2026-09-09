\set ON_ERROR_STOP on

INSERT INTO public.tenants (id, status) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'active'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'active');

INSERT INTO public.products (
  id, tenant_id, is_published, price, currency, stock, name, sku
) VALUES
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true, 5000, 'YER', 10, 'Valid product', 'VALID-1'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true, 7000, 'YER', 10, 'Other tenant product', 'OTHER-1'),
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true, 0, 'YER', 10, 'Invalid price product', 'ZERO-1');

DO $$
DECLARE
  first_result jsonb;
  retry_result jsonb;
  first_order_id uuid;
BEGIN
  first_result := public.create_checkout_order_v2(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', NULL, 'Test customer', '771234567',
    'Sanaa', NULL, NULL, NULL, 13000, 'cash_on_delivery',
    '44444444-4444-4444-8444-444444444444',
    '[{"source":"supabase","id":"11111111-1111-4111-8111-111111111111","quantity":2}]'
  );
  IF (first_result->>'itemsCount')::integer <> 1 OR (first_result->>'total')::numeric <> 13000 THEN
    RAISE EXCEPTION 'positive checkout returned unexpected result: %', first_result;
  END IF;

  first_order_id := (first_result->>'orderId')::uuid;
  retry_result := public.create_checkout_order_v2(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', NULL, 'Test customer', '771234567',
    'Sanaa', NULL, NULL, NULL, 13000, 'cash_on_delivery',
    '44444444-4444-4444-8444-444444444444',
    '[{"source":"supabase","id":"11111111-1111-4111-8111-111111111111","quantity":2}]'
  );
  IF (retry_result->>'orderId')::uuid <> first_order_id THEN
    RAISE EXCEPTION 'idempotent retry created a different order';
  END IF;
END
$$;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.orders) <> 1
     OR (SELECT count(*) FROM public.order_items) <> 1
     OR (SELECT count(*) FROM public.order_status_history) <> 1 THEN
    RAISE EXCEPTION 'checkout did not commit exactly one complete order';
  END IF;
END
$$;

DO $$
BEGIN
  BEGIN
    PERFORM public.create_checkout_order_v2(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', NULL, 'Test', '771234567', 'Sanaa',
      NULL, NULL, NULL, NULL, 'cash_on_delivery', gen_random_uuid(),
      '[{"source":"supabase","id":"22222222-2222-4222-8222-222222222222","quantity":1}]'
    );
    RAISE EXCEPTION 'cross-tenant product was accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'cross-tenant product was accepted' OR SQLERRM NOT LIKE '%CHECKOUT_PRODUCT_UNAVAILABLE%' THEN
      RAISE;
    END IF;
  END;

  BEGIN
    PERFORM public.create_checkout_order_v2(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', NULL, 'Test', '771234567', 'Sanaa',
      NULL, NULL, NULL, NULL, 'cash_on_delivery', gen_random_uuid(),
      '[{"source":"fallback","id":"p1","quantity":1}]'
    );
    RAISE EXCEPTION 'fallback product was accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'fallback product was accepted' OR SQLERRM NOT LIKE '%CHECKOUT_PRODUCT_SOURCE_UNSUPPORTED%' THEN
      RAISE;
    END IF;
  END;

  BEGIN
    PERFORM public.create_checkout_order_v2(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', NULL, 'Test', '771234567', 'Sanaa',
      NULL, NULL, NULL, NULL, 'cash_on_delivery', gen_random_uuid(),
      '[{"source":"supabase","id":"33333333-3333-4333-8333-333333333333","quantity":1}]'
    );
    RAISE EXCEPTION 'zero-price product was accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'zero-price product was accepted' OR SQLERRM NOT LIKE '%CHECKOUT_PRODUCT_PRICE_INVALID%' THEN
      RAISE;
    END IF;
  END;
END
$$;

DO $$
DECLARE
  signature text := 'public.create_checkout_order_v2(uuid,uuid,text,text,text,text,text,text,numeric,text,uuid,jsonb)';
BEGIN
  IF has_function_privilege('anon', signature, 'EXECUTE')
     OR has_function_privilege('authenticated', signature, 'EXECUTE')
     OR NOT has_function_privilege('service_role', signature, 'EXECUTE') THEN
    RAISE EXCEPTION 'checkout RPC grants are unsafe';
  END IF;
END
$$;

SELECT 'checkout database contract passed' AS result;
