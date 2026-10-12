-- Tests the upgraded shared-quote + idempotent checkout implementation.
-- Run ONLY against disposable PostgreSQL CI fixtures after applying migrations.
-- No customer data or production Supabase connections are used.
\set ON_ERROR_STOP on

BEGIN;
INSERT INTO public.tenants (id, status) VALUES
  ('70000001-7777-4777-8777-000000000001', 'active'),
  ('70000002-7777-4777-8777-000000000002', 'active');

INSERT INTO public.products (
  id, tenant_id, is_published, price, currency, stock, reserved_stock, name, sku
) VALUES
  ('70000101-7777-4777-8777-000000000101',
   '70000001-7777-4777-8777-000000000001', true, 8000, 'YER', 12, 2,
   'Yemen fixture 8000', 'AUDIT-101'),
  ('70000102-7777-4777-8777-000000000102',
   '70000001-7777-4777-8777-000000000001', true, 9000, 'YER', 2, 2,
   'Fully reserved fixture', 'AUDIT-102'),
  ('70000201-7777-4777-8777-000000000201',
   '70000002-7777-4777-8777-000000000002', true, 11000, 'YER', 10, 0,
   'Other tenant fixture', 'AUDIT-201');

DO $$
DECLARE
  t uuid := '70000001-7777-4777-8777-000000000001';
  k uuid := '70000301-7777-4777-8777-000000000301';
  product_id uuid := '70000101-7777-4777-8777-000000000101';
  cart jsonb := jsonb_build_array(jsonb_build_object(
    'source', 'supabase', 'id', '70000101-7777-4777-8777-000000000101', 'quantity', 1
  ));
  result_first jsonb;
  result_retry jsonb;
  result_coupon jsonb;
  stored_id uuid;
  rejected boolean;
BEGIN
  -- Server quote should include configured shipping below the threshold.
  IF (public.checkout_totals_v1(8000, '', '{}'::jsonb)->>'total')::numeric <> 11000 THEN
    RAISE EXCEPTION 'baseline YER quote calculation changed';
  END IF;

  result_first := public.create_checkout_order_v2(
    t, NULL, 'Fixture buyer', '771234567', 'Sanaa', NULL, NULL, '',
    11000, 'cod', k, cart
  );
  stored_id := (result_first->>'orderId')::uuid;
  IF stored_id IS NULL
     OR (result_first->>'itemsCount')::integer <> 1
     OR (result_first->>'total')::numeric <> 11000
     OR (result_first->'quote'->>'total')::numeric <> 11000
     OR (result_first->'quote'->>'currency') <> 'YER'
     OR (result_first->'quote'->'items'->0->>'unitPrice')::numeric <> 8000
     OR (result_first->'quote'->'items'->0->>'stock')::integer <> 10
  THEN
    RAISE EXCEPTION 'atomic upgraded checkout quote is not authoritative: %', result_first;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.orders WHERE id=stored_id AND tenant_id=t
    AND checkout_fingerprint IS NOT NULL AND checkout_quote = result_first->'quote'
  ) THEN
    RAISE EXCEPTION 'order quote and fingerprint are not persisted';
  END IF;

  result_retry := public.create_checkout_order_v2(
    t, NULL, 'Fixture buyer', '771234567', 'Sanaa', NULL, NULL, '',
    11000, 'cod', k, cart
  );
  IF result_retry->>'orderId' <> result_first->>'orderId'
     OR result_retry->'quote' <> result_first->'quote'
     OR (SELECT count(*) FROM public.orders WHERE tenant_id=t AND idempotency_key=k) <> 1
     OR (SELECT count(*) FROM public.order_items WHERE order_id=stored_id) <> 1 THEN
    RAISE EXCEPTION 'same-key replay duplicated or changed committed checkout';
  END IF;

  -- Reusing the same key for a different cart must fail, not silently return
  -- the old order or insert a second record.
  rejected := false;
  BEGIN
    PERFORM public.create_checkout_order_v2(
      t, NULL, 'Fixture buyer', '771234567', 'Sanaa', NULL, NULL, '',
      NULL, 'cod', k,
      jsonb_build_array(jsonb_build_object('source','supabase',
        'id', product_id::text, 'quantity', 2))
    );
  EXCEPTION WHEN raise_exception THEN
    rejected := SQLERRM = 'CHECKOUT_IDEMPOTENCY_CONFLICT';
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'changed cart reused an existing checkout key'; END IF;

  -- The checkout quote cannot be overridden by an incorrect browser total.
  rejected := false;
  BEGIN
    PERFORM public.create_checkout_order_v2(
      t, NULL, 'Second buyer', '771234568', 'Sanaa', NULL, NULL, '',
      9000, 'cod', gen_random_uuid(), cart
    );
  EXCEPTION WHEN raise_exception THEN
    rejected := SQLERRM = 'CHECKOUT_TOTAL_CHANGED';
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'untrusted expected total was accepted'; END IF;

  -- Reserved units cannot be sold and must not produce a partial order.
  rejected := false;
  BEGIN
    PERFORM public.create_checkout_order_v2(
      t, NULL, 'Third buyer', '771234569', 'Sanaa', NULL, NULL, '',
      NULL, 'cod', gen_random_uuid(),
      jsonb_build_array(jsonb_build_object('source','supabase',
        'id','70000102-7777-4777-8777-000000000102', 'quantity', 1))
    );
  EXCEPTION WHEN raise_exception THEN
    rejected := SQLERRM = 'CHECKOUT_INSUFFICIENT_STOCK';
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'reserved stock was not respected'; END IF;

  -- A product owned by another tenant is never eligible in this checkout.
  rejected := false;
  BEGIN
    PERFORM public.create_checkout_order_v2(
      t, NULL, 'Fourth buyer', '771234570', 'Sanaa', NULL, NULL, '',
      NULL, 'cod', gen_random_uuid(),
      jsonb_build_array(jsonb_build_object('source','supabase',
        'id','70000201-7777-4777-8777-000000000201', 'quantity', 1))
    );
  EXCEPTION WHEN raise_exception THEN
    rejected := SQLERRM = 'CHECKOUT_PRODUCT_UNAVAILABLE';
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'cross-tenant item was accepted'; END IF;

  -- Coupon must be computed by the same RPC used by preview quote.
  result_coupon := public.create_checkout_order_v2(
    t, NULL, 'Coupon buyer', '771234571', 'Sanaa', NULL, NULL, 'INDEXES10',
    10200, 'cod', gen_random_uuid(), cart
  );
  IF (result_coupon->>'total')::numeric <> 10200
     OR (result_coupon->'quote'->>'discount')::numeric <> 800
     OR (result_coupon->'quote'->>'shipping')::numeric <> 3000 THEN
    RAISE EXCEPTION 'coupon and shipment disagree with checkout calculation: %', result_coupon;
  END IF;

  -- Only successful test orders have been committed within this transaction.
  IF (SELECT count(*) FROM public.orders WHERE tenant_id=t) <> 2
     OR (SELECT count(*) FROM public.order_items WHERE tenant_id=t) <> 2
     OR (SELECT count(*) FROM public.order_status_history WHERE tenant_id=t) <> 2 THEN
    RAISE EXCEPTION 'checkout failure created partial order data';
  END IF;

  IF has_function_privilege('anon','public.checkout_totals_v1(numeric,text,jsonb)','EXECUTE')
     OR has_function_privilege('authenticated','public.checkout_totals_v1(numeric,text,jsonb)','EXECUTE')
     OR NOT has_function_privilege('service_role','public.checkout_totals_v1(numeric,text,jsonb)','EXECUTE') THEN
    RAISE EXCEPTION 'shared quote RPC is exposed to an untrusted role';
  END IF;
END
$$;
ROLLBACK;

SELECT 'upgraded checkout idempotency and quote contract passed' AS result;
